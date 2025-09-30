import { NextResponse } from 'next/server';

export async function GET() {
  // Return mock data to avoid Redis connection issues during build
  return NextResponse.json({
    success: true,
    stats: {
      analysis: { waiting: 0, active: 0, completed: 0, failed: 0 },
      email: { waiting: 0, active: 0, completed: 0, failed: 0 },
      total: { waiting: 0, active: 0, completed: 0, failed: 0 }
    },
    timestamp: new Date().toISOString()
  });
}
