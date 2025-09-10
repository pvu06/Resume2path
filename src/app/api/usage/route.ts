export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentees, resumes, analyses } from '@/db/schema';
import { and, eq, gte } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

    // Find mentee
    const mentee = (await db.select().from(mentees).where(eq(mentees.email, email))).at(0);
    if (!mentee) {
      return NextResponse.json({ used: 0, remaining: 5, limit: 5 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Count analyses for resumes of this mentee created this month
    const rows = await db
      .select({ id: analyses.id })
      .from(analyses)
      .innerJoin(resumes, eq(analyses.resumeId, resumes.id))
      .where(and(eq(resumes.menteeId, mentee.id), gte(analyses.createdAt, startOfMonth)));

    const used = rows.length;
    const limit = 5;
    const remaining = Math.max(0, limit - used);
    return NextResponse.json({ used, remaining, limit });
  } catch (e) {
    console.error('Usage error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
