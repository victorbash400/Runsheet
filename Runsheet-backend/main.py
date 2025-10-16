from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import logging
import asyncio
import csv
import io
from datetime import datetime, timedelta
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
    allow_origins=[
        "http://localhost:3000",  # Next.js dev server
        "https://*.vercel.app",   # Vercel deployments
        "https://runsheet.vercel.app"  # Your actual Vercel domain
    ],
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
        logger.info("🌅 Seeding Elasticsearch with baseline morning data...")
        await data_seeder.seed_baseline_data(operational_time="09:00")
        logger.info("✅ Baseline data seeding completed! Ready for temporal demo.")
    except Exception as e:
        logger.error(f"❌ Failed to seed Elasticsearch data: {e}")
        # Don't fail startup, just log the error

class ChatRequest(BaseModel):
    message: str
    mode: str = "chat"  # "chat" or "agent"

class ClearChatRequest(BaseModel):
    pass

class TemporalUploadRequest(BaseModel):
    data_type: str
    batch_id: str
    operational_time: str
    sheets_url: str = None

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
                        elif "current_tool_use" in event:
                            # Tool is being invoked
                            tool_info = event["current_tool_use"]
                            yield f"data: {json.dumps({'type': 'tool', 'tool_name': tool_info.get('name', ''), 'tool_input': tool_info.get('input', {})})}\n\n"
                        elif "current_tool_result" in event:
                            # Tool result received
                            tool_result = event["current_tool_result"]
                            yield f"data: {json.dumps({'type': 'tool_result', 'tool_name': tool_result.get('name', ''), 'tool_output': tool_result.get('output', '')})}\n\n"
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

