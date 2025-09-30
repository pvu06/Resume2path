'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Play,
  Pause,
  Trash2
} from 'lucide-react';

interface QueueStats {
  analysis: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  email: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
  total: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

export default function QueueMonitor() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/queue/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching queue stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'failed': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'active': return <Activity className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queue Monitor</CardTitle>
          <CardDescription>Loading queue statistics...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Queue Monitor
            </CardTitle>
            <CardDescription>
              Background job processing status
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {autoRefresh ? 'Pause' : 'Resume'} Auto-refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Stats */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Overall Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats?.total || {}).map(([status, count]) => (
                <div key={status} className="text-center p-3 rounded-lg border">
                  <div className="flex items-center justify-center mb-2">
                    {getStatusIcon(status)}
                  </div>
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{status}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Queue Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analysis Queue */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Analysis Queue
              </h3>
              <div className="space-y-2">
                {Object.entries(stats?.analysis || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="capitalize">{status}</span>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Email Queue */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Email Queue
              </h3>
              <div className="space-y-2">
                {Object.entries(stats?.email || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="capitalize">{status}</span>
                    </div>
                    <Badge className={getStatusColor(status)}>
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">System Health</h3>
                <p className="text-sm text-gray-600">
                  Last updated: {new Date().toLocaleTimeString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {stats && stats.total.failed > 0 ? (
                  <Badge className="bg-red-100 text-red-800 border-red-300">
                    <XCircle className="w-4 h-4 mr-1" />
                    Issues Detected
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800 border-green-300">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Healthy
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

