export const runtime = 'nodejs';
import { put } from '@vercel/blob';
import { db } from '@/db';
import { mentees, resumes, analyses } from '@/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { parseFileToText } from '@/lib/parse';
import connectDB from '@/lib/mongodb';
import Resume from '@/models/Resume';
import { sendAnalysisEmail, sendWelcomeEmail } from '@/lib/email';


export async function POST(req: Request) {
  try {
  const reqUrl = new URL(req.url);
  const debug = reqUrl.searchParams.get('debug') === '1';
    const form = await req.formData();
    const file = form.get('file') as File;
    const email = String(form.get('email')||'');
    const name = String(form.get('name')||'');
  const targetRole = String(form.get('targetRole')||'');
  const jobDescription = String(form.get('jobDescription')||'');
    
    if (!file || !email) {
      return NextResponse.json({ error: 'Missing file or email' }, { status: 400 });
    }

    // Enforce monthly quota (5 analyses/month)
    const existingMentee = (await db.select().from(mentees).where(eq(mentees.email, email)).limit(1)).at(0);
    if (existingMentee) {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const countRows = await db
        .select({ id: analyses.id })
        .from(analyses)
        .innerJoin(resumes, eq(analyses.resumeId, resumes.id))
        .where(and(eq(resumes.menteeId, existingMentee.id), gte(analyses.createdAt, startOfMonth)));
      if (countRows.length >= 5) {
        return NextResponse.json({ error: 'Monthly limit reached. You have used all 5 free analyses for this month.' }, { status: 403 });
      }
    }

    // Upload to Vercel Blob (graceful fallback in local/dev without token)
    let url: string;
    try {
      const uploaded = await put(`cv/${crypto.randomUUID()}-${file.name}`, file, { access: 'public' });
      url = uploaded.url;
    } catch (e) {
      console.error('Blob upload failed, using local placeholder URL:', e);
      url = `local://${crypto.randomUUID()}-${file.name}`;
    }
    
  // Parse file to text (shared util)
  const parseRes = await parseFileToText(file);
  const text = parseRes.text || '';
  const textLen = text.length;
  console.log('[upload] extracted text length:', textLen, 'mime:', file.type, 'name:', file.name, 'parser:', parseRes.parser);

    // Upsert mentee by email and ensure targetRole is saved/updated
    const existing = (await db.select().from(mentees).where(eq(mentees.email, email)).limit(1));
    let menteeId: number;
    if (existing.length > 0) {
      menteeId = existing[0].id;
      // Update name and targetRole if provided
      await db
        .update(mentees)
        .set({
          name: name || existing[0].name || null as any,
          targetRole: targetRole || existing[0].targetRole || null as any,
        })
        .where(eq(mentees.id, menteeId));
    } else {
      const [m] = await db
        .insert(mentees)
        .values({ email, name, targetRole })
        .returning();
      menteeId = m.id;
      
      // Send welcome email for new users
      if (email && name) {
        try {
          await sendWelcomeEmail(email, name);
          console.log('✅ Welcome email sent to new user');
        } catch (welcomeEmailError) {
          console.error('❌ Welcome email error (non-blocking):', welcomeEmailError);
          // Don't fail the request if welcome email fails
        }
      }
    }
    
    // Insert resume
    const [r] = await db.insert(resumes).values({ menteeId, fileUrl: url, fileType: file.type, textContent: text }).returning();

    // Use Gemini AI for analysis (graceful fallback if it fails)
    const origin = new URL(req.url).origin;
    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '')) || origin;
    let finalResult: any;
    try {
    const geminiResponse = await fetch(`${baseUrl}/api/gemini`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
      text: text.slice(0, 14000),
          targetRole: targetRole || 'General',
          jobDescription: jobDescription || undefined
        })
      });
      if (geminiResponse.ok) {
        const geminiData = await geminiResponse.json();
        finalResult = geminiData.result;
      } else {
        const msg = await geminiResponse.text();
        console.error('Gemini call failed:', geminiResponse.status, msg);
      }
    } catch (e) {
      console.error('Gemini request error:', e);
    }

    // Normalize or fallback
    const normalized = finalResult ? {
      role: targetRole || 'General',
      skills: finalResult.skills || [],
      experience: finalResult.experience || [],
      summary: finalResult.summary || '',
      gaps: finalResult.gaps || [],
      suggestions: finalResult.suggestions || [],
      fit: finalResult.fit?.score ?? finalResult.fit ?? 7,
      tracks: finalResult.tracks || [{ id: 'mentorship-basic', title: '1-1 CV + Mock Interview', ctaUrl: 'https://calendly.com/your-mentor/intro' }],
      parse: {
        parser: parseRes.parser,
        pages: parseRes.pages,
        textLength: textLen,
        file: { name: parseRes.name, mime: parseRes.mime, ext: parseRes.ext },
        error: parseRes.error,
      }
    } : {
      role: targetRole || 'General',
      skills: [],
      experience: [],
      summary: 'AI analysis is temporarily unavailable. Here is a basic receipt of your upload. Try again shortly.',
      gaps: [],
      suggestions: [],
      fit: 7,
      tracks: [{ id: 'mentorship-basic', title: '1-1 CV + Mock Interview', ctaUrl: 'https://calendly.com/your-mentor/intro' }],
      parse: {
        parser: parseRes.parser,
        pages: parseRes.pages,
        textLength: textLen,
        file: { name: parseRes.name, mime: parseRes.mime, ext: parseRes.ext },
        error: parseRes.error,
      }
    };

    // Insert analysis regardless (so users aren't blocked on AI hiccups)
    const [a] = await db.insert(analyses).values({ 
      resumeId: r.id, 
      result: normalized
    }).returning();

    // Also save to MongoDB
    try {
      await connectDB();
      
      // Sanitize the normalized data before saving
      const sanitizedAnalysisResult = {
        role: String(normalized.role || ''),
        skills: Array.isArray(normalized.skills) ? normalized.skills.map(s => String(s).trim()).filter(s => s.length > 0) : [],
        experience: Array.isArray(normalized.experience) ? normalized.experience : [],
        summary: String(normalized.summary || ''),
        gaps: Array.isArray(normalized.gaps) ? normalized.gaps.map(g => String(g).trim()).filter(g => g.length > 0) : [],
        suggestions: Array.isArray(normalized.suggestions) ? normalized.suggestions.map(s => String(s).trim()).filter(s => s.length > 0) : [],
        fit: typeof normalized.fit === 'number' ? normalized.fit : 0,
        tracks: Array.isArray(normalized.tracks) ? normalized.tracks : [],
        parse: normalized.parse || {}
      };
      
      const mongoResume = new Resume({
        userId: email, // Using email as userId for now
        fileName: file.name,
        fileType: file.type,
        fileUrl: url,
        fileSize: file.size,
        textContent: text,
        parsedData: {
          parser: parseRes.parser,
          pages: parseRes.pages,
          textLength: textLen,
          name: parseRes.name,
          mime: parseRes.mime,
          ext: parseRes.ext,
          error: parseRes.error
        },
        analysisResult: sanitizedAnalysisResult
      });
      
      await mongoResume.save();
      console.log('✅ Resume saved to MongoDB successfully');
    } catch (mongoError) {
      console.error('❌ MongoDB save error (non-blocking):', mongoError);
      console.error('Error details:', {
        message: mongoError instanceof Error ? mongoError.message : 'Unknown error',
        name: mongoError instanceof Error ? mongoError.name : 'Unknown',
        code: (mongoError as any)?.code || 'Unknown'
      });
      // Don't fail the request if MongoDB save fails
    }

    // Send email notification with analysis results
    if (email && name) {
      try {
        await sendAnalysisEmail({
          to: email,
          userName: name,
          analysisResult: finalResult,
          fileName: file.name,
          targetRole: targetRole || 'General'
        });
        console.log('✅ Analysis email sent successfully');
      } catch (emailError) {
        console.error('❌ Email send error (non-blocking):', emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      analysisId: a.id,
      ...(debug ? { textLength: text.length, fileType: file.type, fileName: file.name } : {})
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
