import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Resume from '@/models/Resume';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const resumeData = await req.json();
    
    if (!resumeData.userId || !resumeData.fileName || !resumeData.fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resume = new Resume(resumeData);
    await resume.save();

    return NextResponse.json({ success: true, resume });
  } catch (error) {
    console.error('Error saving resume:', error);
    return NextResponse.json({ error: 'Failed to save resume' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ resumes });
  } catch (error) {
    console.error('Error fetching resumes:', error);
    return NextResponse.json({ error: 'Failed to fetch resumes' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    
    const { resumeId, updateData } = await req.json();
    
    if (!resumeId) {
      return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });
    }

    const resume = await Resume.findByIdAndUpdate(
      resumeId, 
      updateData, 
      { new: true }
    );
    
    if (!resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, resume });
  } catch (error) {
    console.error('Error updating resume:', error);
    return NextResponse.json({ error: 'Failed to update resume' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const resumeId = searchParams.get('resumeId');
    
    if (!resumeId) {
      return NextResponse.json({ error: 'Missing resumeId' }, { status: 400 });
    }

    await Resume.findByIdAndDelete(resumeId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json({ error: 'Failed to delete resume' }, { status: 500 });
  }
}
