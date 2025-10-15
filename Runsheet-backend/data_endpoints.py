"""
Data API endpoints for Runsheet Logistics Platform
Provides Elasticsearch-powered data endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random
import logging
from services.elasticsearch_service import elasticsearch_service

logger = logging.getLogger(__name__)

# Create router for data endpoints
router = APIRouter(prefix="/api")

# Data Models
class Location(BaseModel):
    id: str
    name: str
    type: str
    coordinates: dict
    address: str

class CargoInfo(BaseModel):
    type: str
    weight: float
    volume: float
    description: str
    priority: str

class Route(BaseModel):
    id: str
    origin: Location
    destination: Location
    waypoints: List[Location]
    distance: float
    estimatedDuration: int
    actualDuration: Optional[int] = None

class Truck(BaseModel):
    id: str
    plateNumber: str
    driverId: str
    driverName: str
    currentLocation: Location
    destination: Location
    route: Route
    status: str
    estimatedArrival: str
    lastUpdate: str
    cargo: Optional[CargoInfo] = None

class FleetSummary(BaseModel):
    totalTrucks: int
    activeTrucks: int
    onTimeTrucks: int
    delayedTrucks: int
    averageDelay: float

class InventoryItem(BaseModel):
    id: str
    name: str
    category: str
    quantity: int
    unit: str
    location: str
    status: str
    lastUpdated: str

class Order(BaseModel):
    id: str
    customer: str
    status: str
    value: float
    items: str
    truckId: Optional[str] = None
    region: str
    createdAt: str
    deliveryEta: str
    priority: str

class SupportTicket(BaseModel):
    id: str
    customer: str
    issue: str
    description: str
    priority: str
    status: str
    createdAt: str
    assignedTo: Optional[str] = None
    relatedOrder: Optional[str] = None

# Mock Data Functions
def get_mock_locations():
    return [
        Location(
            id="nairobi-station",
            name="Nairobi Station",
            type="station",
            coordinates={"lat": -1.2921, "lng": 36.8219},
            address="Nairobi, Kenya"
        ),
        Location(
            id="mombasa-port",
            name="Mombasa Port",
            type="station",
            coordinates={"lat": -4.0435, "lng": 39.6682},
            address="Mombasa, Kenya"
        ),
        Location(
            id="kisumu-depot",
            name="Kisumu Depot",
            type="depot",
            coordinates={"lat": -0.0917, "lng": 34.7680},
            address="Kisumu, Kenya"
        ),
        Location(
            id="kinara-warehouse",
            name="Kinara Warehouse",
            type="warehouse",
            coordinates={"lat": -1.3733, "lng": 36.7516},
            address="Kinara, Kenya"
        )
    ]

def get_mock_trucks():
    locations = get_mock_locations()
    route = Route(
        id="kisumu-mombasa",
        origin=locations[2],
        destination=locations[1],
        waypoints=[locations[0]],
        distance=580,
        estimatedDuration=480
    )
    
    return [
        Truck(
            id="GI-58A",
            plateNumber="GI-58A",
            driverId="driver-001",
            driverName="John Kamau",
            currentLocation=locations[2],
            destination=locations[1],
            route=route,
            status="on_time",
            estimatedArrival="2024-01-15T14:15:00Z",
            lastUpdate="2024-01-15T12:00:00Z",
            cargo=CargoInfo(
                type="General Cargo",
                weight=15000,
                volume=45,
                description="Mixed goods",
                priority="medium"
            )
        ),
        Truck(
            id="MO-84A",
            plateNumber="MO-84A",
            driverId="driver-002",
            driverName="Mary Wanjiku",
            currentLocation=locations[0],
            destination=locations[3],
            route=route,
            status="delayed",
            estimatedArrival="2024-01-15T16:25:00Z",
            lastUpdate="2024-01-15T12:05:00Z",
            cargo=CargoInfo(
                type="Perishables",
                weight=8000,
                volume=25,
                description="Fresh produce",
                priority="high"
            )
        ),
        Truck(
            id="CE-57A",
            plateNumber="CE-57A",
            driverId="driver-003",
            driverName="Peter Ochieng",
            currentLocation=locations[2],
            destination=locations[1],
            route=route,
            status="delayed",
            estimatedArrival="2024-01-15T12:25:00Z",
            lastUpdate="2024-01-15T12:10:00Z"
        ),
        Truck(
            id="AL-94J",
            plateNumber="AL-94J",
            driverId="driver-004",
            driverName="Grace Mutua",
            currentLocation=locations[1],
            destination=locations[0],
            route=route,
            status="delayed",
            estimatedArrival="2024-01-15T12:25:00Z",
            lastUpdate="2024-01-15T12:15:00Z"
        ),
        Truck(
            id="PL-56A",
            plateNumber="PL-56A",
            driverId="driver-005",
            driverName="Samuel Kiprotich",
            currentLocation=locations[0],
            destination=locations[2],
            route=route,
            status="delayed",
            estimatedArrival="2024-01-15T12:25:00Z",
            lastUpdate="2024-01-15T12:20:00Z"
        ),
        Truck(
            id="DU-265",
            plateNumber="DU-265",
            driverId="driver-006",
            driverName="Alice Nyong",
            currentLocation=locations[1],
            destination=locations[0],
            route=route,
            status="delayed",
            estimatedArrival="2024-01-15T19:23:00Z",
            lastUpdate="2024-01-15T12:25:00Z"
        )
    ]

def get_mock_inventory():
    return [
        InventoryItem(
            id="INV-001",
            name="Diesel Fuel",
            category="Fuel",
            quantity=15000,
            unit="liters",
            location="Nairobi Depot",
            status="in_stock",
            lastUpdated="2024-01-15T10:30:00Z"
        ),
        InventoryItem(
            id="INV-002",
            name="Spare Tires",
            category="Parts",
            quantity=25,
            unit="pieces",
            location="Mombasa Warehouse",
            status="low_stock",
            lastUpdated="2024-01-15T09:15:00Z"
        ),
        InventoryItem(
            id="INV-003",
            name="Engine Oil",
            category="Maintenance",
            quantity=0,
            unit="bottles",
            location="Kisumu Station",
            status="out_of_stock",
            lastUpdated="2024-01-14T16:45:00Z"
        ),
        InventoryItem(
            id="INV-004",
            name="Brake Pads",
            category="Parts",
            quantity=120,
            unit="sets",
            location="Nairobi Depot",
            status="in_stock",
            lastUpdated="2024-01-15T08:20:00Z"
        ),
        InventoryItem(
            id="INV-005",
            name="Coolant Fluid",
            category="Maintenance",
            quantity=8,
            unit="bottles",
            location="Mombasa Warehouse",
            status="low_stock",
            lastUpdated="2024-01-15T11:00:00Z"
        )
    ]

def get_mock_orders():
    return [
        Order(
            id="ORD-001",
            customer="Safaricom Ltd",
            status="in_transit",
            value=125000,
            items="Network equipment, cables",
            truckId="GI-58A",
            region="Nairobi",
            createdAt="2024-01-14T08:00:00Z",
            deliveryEta="2024-01-15T14:00:00Z",
            priority="high"
        ),
        Order(
            id="ORD-002",
            customer="Kenya Power",
            status="pending",
            value=89000,
            items="Electrical transformers",
            region="Mombasa",
            createdAt="2024-01-15T09:30:00Z",
            deliveryEta="2024-01-16T16:00:00Z",
            priority="medium"
        ),
        Order(
            id="ORD-003",
            customer="Equity Bank",
            status="delivered",
            value=45000,
            items="ATM machines, security equipment",
            truckId="MO-84A",
            region="Kisumu",
            createdAt="2024-01-13T10:15:00Z",
            deliveryEta="2024-01-14T12:00:00Z",
            priority="urgent"
        ),
        Order(
            id="ORD-004",
            customer="Tusker Breweries",
            status="in_transit",
            value=210000,
            items="Brewing equipment, containers",
            truckId="NA-45B",
            region="Nakuru",
            createdAt="2024-01-14T11:20:00Z",
            deliveryEta="2024-01-15T18:00:00Z",
            priority="medium"
        ),
        Order(
            id="ORD-005",
            customer="Naivas Supermarket",
            status="pending",
            value=67000,
            items="Refrigeration units, shelving",
            region="Eldoret",
            createdAt="2024-01-15T07:45:00Z",
            deliveryEta="2024-01-16T10:00:00Z",
            priority="low"
        )
    ]

def get_mock_support_tickets():
    return [
        SupportTicket(
            id="TKT-001",
            customer="Safaricom Ltd",
            issue="Delivery Delay",
            description="Order ORD-001 is running 3 hours behind schedule. Customer needs urgent update on ETA.",
            priority="high",
            status="open",
            createdAt="2024-01-15T09:30:00Z",
            relatedOrder="ORD-001"
        ),
        SupportTicket(
            id="TKT-002",
            customer="Kenya Power",
            issue="Damaged Goods",
            description="Electrical transformer arrived with visible damage. Customer requesting replacement.",
            priority="urgent",
            status="in_progress",
            createdAt="2024-01-15T11:15:00Z",
            assignedTo="John Kamau",
            relatedOrder="ORD-002"
        ),
        SupportTicket(
            id="TKT-003",
            customer="Equity Bank",
            issue="Invoice Query",
            description="Customer questioning additional charges on delivery invoice.",
            priority="medium",
            status="resolved",
            createdAt="2024-01-14T14:20:00Z",
            assignedTo="Mary Wanjiku"
        ),
        SupportTicket(
            id="TKT-004",
            customer="Nakumatt Holdings",
            issue="Missing Items",
            description="Partial delivery received. 5 items missing from the shipment.",
            priority="high",
            status="open",
            createdAt="2024-01-15T13:45:00Z"
        ),
        SupportTicket(
            id="TKT-005",
            customer="Tusker Breweries",
            issue="Route Change Request",
            description="Customer requesting alternative delivery route due to road closure.",
            priority="medium",
            status="in_progress",
            createdAt="2024-01-15T08:20:00Z",
            assignedTo="Peter Omondi"
        )
    ]

# API Endpoints

# Fleet Management
@router.get("/fleet/summary")
async def get_fleet_summary():
    try:
        trucks = await elasticsearch_service.get_all_documents("trucks")
        
        summary = FleetSummary(
            totalTrucks=len(trucks),
            activeTrucks=len([t for t in trucks if t.get("status") in ['on_time', 'delayed']]),
            onTimeTrucks=len([t for t in trucks if t.get("status") == 'on_time']),
            delayedTrucks=len([t for t in trucks if t.get("status") == 'delayed']),
            averageDelay=45
        )
        
        return {
            "data": summary.dict(),
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting fleet summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fleet/trucks")
async def get_trucks():
    try:
        trucks = await elasticsearch_service.get_all_documents("trucks")
        
        # Convert to Truck model format for consistency
        formatted_trucks = []
        for truck in trucks:
            # Build route with origin and destination for frontend compatibility
            route_data = truck.get("route", {})
            current_location = truck.get("current_location", {})
            destination = truck.get("destination", {})
            
            formatted_route = {
                "id": route_data.get("id", ""),
                "origin": current_location,
                "destination": destination,
                "waypoints": [],
                "distance": route_data.get("distance", 0),
                "estimatedDuration": route_data.get("estimated_duration", 0),
                "actualDuration": route_data.get("actual_duration")
            }
            
            formatted_truck = {
                "id": truck.get("truck_id"),
                "plateNumber": truck.get("plate_number"),
                "driverId": truck.get("driver_id"),
                "driverName": truck.get("driver_name"),
                "currentLocation": current_location,
                "destination": destination,
                "route": formatted_route,
                "status": truck.get("status"),
                "estimatedArrival": truck.get("estimated_arrival"),
                "lastUpdate": truck.get("last_update"),
                "cargo": truck.get("cargo")
            }
            formatted_trucks.append(formatted_truck)
        
        return {
            "data": formatted_trucks,
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting trucks: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fleet/trucks/{truck_id}")
async def get_truck_by_id(truck_id: str):
    try:
        truck = await elasticsearch_service.get_document("trucks", truck_id)
        
        # Convert to Truck model format
        route_data = truck.get("route", {})
        current_location = truck.get("current_location", {})
        destination = truck.get("destination", {})
        
        formatted_route = {
            "id": route_data.get("id", ""),
            "origin": current_location,
            "destination": destination,
            "waypoints": [],
            "distance": route_data.get("distance", 0),
            "estimatedDuration": route_data.get("estimated_duration", 0),
            "actualDuration": route_data.get("actual_duration")
        }
        
        formatted_truck = {
            "id": truck.get("truck_id"),
            "plateNumber": truck.get("plate_number"),
            "driverId": truck.get("driver_id"),
            "driverName": truck.get("driver_name"),
            "currentLocation": current_location,
            "destination": destination,
            "route": formatted_route,
            "status": truck.get("status"),
            "estimatedArrival": truck.get("estimated_arrival"),
            "lastUpdate": truck.get("last_update"),
            "cargo": truck.get("cargo")
        }
        
        return {
            "data": formatted_truck,
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting truck {truck_id}: {e}")
        raise HTTPException(status_code=404, detail="Truck not found")

# Inventory Management
@router.get("/inventory")
async def get_inventory():
    try:
        inventory = await elasticsearch_service.get_all_documents("inventory")
        
        # Convert to InventoryItem model format
        formatted_inventory = []
        for item in inventory:
            formatted_item = {
                "id": item.get("item_id"),
                "name": item.get("name"),
                "category": item.get("category"),
                "quantity": item.get("quantity"),
                "unit": item.get("unit"),
                "location": item.get("location"),
                "status": item.get("status"),
                "lastUpdated": item.get("last_updated")
            }
            formatted_inventory.append(formatted_item)
        
        return {
            "data": formatted_inventory,
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting inventory: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Orders Management
@router.get("/orders")
async def get_orders():
    try:
        orders = await elasticsearch_service.get_all_documents("orders")
        
        # Convert to Order model format
        formatted_orders = []
        for order in orders:
            formatted_order = {
                "id": order.get("order_id"),
                "customer": order.get("customer"),
                "status": order.get("status"),
                "value": order.get("value"),
                "items": order.get("items"),
                "truckId": order.get("truck_id"),
                "region": order.get("region"),
                "createdAt": order.get("created_at"),
                "deliveryEta": order.get("delivery_eta"),
                "priority": order.get("priority")
            }
            formatted_orders.append(formatted_order)
        
        return {
            "data": formatted_orders,
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting orders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Support Management
@router.get("/support/tickets")
async def get_support_tickets():
    try:
        tickets = await elasticsearch_service.get_all_documents("support_tickets")
        
        # Convert to SupportTicket model format
        formatted_tickets = []
        for ticket in tickets:
            formatted_ticket = {
                "id": ticket.get("ticket_id"),
                "customer": ticket.get("customer"),
                "issue": ticket.get("issue"),
                "description": ticket.get("description"),
                "priority": ticket.get("priority"),
                "status": ticket.get("status"),
                "createdAt": ticket.get("created_at"),
                "assignedTo": ticket.get("assigned_to"),
                "relatedOrder": ticket.get("related_order")
            }
            formatted_tickets.append(formatted_ticket)
        
        return {
            "data": formatted_tickets,
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting support tickets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics
@router.get("/analytics/metrics")
async def get_analytics_metrics(timeRange: str = "7d"):
    metrics = await elasticsearch_service.get_current_metrics()
    return {
        "data": metrics,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analytics/routes")
async def get_route_performance():
    routes = await elasticsearch_service.get_route_performance_data()
    return {
        "data": routes,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analytics/delay-causes")
async def get_delay_causes():
    causes = await elasticsearch_service.get_delay_causes_data()
    return {
        "data": causes,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analytics/regional")
async def get_regional_performance():
    regions = await elasticsearch_service.get_regional_performance_data()
    return {
        "data": regions,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analytics/time-series")
async def get_time_series_data(metric: str = "delivery_performance_pct", timeRange: str = "7d"):
    """Get time-series data for trending charts"""
    event_type = "hourly_metrics" if timeRange == "24h" else "daily_performance"
    data = await elasticsearch_service.get_time_series_data(event_type, metric, timeRange)
    
    return {
        "data": data,
        "metric": metric,
        "timeRange": timeRange,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

# Semantic Search
@router.get("/search")
async def semantic_search(q: str, index: str = "orders", limit: int = 10):
    """
    Perform semantic search across different indices
    """
    try:
        if index == "orders":
            results = await elasticsearch_service.semantic_search(
                "orders", q, ["items", "customer"], limit
            )
            # Format results
            formatted_results = []
            for result in results:
                formatted_result = {
                    "id": result.get("order_id"),
                    "customer": result.get("customer"),
                    "status": result.get("status"),
                    "value": result.get("value"),
                    "items": result.get("items"),
                    "region": result.get("region"),
                    "priority": result.get("priority")
                }
                formatted_results.append(formatted_result)
            
        elif index == "trucks":
            results = await elasticsearch_service.semantic_search(
                "trucks", q, ["cargo.description", "driver_name"], limit
            )
            formatted_results = []
            for result in results:
                formatted_result = {
                    "id": result.get("truck_id"),
                    "plateNumber": result.get("plate_number"),
                    "driverName": result.get("driver_name"),
                    "status": result.get("status"),
                    "cargo": result.get("cargo")
                }
                formatted_results.append(formatted_result)
                
        elif index == "support_tickets":
            results = await elasticsearch_service.semantic_search(
                "support_tickets", q, ["issue", "description"], limit
            )
            formatted_results = []
            for result in results:
                formatted_result = {
                    "id": result.get("ticket_id"),
                    "customer": result.get("customer"),
                    "issue": result.get("issue"),
                    "description": result.get("description"),
                    "priority": result.get("priority"),
                    "status": result.get("status")
                }
                formatted_results.append(formatted_result)
        else:
            raise HTTPException(status_code=400, detail="Invalid index. Use: orders, trucks, or support_tickets")
        
        return {
            "data": formatted_results,
            "query": q,
            "index": index,
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error in semantic search: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Data Management
@router.post("/data/cleanup")
async def cleanup_duplicate_data():
    """Clean up duplicate data in Elasticsearch"""
    try:
        from services.data_seeder import data_seeder
        
        # Clear all existing data
        await data_seeder.clear_all_data()
        
        # Reseed with fresh data
        await data_seeder.seed_all_data(force=True)
        
        return {
            "message": "Data cleanup and reseed completed successfully",
            "success": True,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error during data cleanup: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Data Upload
@router.post("/data/upload/sheets")
async def upload_from_sheets(request: dict):
    # Simulate processing
    record_count = random.randint(50, 150)
    
    return {
        "data": {"recordCount": record_count},
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.post("/data/upload/csv")
async def upload_csv(file: UploadFile = File(...), dataType: str = Form(...)):
    # Simulate processing
    record_count = random.randint(100, 300)
    
    return {
        "data": {"recordCount": record_count},
        "success": True,
        "timestamp": datetime.now().isoformat()
    }