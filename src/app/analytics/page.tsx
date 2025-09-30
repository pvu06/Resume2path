'use client';

import { useState } from 'react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import Header from '@/components/Header';

export default function AnalyticsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Simple authentication check (in production, use proper auth)
  const handleAuth = () => {
    const password = prompt('Enter admin password:');
    if (password === 'admin123') { // Simple demo password
      setIsAuthenticated(true);
    } else {
      alert('Invalid password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ocean-900 to-ocean-800">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-4">Analytics Dashboard</h1>
            <p className="text-ocean-200 mb-6">Enter admin password to view analytics</p>
            <button
              onClick={handleAuth}
              className="bg-white text-ocean-900 px-6 py-3 rounded-lg font-semibold hover:bg-ocean-50 transition-colors"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AnalyticsDashboard />
    </div>
  );
}

