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
    try:
        if data_type == "trucks" or data_type == "fleet":
            return {
                "truck_id": row.get("truck_id"),
                "plate_number": row.get("plate_number", row.get("truck_id")),
                "driver_name": row.get("driver_name", row.get("driver")),
                "status": row.get("status", "on_time"),
                "current_location": {
                    "name": row.get("current_location", row.get("location")),
                    "coordinates": {"lat": float(row.get("lat", 0)), "lon": float(row.get("lon", 0))} if row.get("lat") else None
                },
                "destination": {
                    "name": row.get("destination")
                },
                "estimated_arrival": row.get("estimated_arrival", row.get("eta")),
                "cargo": {
                    "type": row.get("cargo_type", row.get("cargo")),
                    "description": row.get("cargo_description", row.get("description"))
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
    """Generate demo data simulating Google Sheets import"""
    base_time = datetime.now()
    
    # Determine time period from batch_id
    is_afternoon = "afternoon" in batch_id.lower()
    is_evening = "evening" in batch_id.lower()
    is_night = "night" in batch_id.lower()
    
    if data_type == "trucks" or data_type == "fleet":
        if is_afternoon:
            return [
                {
                    "truck_id": "GI-58A",
                    "plate_number": "GI-58A",
                    "driver_name": "John Kamau",
                    "status": "delayed",
                    "current_location": {
                        "name": "Highway A104 - Traffic Jam",
                        "coordinates": {"lat": -1.5, "lon": 37.0}
                    },
                    "destination": {"name": "Mombasa Port"},
                    "estimated_arrival": (base_time.replace(hour=17, minute=30)).isoformat() + "Z",
                    "cargo": {
                        "type": "General Cargo",
                        "description": "Network equipment - delayed due to traffic"
                    }
                },
                {
                    "truck_id": "MO-84A",
                    "plate_number": "MO-84A",
                    "driver_name": "Mary Wanjiku",
                    "status": "on_time",
                    "current_location": {
                        "name": "Nairobi Station",
                        "coordinates": {"lat": -1.2921, "lon": 36.8219}
                    },
                    "destination": {"name": "Kinara Warehouse"},
                    "estimated_arrival": (base_time.replace(hour=15, minute=0)).isoformat() + "Z",
                    "cargo": {
                        "type": "Perishables",
                        "description": "Fresh produce - delivered successfully"
                    }
                }
            ]
        elif is_evening:
            return [
                {
                    "truck_id": "KA-123B",
                    "plate_number": "KA-123B",
                    "driver_name": "Sarah Njeri",
                    "status": "on_time",
                    "current_location": {
                        "name": "Thika Warehouse",
                        "coordinates": {"lat": -1.0332, "lon": 37.0692}
                    },
                    "destination": {"name": "Mombasa Port"},
                    "estimated_arrival": (base_time.replace(hour=22, minute=0)).isoformat() + "Z",
                    "cargo": {
                        "type": "Electronics",
                        "description": "Evening shift - computer equipment"
                    }
                },
                {
                    "truck_id": "GI-58A",
                    "plate_number": "GI-58A",
                    "driver_name": "John Kamau",
                    "status": "on_time",
                    "current_location": {
                        "name": "Mombasa Port",
                        "coordinates": {"lat": -4.0435, "lon": 39.6682}
                    },
                    "destination": {"name": "Nairobi Station"},
                    "estimated_arrival": (base_time.replace(hour=23, minute=30)).isoformat() + "Z",
                    "cargo": {
                        "type": "Empty",
                        "description": "Delivery completed - returning to base"
                    }
                }
            ]
        elif is_night:
            return [
                {
                    "truck_id": "KBZ-456C",
                    "plate_number": "KBZ-456C",
                    "driver_name": "David Mwangi",
                    "status": "on_time",
                    "current_location": {
                        "name": "Nairobi Station",
                        "coordinates": {"lat": -1.2921, "lon": 36.8219}
                    },
                    "destination": {"name": "Mombasa Port"},
                    "estimated_arrival": (base_time.replace(hour=4, minute=0) + timedelta(days=1)).isoformat() + "Z",
                    "cargo": {
                        "type": "Agricultural Products",
                        "description": "Night shift - fresh produce for morning markets"
                    }
                },
                {
                    "truck_id": "KCD-789D",
                    "plate_number": "KCD-789D",
                    "driver_name": "Grace Akinyi",
                    "status": "in_transit",
                    "current_location": {
                        "name": "Mombasa Highway",
                        "coordinates": {"lat": -2.5, "lon": 38.0}
                    },
                    "destination": {"name": "Nairobi Station"},
                    "estimated_arrival": (base_time.replace(hour=2, minute=30) + timedelta(days=1)).isoformat() + "Z",
                    "cargo": {
                        "type": "Textiles",
                        "description": "Night delivery - clothing for retail stores"
                    }
                },
                {
                    "truck_id": "GI-58A",
                    "plate_number": "GI-58A",
                    "driver_name": "John Kamau",
                    "status": "resting",
                    "current_location": {
                        "name": "Mombasa Port - Rest Area",
                        "coordinates": {"lat": -4.0435, "lon": 39.6682}
                    },
                    "destination": {"name": "Nairobi Station"},
                    "estimated_arrival": (base_time.replace(hour=8, minute=0) + timedelta(days=1)).isoformat() + "Z",
                    "cargo": {
                        "type": "Empty",
                        "description": "Driver rest period - mandatory break"
                    }
                }
            ]
    
    elif data_type == "orders":
        if is_afternoon:
            return [
                {
                    "order_id": "ORD-005",
                    "customer": "Safaricom Ltd",
                    "status": "pending",
                    "value": 95000.0,
                    "items": "Network infrastructure equipment for afternoon deployment",
                    "region": "Nairobi",
                    "priority": "high",
                    "truck_id": "GI-58A"
                },
                {
                    "order_id": "ORD-006", 
                    "customer": "Kenya Power",
                    "status": "in_transit",
                    "value": 67000.0,
                    "items": "Electrical components for afternoon installation",
                    "region": "Mombasa",
                    "priority": "medium",
                    "truck_id": "MO-84A"
                }
            ]
        elif is_evening:
            return [
                {
                    "order_id": "ORD-007",
                    "customer": "Equity Bank",
                    "status": "delivered",
                    "value": 45000.0,
                    "items": "Banking equipment delivered in evening shift",
                    "region": "Kisumu",
                    "priority": "urgent",
                    "truck_id": "KA-123B"
                },
                {
                    "order_id": "ORD-008",
                    "customer": "Nakumatt Holdings",
                    "status": "pending",
                    "value": 120000.0,
                    "items": "Retail merchandise for evening restocking",
                    "region": "Nakuru",
                    "priority": "medium"
                }
            ]
        elif is_night:
            return [
                {
                    "order_id": "ORD-009",
                    "customer": "Fresh Produce Ltd",
                    "status": "in_transit",
                    "value": 35000.0,
                    "items": "Perishable goods for night delivery to markets",
                    "region": "Nairobi",
                    "priority": "urgent",
                    "truck_id": "KBZ-456C"
                },
                {
                    "order_id": "ORD-010",
                    "customer": "Kenya Railways",
                    "status": "scheduled",
                    "value": 180000.0,
                    "items": "Railway maintenance equipment for night operations",
                    "region": "Mombasa",
                    "priority": "high",
                    "truck_id": "KCD-789D"
                }
            ]
    
    elif data_type == "inventory":
        if is_afternoon:
            return [
                {
                    "item_id": "INV-001",
                    "name": "Diesel Fuel Premium Grade",
                    "category": "Fuel",
                    "quantity": 12000,  # Consumed 3000 liters
                    "unit": "liters",
                    "location": "Nairobi Depot",
                    "status": "in_stock"
                },
                {
                    "item_id": "INV-002",
                    "name": "Heavy Duty Truck Tires",
                    "category": "Parts",
                    "quantity": 25,  # Used 25 tires
                    "unit": "pieces",
                    "location": "Mombasa Warehouse",
                    "status": "low_stock"
                },
                {
                    "item_id": "INV-003",
                    "name": "Synthetic Engine Oil 15W-40",
                    "category": "Maintenance",
                    "quantity": 5,  # Used 20 bottles
                    "unit": "bottles",
                    "location": "Kisumu Station",
                    "status": "low_stock"
                }
            ]
        elif is_evening:
            return [
                {
                    "item_id": "INV-001",
                    "name": "Diesel Fuel Premium Grade",
                    "category": "Fuel",
                    "quantity": 8500,  # Further consumed
                    "unit": "liters",
                    "location": "Nairobi Depot",
                    "status": "in_stock"
                },
                {
                    "item_id": "INV-002",
                    "name": "Heavy Duty Truck Tires",
                    "category": "Parts",
                    "quantity": 15,  # More used
                    "unit": "pieces",
                    "location": "Mombasa Warehouse",
                    "status": "low_stock"
                },
                {
                    "item_id": "INV-003",
                    "name": "Synthetic Engine Oil 15W-40",
                    "category": "Maintenance",
                    "quantity": 0,  # Out of stock
                    "unit": "bottles",
                    "location": "Kisumu Station",
                    "status": "out_of_stock"
                }
            ]
        elif is_night:
            return [
                {
                    "item_id": "INV-001",
                    "name": "Diesel Fuel Premium Grade",
                    "category": "Fuel",
                    "quantity": 6000,  # Night operations consumption
                    "unit": "liters",
                    "location": "Nairobi Depot",
                    "status": "low_stock"
                },
                {
                    "item_id": "INV-009",
                    "name": "Night Vision Equipment",
                    "category": "Safety",
                    "quantity": 12,
                    "unit": "sets",
                    "location": "Nairobi Depot",
                    "status": "in_stock"
                },
                {
                    "item_id": "INV-010",
                    "name": "Emergency Flares",
                    "category": "Safety",
                    "quantity": 25,
                    "unit": "pieces",
                    "location": "All Depots",
                    "status": "in_stock"
                }
            ]
    
    elif data_type == "support_tickets" or data_type == "support":
        if is_afternoon:
            return [
                {
                    "ticket_id": "TKT-002",
                    "customer": "Safaricom Ltd",
                    "issue": "Delivery delay notification",
                    "description": "Truck GI-58A delayed due to traffic congestion. Customer requesting updated ETA.",
                    "priority": "high",
                    "status": "open"
                },
                {
                    "ticket_id": "TKT-003",
                    "customer": "Kenya Power",
                    "issue": "Inventory shortage alert",
                    "description": "Low stock alert for truck tires at Mombasa warehouse. Requesting urgent restocking.",
                    "priority": "medium",
                    "status": "open"
                }
            ]
        elif is_evening:
            return [
                {
                    "ticket_id": "TKT-001",
                    "customer": "General Inquiry",
                    "issue": "Route optimization inquiry",
                    "description": "Customer requesting information about optimal delivery routes - RESOLVED with route recommendations.",
                    "priority": "low",
                    "status": "resolved"
                },
                {
                    "ticket_id": "TKT-004",
                    "customer": "Nakumatt Holdings",
                    "issue": "Urgent restocking request",
                    "description": "Customer requesting priority delivery for weekend sales. Need truck assignment for tomorrow morning.",
                    "priority": "urgent",
                    "status": "open"
                },
                {
                    "ticket_id": "TKT-005",
                    "customer": "East African Breweries",
                    "issue": "Equipment maintenance",
                    "description": "Bottling machinery delivered but requires installation support. Technician scheduled for tomorrow.",
                    "priority": "medium",
                    "status": "in_progress"
                }
            ]
        elif is_night:
            return [
                {
                    "ticket_id": "TKT-007",
                    "customer": "Kenya Railways",
                    "issue": "Night delivery coordination",
                    "description": "Coordinating night delivery schedule to avoid daytime traffic. Special permits arranged for oversized cargo.",
                    "priority": "medium",
                    "status": "open"
                },
                {
                    "ticket_id": "TKT-008",
                    "customer": "Fresh Produce Ltd",
                    "issue": "Temperature monitoring alert",
                    "description": "Night delivery of perishables requires continuous temperature monitoring. Driver training completed.",
                    "priority": "high",
                    "status": "in_progress"
                }
            ]
    
    # Log what we're trying to match for debugging
    logger.info(f"🔍 Demo data generation: data_type={data_type}, batch_id={batch_id}")
    logger.info(f"🔍 Time period flags: afternoon={is_afternoon}, evening={is_evening}, night={is_night}")
    
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
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
