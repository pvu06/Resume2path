import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentees } from '@/db/schema';

export async function GET() {
  try {
    console.log('🧪 Testing database connection...');
    
    // Try a simple query
    const result = await db.select().from(mentees).limit(1);
    
    console.log('✅ Database query successful:', result);
    
    return NextResponse.json({ 
      success: true,
      message: 'Database connection working',
      data: result
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}