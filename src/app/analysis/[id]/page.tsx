'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, AlertCircle, ArrowRight, Target, Lightbulb, Calendar } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

type AnalysisResult = any;

export default function AnalysisPage() {
  const params = useParams();
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [role, setRole] = useState<string>('General');
  const [fitScore, setFitScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [parseMeta, setParseMeta] = useState<any | null>(null);
  const [createdAtIso, setCreatedAtIso] = useState<string | null>(null);
  const [resumeMeta, setResumeMeta] = useState<{ fileUrl?: string; fileType?: string } | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const response = await fetch(`/api/analysis/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          // API returns { result: { id, result, createdAt, resume, mentee } }
          const res = data.result?.result || data.result;
          setAnalysis(res);
          setRole(res?.role || data.result?.mentee?.targetRole || 'General');
          const fs = typeof res?.fit === 'number' ? res.fit : (typeof res?.fit?.score === 'number' ? res.fit.score : null);
          setFitScore(fs);
          setParseMeta(res?.parse || null);
          setCreatedAtIso(data.result?.createdAt || null);
          setResumeMeta({ fileUrl: data.result?.resume?.fileUrl, fileType: data.result?.resume?.fileType });
        } else {
          console.error('Failed to fetch analysis');
        }
      } catch (error) {
        console.error('Error fetching analysis:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [params.id]);

  // Persist this analysis to the authenticated user's Firestore history
  useEffect(() => {
    if (!analysis) return;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;
      try {
        const idStr = String(params.id);
        const createdMs = createdAtIso ? Date.parse(createdAtIso) : Date.now();
        const ref = doc(db, 'users', u.uid, 'analyses', idStr);
        await setDoc(ref, {
          analysisId: Number(params.id),
          createdAtIso: createdAtIso || new Date().toISOString(),
          createdAtMs: isNaN(createdMs) ? Date.now() : createdMs,
          role: role,
          fitScore: fitScore,
          summary: analysis.summary || null,
          parse: parseMeta || null,
          resume: resumeMeta || null,
        }, { merge: true });
      } catch (e) {
        // best effort; do not block UI
        console.error('Failed to save analysis history to Firestore:', e);
      } finally {
        unsub();
      }
    });
    return () => unsub();
  }, [analysis, role, fitScore, parseMeta, createdAtIso, resumeMeta, params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600">Analysis not found</p>
        </div>
      </div>
    );
  }

  const getFitColor = (fit: string) => {
    switch (fit) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'mid': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFitText = (fit: string) => {
    switch (fit) {
      case 'high': return 'High Fit';
      case 'mid': return 'Medium Fit';
      case 'low': return 'Low Fit';
      default: return 'Unknown Fit';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Resume Analysis Results
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-blue-200" />
              <span className="text-xl text-blue-100">Target Role: {role}</span>
            </div>
            <Badge className={`${getFitColor('unknown')} text-lg px-4 py-2`}>
              {fitScore != null ? `Fit: ${fitScore}/10` : 'Fit: N/A'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Parse Summary */}
        {parseMeta && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Parsing Summary</CardTitle>
              <CardDescription>Details from file text extraction</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
              <div>
                <span className="font-semibold">Parser:</span> {parseMeta.parser || 'n/a'}
              </div>
              {typeof parseMeta.pages === 'number' && (
                <div>
                  <span className="font-semibold">Pages:</span> {parseMeta.pages}
                </div>
              )}
              <div>
                <span className="font-semibold">Extracted Length:</span> {parseMeta.textLength ?? 'n/a'} chars
              </div>
              <div>
                <span className="font-semibold">File:</span> {parseMeta.file?.name || 'n/a'} ({parseMeta.file?.mime || parseMeta.file?.ext || 'n/a'})
              </div>
              {parseMeta.error && (
                <div className="sm:col-span-2 text-orange-700">
                  <span className="font-semibold">Note:</span> {parseMeta.error}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Skills Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Current Skills
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Hard Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.skills?.hard?.map?.((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  )) || <span className="text-gray-500">No hard skills identified</span>}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Soft Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.skills?.soft?.map?.((skill: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  )) || <span className="text-gray-500">No soft skills identified</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gaps Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Skills Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
        {analysis.gaps?.map?.((gap: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span className="text-gray-700">{typeof gap === 'string' ? gap : gap?.skill || 'Gap'}</span>
                  </div>
        )) || <span className="text-gray-500">No skill gaps identified</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Suggestions Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-blue-600" />
              Improvement Suggestions
            </CardTitle>
            <CardDescription>
              Specific recommendations to improve your resume for the target role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
        {analysis.suggestions?.map?.((suggestion: any, index: number) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
          <span className="font-medium">{suggestion.section || suggestion.title || `Suggestion ${index+1}`}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3 pt-2">
                      <div>
                        <h5 className="font-semibold text-sm text-gray-700">Suggested Change:</h5>
            <p className="text-gray-600">{suggestion.change || suggestion.description || '—'}</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-sm text-gray-700">Reason:</h5>
            <p className="text-gray-600">{suggestion.reason || suggestion.rationale || '—'}</p>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )) || <div className="text-center py-8 text-gray-500">No specific suggestions available at this time.</div>}
            </Accordion>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-2xl border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Calendar className="h-7 w-7" />
              Ready to Take Action?
            </CardTitle>
            <CardDescription className="text-blue-100 text-lg">
              Book a 1-on-1 session with our career mentors to dive deeper into your analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <h4 className="font-semibold text-lg mb-3">{analysis.tracks?.[0]?.title || 'Career Development Session'}</h4>
                <p className="text-blue-100">
                  Get personalized feedback on your resume and practice mock interviews
                </p>
              </div>
              <Button 
                asChild 
                size="lg" 
                className="w-full bg-white text-blue-600 hover:bg-blue-50 h-14 text-lg font-semibold shadow-lg hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
              >
                <a href={analysis.tracks?.[0]?.ctaUrl || 'https://calendly.com/your-mentor/intro'} target="_blank" rel="noopener noreferrer">
                  Book 1-on-1 Session
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
