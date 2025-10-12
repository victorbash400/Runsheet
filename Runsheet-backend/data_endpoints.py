"""
Data API endpoints for Runsheet Logistics Platform
Provides mock data endpoints that can later be replaced with Elasticsearch
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import random

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
    trucks = get_mock_trucks()
    summary = FleetSummary(
        totalTrucks=len(trucks),
        activeTrucks=len([t for t in trucks if t.status in ['on_time', 'delayed']]),
        onTimeTrucks=len([t for t in trucks if t.status == 'on_time']),
        delayedTrucks=len([t for t in trucks if t.status == 'delayed']),
        averageDelay=45
    )
    
    return {
        "data": summary.dict(),
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/fleet/trucks")
async def get_trucks():
    trucks = get_mock_trucks()
    return {
        "data": [truck.dict() for truck in trucks],
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/fleet/trucks/{truck_id}")
async def get_truck_by_id(truck_id: str):
    trucks = get_mock_trucks()
    truck = next((t for t in trucks if t.id == truck_id), None)
    
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    
    return {
        "data": truck.dict(),
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

# Inventory Management
@router.get("/inventory")
async def get_inventory():
    inventory = get_mock_inventory()
    return {
        "data": [item.dict() for item in inventory],
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

# Orders Management
@router.get("/orders")
async def get_orders():
    orders = get_mock_orders()
    return {
        "data": [order.dict() for order in orders],
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

# Support Management
@router.get("/support/tickets")
async def get_support_tickets():
    tickets = get_mock_support_tickets()
    return {
        "data": [ticket.dict() for ticket in tickets],
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

# Analytics
@router.get("/analytics/metrics")
async def get_analytics_metrics(timeRange: str = "7d"):
    metrics = {
        "delivery_performance": {
            "title": "Delivery Performance",
            "value": "87.5%",
            "change": "+2.3%",
            "trend": "up"
        },
        "average_delay": {
            "title": "Average Delay",
            "value": "2.4 hrs",
            "change": "-0.8 hrs",
            "trend": "down"
        },
        "fleet_utilization": {
            "title": "Fleet Utilization",
            "value": "92%",
            "change": "+5%",
            "trend": "up"
        },
        "customer_satisfaction": {
            "title": "Customer Satisfaction",
            "value": "4.2/5",
            "change": "+0.1",
            "trend": "up"
        }
    }
    
    return {
        "data": metrics,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analytics/routes")
async def get_route_performance():
    routes = [
        {"name": "Nairobi → Mombasa", "performance": 94},
        {"name": "Kisumu → Nakuru", "performance": 91},
        {"name": "Eldoret → Nairobi", "performance": 78},
        {"name": "Mombasa → Kisumu", "performance": 75}
    ]
    
    return {
        "data": routes,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analytics/delay-causes")
async def get_delay_causes():
    causes = [
        {"name": "Traffic Congestion", "percentage": 45},
        {"name": "Weather Conditions", "percentage": 28},
        {"name": "Vehicle Maintenance", "percentage": 18},
        {"name": "Other", "percentage": 9}
    ]
    
    return {
        "data": causes,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

@router.get("/analytics/regional")
async def get_regional_performance():
    regions = [
        {"name": "Nairobi", "onTimePercentage": 92},
        {"name": "Mombasa", "onTimePercentage": 88},
        {"name": "Kisumu", "onTimePercentage": 85},
        {"name": "Eldoret", "onTimePercentage": 81}
    ]
    
    return {
        "data": regions,
        "success": True,
        "timestamp": datetime.now().isoformat()
    }

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