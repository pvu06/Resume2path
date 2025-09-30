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

    // Check if this is one of the paid users
    const premiumEmails = ['pvu14@student.gsu.edu', 'hakaho1411@bitmens.com'];
    
    if (premiumEmails.includes(email)) {
      // Return premium status for paid users
      const currentMonth = new Date().toISOString().slice(0, 7);
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30); // 30 days from now

      return NextResponse.json({
        subscription: {
          status: 'premium',
          currentPeriodEnd: currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: false
        },
        usage: {
          currentMonth,
          analysesCount: 0,
          limit: -1 // Unlimited for premium
        }
      });
    }

    // For other users, try to get from database
    try {
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

    } catch (dbError) {
      console.error('Database error, falling back to free:', dbError);
      // Fallback to free if database fails
      const currentMonth = new Date().toISOString().slice(0, 7);
      return NextResponse.json({
        subscription: {
          status: 'free',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false
        },
        usage: {
          currentMonth,
          analysesCount: 0,
          limit: 3
        }
      });
    }

  } catch (error) {
    console.error('Subscription check error:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}

