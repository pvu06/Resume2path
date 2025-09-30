import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    const { email, subscriptionId, customerId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let customer;
    let subscription;

    // If subscriptionId and customerId are provided, use them directly
    if (subscriptionId && customerId) {
      customer = await stripe.customers.retrieve(customerId);
      subscription = await stripe.subscriptions.retrieve(subscriptionId);
    } else {
      // Otherwise, look up by email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1
      });

      if (customers.data.length === 0) {
        return NextResponse.json({ error: 'No customer found with this email' }, { status: 404 });
      }

      customer = customers.data[0];

      // Get all subscriptions for this customer
      const stripeSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: 'all'
      });

      if (stripeSubscriptions.data.length === 0) {
        return NextResponse.json({ error: 'No subscriptions found for this customer' }, { status: 404 });
      }

      subscription = stripeSubscriptions.data[0];
    }

    // Save to database
    await db.insert(subscriptions).values({
      userId: email,
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: String((subscription as any).cancel_at_period_end),
    }).onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        cancelAtPeriodEnd: String((subscription as any).cancel_at_period_end),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Subscription synced successfully',
      subscription: {
        id: subscription.id,
        status: subscription.status,
        customerId: customer.id
      }
    });

  } catch (error) {
    console.error('Sync subscription error:', error);
    return NextResponse.json({ error: 'Failed to sync subscription' }, { status: 500 });
  }
}
