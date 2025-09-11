import mongoose, { Schema, Document } from 'mongoose';

export interface IResume extends Document {
  userId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize: number;
  textContent: string;
  parsedData?: {
    parser: string;
    pages?: number;
    textLength: number;
    name: string;
    mime: string;
    ext: string;
    error?: string;
  };
  analysisResult?: {
    role: string;
    skills: string[];
    experience: any[];
    summary: string;
    gaps: string[];
    suggestions: string[];
    fit: number;
    tracks: any[];
    parse: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>({
  userId: { type: String, required: true, index: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileSize: { type: Number, required: true },
  textContent: { type: String, required: true },
  parsedData: {
    parser: String,
    pages: Number,
    textLength: Number,
    name: String,
    mime: String,
    ext: String,
    error: String
  },
  analysisResult: {
    role: String,
    skills: [String],
    experience: [Schema.Types.Mixed],
    summary: String,
    gaps: [String],
    suggestions: [String],
    fit: Number,
    tracks: [Schema.Types.Mixed],
    parse: Schema.Types.Mixed
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
ResumeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create index for efficient queries
ResumeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
