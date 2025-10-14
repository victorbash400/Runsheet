"""
Data seeder for Elasticsearch
Seeds the Elasticsearch indices with mock data and handles temporal data updates
"""

import asyncio
import logging
from datetime import datetime, timedelta
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
    
    async def seed_baseline_data(self, operational_time="09:00"):
        """Seed baseline morning operations data for demo"""
        try:
            logger.info(f"🌅 Seeding baseline data for {operational_time}...")
            
            # Check if baseline data already exists
            existing_trucks = await self.es_service.get_all_documents("trucks")
            if len(existing_trucks) > 0:
                logger.info("📋 Baseline data already exists, skipping seeding")
                return
            
            # Add temporal metadata to all documents
            base_timestamp = datetime.now().replace(hour=9, minute=0, second=0, microsecond=0)
            batch_metadata = {
                "batch_id": "morning_baseline",
                "operational_time": operational_time,
                "ingestion_timestamp": datetime.now().isoformat(),
                "data_version": "v1"
            }
            
            # Seed locations first
            await self.seed_locations(batch_metadata)
            
            # Seed baseline operational data
            await self.seed_baseline_trucks(batch_metadata, base_timestamp)
            await self.seed_baseline_orders(batch_metadata, base_timestamp)
            await self.seed_baseline_inventory(batch_metadata, base_timestamp)
            await self.seed_baseline_support_tickets(batch_metadata, base_timestamp)
            await self.seed_analytics_events(batch_metadata)
            
            logger.info("✅ Baseline data seeding completed!")
            
        except Exception as e:
            logger.error(f"❌ Baseline data seeding failed: {e}")
            raise
    
    async def upsert_batch_data(self, data_type: str, documents: list, batch_id: str, operational_time: str):
        """Upsert batch data with temporal metadata"""
        try:
            logger.info(f"📊 Upserting {len(documents)} {data_type} documents for batch {batch_id}")
            
            # Add temporal metadata to all documents
            batch_metadata = {
                "batch_id": batch_id,
                "operational_time": operational_time,
                "ingestion_timestamp": datetime.now().isoformat(),
                "data_version": f"v{len(batch_id.split('_')) + 1}"
            }
            
            # Add metadata to each document
            for doc in documents:
                doc.update(batch_metadata)
                doc["operational_timestamp"] = datetime.now().replace(
                    hour=int(operational_time.split(':')[0]),
                    minute=int(operational_time.split(':')[1]),
                    second=0,
                    microsecond=0
                ).isoformat()
            
            # Map data types to correct indices
            index_name = data_type
            if data_type == "fleet":
                index_name = "trucks"  # Fleet data goes to trucks index
            elif data_type == "support":
                index_name = "support_tickets"  # Support data goes to support_tickets index
            
            # Upsert documents (update existing, insert new)
            await self.es_service.bulk_index_documents(index_name, documents)
            
            logger.info(f"✅ Successfully upserted {len(documents)} {data_type} documents")
            return {"status": "success", "recordCount": len(documents)}
            
        except Exception as e:
            logger.error(f"❌ Batch upsert failed: {e}")
            raise
    
    async def seed_locations(self, batch_metadata=None):
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
            },
            {
                "location_id": "nakuru-station",
                "name": "Nakuru Station",
                "type": "station",
                "coordinates": {"lat": -0.3031, "lon": 36.0800},
                "address": "Nakuru, Kenya",
                "region": "Rift Valley"
            },
            {
                "location_id": "eldoret-depot",
                "name": "Eldoret Depot",
                "type": "depot",
                "coordinates": {"lat": 0.5143, "lon": 35.2698},
                "address": "Eldoret, Kenya",
                "region": "Rift Valley"
            },
            {
                "location_id": "thika-warehouse",
                "name": "Thika Warehouse",
                "type": "warehouse",
                "coordinates": {"lat": -1.0332, "lon": 37.0692},
                "address": "Thika, Kenya",
                "region": "Central"
            }
        ]
        
        # Add batch metadata if provided
        if batch_metadata:
            for location in locations_data:
                location.update(batch_metadata)
        
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
            },
            {
                "truck_id": "KA-123B",
                "plate_number": "KA-123B",
                "driver_id": "driver-004",
                "driver_name": "Sarah Njeri",
                "current_location": {
                    "id": "nakuru-station",
                    "name": "Nakuru Station",
                    "type": "station",
                    "coordinates": {"lat": -0.3031, "lon": 36.0800},
                    "address": "Nakuru, Kenya"
                },
                "destination": {
                    "id": "nairobi-station",
                    "name": "Nairobi Station",
                    "type": "station",
                    "coordinates": {"lat": -1.2921, "lon": 36.8219},
                    "address": "Nairobi, Kenya"
                },
                "route": {
                    "id": "nakuru-nairobi",
                    "distance": 160.0,
                    "estimated_duration": 180,
                    "actual_duration": None
                },
                "status": "on_time",
                "estimated_arrival": "2024-01-15T15:30:00Z",
                "last_update": "2024-01-15T12:30:00Z",
                "cargo": {
                    "type": "Electronics",
                    "weight": 5000.0,
                    "volume": 20.0,
                    "description": "Computer equipment and mobile phones for retail stores",
                    "priority": "high"
                }
            },
            {
                "truck_id": "KBZ-456C",
                "plate_number": "KBZ-456C",
                "driver_id": "driver-005",
                "driver_name": "David Mwangi",
                "current_location": {
                    "id": "eldoret-depot",
                    "name": "Eldoret Depot",
                    "type": "depot",
                    "coordinates": {"lat": 0.5143, "lon": 35.2698},
                    "address": "Eldoret, Kenya"
                },
                "destination": {
                    "id": "kisumu-depot",
                    "name": "Kisumu Depot",
                    "type": "depot",
                    "coordinates": {"lat": -0.0917, "lon": 34.7680},
                    "address": "Kisumu, Kenya"
                },
                "route": {
                    "id": "eldoret-kisumu",
                    "distance": 120.0,
                    "estimated_duration": 150,
                    "actual_duration": None
                },
                "status": "on_time",
                "estimated_arrival": "2024-01-15T17:00:00Z",
                "last_update": "2024-01-15T12:45:00Z",
                "cargo": {
                    "type": "Agricultural Products",
                    "weight": 12000.0,
                    "volume": 35.0,
                    "description": "Maize and wheat grain for distribution centers",
                    "priority": "medium"
                }
            },
            {
                "truck_id": "KCD-789D",
                "plate_number": "KCD-789D",
                "driver_id": "driver-006",
                "driver_name": "Grace Akinyi",
                "current_location": {
                    "id": "thika-warehouse",
                    "name": "Thika Warehouse",
                    "type": "warehouse",
                    "coordinates": {"lat": -1.0332, "lon": 37.0692},
                    "address": "Thika, Kenya"
                },
                "destination": {
                    "id": "mombasa-port",
                    "name": "Mombasa Port",
                    "type": "port",
                    "coordinates": {"lat": -4.0435, "lon": 39.6682},
                    "address": "Mombasa, Kenya"
                },
                "route": {
                    "id": "thika-mombasa",
                    "distance": 520.0,
                    "estimated_duration": 420,
                    "actual_duration": None
                },
                "status": "delayed",
                "estimated_arrival": "2024-01-15T19:45:00Z",
                "last_update": "2024-01-15T13:00:00Z",
                "cargo": {
                    "type": "Textiles",
                    "weight": 8500.0,
                    "volume": 40.0,
                    "description": "Clothing and fabric materials for export",
                    "priority": "low"
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
    
    async def seed_analytics_events(self, batch_metadata=None):
        """Seed analytics events data with time-series data for charts"""
        import random
        from datetime import datetime, timedelta
        
        events_data = []
        base_time = datetime.now()
        
        # Generate time-series data for the last 30 days
        for days_back in range(30, 0, -1):
            event_time = base_time - timedelta(days=days_back)
            
            # Daily performance metrics
            events_data.append({
                "event_id": f"PERF-{days_back:03d}",
                "event_type": "daily_performance",
                "timestamp": event_time.isoformat() + "Z",
                "region": "All",
                "metrics": {
                    "delivery_performance_pct": round(85 + random.uniform(-10, 10), 1),
                    "average_delay_minutes": round(120 + random.uniform(-60, 120), 1),
                    "fleet_utilization_pct": round(90 + random.uniform(-15, 10), 1),
                    "customer_satisfaction": round(4.0 + random.uniform(-0.5, 1.0), 1),
                    "total_deliveries": random.randint(15, 35),
                    "on_time_deliveries": random.randint(12, 30)
                }
            })
            
            # Route performance events
            routes = [
                ("Nairobi → Mombasa", "nairobi-mombasa"),
                ("Kisumu → Nakuru", "kisumu-nakuru"), 
                ("Eldoret → Nairobi", "eldoret-nairobi"),
                ("Mombasa → Kisumu", "mombasa-kisumu")
            ]
            
            for route_name, route_id in routes:
                events_data.append({
                    "event_id": f"ROUTE-{route_id}-{days_back:03d}",
                    "event_type": "route_performance",
                    "timestamp": event_time.isoformat() + "Z",
                    "route_name": route_name,
                    "route_id": route_id,
                    "metrics": {
                        "performance_pct": round(75 + random.uniform(-15, 20), 1),
                        "avg_delivery_time": round(300 + random.uniform(-120, 180), 1),
                        "delay_incidents": random.randint(0, 5),
                        "completed_trips": random.randint(2, 8)
                    }
                })
        
        # Generate hourly data for the last 24 hours
        for hours_back in range(24, 0, -1):
            event_time = base_time - timedelta(hours=hours_back)
            
            events_data.append({
                "event_id": f"HOURLY-{hours_back:03d}",
                "event_type": "hourly_metrics",
                "timestamp": event_time.isoformat() + "Z",
                "region": "All",
                "metrics": {
                    "active_trucks": random.randint(4, 8),
                    "delivery_performance_pct": round(85 + random.uniform(-15, 15), 1),
                    "average_delay_minutes": round(90 + random.uniform(-60, 120), 1),
                    "fleet_utilization_pct": round(88 + random.uniform(-20, 12), 1)
                }
            })
        
        # Delay cause events
        delay_causes = [
            ("Traffic Congestion", 45),
            ("Weather Conditions", 28), 
            ("Vehicle Maintenance", 18),
            ("Loading Delays", 9)
        ]
        
        for cause, base_pct in delay_causes:
            events_data.append({
                "event_id": f"DELAY-{cause.replace(' ', '-').lower()}",
                "event_type": "delay_cause_analysis",
                "timestamp": base_time.isoformat() + "Z",
                "delay_cause": cause,
                "metrics": {
                    "percentage": round(base_pct + random.uniform(-5, 5), 1),
                    "incident_count": random.randint(5, 25),
                    "avg_delay_minutes": round(60 + random.uniform(-30, 90), 1)
                }
            })
        
        # Regional performance
        regions = ["Nairobi", "Mombasa", "Kisumu", "Eldoret"]
        for region in regions:
            events_data.append({
                "event_id": f"REGIONAL-{region.lower()}",
                "event_type": "regional_performance",
                "timestamp": base_time.isoformat() + "Z",
                "region": region,
                "metrics": {
                    "on_time_percentage": round(80 + random.uniform(-15, 15), 1),
                    "total_deliveries": random.randint(20, 50),
                    "avg_delivery_time": round(240 + random.uniform(-60, 120), 1),
                    "customer_rating": round(3.8 + random.uniform(-0.3, 1.2), 1)
                }
            })
        
        # Individual delivery events for more granular data
        delivery_events = [
            {
                "event_id": "DEL-001",
                "event_type": "delivery_completed",
                "timestamp": "2024-01-14T11:45:00Z",
                "truck_id": "MO-84A",
                "order_id": "ORD-003",
                "region": "Kisumu",
                "metrics": {
                    "delivery_time_minutes": 385,
                    "delay_minutes": -15,
                    "distance_km": 285.5,
                    "fuel_consumed_liters": 45.2,
                    "customer_rating": 4.5
                }
            },
            {
                "event_id": "DEL-002", 
                "event_type": "delivery_started",
                "timestamp": "2024-01-15T08:00:00Z",
                "truck_id": "GI-58A",
                "order_id": "ORD-001",
                "region": "Central",
                "metrics": {
                    "planned_distance_km": 580.0,
                    "estimated_duration_minutes": 480
                }
            },
            {
                "event_id": "DEL-003",
                "event_type": "delay_reported",
                "timestamp": "2024-01-15T12:00:00Z",
                "truck_id": "CE-57A",
                "region": "Nyanza",
                "delay_cause": "Traffic Congestion",
                "metrics": {
                    "delay_minutes": 180,
                    "expected_delay_duration": 120
                }
            }
        ]
        
        events_data.extend(delivery_events)
        
        # Add batch metadata if provided
        if batch_metadata:
            for event in events_data:
                event.update(batch_metadata)
        
        await self.es_service.bulk_index_documents("analytics_events", events_data)
        logger.info(f"✅ Seeded {len(events_data)} analytics events with time-series data")
    
    async def seed_baseline_trucks(self, batch_metadata, base_timestamp):
        """Seed baseline morning truck data - all on time"""
        trucks_data = [
            {
                "truck_id": "GI-58A",
                "plate_number": "GI-58A",
                "driver_id": "driver-001",
                "driver_name": "John Kamau",
                "current_location": {
                    "id": "nairobi-station",
                    "name": "Nairobi Station",
                    "type": "station",
                    "coordinates": {"lat": -1.2921, "lon": 36.8219},
                    "address": "Nairobi, Kenya"
                },
                "destination": {
                    "id": "mombasa-port",
                    "name": "Mombasa Port",
                    "type": "port",
                    "coordinates": {"lat": -4.0435, "lon": 39.6682},
                    "address": "Mombasa, Kenya"
                },
                "route": {
                    "id": "nairobi-mombasa",
                    "distance": 480.0,
                    "estimated_duration": 420,
                    "actual_duration": None
                },
                "status": "on_time",
                "estimated_arrival": (base_timestamp + timedelta(hours=7)).isoformat() + "Z",
                "last_update": base_timestamp.isoformat() + "Z",
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
                    "id": "nakuru-station",
                    "name": "Nakuru Station",
                    "type": "station",
                    "coordinates": {"lat": -0.3031, "lon": 36.0800},
                    "address": "Nakuru, Kenya"
                },
                "destination": {
                    "id": "nairobi-station",
                    "name": "Nairobi Station",
                    "type": "station",
                    "coordinates": {"lat": -1.2921, "lon": 36.8219},
                    "address": "Nairobi, Kenya"
                },
                "route": {
                    "id": "nakuru-nairobi",
                    "distance": 160.0,
                    "estimated_duration": 180,
                    "actual_duration": None
                },
                "status": "on_time",
                "estimated_arrival": (base_timestamp + timedelta(hours=3)).isoformat() + "Z",
                "last_update": base_timestamp.isoformat() + "Z",
                "cargo": {
                    "type": "Perishables",
                    "weight": 8000.0,
                    "volume": 25.0,
                    "description": "Fresh produce including vegetables and fruits",
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
                    "id": "eldoret-depot",
                    "name": "Eldoret Depot",
                    "type": "depot",
                    "coordinates": {"lat": 0.5143, "lon": 35.2698},
                    "address": "Eldoret, Kenya"
                },
                "route": {
                    "id": "kisumu-eldoret",
                    "distance": 120.0,
                    "estimated_duration": 150,
                    "actual_duration": None
                },
                "status": "on_time",
                "estimated_arrival": (base_timestamp + timedelta(hours=2, minutes=30)).isoformat() + "Z",
                "last_update": base_timestamp.isoformat() + "Z",
                "cargo": {
                    "type": "Construction Materials",
                    "weight": 20000.0,
                    "volume": 60.0,
                    "description": "Cement bags and steel rods",
                    "priority": "medium"
                }
            }
        ]
        
        # Add batch metadata
        for truck in trucks_data:
            truck.update(batch_metadata)
        
        await self.es_service.bulk_index_documents("trucks", trucks_data)
        logger.info("✅ Seeded baseline trucks data")
    
    async def seed_baseline_orders(self, batch_metadata, base_timestamp):
        """Seed baseline morning orders - fresh orders"""
        orders_data = [
            {
                "order_id": "ORD-001",
                "customer": "Safaricom Ltd",
                "customer_id": "CUST-001",
                "status": "in_transit",
                "value": 125000.0,
                "items": "Network equipment including routers and switches",
                "truck_id": "GI-58A",
                "region": "Nairobi",
                "priority": "high",
                "created_at": (base_timestamp - timedelta(hours=1)).isoformat() + "Z",
                "delivery_eta": (base_timestamp + timedelta(hours=7)).isoformat() + "Z"
            },
            {
                "order_id": "ORD-002",
                "customer": "Kenya Power",
                "customer_id": "CUST-002",
                "status": "pending",
                "value": 89000.0,
                "items": "Electrical transformers and power equipment",
                "region": "Mombasa",
                "priority": "medium",
                "created_at": base_timestamp.isoformat() + "Z",
                "delivery_eta": (base_timestamp + timedelta(hours=8)).isoformat() + "Z"
            },
            {
                "order_id": "ORD-003",
                "customer": "Equity Bank",
                "customer_id": "CUST-003",
                "status": "in_transit",
                "value": 45000.0,
                "items": "ATM machines and security equipment",
                "truck_id": "MO-84A",
                "region": "Central",
                "priority": "urgent",
                "created_at": (base_timestamp - timedelta(minutes=30)).isoformat() + "Z",
                "delivery_eta": (base_timestamp + timedelta(hours=3)).isoformat() + "Z"
            }
        ]
        
        # Add batch metadata
        for order in orders_data:
            order.update(batch_metadata)
        
        await self.es_service.bulk_index_documents("orders", orders_data)
        logger.info("✅ Seeded baseline orders data")
    
    async def seed_baseline_inventory(self, batch_metadata, base_timestamp):
        """Seed baseline morning inventory - full stock"""
        inventory_data = [
            {
                "item_id": "INV-001",
                "name": "Diesel Fuel Premium Grade",
                "category": "Fuel",
                "quantity": 15000,
                "unit": "liters",
                "location": "Nairobi Depot",
                "status": "in_stock",
                "last_updated": base_timestamp.isoformat() + "Z"
            },
            {
                "item_id": "INV-002",
                "name": "Heavy Duty Truck Tires",
                "category": "Parts",
                "quantity": 50,
                "unit": "pieces",
                "location": "Mombasa Warehouse",
                "status": "in_stock",
                "last_updated": base_timestamp.isoformat() + "Z"
            },
            {
                "item_id": "INV-003",
                "name": "Synthetic Engine Oil 15W-40",
                "category": "Maintenance",
                "quantity": 25,
                "unit": "bottles",
                "location": "Kisumu Station",
                "status": "in_stock",
                "last_updated": base_timestamp.isoformat() + "Z"
            },
            {
                "item_id": "INV-004",
                "name": "Ceramic Brake Pads Heavy Duty",
                "category": "Parts",
                "quantity": 120,
                "unit": "sets",
                "location": "Nairobi Depot",
                "status": "in_stock",
                "last_updated": base_timestamp.isoformat() + "Z"
            }
        ]
        
        # Add batch metadata
        for item in inventory_data:
            item.update(batch_metadata)
        
        await self.es_service.bulk_index_documents("inventory", inventory_data)
        logger.info("✅ Seeded baseline inventory data")
    
    async def seed_baseline_support_tickets(self, batch_metadata, base_timestamp):
        """Seed baseline morning support tickets - minimal issues"""
        tickets_data = [
            {
                "ticket_id": "TKT-001",
                "customer": "General Inquiry",
                "customer_id": "CUST-000",
                "issue": "Route optimization inquiry",
                "description": "Customer requesting information about optimal delivery routes for regular shipments",
                "priority": "low",
                "status": "open",
                "created_at": (base_timestamp - timedelta(minutes=15)).isoformat() + "Z"
            }
        ]
        
        # Add batch metadata
        for ticket in tickets_data:
            ticket.update(batch_metadata)
        
        await self.es_service.bulk_index_documents("support_tickets", tickets_data)
        logger.info("✅ Seeded baseline support tickets data")

# Global instance
data_seeder = DataSeeder()