import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentees, subscriptions, analyses, resumes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get users with their subscription status and analysis count
    const usersWithStats = await db
      .select({
        id: mentees.id,
        email: mentees.email,
        name: mentees.name,
        createdAt: mentees.createdAt,
        subscriptionStatus: subscriptions.status,
        analysesCount: sql<number>`count(${analyses.id})`
      })
      .from(mentees)
      .leftJoin(subscriptions, eq(mentees.email, subscriptions.userId))
      .leftJoin(resumes, eq(mentees.id, resumes.menteeId))
      .leftJoin(analyses, eq(resumes.id, analyses.resumeId))
      .groupBy(mentees.id, mentees.email, mentees.name, mentees.createdAt, subscriptions.status);

    // Format the data
    const formattedUsers = usersWithStats.map((user: any) => ({
      id: user.id.toString(),
      email: user.email,
      name: user.name || 'No name',
      subscription: user.subscriptionStatus || 'free',
      analysesCount: user.analysesCount || 0,
      lastActive: user.createdAt?.toISOString() || '',
      createdAt: user.createdAt?.toISOString() || ''
    }));

    return NextResponse.json(formattedUsers);

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
