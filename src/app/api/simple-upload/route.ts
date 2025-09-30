import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentees, resumes, analyses } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  try {
    console.log('📤 Simple upload API called');
    
    const form = await req.formData();
    const file = form.get('file') as File;
    const email = form.get('email') as string;
    const name = form.get('name') as string;
    const targetRole = form.get('targetRole') as string;
    
    console.log('📤 Upload data:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      email, 
      name,
      targetRole
    });
    
    if (!file || !email) {
      return NextResponse.json({ error: 'Missing file or email' }, { status: 400 });
    }

    // Simple file processing - just read as text for now
    const text = await file.text();
    console.log('📄 File text length:', text.length);

    // Create or find user
    let menteeId: number;
    try {
      const existing = await db.select().from(mentees).where(eq(mentees.email, email)).limit(1);
      if (existing.length > 0) {
        menteeId = existing[0].id;
        console.log('✅ Found existing user:', menteeId);
      } else {
        const [newUser] = await db.insert(mentees).values({ 
          email, 
          name: name || 'User', 
          targetRole: targetRole || 'General' 
        }).returning();
        menteeId = newUser.id;
        console.log('✅ Created new user:', menteeId);
      }
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database error',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Create resume record
    let resumeId: number;
    try {
      const [resume] = await db.insert(resumes).values({ 
        menteeId, 
        fileUrl: `local://${file.name}`, 
        fileType: file.type, 
        textContent: text 
      }).returning();
      resumeId = resume.id;
      console.log('✅ Created resume record:', resumeId);
    } catch (dbError) {
      console.error('❌ Resume creation error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to create resume record',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Create simple analysis
    let analysisId: number;
    try {
      const [analysis] = await db.insert(analyses).values({ 
        resumeId, 
        result: {
          role: targetRole || 'General',
          skills: ['Sample skill 1', 'Sample skill 2'],
          summary: 'Resume uploaded successfully! Analysis will be completed shortly.',
          gaps: ['Sample gap 1'],
          suggestions: ['Sample suggestion 1'],
          fit: { score: 7, rationale: 'Good overall structure' },
          tracks: []
        }
      }).returning();
      analysisId = analysis.id;
      console.log('✅ Created analysis record:', analysisId);
    } catch (dbError) {
      console.error('❌ Analysis creation error:', dbError);
      return NextResponse.json({ 
        error: 'Failed to create analysis record',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

    console.log('🎉 Upload completed successfully!');
    return NextResponse.json({ 
      success: true,
      analysisId: analysisId,
      message: 'Resume uploaded and analysis created successfully!',
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        email,
        name: name || 'User',
        targetRole: targetRole || 'General'
      }
    });

  } catch (error) {
    console.error('📤 Simple upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}