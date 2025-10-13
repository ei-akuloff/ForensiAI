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
        lang_instruction = "IMPORTANT: You MUST respond in English only. Use proper English grammar, vocabulary, and sentence structure. Do not use any other languages."
        detected_language = None
        
        if language:
            # Explicit language parameter provided
            language_lower = language.lower()
            if language_lower in ["en", "english", "eng"]:
                lang_instruction = "IMPORTANT: You MUST respond in English only. Use proper English grammar, vocabulary, and sentence structure. Do not use any other languages."
                detected_language = "English"
            elif language_lower in ["hi", "hindi", "हिंदी"]:
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

@app.post("/generate-graph/")
async def generate_graph(session_id: str = Form(...), chat_history: str = Form(...)):
    """
    Generate Neo4j graph visualizations based on chat history and context.
    
    Args:
        session_id: The session ID for this case
        chat_history: JSON string containing the chat history
        
    Returns:
        Graph data with nodes, relationships, and suggested queries
    """
    try:
        import json
        from cypher_generator import generate_graph_queries
        from neo4j_service import execute_cypher_query, get_database_overview, get_neo4j_service
        from forensic_data_extractor import extract_forensic_graph_data
        from vector_store import similarity_search
        
        # Parse chat history
        try:
            chat_messages = json.loads(chat_history)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid chat history format")
        
        # Validate chat history format
        if not isinstance(chat_messages, list):
            raise HTTPException(status_code=400, detail="Chat history must be a list of messages")
        
        # Import query validator for safe queries
        from query_validator import CypherQueryValidator
        validator = CypherQueryValidator()
        
        # Ensure Neo4j connection and prepare data
        neo4j_service = get_neo4j_service()
        if not neo4j_service.connect():
            # If connection fails, return safe fallback queries
            return JSONResponse(content={
                "success": False,
                "error": "Neo4j database not available",
                "mock_data": True,
                "suggested_queries": validator.get_forensic_queries(),
                "graph_data": {
                    "nodes": [],
                    "relationships": [],
                    "node_count": 0,
                    "relationship_count": 0
                }
            })
        
        # Try to get actual UFDR content for this session
        ufdr_content = None
        try:
            # Get relevant documents from vector store
            chat_context = " ".join([msg.get('content', '') for msg in chat_messages[-5:]])
            docs, _ = similarity_search(chat_context, session_id, n_results=10)
            if docs:
                ufdr_content = "\n".join(docs)
        except Exception as e:
            print(f"Could not retrieve UFDR content: {e}")
        
        # Clear existing data and create forensic data
        with neo4j_service.driver.session() as session:
            session.run("MATCH (n) DETACH DELETE n")
        
        # Generate forensic graph data (either from real UFDR or realistic sample)
        nodes, relationships = extract_forensic_graph_data(session_id, ufdr_content)
        
        # Create nodes in Neo4j
        with neo4j_service.driver.session() as session:
            # Clear existing data first
            session.run("MATCH (n) DETACH DELETE n")
            
            for node in nodes:
                labels = ":".join(node['labels'])
                
                # Build properties string excluding id and name
                property_pairs = []
                for k, v in node['properties'].items():
                    if k not in ['id', 'name'] and v is not None:
                        property_pairs.append(f"{k}: ${k}")
                
                if property_pairs:
                    properties_str = ", " + ", ".join(property_pairs)
                else:
                    properties_str = ""
                
                query = f"CREATE (n:{labels} {{id: $id, name: $name{properties_str}}})"
                
                params = {
                    'id': node['id'],
                    'name': node['name']
                }
                
                # Add other properties
                for k, v in node['properties'].items():
                    if k not in ['id', 'name'] and v is not None:
                        params[k] = str(v)  # Convert to string to avoid type issues
                
                session.run(query, params)
            
            # Create relationships
            for rel in relationships:
                query = """
                MATCH (a {id: $start_id}), (b {id: $end_id})
                CREATE (a)-[r:""" + rel['type'] + """ {id: $rel_id}]->(b)
                SET r += $properties
                """
                
                params = {
                    'start_id': rel['start_node'],
                    'end_id': rel['end_node'],
                    'rel_id': rel['id'],
                    'properties': rel.get('properties', {})
                }
                
                session.run(query, params)
        
        # Generate query suggestions using validator for safety
        suggested_queries = validator.get_forensic_queries()
        
        # Execute the first suggested query to get initial graph data
        graph_data = {"nodes": [], "relationships": [], "node_count": 0, "relationship_count": 0}
        executed_query = None
        
        if suggested_queries:
            first_query = suggested_queries[0]
            executed_query = first_query
            
            # Validate the query before execution
            validation_result = validator.validate_query(first_query['query'])
            if validation_result["is_valid"]:
                safe_query = validation_result["sanitized_query"]
            else:
                safe_query = validator.get_safe_query("all_relationships")
                print(f"Query validation failed, using safe fallback: {validation_result['errors']}")
            
            graph_result = execute_cypher_query(safe_query)
            
            if graph_result['success']:
                graph_data = {
                    "nodes": graph_result['nodes'],
                    "relationships": graph_result['relationships'],
                    "node_count": graph_result['node_count'],
                    "relationship_count": graph_result['relationship_count']
                }
        
        # Get database overview
        db_overview = get_database_overview()
        
        # Determine if real UFDR data was used
        data_source = "Real UFDR Data" if ufdr_content else "Realistic Forensic Sample"
        
        return JSONResponse(content={
            "success": True,
            "session_id": session_id,
            "data_source": data_source,
            "analysis": {"primary_focus": "forensic_investigation", "safe_queries_used": True},
            "suggested_queries": suggested_queries,
            "executed_query": executed_query,
            "graph_data": graph_data,
            "database_stats": db_overview.get('stats', {}),
            "total_messages_analyzed": len(chat_messages),
            "forensic_nodes_created": len(nodes),
            "forensic_relationships_created": len(relationships)
        })
        
    except Exception as e:
        print(f"Graph generation error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        # Return error response with some mock data
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "suggested_queries": [
                    {
                        "query": "MATCH (n) RETURN n LIMIT 10",
                        "title": "Sample Nodes",
                        "description": "Basic node overview",
                        "type": "overview"
                    }
                ],
                "graph_data": {
                    "nodes": [],
                    "relationships": [],
                    "node_count": 0,
                    "relationship_count": 0
                }
            }
        )

