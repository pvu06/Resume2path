import { NextResponse } from 'next/server';
import { getQueueStats } from '@/lib/queue';

export async function GET() {
  try {
    const stats = await getQueueStats();
    
    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Queue stats error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch queue stats',
        stats: {
          analysis: { waiting: 0, active: 0, completed: 0, failed: 0 },
          email: { waiting: 0, active: 0, completed: 0, failed: 0 },
          total: { waiting: 0, active: 0, completed: 0, failed: 0 }
        }
      },
      { status: 500 }
    );
  }
}
