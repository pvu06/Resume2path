import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(req: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

    // Get recent events from Stripe
    const events = await stripe.events.list({
      limit: 10,
      type: 'checkout.session.completed'
    });

    const recentEvents = events.data.map(event => ({
      id: event.id,
      type: event.type,
      created: new Date(event.created * 1000).toISOString(),
      data: event.data.object
    }));

    return NextResponse.json({
      message: 'Recent checkout events:',
      events: recentEvents,
      total: events.data.length
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}

