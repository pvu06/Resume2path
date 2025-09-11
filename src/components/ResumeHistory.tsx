'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Trash2, Eye, Calendar } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { getUserIdentifier } from '@/lib/user-utils';

interface ResumeData {
  _id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  createdAt: string;
  analysisResult?: {
    role: string;
    skills: string[];
    summary: string;
    fit: number;
  };
}

export default function ResumeHistory() {
  const [user, setUser] = useState<any>(null);
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadResumes();
    }
  }, [user]);

  const loadResumes = async () => {
    const userId = getUserIdentifier(user);
    if (!userId) return;

    try {
      const response = await fetch(`/api/resumes?userId=${encodeURIComponent(userId)}`);
      if (response.ok) {
        const data = await response.json();
        setResumes(data.resumes || []);
      }
    } catch (error) {
      console.error('Error loading resumes:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteResume = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;

    try {
      const response = await fetch(`/api/resumes?resumeId=${resumeId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setResumes(prev => prev.filter(resume => resume._id !== resumeId));
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Please log in to view your resume history.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Loading your resumes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Resume History</h2>
        <Badge variant="outline" className="text-sm">
          {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No resumes uploaded yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Upload your first resume to get started with AI analysis.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => (
            <Card key={resume._id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <CardTitle className="text-lg truncate">
                      {resume.fileName}
                    </CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteResume(resume._id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(resume.createdAt)}
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>Type: {resume.fileType}</p>
                  <p>Size: {formatFileSize(resume.fileSize)}</p>
                </div>

                {resume.analysisResult && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Role:</span>
                      <Badge variant="secondary">{resume.analysisResult.role}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Fit Score:</span>
                      <Badge 
                        variant={resume.analysisResult.fit >= 7 ? "default" : "destructive"}
                      >
                        {resume.analysisResult.fit}/10
                      </Badge>
                    </div>

                    {resume.analysisResult.skills && resume.analysisResult.skills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Key Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {resume.analysisResult.skills.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {resume.analysisResult.skills.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{resume.analysisResult.skills.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(resume.fileUrl, '_blank')}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = resume.fileUrl;
                      link.download = resume.fileName;
                      link.click();
                    }}
                    className="flex-1"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
