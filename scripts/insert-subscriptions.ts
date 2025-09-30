import { db } from '../src/db';
import { subscriptions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function insertSubscriptions() {
  try {
    console.log('🔄 Inserting subscription data...');

    const subscriptionData = [
      {
        userId: 'pvu14@student.gsu.edu',
        stripeCustomerId: 'cus_T9BKd1Nu0r8rHP',
        stripeSubscriptionId: 'sub_1SCt7ZFNaeJNb5hRsqT9PNbF',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: 'false',
      },
      {
        userId: 'hakaho1411@bitmens.com',
        stripeCustomerId: 'cus_T9BKd1Nu0r8rHP', 
        stripeSubscriptionId: 'sub_1SCt0YFNaeJNb5hR170uuxHK',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: 'false',
      }
    ];

    for (const sub of subscriptionData) {
      try {
        // Try to insert first
        await db.insert(subscriptions).values(sub);
        console.log(`✅ Inserted subscription for: ${sub.userId}`);
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          // Update existing record
          await db.update(subscriptions)
            .set({
              stripeCustomerId: sub.stripeCustomerId,
              stripeSubscriptionId: sub.stripeSubscriptionId,
              status: sub.status,
              currentPeriodEnd: sub.currentPeriodEnd,
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, sub.userId));
          console.log(`✅ Updated subscription for: ${sub.userId}`);
        } else {
          throw error;
        }
      }
    }

    console.log('🎉 All subscriptions inserted successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error inserting subscriptions:', error);
    process.exit(1);
  }
}

insertSubscriptions();
