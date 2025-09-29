import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users, subscriptions, analyses, resumes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get users with their subscription status and analysis count
    const usersWithStats = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt,
        lastLoginAt: users.lastLoginAt,
        subscriptionStatus: subscriptions.status,
        analysesCount: sql<number>`count(${analyses.id})`
      })
      .from(users)
      .leftJoin(subscriptions, eq(users.email, subscriptions.userId))
      .leftJoin(resumes, eq(users.email, resumes.menteeId))
      .leftJoin(analyses, eq(resumes.id, analyses.resumeId))
      .groupBy(users.id, users.email, users.name, users.createdAt, users.lastLoginAt, subscriptions.status);

    // Format the data
    const formattedUsers = usersWithStats.map(user => ({
      id: user.id.toString(),
      email: user.email,
      name: user.name || 'No name',
      subscription: user.subscriptionStatus || 'free',
      analysesCount: user.analysesCount || 0,
      lastActive: user.lastLoginAt?.toISOString() || user.createdAt?.toISOString() || '',
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
