import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    console.log('🧪 Test upload API called');
    
    const form = await req.formData();
    const file = form.get('file') as File;
    const email = form.get('email') as string;
    const name = form.get('name') as string;
    
    console.log('🧪 Test upload data:', { 
      fileName: file?.name, 
      fileSize: file?.size, 
      fileType: file?.type,
      email, 
      name
    });
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!email) {
      return NextResponse.json({ error: 'No email provided' }, { status: 400 });
    }

    // Just return success with file info
    return NextResponse.json({ 
      success: true,
      message: 'Test upload successful!',
      fileInfo: {
        name: file.name,
        size: file.size,
        type: file.type,
        email,
        name: name || 'No name provided'
      }
    });

  } catch (error) {
    console.error('🧪 Test upload error:', error);
    return NextResponse.json({ 
      error: 'Test upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
