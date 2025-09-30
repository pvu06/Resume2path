import { NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';

export async function GET() {
  try {
    // Test database connection by trying to query subscriptions
    const result = await db.select().from(subscriptions).limit(1);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      subscriptionCount: result.length,
      sampleData: result
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

