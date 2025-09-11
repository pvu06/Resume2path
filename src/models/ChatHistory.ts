import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface IChatHistory extends Document {
  userId: string;
  sessionId: string;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  id: { type: String, required: true },
  text: { type: String, required: true },
  sender: { type: String, enum: ['user', 'bot'], required: true },
  timestamp: { type: Date, required: true }
});

const ChatHistorySchema = new Schema<IChatHistory>({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  messages: [ChatMessageSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
ChatHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound index for efficient queries
ChatHistorySchema.index({ userId: 1, sessionId: 1 });

export default mongoose.models.ChatHistory || mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);
