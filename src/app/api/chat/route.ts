import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ChatHistory from '@/models/ChatHistory';
import { IChatMessage } from '@/models/ChatHistory';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { userId, sessionId, message } = await req.json();
    
    if (!userId || !sessionId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find existing chat history or create new one
    let chatHistory = await ChatHistory.findOne({ userId, sessionId });
    
    if (!chatHistory) {
      chatHistory = new ChatHistory({
        userId,
        sessionId,
        messages: []
      });
    }

    // Add the new message
    chatHistory.messages.push(message);
    await chatHistory.save();

    return NextResponse.json({ success: true, chatHistory });
  } catch (error) {
    console.error('Error saving chat message:', error);
    return NextResponse.json({ error: 'Failed to save chat message' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing userId or sessionId' }, { status: 400 });
    }

    const chatHistory = await ChatHistory.findOne({ userId, sessionId });
    
    if (!chatHistory) {
      return NextResponse.json({ messages: [] });
    }

    // Ensure timestamps are properly formatted
    const messages = chatHistory.messages.map(message => ({
      ...message.toObject(),
      timestamp: message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)
    }));

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    
    if (!userId || !sessionId) {
      return NextResponse.json({ error: 'Missing userId or sessionId' }, { status: 400 });
    }

    await ChatHistory.deleteOne({ userId, sessionId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chat history:', error);
    return NextResponse.json({ error: 'Failed to delete chat history' }, { status: 500 });
  }
}
