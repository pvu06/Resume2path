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
    role?: string;
    skills?: string[];
    experience?: any[];
    summary?: string;
    gaps?: string[];
    suggestions?: string[];
    fit?: number;
    tracks?: any[];
    parse?: any;
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
    role: { type: String, default: '' },
    skills: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(v: any) {
          return Array.isArray(v) && v.every(item => typeof item === 'string');
        },
        message: 'Skills must be an array of strings'
      }
    },
    experience: { type: [Schema.Types.Mixed], default: [] },
    summary: { type: String, default: '' },
    gaps: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(v: any) {
          return Array.isArray(v) && v.every(item => typeof item === 'string');
        },
        message: 'Gaps must be an array of strings'
      }
    },
    suggestions: { 
      type: [String], 
      default: [],
      validate: {
        validator: function(v: any) {
          return Array.isArray(v) && v.every(item => typeof item === 'string');
        },
        message: 'Suggestions must be an array of strings'
      }
    },
    fit: { type: Number, default: 0 },
    tracks: { type: [Schema.Types.Mixed], default: [] },
    parse: { type: Schema.Types.Mixed, default: {} }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Sanitize and validate data before saving
ResumeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Sanitize analysisResult if it exists
  if (this.analysisResult) {
    // Ensure skills is an array of strings
    if (this.analysisResult.skills && Array.isArray(this.analysisResult.skills)) {
      this.analysisResult.skills = this.analysisResult.skills
        .filter(skill => skill != null && skill !== undefined)
        .map(skill => String(skill).trim())
        .filter(skill => skill.length > 0);
    } else {
      this.analysisResult.skills = [];
    }
    
    // Ensure gaps is an array of strings
    if (this.analysisResult.gaps && Array.isArray(this.analysisResult.gaps)) {
      this.analysisResult.gaps = this.analysisResult.gaps
        .filter(gap => gap != null && gap !== undefined)
        .map(gap => String(gap).trim())
        .filter(gap => gap.length > 0);
    } else {
      this.analysisResult.gaps = [];
    }
    
    // Ensure suggestions is an array of strings
    if (this.analysisResult.suggestions && Array.isArray(this.analysisResult.suggestions)) {
      this.analysisResult.suggestions = this.analysisResult.suggestions
        .filter(suggestion => suggestion != null && suggestion !== undefined)
        .map(suggestion => String(suggestion).trim())
        .filter(suggestion => suggestion.length > 0);
    } else {
      this.analysisResult.suggestions = [];
    }
    
    // Ensure fit is a number
    if (typeof this.analysisResult.fit !== 'number') {
      this.analysisResult.fit = 0;
    }
    
    // Ensure role is a string
    if (typeof this.analysisResult.role !== 'string') {
      this.analysisResult.role = '';
    }
    
    // Ensure summary is a string
    if (typeof this.analysisResult.summary !== 'string') {
      this.analysisResult.summary = '';
    }
  }
  
  next();
});

// Create index for efficient queries
ResumeSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Resume || mongoose.model<IResume>('Resume', ResumeSchema);
