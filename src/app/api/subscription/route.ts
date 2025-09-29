import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions, usage } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get subscription status
    const subscriptionRows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, email))
      .limit(1);

    const subscription = subscriptionRows[0] || {
      status: 'free',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false
    };

    // Get current month usage
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageRows = await db
      .select()
      .from(usage)
      .where(
        and(
          eq(usage.userId, email),
          eq(usage.month, currentMonth)
        )
      )
      .limit(1);

    const currentUsage = usageRows[0]?.analysesCount || 0;

    return NextResponse.json({
      subscription: {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === 'true'
      },
      usage: {
        currentMonth,
        analysesCount: currentUsage,
        limit: subscription.status === 'premium' ? -1 : 3 // -1 means unlimited
      }
    });

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}
