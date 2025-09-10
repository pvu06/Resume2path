export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { parseFileToText } from '@/lib/parse';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const max = parseInt(searchParams.get('max') || '1000', 10);
    const full = searchParams.get('full') === '1';
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const res = await parseFileToText(file);
    const textLength = res.text.length;
    const preview = full ? res.text : res.text.slice(0, max);
    const truncated = !full && res.text.length > max;

    return NextResponse.json({
      ok: true,
      parser: res.parser,
      pages: res.pages,
      textLength,
      truncated,
      mime: res.mime,
      name: res.name,
      ext: res.ext,
      preview,
      error: res.error,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
