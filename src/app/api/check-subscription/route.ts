import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    console.log(`Checking subscription for: ${email}`);

    // Simple query to get subscription
    const subscriptionRows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, email))
      .limit(1);

    console.log(`Found ${subscriptionRows.length} subscription records for ${email}`);

    if (subscriptionRows.length === 0) {
      return NextResponse.json({
        email,
        subscription: {
          status: 'free',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false
        },
        found: false
      });
    }

    const subscription = subscriptionRows[0];

    return NextResponse.json({
      email,
      subscription: {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd === 'true'
      },
      found: true,
      rawData: subscription
    });

  } catch (error) {
    console.error('Check subscription error:', error);
    return NextResponse.json({ 
      error: 'Failed to check subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