@app.post("/api/chat/fallback")
async def chat_fallback_endpoint(request: ChatRequest):
    """
    Non-streaming chat fallback endpoint
    """
    try:
        logger.info(f"🔄 BACKEND: Fallback chat request - Mode: {request.mode}, Message: {request.message[:50]}...")
        
        response = await logistics_agent.chat_fallback(request.message, request.mode)
        
        return {
            "response": response,
            "mode": request.mode,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in fallback chat endpoint: {e}")
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

@app.post("/api/demo/reset")
async def reset_demo():
    """Reset demo to baseline morning state"""
    try:
        logger.info("Demo reset requested - clearing and reseeding data...")
        
        # Clear all existing data
        await data_seeder.clear_all_data()
        
        # Reseed with baseline morning data
        await data_seeder.seed_baseline_data(operational_time="09:00")
        
        return {
            "success": True,
            "message": "Demo reset to baseline morning operations",
            "timestamp": datetime.now().isoformat(),
            "state": "morning_baseline"
        }
        
    except Exception as e:
        logger.error(f"Demo reset failed: {e}")
        raise HTTPException(status_code=500, detail=f"Demo reset failed: {str(e)}")

@app.get("/api/demo/status")
async def get_demo_status():
    """Get current demo state"""
    try:
        # Check what data exists to determine current state
        trucks = await data_seeder.es_service.get_all_documents("trucks")
        
        # Analyze data to determine current time period
        current_state = "unknown"
        if trucks:
            # Check batch_id or operational_time to determine state
            sample_truck = trucks[0]
            batch_id = sample_truck.get("batch_id", "morning_baseline")
            
            if "afternoon" in batch_id.lower():
                current_state = "afternoon"
            elif "evening" in batch_id.lower():
                current_state = "evening"
            elif "night" in batch_id.lower():
                current_state = "night"
            else:
                current_state = "morning_baseline"
        
        return {
            "success": True,
            "current_state": current_state,
            "total_trucks": len(trucks),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get demo status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/csv")
async def upload_csv_temporal(
    file: UploadFile = File(...),
    data_type: str = Form(...),
    batch_id: str = Form(...),
    operational_time: str = Form(...)
):
    """
    Upload CSV file with temporal metadata for demo
    """
    try:
        logger.info(f"📊 CSV Upload: {data_type} batch {batch_id} at {operational_time}")
        
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        
        # Parse CSV data
        documents = []
        csv_reader = csv.DictReader(io.StringIO(csv_content))
        
        for row in csv_reader:
            # Convert CSV row to document format based on data type
            doc = convert_csv_row_to_document(row, data_type)
            if doc:
                documents.append(doc)
        
        if not documents:
            raise HTTPException(status_code=400, detail="No valid data found in CSV")
        
        # Upsert the data with temporal metadata
        result = await data_seeder.upsert_batch_data(
            data_type=data_type,
            documents=documents,
            batch_id=batch_id,
            operational_time=operational_time
        )
        
        return {
            "data": {
                "recordCount": len(documents),
                "batch_id": batch_id,
                "operational_time": operational_time
            },
            "success": True,
            "message": f"Successfully uploaded {len(documents)} {data_type} records",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"CSV upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/batch")
async def upload_batch_temporal(request: TemporalUploadRequest):
    """
    Upload all data types for a complete operational snapshot
    """
    try:
        logger.info(f"📊 Batch Upload: All data types for {request.batch_id} at {request.operational_time}")
        
        data_types = ["fleet", "orders", "inventory", "support"]
        total_records = 0
        results = {}
        
        for data_type in data_types:
            documents = generate_demo_sheets_data(data_type, request.batch_id)
            if documents:
                result = await data_seeder.upsert_batch_data(
                    data_type=data_type,
                    documents=documents,
                    batch_id=request.batch_id,
                    operational_time=request.operational_time
                )
                total_records += len(documents)
                results[data_type] = len(documents)
        
        return {
            "data": {
                "recordCount": total_records,
                "batch_id": request.batch_id,
                "operational_time": request.operational_time,
                "breakdown": results
            },
            "success": True,
            "message": f"Successfully uploaded complete operational snapshot with {total_records} total records",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Batch upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class SelectiveUploadRequest(BaseModel):
    batch_id: str
    operational_time: str
    data_types: list[str]  # Selected data types to upload

@app.post("/api/upload/selective")
async def upload_selective_temporal(request: SelectiveUploadRequest):
    """
    Upload selected data types for a customized operational update
    """
    try:
        logger.info(f"📊 Selective Upload: {request.data_types} for {request.batch_id} at {request.operational_time}")
        
        total_records = 0
        results = {}
        
        for data_type in request.data_types:
            documents = generate_demo_sheets_data(data_type, request.batch_id)
            if documents:
                result = await data_seeder.upsert_batch_data(
                    data_type=data_type,
                    documents=documents,
                    batch_id=request.batch_id,
                    operational_time=request.operational_time
                )
                total_records += len(documents)
                results[data_type] = len(documents)
        
        return {
            "data": {
                "recordCount": total_records,
                "batch_id": request.batch_id,
                "operational_time": request.operational_time,
                "breakdown": results
            },
            "success": True,
            "message": f"Successfully uploaded {len(request.data_types)} data types with {total_records} total records",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Selective upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload/sheets")
async def upload_sheets_temporal(request: TemporalUploadRequest):
    """
    Upload from Google Sheets with temporal metadata for demo
    """
    try:
        logger.info(f"📊 Sheets Upload: {request.data_type} batch {request.batch_id} at {request.operational_time}")
        
        # For demo purposes, we'll simulate Google Sheets data
        # In production, you'd fetch from the actual Google Sheets API
        documents = generate_demo_sheets_data(request.data_type, request.batch_id)
        
        if not documents:
            raise HTTPException(status_code=400, detail="No data generated from sheets")
        
        # Upsert the data with temporal metadata
        result = await data_seeder.upsert_batch_data(
            data_type=request.data_type,
            documents=documents,
            batch_id=request.batch_id,
            operational_time=request.operational_time
        )
        
        return {
            "data": {
                "recordCount": len(documents),
                "batch_id": request.batch_id,
                "operational_time": request.operational_time
            },
            "success": True,
            "message": f"Successfully uploaded {len(documents)} {request.data_type} records from sheets",
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Sheets upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def convert_csv_row_to_document(row: dict, data_type: str) -> dict:
    """Convert CSV row to Elasticsearch document format"""
    
    def create_location_object(location_name: str, lat: float = None, lon: float = None):
        """Create a proper location object by reading from locations CSV"""
        import os
        
        # Load locations from CSV file
        locations_path = os.path.join("demo-data", "locations.csv")
        location_map = {}
        
        try:
            if os.path.exists(locations_path):
                with open(locations_path, 'r', encoding='utf-8') as file:
                    locations_reader = csv.DictReader(file)
                    for loc_row in locations_reader:
                        location_map[loc_row['name']] = {
                            "id": loc_row['location_id'],
                            "name": loc_row['name'],
                            "type": loc_row['type'],
                            "coordinates": {"lat": float(loc_row['lat']), "lon": float(loc_row['lon'])},
                            "address": loc_row['address']
                        }
        except Exception as e:
            logger.error(f"Error loading locations CSV: {e}")
        
        # Try to find exact match first
        if location_name in location_map:
            return location_map[location_name]
        
        # If custom coordinates provided, create dynamic location
        if lat is not None and lon is not None:
            return {
                "id": location_name.lower().replace(" ", "-").replace(",", ""),
                "name": location_name,
                "type": "location",
                "coordinates": {"lat": lat, "lon": lon},
                "address": f"{location_name}, Kenya"
            }
        
        # Default fallback to Nairobi if no match
        return {
            "id": "nairobi-station",
            "name": "Nairobi Station",
            "type": "station", 
            "coordinates": {"lat": -1.2921, "lon": 36.8219},
            "address": "Nairobi, Kenya"
        }
    
    try:
        if data_type == "trucks" or data_type == "fleet":
            # Get coordinates if available
            lat = float(row.get("lat", 0)) if row.get("lat") else None
            lon = float(row.get("lon", 0)) if row.get("lon") else None
            
            current_location_name = row.get("current_location", row.get("location", "Nairobi Station"))
            destination_name = row.get("destination", "Mombasa Port")
            
            return {
                "truck_id": row.get("truck_id"),
                "plate_number": row.get("plate_number", row.get("truck_id")),
                "driver_id": f"driver-{row.get('truck_id', 'unknown')}",
                "driver_name": row.get("driver_name", row.get("driver")),
                "status": row.get("status", "on_time"),
                "current_location": create_location_object(current_location_name, lat, lon),
                "destination": create_location_object(destination_name),
                "route": {
                    "id": f"{current_location_name.lower().replace(' ', '-')}-{destination_name.lower().replace(' ', '-')}",
                    "distance": 500.0,  # Default distance
                    "estimated_duration": 300,  # Default 5 hours
                    "actual_duration": None
                },
                "estimated_arrival": row.get("estimated_arrival", row.get("eta")),
                "last_update": datetime.now().isoformat() + "Z",
                "cargo": {
                    "type": row.get("cargo_type", row.get("cargo", "General Cargo")),
                    "weight": 10000.0,  # Default weight
                    "volume": 30.0,     # Default volume
                    "description": row.get("cargo_description", row.get("description", "Standard cargo")),
                    "priority": "medium"
                }
            }
        
        elif data_type == "orders":
            return {
                "order_id": row.get("order_id"),
                "customer": row.get("customer"),
                "status": row.get("status", "pending"),
                "value": float(row.get("value", 0)) if row.get("value") else 0,
                "items": row.get("items", row.get("description")),
                "region": row.get("region"),
                "priority": row.get("priority", "medium"),
                "truck_id": row.get("truck_id")
            }
        
        elif data_type == "inventory":
            return {
                "item_id": row.get("item_id"),
                "name": row.get("name", row.get("item_name")),
                "category": row.get("category"),
                "quantity": int(row.get("quantity", 0)) if row.get("quantity") else 0,
                "unit": row.get("unit"),
                "location": row.get("location"),
                "status": row.get("status", "in_stock")
            }
        
        elif data_type == "support_tickets" or data_type == "support":
            return {
                "ticket_id": row.get("ticket_id"),
                "customer": row.get("customer"),
                "issue": row.get("issue"),
                "description": row.get("description"),
                "priority": row.get("priority", "medium"),
                "status": row.get("status", "open")
            }
        
        return None
    except Exception as e:
        logger.error(f"Error converting CSV row: {e}")
        return None

def generate_demo_sheets_data(data_type: str, batch_id: str) -> list:
    """Generate demo data by reading from CSV files"""
    import os
    
    # Determine time period from batch_id
    time_period = "morning"  # default
    if "afternoon" in batch_id.lower():
        time_period = "afternoon"
    elif "evening" in batch_id.lower():
        time_period = "evening"
    elif "night" in batch_id.lower():
        time_period = "night"
    
    # Map data types to CSV file names
    data_type_mapping = {
        "trucks": "fleet",
        "fleet": "fleet",
        "orders": "orders", 
        "inventory": "inventory",
        "support_tickets": "support",
        "support": "support"
    }
    
    csv_data_type = data_type_mapping.get(data_type, data_type)
    csv_filename = f"{time_period}_{csv_data_type}.csv"
    csv_path = os.path.join("demo-data", csv_filename)
    
    # Check if CSV file exists
    if not os.path.exists(csv_path):
        logger.warning(f"CSV file not found: {csv_path}")
        return []
    
    try:
        # Read CSV and convert to documents
        documents = []
        with open(csv_path, 'r', encoding='utf-8') as file:
            csv_reader = csv.DictReader(file)
            for row in csv_reader:
                doc = convert_csv_row_to_document(row, data_type)
                if doc:
                    documents.append(doc)
        
        logger.info(f"Loaded {len(documents)} records from {csv_filename}")
        return documents
        
    except Exception as e:
        logger.error(f"Error reading CSV file {csv_path}: {e}")
        return []
    
    # If no specific time period matched, return empty list
    logger.warning(f"⚠️ No demo data generated for data_type={data_type}, batch_id={batch_id}")
    return []

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
    import os
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
