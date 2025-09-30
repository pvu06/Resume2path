import { NextResponse } from 'next/server';

export async function GET() {
  // Return mock data to avoid database connection issues during build
  return NextResponse.json([]);
}
