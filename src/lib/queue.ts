import Queue from 'bull';
import { sendAnalysisEmail, sendWelcomeEmail } from './email';
import { analytics } from './analytics';

// Redis connection (using default localhost for development)
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
};

// Create queues
export const analysisQueue = new Queue('resume analysis', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const emailQueue = new Queue('email notifications', {
  redis: redisConfig,
  defaultJobOptions: {
    removeOnComplete: 20,
    removeOnFail: 10,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

// Job processors
analysisQueue.process('analyze-resume', async (job) => {
  const { resumeId, fileUrl, textContent, targetRole, email, name } = job.data;
  
  console.log(`🔄 Processing resume analysis for ${email}...`);
  
  try {
    // Call Gemini API for analysis
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/gemini`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textContent,
        targetRole: targetRole,
        isChat: false
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const analysisResult = await response.json();
    
    // Update job progress
    job.progress(50);
    
    // Save analysis to database
    const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analysis/${resumeId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: analysisResult })
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save analysis to database');
    }

    job.progress(100);
    
    // Queue email notification
    await emailQueue.add('send-analysis-email', {
      email,
      name,
      analysisResult,
      fileName: 'resume.pdf',
      targetRole
    });

    console.log(`✅ Resume analysis completed for ${email}`);
    return { success: true, analysisResult };

  } catch (error) {
    console.error(`❌ Resume analysis failed for ${email}:`, error);
    throw error;
  }
});

emailQueue.process('send-welcome-email', async (job) => {
  const { email, name } = job.data;
  
  console.log(`📧 Sending welcome email to ${email}...`);
  
  try {
    await sendWelcomeEmail(email, name);
    console.log(`✅ Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Welcome email failed for ${email}:`, error);
    throw error;
  }
});

emailQueue.process('send-analysis-email', async (job) => {
  const { email, name, analysisResult, fileName, targetRole } = job.data;
  
  console.log(`📧 Sending analysis email to ${email}...`);
  
  try {
    await sendAnalysisEmail({
      to: email,
      userName: name,
      analysisResult,
      fileName,
      targetRole
    });
    console.log(`✅ Analysis email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`❌ Analysis email failed for ${email}:`, error);
    throw error;
  }
});

// Queue event listeners
analysisQueue.on('completed', (job, result) => {
  console.log(`✅ Analysis job ${job.id} completed:`, result);
});

analysisQueue.on('failed', (job, err) => {
  console.error(`❌ Analysis job ${job.id} failed:`, err.message);
});

emailQueue.on('completed', (job, result) => {
  console.log(`✅ Email job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
  console.error(`❌ Email job ${job.id} failed:`, err.message);
});

// Helper functions
export async function queueResumeAnalysis(data: {
  resumeId: number;
  fileUrl: string;
  textContent: string;
  targetRole: string;
  email: string;
  name: string;
}) {
  const job = await analysisQueue.add('analyze-resume', data, {
    priority: 1, // High priority for analysis
    delay: 0, // Process immediately
  });
  
  console.log(`📋 Queued resume analysis job ${job.id} for ${data.email}`);
  return job;
}

export async function queueWelcomeEmail(email: string, name: string) {
  const job = await emailQueue.add('send-welcome-email', { email, name }, {
    priority: 2, // Medium priority for emails
    delay: 1000, // 1 second delay
  });
  
  console.log(`📋 Queued welcome email job ${job.id} for ${email}`);
  return job;
}

export async function queueAnalysisEmail(data: {
  email: string;
  name: string;
  analysisResult: any;
  fileName: string;
  targetRole: string;
}) {
  const job = await emailQueue.add('send-analysis-email', data, {
    priority: 2, // Medium priority for emails
    delay: 2000, // 2 second delay
  });
  
  console.log(`📋 Queued analysis email job ${job.id} for ${data.email}`);
  return job;
}

// Queue monitoring
export async function getQueueStats() {
  const analysisStats = await analysisQueue.getJobCounts();
  const emailStats = await emailQueue.getJobCounts();
  
  return {
    analysis: analysisStats,
    email: emailStats,
    total: {
      waiting: analysisStats.waiting + emailStats.waiting,
      active: analysisStats.active + emailStats.active,
      completed: analysisStats.completed + emailStats.completed,
      failed: analysisStats.failed + emailStats.failed,
    }
  };
}

// Clean up function
export async function closeQueues() {
  await analysisQueue.close();
  await emailQueue.close();
}
