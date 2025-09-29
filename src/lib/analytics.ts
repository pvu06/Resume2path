// Simple analytics tracking for Resume2Path
export interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp?: Date;
  userId?: string;
}

export interface AnalyticsData {
  totalUsers: number;
  totalResumes: number;
  totalAnalyses: number;
  averageScore: number;
  topRoles: Array<{ role: string; count: number }>;
  recentActivity: Array<{
    type: string;
    timestamp: Date;
    details: string;
  }>;
}

// Track events (in production, you'd send to analytics service)
export function trackEvent(event: string, properties?: Record<string, any>, userId?: string) {
  try {
    // In a real app, you'd send this to Google Analytics, Mixpanel, etc.
    console.log('📊 Analytics Event:', {
      event,
      properties,
      userId,
      timestamp: new Date().toISOString()
    });

    // Store in localStorage for demo purposes
    const events = JSON.parse(localStorage.getItem('resume2path_analytics') || '[]');
    events.push({
      event,
      properties,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.splice(0, events.length - 100);
    }
    
    localStorage.setItem('resume2path_analytics', JSON.stringify(events));
  } catch (error) {
    console.error('Analytics tracking error:', error);
  }
}

// Get analytics data
export function getAnalyticsData(): AnalyticsData {
  try {
    const events = JSON.parse(localStorage.getItem('resume2path_analytics') || '[]');
    
    const totalUsers = new Set(events.map((e: any) => e.userId).filter(Boolean)).size;
    const resumeEvents = events.filter((e: any) => e.event === 'resume_uploaded');
    const analysisEvents = events.filter((e: any) => e.event === 'analysis_completed');
    
    // Calculate average score from analysis events
    const scores = analysisEvents
      .map((e: any) => e.properties?.score)
      .filter(score => typeof score === 'number');
    const averageScore = scores.length > 0 
      ? scores.reduce((a, b) => a + b, 0) / scores.length 
      : 0;

    // Get top roles
    const roleCounts: Record<string, number> = {};
    resumeEvents.forEach((e: any) => {
      const role = e.properties?.targetRole || 'General';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    const topRoles = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent activity
    const recentActivity = events
      .slice(-10)
      .map((e: any) => ({
        type: e.event,
        timestamp: new Date(e.timestamp),
        details: getEventDescription(e.event, e.properties)
      }))
      .reverse();

    return {
      totalUsers,
      totalResumes: resumeEvents.length,
      totalAnalyses: analysisEvents.length,
      averageScore: Math.round(averageScore * 10) / 10,
      topRoles,
      recentActivity
    };
  } catch (error) {
    console.error('Analytics data error:', error);
    return {
      totalUsers: 0,
      totalResumes: 0,
      totalAnalyses: 0,
      averageScore: 0,
      topRoles: [],
      recentActivity: []
    };
  }
}

function getEventDescription(event: string, properties?: Record<string, any>): string {
  switch (event) {
    case 'resume_uploaded':
      return `Resume uploaded for ${properties?.targetRole || 'General'} role`;
    case 'analysis_completed':
      return `Analysis completed with score ${properties?.score || 'N/A'}/10`;
    case 'user_registered':
      return 'New user registered';
    case 'chat_message':
      return 'AI chat interaction';
    default:
      return event.replace(/_/g, ' ');
  }
}

// Common tracking functions
export const analytics = {
  trackResumeUpload: (targetRole: string, userId?: string) => {
    trackEvent('resume_uploaded', { targetRole }, userId);
  },
  
  trackAnalysisComplete: (score: number, targetRole: string, userId?: string) => {
    trackEvent('analysis_completed', { score, targetRole }, userId);
  },
  
  trackUserRegistration: (userId: string) => {
    trackEvent('user_registered', {}, userId);
  },
  
  trackChatMessage: (messageType: string, userId?: string) => {
    trackEvent('chat_message', { messageType }, userId);
  },
  
  trackPageView: (page: string, userId?: string) => {
    trackEvent('page_view', { page }, userId);
  }
};
