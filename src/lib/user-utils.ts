import { User } from 'firebase/auth';

export function getUserIdentifier(user: User | null | undefined): string | null {
  if (!user) return null;
  
  // Use email as the primary identifier
  return user.email || user.uid;
}

export function getSessionId(): string {
  // Generate a session ID that persists for the browser session
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('chat_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('chat_session_id', sessionId);
    }
    return sessionId;
  }
  
  // Fallback for server-side
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
