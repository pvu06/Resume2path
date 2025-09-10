import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentees } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || '';
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 });
  const rows = await db.select().from(mentees).where(eq(mentees.email, email)).limit(1);
  const mentee = rows[0] || null;
  return NextResponse.json({ mentee });
}
