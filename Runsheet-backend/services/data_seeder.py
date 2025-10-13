"""
Data seeder for Elasticsearch
Seeds the Elasticsearch indices with mock data from data_endpoints.py
"""

import asyncio
import logging
from datetime import datetime
from services.elasticsearch_service import elasticsearch_service

logger = logging.getLogger(__name__)

class DataSeeder:
    def __init__(self):
        self.es_service = elasticsearch_service
    
    async def clear_all_data(self):
        """Clear all existing data from indices"""
        indices = ["trucks", "locations", "orders", "inventory", "support_tickets", "analytics_events"]
        for index in indices:
            try:
                # Delete all documents in the index
                query = {"query": {"match_all": {}}}
                self.es_service.client.delete_by_query(index=index, body=query, refresh=True)
                logger.info(f"🗑️ Cleared data from {index}")
            except Exception as e:
                logger.warning(f"Could not clear {index}: {e}")
    
    async def seed_all_data(self, force=False):
        """Seed all indices with mock data (only if empty unless forced)"""
        try:
            logger.info("🌱 Starting data seeding process...")
            
            # Check if data already exists (unless forced)
            if not force:
                existing_trucks = await self.es_service.get_all_documents("trucks")
                if len(existing_trucks) > 0:
                    logger.info("📋 Data already exists, skipping seeding")
                    return
            
            # Seed locations first (referenced by other entities)
            await self.seed_locations()
            
            # Seed other entities
            await self.seed_trucks()
            await self.seed_orders()
            await self.seed_inventory()
            await self.seed_support_tickets()
            await self.seed_analytics_events()
            
            logger.info("✅ Data seeding completed successfully!")
            
        except Exception as e:
            logger.error(f"❌ Data seeding failed: {e}")
            raise
    
    async def seed_locations(self):
        """Seed locations data"""
        locations_data = [
            {
                "location_id": "nairobi-station",
                "name": "Nairobi Station",
                "type": "station",
                "coordinates": {"lat": -1.2921, "lon": 36.8219},
                "address": "Nairobi, Kenya",
                "region": "Central"
            },
            {
                "location_id": "mombasa-port",
                "name": "Mombasa Port",
                "type": "port",
                "coordinates": {"lat": -4.0435, "lon": 39.6682},
                "address": "Mombasa, Kenya",
                "region": "Coast"
            },
            {
                "location_id": "kisumu-depot",
                "name": "Kisumu Depot",
                "type": "depot",
                "coordinates": {"lat": -0.0917, "lon": 34.7680},
                "address": "Kisumu, Kenya",
                "region": "Nyanza"
            },
            {
                "location_id": "kinara-warehouse",
                "name": "Kinara Warehouse",
                "type": "warehouse",
                "coordinates": {"lat": -1.3733, "lon": 36.7516},
                "address": "Kinara, Kenya",
                "region": "Central"
            }
        ]
        
        await self.es_service.bulk_index_documents("locations", locations_data)
        logger.info("✅ Seeded locations data")
    
    async def seed_trucks(self):
        """Seed trucks data"""
        trucks_data = [
            {
                "truck_id": "GI-58A",
                "plate_number": "GI-58A",
                "driver_id": "driver-001",
                "driver_name": "John Kamau",
                "current_location": {
                    "id": "kisumu-depot",
                    "name": "Kisumu Depot",
                    "type": "depot",
                    "coordinates": {"lat": -0.0917, "lon": 34.7680},
                    "address": "Kisumu, Kenya"
                },
                "destination": {
                    "id": "mombasa-port",
                    "name": "Mombasa Port",
                    "type": "port",
                    "coordinates": {"lat": -4.0435, "lon": 39.6682},
                    "address": "Mombasa, Kenya"
                },
                "route": {
                    "id": "kisumu-mombasa",
                    "distance": 580.0,
                    "estimated_duration": 480,
                    "actual_duration": None
                },
                "status": "on_time",
                "estimated_arrival": "2024-01-15T14:15:00Z",
                "last_update": "2024-01-15T12:00:00Z",
                "cargo": {
                    "type": "General Cargo",
                    "weight": 15000.0,
                    "volume": 45.0,
                    "description": "Mixed goods including electronics and household items",
                    "priority": "medium"
                }
            },
            {
                "truck_id": "MO-84A",
                "plate_number": "MO-84A",
                "driver_id": "driver-002",
                "driver_name": "Mary Wanjiku",
                "current_location": {
                    "id": "nairobi-station",
                    "name": "Nairobi Station",
                    "type": "station",
                    "coordinates": {"lat": -1.2921, "lon": 36.8219},
                    "address": "Nairobi, Kenya"
                },
                "destination": {
                    "id": "kinara-warehouse",
                    "name": "Kinara Warehouse",
                    "type": "warehouse",
                    "coordinates": {"lat": -1.3733, "lon": 36.7516},
                    "address": "Kinara, Kenya"
                },
                "route": {
                    "id": "nairobi-kinara",
                    "distance": 25.0,
                    "estimated_duration": 45,
                    "actual_duration": None
                },
                "status": "delayed",
                "estimated_arrival": "2024-01-15T16:25:00Z",
                "last_update": "2024-01-15T12:05:00Z",
                "cargo": {
                    "type": "Perishables",
                    "weight": 8000.0,
                    "volume": 25.0,
                    "description": "Fresh produce including vegetables and fruits for local markets",
                    "priority": "high"
                }
            },
            {
                "truck_id": "CE-57A",
                "plate_number": "CE-57A",
                "driver_id": "driver-003",
                "driver_name": "Peter Ochieng",
                "current_location": {
                    "id": "kisumu-depot",
                    "name": "Kisumu Depot",
                    "type": "depot",
                    "coordinates": {"lat": -0.0917, "lon": 34.7680},
                    "address": "Kisumu, Kenya"
                },
                "destination": {
                    "id": "mombasa-port",
                    "name": "Mombasa Port",
                    "type": "port",
                    "coordinates": {"lat": -4.0435, "lon": 39.6682},
                    "address": "Mombasa, Kenya"
                },
                "route": {
                    "id": "kisumu-mombasa-2",
                    "distance": 580.0,
                    "estimated_duration": 480,
                    "actual_duration": None
                },
                "status": "delayed",
                "estimated_arrival": "2024-01-15T12:25:00Z",
                "last_update": "2024-01-15T12:10:00Z",
                "cargo": {
                    "type": "Construction Materials",
                    "weight": 20000.0,
                    "volume": 60.0,
                    "description": "Cement bags and steel rods for construction projects",
                    "priority": "medium"
                }
            }
        ]
        
        await self.es_service.bulk_index_documents("trucks", trucks_data)
        logger.info("✅ Seeded trucks data")
    
    async def seed_orders(self):
        """Seed orders data"""
        orders_data = [
            {
                "order_id": "ORD-001",
                "customer": "Safaricom Ltd",
                "customer_id": "CUST-001",
                "status": "in_transit",
                "value": 125000.0,
                "items": "Network equipment including routers, switches, and fiber optic cables for telecommunications infrastructure",
                "truck_id": "GI-58A",
                "region": "Nairobi",
                "priority": "high",
                "created_at": "2024-01-14T08:00:00Z",
                "delivery_eta": "2024-01-15T14:00:00Z"
            },
            {
                "order_id": "ORD-002",
                "customer": "Kenya Power",
                "customer_id": "CUST-002",
                "status": "pending",
                "value": 89000.0,
                "items": "Electrical transformers and power distribution equipment for grid expansion",
                "region": "Mombasa",
                "priority": "medium",
                "created_at": "2024-01-15T09:30:00Z",
                "delivery_eta": "2024-01-16T16:00:00Z"
            },
            {
                "order_id": "ORD-003",
                "customer": "Equity Bank",
                "customer_id": "CUST-003",
                "status": "delivered",
                "value": 45000.0,
                "items": "ATM machines and security equipment for new branch installations",
                "truck_id": "MO-84A",
                "region": "Kisumu",
                "priority": "urgent",
                "created_at": "2024-01-13T10:15:00Z",
                "delivery_eta": "2024-01-14T12:00:00Z",
                "delivered_at": "2024-01-14T11:45:00Z"
            },
            {
                "order_id": "ORD-004",
                "customer": "Tusker Breweries",
                "customer_id": "CUST-004",
                "status": "in_transit",
                "value": 210000.0,
                "items": "Brewing equipment including fermentation tanks and bottling machinery",
                "truck_id": "CE-57A",
                "region": "Nakuru",
                "priority": "medium",
                "created_at": "2024-01-14T11:20:00Z",
                "delivery_eta": "2024-01-15T18:00:00Z"
            }
        ]
        
        await self.es_service.bulk_index_documents("orders", orders_data)
        logger.info("✅ Seeded orders data")
    
    async def seed_inventory(self):
        """Seed inventory data"""
        inventory_data = [
            {
                "item_id": "INV-001",
                "name": "Diesel Fuel Premium Grade",
                "category": "Fuel",
                "quantity": 15000,
                "unit": "liters",
                "location": "Nairobi Depot",
                "status": "in_stock",
                "last_updated": "2024-01-15T10:30:00Z"
            },
            {
                "item_id": "INV-002",
                "name": "Heavy Duty Truck Tires",
                "category": "Parts",
                "quantity": 25,
                "unit": "pieces",
                "location": "Mombasa Warehouse",
                "status": "low_stock",
                "last_updated": "2024-01-15T09:15:00Z"
            },
            {
                "item_id": "INV-003",
                "name": "Synthetic Engine Oil 15W-40",
                "category": "Maintenance",
                "quantity": 0,
                "unit": "bottles",
                "location": "Kisumu Station",
                "status": "out_of_stock",
                "last_updated": "2024-01-14T16:45:00Z"
            },
            {
                "item_id": "INV-004",
                "name": "Ceramic Brake Pads Heavy Duty",
                "category": "Parts",
                "quantity": 120,
                "unit": "sets",
                "location": "Nairobi Depot",
                "status": "in_stock",
                "last_updated": "2024-01-15T08:20:00Z"
            },
            {
                "item_id": "INV-005",
                "name": "Radiator Coolant Fluid",
                "category": "Maintenance",
                "quantity": 8,
                "unit": "bottles",
                "location": "Mombasa Warehouse",
                "status": "low_stock",
                "last_updated": "2024-01-15T11:00:00Z"
            }
        ]
        
        await self.es_service.bulk_index_documents("inventory", inventory_data)
        logger.info("✅ Seeded inventory data")
    
    async def seed_support_tickets(self):
        """Seed support tickets data"""
        tickets_data = [
            {
                "ticket_id": "TKT-001",
                "customer": "Safaricom Ltd",
                "customer_id": "CUST-001",
                "issue": "Delivery delay notification and customer communication",
                "description": "Order ORD-001 is running 3 hours behind schedule due to traffic congestion on Nairobi-Mombasa highway. Customer needs urgent update on revised ETA and compensation options.",
                "priority": "high",
                "status": "open",
                "related_order": "ORD-001",
                "created_at": "2024-01-15T09:30:00Z"
            },
            {
                "ticket_id": "TKT-002",
                "customer": "Kenya Power",
                "customer_id": "CUST-002",
                "issue": "Damaged goods inspection and replacement request",
                "description": "Electrical transformer arrived with visible damage to outer casing and oil leak detected. Customer requesting immediate replacement and investigation into handling procedures.",
                "priority": "urgent",
                "status": "in_progress",
                "assigned_to": "John Kamau",
                "related_order": "ORD-002",
                "created_at": "2024-01-15T11:15:00Z"
            },
            {
                "ticket_id": "TKT-003",
                "customer": "Equity Bank",
                "customer_id": "CUST-003",
                "issue": "Invoice discrepancy and billing inquiry",
                "description": "Customer questioning additional fuel surcharge and handling fees on delivery invoice. Requesting detailed breakdown of all charges and justification for extra costs.",
                "priority": "medium",
                "status": "resolved",
                "assigned_to": "Mary Wanjiku",
                "created_at": "2024-01-14T14:20:00Z",
                "resolved_at": "2024-01-15T10:30:00Z"
            },
            {
                "ticket_id": "TKT-004",
                "customer": "Nakumatt Holdings",
                "customer_id": "CUST-005",
                "issue": "Missing items from shipment manifest",
                "description": "Partial delivery received with 5 items missing from the original shipment manifest. Customer needs immediate investigation and delivery of missing items.",
                "priority": "high",
                "status": "open",
                "created_at": "2024-01-15T13:45:00Z"
            }
        ]
        
        await self.es_service.bulk_index_documents("support_tickets", tickets_data)
        logger.info("✅ Seeded support tickets data")
    
    async def seed_analytics_events(self):
        """Seed analytics events data"""
        events_data = [
            {
                "event_id": "EVT-001",
                "event_type": "delivery_completed",
                "timestamp": "2024-01-14T11:45:00Z",
                "truck_id": "MO-84A",
                "order_id": "ORD-003",
                "region": "Kisumu",
                "metrics": {
                    "delivery_time": 385,
                    "delay_minutes": -15,
                    "distance_km": 285.5
                }
            },
            {
                "event_id": "EVT-002",
                "event_type": "route_started",
                "timestamp": "2024-01-15T08:00:00Z",
                "truck_id": "GI-58A",
                "order_id": "ORD-001",
                "region": "Central",
                "metrics": {
                    "distance_km": 580.0
                }
            },
            {
                "event_id": "EVT-003",
                "event_type": "delay_reported",
                "timestamp": "2024-01-15T12:00:00Z",
                "truck_id": "CE-57A",
                "region": "Nyanza",
                "metrics": {
                    "delay_minutes": 180
                }
            }
        ]
        
        await self.es_service.bulk_index_documents("analytics_events", events_data)
        logger.info("✅ Seeded analytics events data")

# Global instance
data_seeder = DataSeeder()