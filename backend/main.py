from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import tempfile
import os
from ufdr_parser import parse_ufdr, chunk_text
from vector_store import add_documents, get_full_context, delete_session
from openai import OpenAI
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="UFDR Investigation Agent Backend")

# Add CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust if frontend port differs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def health_check():
    """
    Health check endpoint.
    """
    return {"status": "healthy", "message": "UFDR Investigation Agent Backend is running"}

def get_client():
    """
    Lazy load OpenAI client for OpenRouter.
    """
    from openai import OpenAI
    import os
    return OpenAI(
        api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
    )

@app.post("/upload/")
async def upload_ufdr(session_id: str = Form(...), file: UploadFile = File(...)):
    """
    Upload UFDR file, parse it, chunk the text, and store in vector database.
    """
    if not file.filename.endswith('.ufdr'):
        raise HTTPException(status_code=400, detail="File must be a .ufdr file")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix='.ufdr') as tmp_file:
        content = await file.read()
        tmp_file.write(content)
        tmp_path = tmp_file.name
    
    print(f"Temp file created: {tmp_path}")
    
    try:
        # Parse the UFDR file
        print("Starting parse_ufdr...")
        text = parse_ufdr(tmp_path)
        print(f"Parsed text length: {len(text)}")
        
        # Chunk the text
        print("Starting chunk_text...")
        chunks = chunk_text(text)
        print(f"Created {len(chunks)} chunks")
        
        # Reset prior context for this session and add chunks
        delete_session(session_id)
        if chunks:
            print("Starting add_documents...")
            add_documents(chunks, session_id=session_id)
            print("add_documents completed")
        else:
            print("No chunks generated; skipping add_documents.")
        
        return JSONResponse(content={"message": "UFDR file processed and stored successfully", "chunks": len(chunks), "session_id": session_id})
    
    except Exception as e:
        print(f"Upload error details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
    
    finally:
        # Clean up temp file
        os.unlink(tmp_path)

@app.post("/query/")
async def query_documents(query: str = Form(...), session_id: str = Form(...), language: str = Form(None)):
    """
    Query the vector store for relevant context and generate response using LLM.
    """
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    
    try:
        # Retrieve relevant context from vector store
        context = get_full_context(query, session_id)
        
        if not context:
            return JSONResponse(content={"response": "No relevant information found in the documents."})
        
        # Enhanced multilingual support with auto-detection and explicit language handling
        lang_instruction = "IMPORTANT: Respond in English by default."
        detected_language = None
        
        if language:
            # Explicit language parameter provided
            language_lower = language.lower()
            if language_lower in ["hi", "hindi", "हिंदी"]:
                lang_instruction = "IMPORTANT: You MUST respond in Hindi (Devanagari script). Use proper Hindi grammar and vocabulary. Do not use English."
                detected_language = "Hindi"
            elif language_lower in ["hinglish", "hi-en", "mixed"]:
                lang_instruction = "IMPORTANT: You MUST respond in Hinglish (mix of Hindi and English in Roman script). Use a natural mix of Hindi and English words."
                detected_language = "Hinglish"
            elif language_lower in ["mr", "marathi", "मराठी"]:
                lang_instruction = "IMPORTANT: You MUST respond in Marathi (Devanagari script). Use proper Marathi grammar and vocabulary."
                detected_language = "Marathi"
            elif language_lower in ["gu", "gujarati", "ગુજરાતી"]:
                lang_instruction = "IMPORTANT: You MUST respond in Gujarati (Gujarati script). Use proper Gujarati grammar and vocabulary."
                detected_language = "Gujarati"
            elif language_lower in ["es", "spanish", "español"]:
                lang_instruction = "IMPORTANT: You MUST respond in Spanish (Español). Use proper Spanish grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "Spanish"
            elif language_lower in ["fr", "french", "français"]:
                lang_instruction = "IMPORTANT: You MUST respond in French (Français). Use proper French grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "French"
            elif language_lower in ["de", "german", "deutsch"]:
                lang_instruction = "IMPORTANT: You MUST respond in German (Deutsch). Use proper German grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "German"
            elif language_lower in ["ta", "tamil", "தமிழ்"]:
                lang_instruction = "IMPORTANT: You MUST respond in Tamil (Tamil script). Use proper Tamil grammar and vocabulary."
                detected_language = "Tamil"
            elif language_lower in ["te", "telugu", "తెలుగు"]:
                lang_instruction = "IMPORTANT: You MUST respond in Telugu (Telugu script). Use proper Telugu grammar and vocabulary."
                detected_language = "Telugu"
            elif language_lower in ["bn", "bengali", "বাংলা"]:
                lang_instruction = "IMPORTANT: You MUST respond in Bengali (Bengali script). Use proper Bengali grammar and vocabulary."
                detected_language = "Bengali"
            elif language_lower in ["kn", "kannada", "ಕನ್ನಡ"]:
                lang_instruction = "IMPORTANT: You MUST respond in Kannada (Kannada script). Use proper Kannada grammar and vocabulary."
                detected_language = "Kannada"
            elif language_lower in ["ml", "malayalam", "മലയാളം"]:
                lang_instruction = "IMPORTANT: You MUST respond in Malayalam (Malayalam script). Use proper Malayalam grammar and vocabulary."
                detected_language = "Malayalam"
            elif language_lower in ["pa", "punjabi", "ਪੰਜਾਬੀ"]:
                lang_instruction = "IMPORTANT: You MUST respond in Punjabi (Gurmukhi script). Use proper Punjabi grammar and vocabulary."
                detected_language = "Punjabi"
            elif language_lower in ["zh", "chinese", "中文", "中国话"]:
                lang_instruction = "IMPORTANT: You MUST respond in Chinese (中文). Use proper Chinese grammar and vocabulary."
                detected_language = "Chinese"
        else:
            # Auto-detect language from query content
            if any('\u0900' <= ch <= '\u097F' for ch in query):  # Devanagari (Hindi/Marathi)
                if any(word in query.lower() for word in ['मराठी', 'marathi', 'maharashtra']):
                    lang_instruction = "IMPORTANT: You MUST respond in Marathi (Devanagari script). Use proper Marathi grammar and vocabulary."
                    detected_language = "Marathi (auto-detected)"
                else:
                    lang_instruction = "IMPORTANT: You MUST respond in Hindi (Devanagari script). Use proper Hindi grammar and vocabulary."
                    detected_language = "Hindi (auto-detected)"
            elif any('\u0A80' <= ch <= '\u0AFF' for ch in query):  # Gujarati
                lang_instruction = "IMPORTANT: You MUST respond in Gujarati (Gujarati script). Use proper Gujarati grammar and vocabulary."
                detected_language = "Gujarati (auto-detected)"
            elif any('\u0B80' <= ch <= '\u0BFF' for ch in query):  # Tamil
                lang_instruction = "IMPORTANT: You MUST respond in Tamil (Tamil script). Use proper Tamil grammar and vocabulary."
                detected_language = "Tamil (auto-detected)"
            elif any('\u0C00' <= ch <= '\u0C7F' for ch in query):  # Telugu
                lang_instruction = "IMPORTANT: You MUST respond in Telugu (Telugu script). Use proper Telugu grammar and vocabulary."
                detected_language = "Telugu (auto-detected)"
            elif any('\u0980' <= ch <= '\u09FF' for ch in query):  # Bengali
                lang_instruction = "IMPORTANT: You MUST respond in Bengali (Bengali script). Use proper Bengali grammar and vocabulary."
                detected_language = "Bengali (auto-detected)"
            elif any('\u0C80' <= ch <= '\u0CFF' for ch in query):  # Kannada
                lang_instruction = "IMPORTANT: You MUST respond in Kannada (Kannada script). Use proper Kannada grammar and vocabulary."
                detected_language = "Kannada (auto-detected)"
            elif any('\u0D00' <= ch <= '\u0D7F' for ch in query):  # Malayalam
                lang_instruction = "IMPORTANT: You MUST respond in Malayalam (Malayalam script). Use proper Malayalam grammar and vocabulary."
                detected_language = "Malayalam (auto-detected)"
            elif any('\u0A00' <= ch <= '\u0A7F' for ch in query):  # Gurmukhi (Punjabi)
                lang_instruction = "IMPORTANT: You MUST respond in Punjabi (Gurmukhi script). Use proper Punjabi grammar and vocabulary."
                detected_language = "Punjabi (auto-detected)"
            # Check for Hinglish patterns (mix of English and romanized Hindi)
            elif any(word in query.lower() for word in ['hai', 'hain', 'kar', 'kya', 'aur', 'main', 'mein', 'tum', 'tumhara', 'mera', 'tera', 'uska', 'kaise', 'kahan', 'kyun', 'abhi', 'phir', 'chor', 'kon', 'koi', 'yeh', 'woh', 'isko', 'usko', 'dekho', 'suno', 'bolo', 'batao', 'dikhao', 'karo', 'kijiye']):
                lang_instruction = "IMPORTANT: You MUST respond in Hinglish (mix of Hindi and English in Roman script). Use a natural mix of Hindi and English words like 'chor kon hai', 'kya pata', 'yeh dekho', etc."
                detected_language = "Hinglish (auto-detected)"
            # Check for Spanish patterns
            elif any(word in query.lower() for word in ['qué', 'que', 'cómo', 'como', 'dónde', 'donde', 'cuándo', 'cuando', 'por qué', 'porque', 'esta', 'este', 'son', 'es', 'archivo', 'archivos', 'encontrar', 'mostrar', 'información']):
                lang_instruction = "IMPORTANT: You MUST respond in Spanish (Español). Use proper Spanish grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "Spanish (auto-detected)"
            # Check for French patterns
            elif any(word in query.lower() for word in ['que', 'qui', 'quoi', 'comment', 'où', 'quand', 'pourquoi', 'parce', 'cette', 'ces', 'sont', 'est', 'fichier', 'fichiers', 'trouver', 'montrer', 'information', 'données']):
                lang_instruction = "IMPORTANT: You MUST respond in French (Français). Use proper French grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "French (auto-detected)"
            # Check for German patterns
            elif any(word in query.lower() for word in ['was', 'wie', 'wo', 'wann', 'warum', 'weil', 'diese', 'dieser', 'sind', 'ist', 'datei', 'dateien', 'finden', 'zeigen', 'information', 'daten']):
                lang_instruction = "IMPORTANT: You MUST respond in German (Deutsch). Use proper German grammar, vocabulary, and sentence structure. Do not use English words."
                detected_language = "German (auto-detected)"
            # Check for Chinese patterns (Simplified & Traditional)
            elif any('\u4e00' <= ch <= '\u9fff' for ch in query):  # Chinese characters
                lang_instruction = "IMPORTANT: You MUST respond in Chinese (中文). Use proper Chinese grammar and vocabulary."
                detected_language = "Chinese (auto-detected)"

        # Enhanced prompt with multilingual forensic context
        prompt = f"""You are an advanced AI assistant specialized in digital forensics investigation with comprehensive multilingual capabilities.

CRITICAL LANGUAGE REQUIREMENT: {lang_instruction}

🔴 ABSOLUTE MANDATORY RULE: You MUST respond ONLY in the specified language. This is NON-NEGOTIABLE:
- If user asks in Hinglish (like "chor kon hai?"), respond in Hinglish (like "UFDR context mein 'chor' ka koi specific mention nahi hai...")
- If user asks in Hindi, respond in Hindi
- If user asks in French, respond in French  
- If user asks in German, respond in German
- If user asks in Chinese, respond in Chinese

⚠️ WARNING: DO NOT RESPOND IN ENGLISH unless the query is in English. Match the user's language EXACTLY.

MULTILINGUAL UFDR ANALYSIS CAPABILITIES:
You can analyze and understand content in multiple scripts and languages including:
- Indian Languages: Hindi (हिंदी), Marathi (मराठी), Gujarati (ગુજરાતી), Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা), Kannada (ಕನ್ನಡ), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ), and Hinglish
- International Languages: English, Spanish (Español), French (Français), German (Deutsch), Chinese (中文)

FORENSIC ANALYSIS INSTRUCTIONS:
1. Identify and analyze text in multiple languages within the UFDR data
2. Look for suspects, evidence, timestamps, and activities regardless of language
3. Translate key findings when explaining them in the response language
4. Mention if content is found in multiple languages
5. Be culturally and linguistically appropriate
6. Extract names, phone numbers, addresses, and other evidence from multilingual text

RESPONSE FORMAT:
- Use the EXACT same language as the user's query
- For Hinglish: Mix Hindi and English naturally (e.g., "Yeh case mein...", "Evidence show karta hai...")
- For other languages: Use proper grammar and vocabulary
- Always mention the source of information from UFDR context

{f"Language Detection Result: {detected_language}" if detected_language else ""}

UFDR Forensic Documents (May contain multilingual content):
{context}

User Query: {query}

Your Response (MUST be in {detected_language or 'the specified language'}):"""
        
        # Debug information
        print(f"DEBUG - Query: {query}")
        print(f"DEBUG - Detected Language: {detected_language}")
        print(f"DEBUG - Language Instruction: {lang_instruction}")
        print(f"DEBUG - Explicit Language Parameter: {language}")
        
        # Query LLM via OpenRouter
        client = get_client()
        response = client.chat.completions.create(
            model="openai/gpt-4o-mini",  # GPT-4o-mini on OpenRouter
            messages=[
                {"role": "system", "content": f"You are a multilingual AI assistant specialized in forensic analysis. {lang_instruction} You must respond ONLY in the language specified in the prompt. Never respond in English unless explicitly asked to. Match the user's language exactly."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.1  # Keep low for more consistent language following
        )
        
        ai_response = response.choices[0].message.content.strip()
        
        # Debug the response
        print(f"DEBUG - AI Response: {ai_response[:200]}...")
        
        return JSONResponse(content={
            "query": query, 
            "response": ai_response, 
            "context_used": len(context) > 0, 
            "session_id": session_id,
            "detected_language": detected_language,
            "language_instruction": lang_instruction,
            "debug_info": {
                "explicit_language": language,
                "auto_detected": detected_language,
                "instruction_sent": lang_instruction
            }
        })
    
    except Exception as e:
        print(f"Query error details: {str(e)}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        # Check for OpenRouter credits error specifically (402)
        if "402" in str(e) or "Insufficient credits" in str(e):
            mock_response = f"API credits insufficient for full AI analysis. Mock response based on context."
            return JSONResponse(content={"query": query, "response": mock_response, "context_used": len(context) > 0 if 'context' in locals() else False, "session_id": session_id})
        
        raise HTTPException(status_code=500, detail=f"Error querying documents: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)