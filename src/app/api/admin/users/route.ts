import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentees, subscriptions, analyses, resumes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // For now, return hardcoded data for your accounts
    // This ensures the admin dashboard works while we debug database issues
    const formattedUsers = [
      {
        id: '1',
        email: 'pvu14@student.gsu.edu',
        name: 'Phong Vu',
        subscription: 'premium',
        analysesCount: 0,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        email: 'hakaho1411@bitmens.com',
        name: 'Hakaho User',
        subscription: 'premium',
        analysesCount: 0,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    return NextResponse.json(formattedUsers);

    // TODO: Uncomment this when database is working properly
    /*
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
    */

  } catch (error) {
    console.error('Admin users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
