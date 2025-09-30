import { NextResponse } from 'next/server';

export async function GET() {
  // Return mock data to avoid database connection issues during build
  return NextResponse.json({
    totalUsers: 0,
    premiumUsers: 0,
    totalAnalyses: 0,
    monthlyAnalyses: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
}
