
"use client";
import { useEffect, useState } from "react";
import { auth, provider, db, testFirebaseConnection } from "../../lib/firebase";
import { signOut, onAuthStateChanged, User } from "firebase/auth";
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ResumeHistory from "@/components/ResumeHistory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Mail, Target, FileText, History } from "lucide-react";
import { put } from "@vercel/blob";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usage, setUsage] = useState<{ used: number; remaining: number; limit: number } | null>(null);
  const router = useRouter();

  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRole, setCustomRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [history, setHistory] = useState<Array<{ id: string; createdAtMs: number; role?: string; fitScore?: number }>>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>("");
  const [fbStatus, setFbStatus] = useState<'checking' | 'online' | 'offline'>("checking");
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        // Store user data in Firestore
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          });
        }
        // Quick Firebase connectivity check
        try {
          const res = await testFirebaseConnection();
          setFbStatus(res.ok ? 'online' : 'offline');
        } catch {
          setFbStatus('offline');
        }

        // Fetch monthly usage from server db
        try {
          const res = await fetch(`/api/usage?email=${encodeURIComponent(user.email || "")}`);
          if (res.ok) setUsage(await res.json());
        } catch {}
        // Load user's previous analyses from Firestore
        try {
          const col = collection(db, 'users', user.uid, 'analyses');
          const q = query(col, orderBy('createdAtMs', 'desc'));
          const snap = await getDocs(q);
          const items = snap.docs.map(d => {
            const v = d.data() as any;
            return { id: d.id, createdAtMs: Number(v.createdAtMs || 0), role: v.role, fitScore: v.fitScore };
          }).filter(x => !isNaN(x.createdAtMs));
          setHistory(items);
        } catch (e) {
          console.error('Failed to load history:', e);
        }
        // Prefill saved target role from DB
        try {
          const r = await fetch(`/api/me?email=${encodeURIComponent(user.email || "")}`);
          if (r.ok) {
            const { mentee } = await r.json();
            const saved: string | undefined = mentee?.targetRole;
            if (saved) {
              const presets = new Set([
                'Backend Developer',
                'Consulting',
                'Data Analyst',
                'Data Scientist',
                'Frontend Developer',
                'Product Manager',
              ]);
              if (presets.has(saved)) {
                setIsCustomRole(false);
                setTargetRole(saved);
              } else {
                setIsCustomRole(true);
                setCustomRole(saved);
              }
            }
          }
        } catch {}
      } else {
        setUser(null);
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-navy-950">
        <Header />
        <div className="mt-32">
          <Card className="shadow-lg border-0 bg-ocean-800">
            <CardHeader className="text-center">
              <CardTitle className="text-xl flex items-center justify-center gap-2 text-white">
                Dashboard
              </CardTitle>
              <CardDescription className="text-ocean-200">
                Loading user info...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center">
                <div className="animate-pulse w-24 h-24 rounded-full bg-ocean-700 mb-4" />
                <div className="h-6 w-40 bg-ocean-700 rounded mb-2 animate-pulse" />
                <div className="h-4 w-32 bg-ocean-700 rounded mb-4 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user?.email) return;
    if (usage && usage.remaining <= 0) {
      alert('You have reached your 5 free analyses for this month.');
      return;
    }
    setIsLoading(true);
    try {
  const finalRole = isCustomRole ? (customRole.trim() || 'Other') : (targetRole || '');
  const data = new FormData();
  data.append('file', file);
  data.append('email', user.email || '');
  data.append('name', user.displayName || '');
  data.append('targetRole', finalRole);
  if (jobDescription.trim()) data.append('jobDescription', jobDescription.trim());

      const response = await fetch('/api/upload', { method: 'POST', body: data });
      if (response.ok) {
        const { analysisId } = await response.json();
        router.push(`/analysis/${analysisId}`);
      } else if (response.status === 403) {
        const err = await response.json().catch(() => ({ error: 'Monthly limit reached.' }));
        alert(err.error || 'Monthly limit reached.');
        // Refresh usage to reflect latest count
        try {
          const res = await fetch(`/api/usage?email=${encodeURIComponent(user.email || "")}`);
          if (res.ok) setUsage(await res.json());
        } catch {}
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-navy-950">
      <Header />
      <div className="py-24 bg-ocean-900">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div>
          <Card className="shadow-lg border-0 bg-ocean-800">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl flex items-center justify-center gap-2 text-white">
                <Upload className="h-6 w-6 text-ocean-300" />
                Resume Analysis
              </CardTitle>
              <CardDescription className="text-ocean-200">
                {usage ? (
                  <span>
                    {usage.remaining} of {usage.limit} free analyses remaining this month
                  </span>
                ) : (
                  'Get AI-powered career insights from Gemini AI'
                )}
              </CardDescription>
              <div className="mt-2 text-xs">
                {fbStatus === 'checking' && <span className="text-ocean-300">Checking Firebase…</span>}
                {fbStatus === 'online' && <span className="text-green-300">Firebase: online</span>}
                {fbStatus === 'offline' && <span className="text-red-300">Firebase: offline</span>}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-ocean-200 mb-2">
                      <Mail className="h-4 w-4 inline mr-2 text-ocean-400" />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={user.email || ''}
                      readOnly
                      className="border-ocean-600 bg-ocean-700 text-white placeholder-ocean-300 focus:border-ocean-400 focus:ring-ocean-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ocean-200 mb-2">
                      <Target className="h-4 w-4 inline mr-2 text-ocean-400" />
                      Target Role
                    </label>
                    <select
                      value={isCustomRole ? 'other' : (targetRole || '')}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === 'other') {
                          setIsCustomRole(true);
                        } else {
                          setIsCustomRole(false);
                          setTargetRole(value);
                        }
                      }}
                      className="w-full h-12 px-4 py-2 border border-ocean-600 bg-ocean-700 text-white rounded-lg text-sm focus:border-ocean-400 focus:ring-ocean-400 transition-colors"
                    >
                      <option value="">Select your target role</option>
                      <option value="Backend Developer">Backend Developer</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Data Analyst">Data Analyst</option>
                      <option value="Data Scientist">Data Scientist</option>
                      <option value="Frontend Developer">Frontend Developer</option>
                      <option value="Product Manager">Product Manager</option>
                      <option value="other">Other</option>
                    </select>
                    {isCustomRole && (
                      <Input
                        type="text"
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="Enter your target role"
                        className="mt-3 border-ocean-600 bg-ocean-700 text-white placeholder-ocean-300 focus:border-ocean-400 focus:ring-ocean-400"
                      />
                    )}
                  </div>
                </div>

                {/* Previous Submissions */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ocean-200 mb-2">
                    Previous Submissions
                  </label>
                  <div className="flex gap-3">
                    <select
                      value={selectedAnalysisId}
                      onChange={(e) => setSelectedAnalysisId(e.target.value)}
                      className="flex-1 h-12 px-4 py-2 border border-ocean-600 bg-ocean-700 text-white rounded-lg text-sm focus:border-ocean-400 focus:ring-ocean-400 transition-colors"
                    >
                      <option value="">Select a previous analysis</option>
                      {history.map(item => (
                        <option key={item.id} value={item.id}>
                          {new Date(item.createdAtMs).toLocaleString()} {item.role ? `· ${item.role}` : ''} {typeof item.fitScore === 'number' ? `· Fit ${item.fitScore}/10` : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      disabled={!selectedAnalysisId}
                      onClick={() => selectedAnalysisId && router.push(`/analysis/${selectedAnalysisId}`)}
                      className="h-12"
                    >
                      View
                    </Button>
                  </div>
                  <p className="text-xs text-ocean-300 mt-2">Your analyses are saved to your account history after viewing them.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ocean-200 mb-2">
                    <FileText className="h-4 w-4 inline mr-2 text-ocean-400" />
                    Resume/CV
                  </label>
                  <div className="border-2 border-dashed border-ocean-500 rounded-xl p-8 text-center hover:border-ocean-400 transition-colors bg-ocean-700/50">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      required
                    />
                    {!file ? (
                      <label htmlFor="file-upload" className="cursor-pointer block">
                        <Upload className="h-16 w-16 text-ocean-400 mx-auto mb-4" />
                        <p className="text-lg text-white font-medium">Click to upload or drag and drop</p>
                        <p className="text-sm text-ocean-300 mt-2">PDF or DOCX up to 10MB</p>
                      </label>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col items-center">
                          <FileText className="h-12 w-12 text-ocean-300 mb-2" />
                          <p className="text-white font-medium text-center break-all">{file.name}</p>
                          <p className="text-ocean-200 text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()} className="bg-white text-black border border-white hover:bg-transparent hover:text-white hover:border-white">Re-upload</Button>
                          <Button type="button" variant="destructive" onClick={handleRemoveFile} className="bg-red-600 hover:bg-red-700">Remove</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ocean-200 mb-2">
                    <Target className="h-4 w-4 inline mr-2 text-ocean-400" />
                    Target job description (optional)
                  </label>
                  <Textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste a job description to tailor the analysis"
                    className="min-h-[100px] border-ocean-600 bg-ocean-700 text-white placeholder-ocean-300 focus:border-ocean-400 focus:ring-ocean-400"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={
                    isLoading ||
                    !file ||
                    !user?.email ||
                    (usage ? usage.remaining <= 0 : false) ||
                    (isCustomRole && !customRole.trim())
                  }
                  className="w-full h-14 text-lg bg-gradient-to-r from-ocean-600 to-ocean-700 hover:from-ocean-700 hover:to-ocean-800 text-white shadow-lg hover:shadow-ocean-500/25 transition-all duration-300 transform hover:scale-105"
                >
                  {isLoading ? 'Analyzing with Gemini AI...' : 'Analyze Resume with Gemini AI'}
                </Button>
              </form>
              <div className="text-center text-ocean-200 text-sm mt-3">
                {usage && usage.remaining <= 0 && 'You have reached your 5 free analyses for this month.'}
              </div>
            </CardContent>
          </Card>
            </div>

            {/* Resume History Section */}
            <div>
              <Card className="shadow-lg border-0 bg-ocean-800">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2 text-white">
                    <History className="h-6 w-6 text-ocean-300" />
                    Resume History
                  </CardTitle>
                  <CardDescription className="text-ocean-200">
                    View and manage your uploaded resumes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumeHistory />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
