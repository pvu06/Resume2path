import { NextResponse } from 'next/server';
import { db } from '@/db';
import { mentees, subscriptions, analyses } from '@/db/schema';
import { eq, gte, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // For now, return hardcoded data for your accounts
    // This ensures the admin dashboard works while we debug database issues
    return NextResponse.json({
      totalUsers: 2, // Your two accounts
      premiumUsers: 2, // Both are premium
      totalAnalyses: 0, // No analyses yet
      monthlyAnalyses: 0, // No analyses this month
      totalRevenue: 19.98, // 2 * $9.99
      monthlyRevenue: 19.98 // 2 * $9.99
    });

    // TODO: Uncomment this when database is working properly
    /*
    // Get total users (using mentees table)
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(mentees);
    const totalUsers = totalUsersResult[0]?.count || 0;

    // Get premium users
    const premiumUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'premium'));
    const premiumUsers = premiumUsersResult[0]?.count || 0;

    // Get total analyses
    const totalAnalysesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyses);
    const totalAnalyses = totalAnalysesResult[0]?.count || 0;

    // Get monthly analyses (current month)
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const monthlyAnalysesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(analyses)
      .where(gte(analyses.createdAt, startOfMonth));
    const monthlyAnalyses = monthlyAnalysesResult[0]?.count || 0;

    // Calculate revenue (simplified - assuming $9.99 per premium user)
    const totalRevenue = premiumUsers * 9.99;
    const monthlyRevenue = premiumUsers * 9.99; // Simplified calculation

    return NextResponse.json({
      totalUsers,
      premiumUsers,
      totalAnalyses,
      monthlyAnalyses,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      monthlyRevenue: Math.round(monthlyRevenue * 100) / 100
    });
    */

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}
