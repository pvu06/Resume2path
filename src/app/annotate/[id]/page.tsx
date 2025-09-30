'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, Share2, Save } from 'lucide-react';
import Header from '@/components/Header';
import PDFAnnotator from '@/components/PDFAnnotator';
import Link from 'next/link';

interface AnalysisResult {
  id: number;
  result: any;
  resume: {
    fileUrl: string;
    fileName: string;
  };
}

export default function AnnotatePage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [annotations, setAnnotations] = useState<any[]>([]);

  useEffect(() => {
    const loadAnalysis = async () => {
      try {
        const response = await fetch(`/api/analysis/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setAnalysis(data);
        }
      } catch (error) {
        console.error('Error loading analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadAnalysis();
    }
  }, [params.id]);

  const handleAnnotationAdd = (annotation: any) => {
    setAnnotations(prev => [...prev, annotation]);
  };

  const handleAnnotationRemove = (annotationId: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
  };

  const handleSaveAnnotations = async () => {
    try {
      // Save annotations to database
      const response = await fetch(`/api/analysis/${params.id}/annotations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations })
      });

      if (response.ok) {
        alert('Annotations saved successfully!');
      }
    } catch (error) {
      console.error('Error saving annotations:', error);
      alert('Failed to save annotations');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/3"></div>
            <div className="h-64 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Analysis not found</h2>
              <p className="text-gray-600 mb-4">The requested analysis could not be found.</p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Annotate Resume
                </h1>
                <p className="text-gray-600">
                  {analysis.resume.fileName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {annotations.length} annotations
              </Badge>
              <Button variant="outline" size="sm" onClick={handleSaveAnnotations}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>

        {/* PDF Annotator */}
        <PDFAnnotator
          fileUrl={analysis.resume.fileUrl}
          analysisResult={analysis.result}
          onAnnotationAdd={handleAnnotationAdd}
          onAnnotationRemove={handleAnnotationRemove}
        />

        {/* Analysis Summary */}
        {analysis.result && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Analysis Summary</CardTitle>
              <CardDescription>
                AI-generated insights for this resume
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Overall Score</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {analysis.result.fit?.score || 'N/A'}/10
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Strengths</h3>
                  <ul className="space-y-1">
                    {analysis.result.skills?.slice(0, 3).map((skill: any, index: number) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {skill.name} ({skill.rating}/10)
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Areas to Improve</h3>
                  <ul className="space-y-1">
                    {analysis.result.gaps?.slice(0, 3).map((gap: any, index: number) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {gap.skill}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

