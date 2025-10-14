"""
Elasticsearch service for Runsheet Logistics Platform
Handles all Elasticsearch operations including index management and data operations
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from elasticsearch import Elasticsearch
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class ElasticsearchService:
    def __init__(self):
        self.client = None
        self.connect()
    
    def connect(self):
        """Initialize Elasticsearch connection"""
        try:
            api_key = os.getenv("ELASTIC_API_KEY", "").strip('"')
            endpoint = os.getenv("ELASTIC_ENDPOINT", "").strip('"')
            
            if not api_key or not endpoint:
                raise ValueError("ELASTIC_API_KEY and ELASTIC_ENDPOINT must be set in environment")
            
            self.client = Elasticsearch(
                endpoint,
                api_key=api_key,
                verify_certs=True,
                request_timeout=30
            )
            
            # Test connection
            if self.client.ping():
                logger.info("✅ Connected to Elasticsearch successfully")
                self.setup_indices()
            else:
                raise ConnectionError("Failed to ping Elasticsearch")
                
        except Exception as e:
            logger.error(f"❌ Failed to connect to Elasticsearch: {e}")
            raise
    
    def setup_indices(self):
        """Create indices with proper mappings if they don't exist"""
        indices = {
            "trucks": self._get_trucks_mapping(),
            "locations": self._get_locations_mapping(),
            "orders": self._get_orders_mapping(),
            "inventory": self._get_inventory_mapping(),
            "support_tickets": self._get_support_tickets_mapping(),
            "analytics_events": self._get_analytics_mapping()
        }
        
        for index_name, mapping in indices.items():
            try:
                if not self.client.indices.exists(index=index_name):
                    self.client.indices.create(
                        index=index_name,
                        body=mapping
                    )
                    logger.info(f"✅ Created index: {index_name}")
                else:
                    logger.info(f"📋 Index already exists: {index_name}")
            except Exception as e:
                logger.error(f"❌ Failed to create index {index_name}: {e}")
    
    def _get_trucks_mapping(self):
        """Get mapping for trucks index"""
        return {
            "mappings": {
                "properties": {
                    "truck_id": {"type": "keyword"},
                    "plate_number": {"type": "keyword"},
                    "driver_id": {"type": "keyword"},
                    "driver_name": {"type": "text"},
                    "current_location": {
                        "properties": {
                            "id": {"type": "keyword"},
                            "name": {"type": "text"},
                            "type": {"type": "keyword"},
                            "coordinates": {"type": "geo_point"},
                            "address": {"type": "text"}
                        }
                    },
                    "destination": {
                        "properties": {
                            "id": {"type": "keyword"},
                            "name": {"type": "text"},
                            "type": {"type": "keyword"},
                            "coordinates": {"type": "geo_point"},
                            "address": {"type": "text"}
                        }
                    },
                    "route": {
                        "properties": {
                            "id": {"type": "keyword"},
                            "distance": {"type": "float"},
                            "estimated_duration": {"type": "integer"},
                            "actual_duration": {"type": "integer"}
                        }
                    },
                    "status": {"type": "keyword"},
                    "estimated_arrival": {"type": "date"},
                    "last_update": {"type": "date"},
                    "cargo": {
                        "properties": {
                            "type": {"type": "keyword"},
                            "weight": {"type": "float"},
                            "volume": {"type": "float"},
                            "description": {"type": "semantic_text"},
                            "priority": {"type": "keyword"}
                        }
                    },
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
    
    def _get_locations_mapping(self):
        """Get mapping for locations index"""
        return {
            "mappings": {
                "properties": {
                    "location_id": {"type": "keyword"},
                    "name": {"type": "text"},
                    "type": {"type": "keyword"},
                    "coordinates": {"type": "geo_point"},
                    "address": {"type": "semantic_text"},
                    "region": {"type": "keyword"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
    
    def _get_orders_mapping(self):
        """Get mapping for orders index"""
        return {
            "mappings": {
                "properties": {
                    "order_id": {"type": "keyword"},
                    "customer": {"type": "text"},
                    "customer_id": {"type": "keyword"},
                    "status": {"type": "keyword"},
                    "value": {"type": "float"},
                    "items": {"type": "semantic_text"},
                    "truck_id": {"type": "keyword"},
                    "region": {"type": "keyword"},
                    "priority": {"type": "keyword"},
                    "created_at": {"type": "date"},
                    "delivery_eta": {"type": "date"},
                    "delivered_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
    
    def _get_inventory_mapping(self):
        """Get mapping for inventory index"""
        return {
            "mappings": {
                "properties": {
                    "item_id": {"type": "keyword"},
                    "name": {"type": "semantic_text"},
                    "category": {"type": "keyword"},
                    "quantity": {"type": "integer"},
                    "unit": {"type": "keyword"},
                    "location": {"type": "text"},
                    "status": {"type": "keyword"},
                    "last_updated": {"type": "date"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"}
                }
            }
        }
    
    def _get_support_tickets_mapping(self):
        """Get mapping for support tickets index"""
        return {
            "mappings": {
                "properties": {
                    "ticket_id": {"type": "keyword"},
                    "customer": {"type": "text"},
                    "customer_id": {"type": "keyword"},
                    "issue": {"type": "semantic_text"},
                    "description": {"type": "semantic_text"},
                    "priority": {"type": "keyword"},
                    "status": {"type": "keyword"},
                    "assigned_to": {"type": "keyword"},
                    "related_order": {"type": "keyword"},
                    "created_at": {"type": "date"},
                    "updated_at": {"type": "date"},
                    "resolved_at": {"type": "date"}
                }
            }
        }
    
    def _get_analytics_mapping(self):
        """Get mapping for analytics events index"""
        return {
            "mappings": {
                "properties": {
                    "event_id": {"type": "keyword"},
                    "event_type": {"type": "keyword"},
                    "timestamp": {"type": "date"},
                    "truck_id": {"type": "keyword"},
                    "order_id": {"type": "keyword"},
                    "region": {"type": "keyword"},
                    "route_name": {"type": "text"},
                    "route_id": {"type": "keyword"},
                    "delay_cause": {"type": "keyword"},
                    "metrics": {
                        "properties": {
                            # Performance metrics
                            "delivery_performance_pct": {"type": "float"},
                            "average_delay_minutes": {"type": "float"},
                            "fleet_utilization_pct": {"type": "float"},
                            "customer_satisfaction": {"type": "float"},
                            "on_time_percentage": {"type": "float"},
                            
                            # Delivery metrics
                            "delivery_time_minutes": {"type": "integer"},
                            "delay_minutes": {"type": "integer"},
                            "distance_km": {"type": "float"},
                            "fuel_consumed_liters": {"type": "float"},
                            "customer_rating": {"type": "float"},
                            
                            # Count metrics
                            "total_deliveries": {"type": "integer"},
                            "on_time_deliveries": {"type": "integer"},
                            "active_trucks": {"type": "integer"},
                            "completed_trips": {"type": "integer"},
                            "delay_incidents": {"type": "integer"},
                            "incident_count": {"type": "integer"},
                            
                            # Performance analysis
                            "performance_pct": {"type": "float"},
                            "avg_delivery_time": {"type": "float"},
                            "percentage": {"type": "float"},
                            "avg_delay_minutes": {"type": "float"},
                            
                            # Planning metrics
                            "planned_distance_km": {"type": "float"},
                            "estimated_duration_minutes": {"type": "integer"},
                            "expected_delay_duration": {"type": "integer"}
                        }
                    },
                    "created_at": {"type": "date"}
                }
            }
        }
    
    # CRUD Operations
    async def index_document(self, index: str, doc_id: str, document: Dict[Any, Any]):
        """Index a single document"""
        try:
            document["updated_at"] = datetime.now().isoformat()
            if "created_at" not in document:
                document["created_at"] = datetime.now().isoformat()
            
            response = self.client.index(
                index=index,
                id=doc_id,
                body=document,
                refresh=True
            )
            return response
        except Exception as e:
            logger.error(f"Failed to index document in {index}: {e}")
            raise
    
    async def bulk_index_documents(self, index: str, documents: List[Dict[Any, Any]]):
        """Bulk index multiple documents"""
        try:
            from elasticsearch.helpers import bulk
            
            actions = []
            for doc in documents:
                doc["updated_at"] = datetime.now().isoformat()
                if "created_at" not in doc:
                    doc["created_at"] = datetime.now().isoformat()
                
                # Map index names to correct ID fields
                id_field_map = {
                    "trucks": "truck_id",
                    "inventory": "item_id", 
                    "support_tickets": "ticket_id",
                    "orders": "order_id",
                    "locations": "location_id",
                    "analytics_events": "event_id"
                }
                
                # Get the correct ID field for this index
                id_field = id_field_map.get(index, f"{index[:-1]}_id")
                doc_id = doc.get("id") or doc.get(id_field)
                
                if not doc_id:
                    logger.warning(f"No ID found for document in {index} index. Available fields: {list(doc.keys())}")
                
                action = {
                    "_index": index,
                    "_id": doc_id,
                    "_source": doc
                }
                actions.append(action)
            
            response = bulk(self.client, actions, refresh=True)
            logger.info(f"✅ Bulk indexed {len(documents)} documents to {index}")
            return response
        except Exception as e:
            logger.error(f"Failed to bulk index documents in {index}: {e}")
            raise
    
    async def search_documents(self, index: str, query: Dict[Any, Any], size: int = 100):
        """Search documents in an index"""
        try:
            # Add size to query body if not already present
            if "size" not in query:
                query["size"] = size
            
            response = self.client.search(
                index=index,
                body=query
            )
            return response
        except Exception as e:
            logger.error(f"Failed to search in {index}: {e}")
            raise
    
    async def get_document(self, index: str, doc_id: str):
        """Get a single document by ID"""
        try:
            response = self.client.get(index=index, id=doc_id)
            return response["_source"]
        except Exception as e:
            logger.error(f"Failed to get document {doc_id} from {index}: {e}")
            raise
    
    async def get_all_documents(self, index: str, size: int = 1000):
        """Get all documents from an index"""
        try:
            query = {
                "query": {"match_all": {}},
                "sort": [{"created_at": {"order": "desc"}}]
            }
            response = await self.search_documents(index, query, size)
            return [hit["_source"] for hit in response["hits"]["hits"]]
        except Exception as e:
            logger.error(f"Failed to get all documents from {index}: {e}")
            raise
    
    async def semantic_search(self, index: str, text: str, fields: List[str], size: int = 10):
        """Perform semantic search using semantic_text fields"""
        try:
            query = {
                "query": {
                    "multi_match": {
                        "query": text,
                        "fields": fields,
                        "type": "best_fields"
                    }
                }
            }
            response = await self.search_documents(index, query, size)
            return [hit["_source"] for hit in response["hits"]["hits"]]
        except Exception as e:
            logger.error(f"Failed to perform semantic search in {index}: {e}")
            raise
    
    # Analytics-specific methods
    async def get_time_series_data(self, event_type: str, metric_field: str, time_range: str = "7d"):
        """Get time-series data for analytics charts"""
        try:
            # Calculate date range
            from datetime import datetime, timedelta
            now = datetime.now()
            
            if time_range == "24h":
                start_time = now - timedelta(hours=24)
                interval = "1h"
            elif time_range == "7d":
                start_time = now - timedelta(days=7)
                interval = "1d"
            elif time_range == "30d":
                start_time = now - timedelta(days=30)
                interval = "1d"
            else:  # 90d
                start_time = now - timedelta(days=90)
                interval = "1d"
            
            query = {
                "query": {
                    "bool": {
                        "must": [
                            {"term": {"event_type": event_type}},
                            {"range": {"timestamp": {"gte": start_time.isoformat()}}}
                        ]
                    }
                },
                "aggs": {
                    "time_series": {
                        "date_histogram": {
                            "field": "timestamp",
                            "fixed_interval": interval,
                            "min_doc_count": 0
                        },
                        "aggs": {
                            "avg_metric": {
                                "avg": {"field": f"metrics.{metric_field}"}
                            }
                        }
                    }
                },
                "size": 0
            }
            
            response = await self.search_documents("analytics_events", query)
            buckets = response["aggregations"]["time_series"]["buckets"]
            
            return [
                {
                    "timestamp": bucket["key_as_string"],
                    "value": round(bucket["avg_metric"]["value"] or 0, 2)
                }
                for bucket in buckets
            ]
        except Exception as e:
            logger.error(f"Failed to get time series data: {e}")
            raise
    
    async def get_route_performance_data(self):
        """Get route performance aggregation"""
        try:
            query = {
                "query": {"term": {"event_type": "route_performance"}},
                "aggs": {
                    "routes": {
                        "terms": {"field": "route_name.keyword", "size": 10},
                        "aggs": {
                            "avg_performance": {
                                "avg": {"field": "metrics.performance_pct"}
                            }
                        }
                    }
                },
                "size": 0
            }
            
            response = await self.search_documents("analytics_events", query)
            buckets = response["aggregations"]["routes"]["buckets"]
            
            return [
                {
                    "name": bucket["key"],
                    "performance": round(bucket["avg_performance"]["value"] or 0, 1)
                }
                for bucket in buckets
            ]
        except Exception as e:
            logger.error(f"Failed to get route performance data: {e}")
            raise
    
    async def get_delay_causes_data(self):
        """Get delay causes aggregation"""
        try:
            query = {
                "query": {"term": {"event_type": "delay_cause_analysis"}},
                "aggs": {
                    "causes": {
                        "terms": {"field": "delay_cause.keyword", "size": 10},
                        "aggs": {
                            "avg_percentage": {
                                "avg": {"field": "metrics.percentage"}
                            }
                        }
                    }
                },
                "size": 0
            }
            
            response = await self.search_documents("analytics_events", query)
            buckets = response["aggregations"]["causes"]["buckets"]
            
            return [
                {
                    "name": bucket["key"],
                    "percentage": round(bucket["avg_percentage"]["value"] or 0, 1)
                }
                for bucket in buckets
            ]
        except Exception as e:
            logger.error(f"Failed to get delay causes data: {e}")
            raise
    
    async def get_regional_performance_data(self):
        """Get regional performance aggregation"""
        try:
            query = {
                "query": {"term": {"event_type": "regional_performance"}},
                "aggs": {
                    "regions": {
                        "terms": {"field": "region.keyword", "size": 10},
                        "aggs": {
                            "avg_on_time": {
                                "avg": {"field": "metrics.on_time_percentage"}
                            }
                        }
                    }
                },
                "size": 0
            }
            
            response = await self.search_documents("analytics_events", query)
            buckets = response["aggregations"]["regions"]["buckets"]
            
            return [
                {
                    "name": bucket["key"],
                    "onTimePercentage": round(bucket["avg_on_time"]["value"] or 0, 1)
                }
                for bucket in buckets
            ]
        except Exception as e:
            logger.error(f"Failed to get regional performance data: {e}")
            raise
    
    async def get_current_metrics(self):
        """Get current performance metrics"""
        try:
            query = {
                "query": {"term": {"event_type": "daily_performance"}},
                "sort": [{"timestamp": {"order": "desc"}}],
                "size": 1
            }
            
            response = await self.search_documents("analytics_events", query)
            if response["hits"]["hits"]:
                latest = response["hits"]["hits"][0]["_source"]["metrics"]
                return {
                    "delivery_performance": {
                        "title": "Delivery Performance",
                        "value": f"{latest.get('delivery_performance_pct', 87.5)}%",
                        "change": "+2.3%",
                        "trend": "up"
                    },
                    "average_delay": {
                        "title": "Average Delay", 
                        "value": f"{latest.get('average_delay_minutes', 144)/60:.1f} hrs",
                        "change": "-0.8 hrs",
                        "trend": "down"
                    },
                    "fleet_utilization": {
                        "title": "Fleet Utilization",
                        "value": f"{latest.get('fleet_utilization_pct', 92)}%",
                        "change": "+5%",
                        "trend": "up"
                    },
                    "customer_satisfaction": {
                        "title": "Customer Satisfaction",
                        "value": f"{latest.get('customer_satisfaction', 4.2)}/5",
                        "change": "+0.1",
                        "trend": "up"
                    }
                }
            else:
                raise Exception("No analytics data found")
        except Exception as e:
            logger.error(f"Failed to get current metrics: {e}")
            raise

# Global instance
elasticsearch_service = ElasticsearchService()