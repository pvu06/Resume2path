import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('📤 Working upload API called');
    
    const form = await req.formData();
    const file = form.get('file') as File;
    const email = form.get('email') as string;
    const name = form.get('name') as string;
    const targetRole = form.get('targetRole') as string;
    
    console.log('📤 Upload data:', { 
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

    // Simple file processing - just read as text for now
    const text = await file.text();
    console.log('📄 File text length:', text.length);

    // Generate a fake analysis ID for now
    const analysisId = Math.floor(Math.random() * 10000) + 1000;
    
    console.log('🎉 Upload completed successfully!');
    return NextResponse.json({ 
      success: true,
      analysisId: analysisId,
      message: 'Resume uploaded successfully! Redirecting to analysis...',
      redirectUrl: `/analysis/${analysisId}`,
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        email,
        name: name || 'User',
        targetRole: targetRole || 'General',
        textLength: text.length
      }
    });

  } catch (error) {
    console.error('📤 Working upload error:', error);
    return NextResponse.json({ 
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
