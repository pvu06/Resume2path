'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type ParseResult = {
  ok?: boolean;
  file?: { name: string; mime: string; ext: string };
  parser?: string;
  textLength?: number;
  preview?: string;
  pages?: number;
  truncated?: boolean;
  note?: string;
  error?: string;
};

export default function ParsePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [maxChars, setMaxChars] = useState<number>(2000);
  const [full, setFull] = useState<boolean>(false);
  const [err, setErr] = useState<string | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResult(null);
    setErr(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setIsLoading(true);
    setErr(null);
    try {
  const fd = new FormData();
      fd.append('file', file);
  const qs = new URLSearchParams();
  if (full) qs.set('full', '1'); else qs.set('max', String(maxChars));
  const res = await fetch(`/api/parse?${qs.toString()}`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Parse failed');
      setResult(data as ParseResult);
    } catch (e: any) {
      setErr(String(e?.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950">
      <Header />
      <section className="py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Card className="bg-ocean-800 border-0">
            <CardHeader>
              <CardTitle className="text-white">Parser Diagnostics</CardTitle>
              <CardDescription className="text-ocean-200">
                Upload a PDF or DOCX to test extraction (uses pdf-parse or mammoth)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <Input type="file" accept=".pdf,.docx" onChange={onChange} className="bg-ocean-700 text-white border-ocean-600" />
                <div className="flex items-center gap-3">
                  <label className="text-ocean-200 text-sm">Max preview chars</label>
                  <Input type="number" min={100} max={100000} step={100} value={maxChars} onChange={(e)=>setMaxChars(parseInt(e.target.value||'2000',10)||2000)} className="w-32 bg-ocean-700 text-white border-ocean-600" />
                  <label className="text-ocean-200 text-sm flex items-center gap-2">
                    <input type="checkbox" checked={full} onChange={(e)=>setFull(e.target.checked)} /> Full text
                  </label>
                </div>
                <Button type="submit" disabled={!file || isLoading} className="w-full">
                  {isLoading ? 'Parsing…' : 'Parse'}
                </Button>
              </form>
              {err && (
                <div className="mt-4 text-red-300 text-sm">{err}</div>
              )}
              {result && (
                <div className="mt-6 space-y-3 text-sm">
                  <div className="text-ocean-200">File: <span className="text-white">{result.file?.name}</span> <span className="text-ocean-300">({result.file?.mime})</span></div>
                  <div className="text-ocean-200">Parser: <span className="text-white">{result.parser || 'n/a'}</span></div>
                  <div className="text-ocean-200">Text length: <span className="text-white">{result.textLength ?? 0}</span> {typeof result.pages === 'number' && <span className="text-ocean-300">({result.pages} pages)</span>} {result.truncated && <span className="text-yellow-300">preview truncated</span>}</div>
                  {result.note && <div className="text-yellow-300">{result.note}</div>}
                  {result.error && <div className="text-red-300">{result.error}</div>}
                  <div className="text-ocean-200">Preview:</div>
                  <pre className="whitespace-pre-wrap bg-ocean-900 text-white p-3 rounded-md border border-ocean-700 max-h-80 overflow-auto">{result.preview || '—'}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
