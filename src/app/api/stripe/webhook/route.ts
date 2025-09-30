import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('✅ Checkout session completed:', session.id);
        
        if (session.subscription && session.customer) {
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customer = await stripe.customers.retrieve(session.customer as string);
          const email = (customer as any).email;
          
          if (email) {
            // Save subscription to database
            await db.insert(subscriptions).values({
              userId: email,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: String((subscription as any).cancel_at_period_end),
            }).onConflictDoUpdate({
              target: subscriptions.userId,
              set: {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscription.id,
                status: subscription.status,
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                cancelAtPeriodEnd: String((subscription as any).cancel_at_period_end),
                updatedAt: new Date(),
              },
            });
            console.log(`✅ Subscription saved for user: ${email}`);
          }
        }
        break;

      case 'customer.subscription.created':
        const newSubscription = event.data.object;
        console.log('✅ Subscription created:', newSubscription.id);
        
        // Get customer email
        const customer = await stripe.customers.retrieve(newSubscription.customer as string);
        const email = (customer as any).email;
        
        if (email) {
          await db.insert(subscriptions).values({
            userId: email,
            stripeCustomerId: newSubscription.customer as string,
            stripeSubscriptionId: newSubscription.id,
            status: newSubscription.status,
            currentPeriodEnd: new Date((newSubscription as any).current_period_end * 1000),
            cancelAtPeriodEnd: String((newSubscription as any).cancel_at_period_end),
          }).onConflictDoUpdate({
            target: subscriptions.userId,
            set: {
              stripeCustomerId: newSubscription.customer as string,
              stripeSubscriptionId: newSubscription.id,
              status: newSubscription.status,
              currentPeriodEnd: new Date((newSubscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: String((newSubscription as any).cancel_at_period_end),
              updatedAt: new Date(),
            },
          });
          console.log(`✅ Subscription created for user: ${email}`);
        }
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object;
        console.log('✅ Subscription updated:', updatedSubscription.id);
        
        // Update subscription in database
        const existingSub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, updatedSubscription.id),
        });
        
        if (existingSub) {
          await db
            .update(subscriptions)
            .set({
              status: updatedSubscription.status,
              currentPeriodEnd: new Date((updatedSubscription as any).current_period_end * 1000),
              cancelAtPeriodEnd: String((updatedSubscription as any).cancel_at_period_end),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, updatedSubscription.id));
          console.log(`✅ Subscription updated for: ${existingSub.userId}`);
        }
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object;
        console.log('✅ Subscription cancelled:', deletedSubscription.id);
        
        // Update subscription status to cancelled
        const cancelledSub = await db.query.subscriptions.findFirst({
          where: eq(subscriptions.stripeSubscriptionId, deletedSubscription.id),
        });
        
        if (cancelledSub) {
          await db
            .update(subscriptions)
            .set({
              status: 'cancelled',
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, deletedSubscription.id));
          console.log(`✅ Subscription cancelled for: ${cancelledSub.userId}`);
        }
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        console.log('✅ Payment succeeded:', invoice.id);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        console.log('❌ Payment failed:', failedInvoice.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
