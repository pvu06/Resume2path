import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';

export async function POST(req: NextRequest) {
  try {
    const { email, subscriptionId, customerId, status = 'active' } = await req.json();

    if (!email || !subscriptionId || !customerId) {
      return NextResponse.json({ error: 'Email, subscriptionId, and customerId are required' }, { status: 400 });
    }

    // Calculate current period end (30 days from now)
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setDate(currentPeriodEnd.getDate() + 30);

    // Insert subscription directly
    await db.insert(subscriptions).values({
      userId: email,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: status,
      currentPeriodEnd: currentPeriodEnd,
      cancelAtPeriodEnd: 'false',
    }).onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: status,
        currentPeriodEnd: currentPeriodEnd,
        cancelAtPeriodEnd: 'false',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription synced successfully',
      subscription: {
        email,
        subscriptionId,
        customerId,
        status
      }
    });

  } catch (error) {
    console.error('Manual sync error:', error);
    return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 });
  }
}

