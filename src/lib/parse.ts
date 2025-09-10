import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export type ParseResult = {
  parser: 'pdf-parse' | 'mammoth' | 'none';
  text: string;
  pages?: number;
  mime?: string;
  name?: string;
  ext?: string;
  error?: string;
};

export async function parseFileToText(file: File): Promise<ParseResult> {
  const mime = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  const ext = name.split('.').pop() || '';

  const buf = Buffer.from(await file.arrayBuffer());
  const isPdf = mime.includes('pdf') || ext === 'pdf';
  const isDocx = mime.includes('word') || mime.includes('officedocument.wordprocessingml.document') || ext === 'docx';

  try {
    if (isPdf) {
      const out: any = await pdf(buf);
      return {
        parser: 'pdf-parse',
        text: typeof out?.text === 'string' ? out.text : '',
        pages: typeof out?.numpages === 'number' ? out.numpages : undefined,
        mime,
        name: file.name,
        ext,
      };
    }
    if (isDocx) {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      return {
        parser: 'mammoth',
        text: typeof value === 'string' ? value : '',
        mime,
        name: file.name,
        ext,
      };
    }
  } catch (err: any) {
    return { parser: 'none', text: '', mime, name: file.name, ext, error: String(err) };
  }

  return { parser: 'none', text: '', mime, name: file.name, ext };
}
