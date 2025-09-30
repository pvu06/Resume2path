// Test script to manually sync subscriptions
const testSync = async () => {
  const emails = [
    'your-email-1@example.com', // Replace with your actual emails
    'your-email-2@example.com'
  ];

  for (const email of emails) {
    try {
      console.log(`Syncing subscription for: ${email}`);
      
      const response = await fetch('https://resume2path.vercel.app/api/sync-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      console.log(`Result for ${email}:`, result);
      
    } catch (error) {
      console.error(`Error syncing ${email}:`, error);
    }
  }
};

testSync();
