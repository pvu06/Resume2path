# MongoDB Integration Setup

This document explains how to set up MongoDB integration for the Resume2Review application to store chat history and resume data.

## Features Added

- **Chat History Storage**: All conversations between users and the AI chatbot are saved to MongoDB
- **Resume Storage**: Uploaded resumes and their analysis results are stored in MongoDB
- **User Association**: Data is linked to users via their email/UID for proper data isolation
- **Dashboard Integration**: Users can view their resume history and manage uploaded files

## MongoDB Setup

### 1. Install MongoDB

#### Option A: Local MongoDB Installation
```bash
# Windows (using Chocolatey)
choco install mongodb

# macOS (using Homebrew)
brew install mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string

### 2. Environment Configuration

Add the following to your `.env.local` file:

```env
# MongoDB Connection String
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/resume2review

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/resume2review?retryWrites=true&w=majority
```

### 3. Database Schema

The application creates two main collections:

#### ChatHistory Collection
```javascript
{
  userId: String,        // User identifier (email or UID)
  sessionId: String,     // Unique session identifier
  messages: [            // Array of chat messages
    {
      id: String,
      text: String,
      sender: 'user' | 'bot',
      timestamp: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

#### Resume Collection
```javascript
{
  userId: String,        // User identifier
  fileName: String,      // Original file name
  fileType: String,      // MIME type
  fileUrl: String,       // Storage URL
  fileSize: Number,      // File size in bytes
  textContent: String,   // Extracted text content
  parsedData: {          // Parsing metadata
    parser: String,
    pages: Number,
    textLength: Number,
    name: String,
    mime: String,
    ext: String,
    error: String
  },
  analysisResult: {      // AI analysis results
    role: String,
    skills: [String],
    experience: [Object],
    summary: String,
    gaps: [String],
    suggestions: [String],
    fit: Number,
    tracks: [Object],
    parse: Object
  },
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Chat API (`/api/chat`)

- **POST**: Save a new chat message
- **GET**: Retrieve chat history for a user/session
- **DELETE**: Delete chat history for a user/session

### Resume API (`/api/resumes`)

- **POST**: Save a new resume
- **GET**: Retrieve all resumes for a user
- **PUT**: Update resume data
- **DELETE**: Delete a resume

## Usage

### Chat History
The chatbot automatically saves and loads chat history based on the authenticated user. Each browser session gets a unique session ID that persists until the browser is closed.

### Resume Management
- Resumes are automatically saved to MongoDB when uploaded
- Users can view their resume history in the dashboard
- Resume data includes both the file metadata and AI analysis results
- Users can delete resumes they no longer need

## Development

### Running Locally with MongoDB

1. Start MongoDB service:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
# or
mongod --dbpath /path/to/your/db
```

2. Start the Next.js application:
```bash
npm run dev
```

### Database Connection

The application uses a connection pooling strategy to efficiently manage MongoDB connections. The connection is cached globally to prevent multiple connections during development hot reloads.

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure MongoDB is running and the connection string is correct
2. **Authentication Failed**: Check username/password in the connection string
3. **Network Timeout**: For Atlas, ensure your IP is whitelisted
4. **Schema Validation**: Ensure the MongoDB version supports the schema features used

### Debug Mode

To enable debug logging, add this to your environment:
```env
DEBUG=mongodb:*
```

## Security Considerations

- Use environment variables for connection strings
- Implement proper user authentication before data access
- Consider data encryption for sensitive information
- Regular backups of MongoDB data
- Monitor database access logs

## Production Deployment

For production deployment:

1. Use MongoDB Atlas or a managed MongoDB service
2. Set up proper authentication and authorization
3. Configure connection pooling limits
4. Set up monitoring and alerting
5. Implement backup strategies
6. Use SSL/TLS for connections

## Migration from Existing Data

If you have existing data in PostgreSQL that you want to migrate to MongoDB:

1. Export data from PostgreSQL
2. Transform data to match MongoDB schema
3. Import data using MongoDB tools or custom scripts
4. Update application to use MongoDB APIs
5. Test thoroughly before switching

## Support

For issues related to MongoDB integration, check:
- MongoDB documentation
- Next.js API routes documentation
- Mongoose documentation for schema definitions
