import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('📤 Minimal upload API called');
    
    const form = await req.formData();
    const file = form.get('file') as File;
    const email = form.get('email') as string;
    const name = form.get('name') as string;
    const targetRole = form.get('targetRole') as string;
    
    console.log('📤 Minimal upload data:', { 
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

    // Simulate a successful upload without any database operations
    const analysisId = Math.floor(Math.random() * 10000);
    
    return NextResponse.json({ 
      success: true,
      analysisId: analysisId,
      message: 'Resume uploaded successfully! (Minimal version)',
      data: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        email,
        name: name || 'No name provided',
        targetRole: targetRole || 'General'
      }
    });

  } catch (error) {
    console.error('📤 Minimal upload error:', error);
    return NextResponse.json({ 
      error: 'Minimal upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
