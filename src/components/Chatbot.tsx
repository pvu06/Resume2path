'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { getUserIdentifier, getSessionId } from '@/lib/user-utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Chatbot() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hi! I\'m your AI career assistant. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => getSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Load chat history when component mounts or user changes
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    const userId = getUserIdentifier(user);
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/chat?userId=${encodeURIComponent(userId)}&sessionId=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          // Convert timestamp strings to Date objects
          const messagesWithDates = data.messages.map((message: any) => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }));
          setMessages(messagesWithDates);
        }
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const saveMessage = async (message: Message) => {
    const userId = getUserIdentifier(user);
    if (!userId) return;
    
    try {
      await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          sessionId,
          message
        })
      });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(userMessage);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    try {
      const prompt = 'You are an AI career assistant specializing in resume writing, job search strategies, and career development. User question: ${inputValue} Please provide helpful, actionable advice that is professional but friendly, specific and practical, and under 200 words.';

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt,
          isChat: true
        })
      });
      
      if (!response.ok){
        throw new Error('AI API failed: ${response.status}');
      }

      const data = await response.json();

      const botMessage: Message = {
        id : (Date.now() + 1).toString(),
        text : data.result?.description || data.rawGeminiResponse || 'Sorry, I had trouble processing that.',
        sender : 'bot',
        timestamp : new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      await saveMessage(botMessage);

    } catch (error) {
      console.error('AI API error:', error);

      const errorMessage: Message = {
        id : (Date.now() + 1).toString(),
        text: 'Sorry, I\'m having trouble right now. Please try again later.',
        sender : 'bot',
        timestamp : new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <Button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-r from-ocean-600 to-ocean-700 text-white shadow-2xl hover:shadow-ocean-500/50 transition-all duration-300 z-50 group"
      >
        {isOpen ? (
          <X className="w-7 h-7 transition-transform duration-300" />
        ) : (
          <MessageCircle className="w-7 h-7 transition-transform duration-300" />
        )}
        
        {/* Pulse ring */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-ocean-400 opacity-75"></div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-96 h-[500px] shadow-2xl border-0 bg-white/95 backdrop-blur-md z-50">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-ocean-600 to-ocean-700 text-white p-4 rounded-t-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Career Assistant</h3>
                  <p className="text-sm text-blue-100">Online • Ready to help</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-indicator">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-ocean-600 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-800 rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                                            <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-ocean-100' : 'text-gray-500'
                        }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-800 rounded-2xl rounded-bl-md p-3">
                    <div className="flex items-center space-x-1">
                      <Loader2 className="w-4 h-4" />
                      <span className="text-sm">AI is typing...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border-gray-300 focus:border-ocean-500 focus:ring-ocean-500"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  size="sm"
                  className="bg-ocean-600 hover:bg-ocean-700 text-white px-3"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                Ask me anything about career advice, resume tips, or job search strategies!
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
