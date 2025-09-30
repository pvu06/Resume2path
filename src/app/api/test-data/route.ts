import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentees, subscriptions, analyses, resumes } from '@/db/schema';

export async function GET() {
  try {
    // Simple count queries
    const menteesCount = await db.select().from(mentees);
    const subscriptionsCount = await db.select().from(subscriptions);
    const analysesCount = await db.select().from(analyses);
    const resumesCount = await db.select().from(resumes);

    return NextResponse.json({
      mentees: menteesCount.length,
      subscriptions: subscriptionsCount.length,
      analyses: analysesCount.length,
      resumes: resumesCount.length,
      menteesData: menteesCount,
      subscriptionsData: subscriptionsCount
    });

  } catch (error) {
    console.error('Test data error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
