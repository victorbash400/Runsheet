from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import logging
import asyncio
from Agents.mainagent import LogisticsAgent
from data_endpoints import router as data_router
from services.data_seeder import data_seeder

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Runsheet Logistics API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the logistics agent
logistics_agent = LogisticsAgent()

# Include data endpoints
app.include_router(data_router)

@app.on_event("startup")
async def startup_event():
    """Initialize Elasticsearch data on startup"""
    try:
        logger.info("🚀 Starting Runsheet Logistics API...")
        logger.info("🔄 Seeding Elasticsearch with initial data...")
        await data_seeder.seed_all_data()
        logger.info("✅ Elasticsearch data seeding completed!")
    except Exception as e:
        logger.error(f"❌ Failed to seed Elasticsearch data: {e}")
        # Don't fail startup, just log the error

class ChatRequest(BaseModel):
    message: str
    mode: str = "chat"  # "chat" or "agent"

class ClearChatRequest(BaseModel):
    pass

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "Runsheet Logistics API is running"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Streaming chat endpoint for the logistics AI assistant
    """
    try:
        logger.info(f"🔴 BACKEND: Chat request received - Mode: {request.mode}, Message: {request.message[:100]}...")
        
        async def generate_response():
            logger.info(f"🟠 BACKEND: Starting generate_response for message: {request.message[:50]}...")
            try:
                async for event in logistics_agent.chat_streaming(request.message, request.mode):
                    # Handle streaming events according to Strands documentation
                    if isinstance(event, dict):
                        if "error" in event:
                            yield f"data: {json.dumps({'error': event['error']})}\n\n"
                        elif "data" in event:
                            # This is the actual streaming text data
                            text = event["data"]
                            if text:
                                yield f"data: {json.dumps({'type': 'text', 'content': text})}\n\n"
                        elif event.get('event') == 'messageStop' or 'result' in event:
                            # Message is complete
                            yield f"data: {json.dumps({'type': 'done'})}\n\n"
                            break
                
            except Exception as e:
                logger.error(f"Error in chat streaming: {e}")
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(
            generate_response(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "Content-Type": "text/plain; charset=utf-8"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat/clear")
async def clear_chat_endpoint(request: ClearChatRequest):
    """
    Clear the chat history/memory
    """
    try:
        logistics_agent.clear_memory()
        return {"message": "Chat memory cleared successfully"}
    except Exception as e:
        logger.error(f"Error clearing chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """
    Health check endpoint for monitoring
    """
    return {
        "status": "healthy",
        "service": "Runsheet Logistics API",
        "agent": "LogisticsAgent",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
