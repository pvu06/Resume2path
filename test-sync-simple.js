// Simple test to sync subscriptions
const testSync = async () => {
  const payments = [
    {
      email: 'pvu14@student.gsu.edu',
      subscriptionId: 'sub_1SCt7ZFNaeJNb5hRsqT9PNbF',
      customerId: 'cus_T9BKd1Nu0r8rHP'
    },
    {
      email: 'hakaho1411@bitmens.com', 
      subscriptionId: 'sub_1SCt0YFNaeJNb5hR170uuxHK',
      customerId: 'cus_T9BKd1Nu0r8rHP'
    }
  ];

  for (const payment of payments) {
    try {
      console.log(`\n🔄 Syncing payment for: ${payment.email}`);
      
      const response = await fetch('https://resume2path.vercel.app/api/sync-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✅ Success for ${payment.email}:`, result);
      } else {
        console.log(`❌ Error for ${payment.email}:`, result);
      }
      
    } catch (error) {
      console.error(`❌ Network error for ${payment.email}:`, error.message);
    }
  }
};

testSync();

