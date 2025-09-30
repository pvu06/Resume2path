export const runtime = 'nodejs';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('Simple upload API called');
    
    const form = await req.formData();
    const file = form.get('file') as File;
    const email = String(form.get('email') || '');
    const name = String(form.get('name') || '');
    const targetRole = String(form.get('targetRole') || '');
    
    console.log('Upload data:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      email, 
      name, 
      targetRole 
    });
    
    if (!file || !email) {
      return NextResponse.json({ error: 'Missing file or email' }, { status: 400 });
    }

    // Simple success response
    return NextResponse.json({ 
      success: true,
      message: 'Upload successful!',
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        email,
        name,
        targetRole
      }
    });

  } catch (error) {
    console.error('Simple upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
