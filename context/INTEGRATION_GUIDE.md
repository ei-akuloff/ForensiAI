# RAG Application Integration Guide

This guide explains how to run the RAG-based forensic analysis application with integrated frontend and backend.

## Backend Setup

1. **Install Python Dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   Make sure you have the `.env` file in the backend folder with your OpenRouter API key:
   ```
   OPENROUTER_API_KEY=your_api_key_here
   ```

3. **Start the Backend**
   ```bash
   # Option 1: Using Python directly
   cd backend
   python main.py
   
   # Option 2: Using the startup script
   # Double-click start-backend.bat (Windows)
   ```

   The backend will start on `http://localhost:8000`

## Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Make sure `.env.local` exists with:
   ```
   NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
   ```

3. **Start the Frontend**
   ```bash
   npm run dev
   ```

   The frontend will start on `http://localhost:3000`

## Using the Application

### Creating a New Case

1. Go to the Dashboard (`http://localhost:3000/dashboard`)
2. Drag and drop or click to upload a `.ufdr` file
3. Fill out the case creation form:
   - Case Number
   - Lead Investigator
   - Case Title
   - Department
   - Priority Level
   - Case Type
   - Description
4. Click "Create Case"

The file will be automatically uploaded to the backend and processed for RAG.

### Using the Chatbot

1. Click "View" on any case from the Dashboard
2. Navigate to the "Chatbot" tab
3. Start asking questions about the uploaded UFDR file

### Sample Questions to Try

- "What files were found in this analysis?"
- "Summarize the key findings"
- "Show me any suspicious activity"
- "What's the timeline of events?"
- "Are there any deleted files?"

## API Endpoints

The backend provides these main endpoints:

- `GET /` - Health check
- `POST /upload/` - Upload and process UFDR files
  - Parameters: `session_id` (string), `file` (UFDR file)
- `POST /query/` - Query processed documents
  - Parameters: `query` (string), `session_id` (string), `language` (optional)

## Data Flow

1. **File Upload**: User uploads UFDR → Frontend sends to `/upload/` → Backend processes and stores in vector database
2. **Chat Query**: User asks question → Frontend sends to `/query/` → Backend retrieves relevant context → AI generates response

## Troubleshooting

- **Backend not starting**: Check if all dependencies are installed (`pip install -r requirements.txt`)
- **File upload fails**: Ensure the file is a `.ufdr` format and the backend is running
- **Chatbot not responding**: Check browser console for errors and ensure the session ID exists
- **CORS errors**: Make sure both frontend and backend are running on the correct ports

## Technical Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Backend**: FastAPI with Python
- **Vector Database**: ChromaDB for storing document embeddings
- **AI Model**: OpenAI GPT-4o-mini via OpenRouter
- **Embeddings**: Sentence Transformers (multilingual support)

The application maintains session-based isolation, so each case has its own vector store namespace.