@app.post("/execute-query/")
async def execute_custom_query(session_id: str = Form(...), cypher_query: str = Form(...)):
    """
    Execute a custom Cypher query and return graph data.
    
    Args:
        session_id: The session ID for this case
        cypher_query: The Cypher query to execute
        
    Returns:
        Graph data with nodes and relationships
    """
    try:
        from neo4j_service import execute_cypher_query, get_neo4j_service
        
        # Clean up the query - remove any newlines and extra spaces
        cleaned_query = ' '.join(cypher_query.strip().split())
        
        # Basic query validation - check for dangerous operations
        dangerous_keywords = ['DELETE', 'DROP', 'CREATE', 'MERGE', 'SET', 'REMOVE']
        query_upper = cleaned_query.upper()
        
        for keyword in dangerous_keywords:
            if keyword in query_upper and not query_upper.startswith('CREATE '):
                raise HTTPException(status_code=400, detail=f"Query contains restricted operation: {keyword}")
        
        # Execute the query
        result = execute_cypher_query(cleaned_query)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=f"Query execution failed: {result.get('error', 'Unknown error')}")
        
        return JSONResponse(content={
            "success": result['success'],
            "session_id": session_id,
            "query": cleaned_query,
            "graph_data": {
                "nodes": result['nodes'],
                "relationships": result['relationships'],
                "node_count": result['node_count'],
                "relationship_count": result['relationship_count']
            },
            "execution_time": result.get('execution_time', 0)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Query execution error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return JSONResponse(content={
            "success": result['success'],
            "session_id": session_id,
            "query": cleaned_query,
            "graph_data": {
                "nodes": result['nodes'],
                "relationships": result['relationships'],
                "node_count": result['node_count'],
                "relationship_count": result['relationship_count']
            },
            "execution_time": result.get('execution_time', 0)
        })
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Query execution error: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "session_id": session_id,
                "query": cypher_query,
                "graph_data": {
                    "nodes": [],
                    "relationships": [],
                    "node_count": 0,
                    "relationship_count": 0
                }
            }
        )

@app.get("/database-stats/")
async def get_database_statistics():
    """
    Get Neo4j database statistics and overview.
    
    Returns:
        Database statistics including node and relationship counts
    """
    try:
        from neo4j_service import get_database_overview, get_neo4j_service
        
        # Ensure connection and sample data
        neo4j_service = get_neo4j_service()
        if not neo4j_service.connect():
            return JSONResponse(
                status_code=503,
                content={
                    "success": False,
                    "error": "Neo4j database not available",
                    "stats": {
                        "total_nodes": 0,
                        "total_relationships": 0,
                        "node_counts_by_label": {},
                        "relationship_counts_by_type": {}
                    }
                }
            )
        
        # Create sample data if needed
        neo4j_service.create_sample_data()
        
        # Get database overview
        overview = get_database_overview()
        
        return JSONResponse(content={
            "success": True,
            "stats": overview.get('stats', {}),
            "database_connected": True
        })
        
    except Exception as e:
        print(f"Database stats error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "stats": {
                    "total_nodes": 0,
                    "total_relationships": 0,
                    "node_counts_by_label": {},
                    "relationship_counts_by_type": {}
                }
            }
        )

@app.get("/test-simple-query/")
async def test_simple_query():
    """
    Test endpoint to execute a simple query and check database connectivity.
    """
    try:
        from neo4j_service import execute_cypher_query, get_neo4j_service
        
        # Test simple query
        result = execute_cypher_query("MATCH (n) RETURN n LIMIT 5")
        
        return JSONResponse(content={
            "success": result['success'],
            "query": "MATCH (n) RETURN n LIMIT 5",
            "node_count": result['node_count'],
            "relationship_count": result['relationship_count'],
            "sample_nodes": result.get('nodes', [])[:3]  # First 3 nodes for preview
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "query": "MATCH (n) RETURN n LIMIT 5"
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)