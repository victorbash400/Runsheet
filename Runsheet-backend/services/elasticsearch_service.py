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
                    "metrics": {
                        "properties": {
                            "delivery_time": {"type": "integer"},
                            "delay_minutes": {"type": "integer"},
                            "distance_km": {"type": "float"}
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
                
                action = {
                    "_index": index,
                    "_id": doc.get("id") or doc.get(f"{index[:-1]}_id"),  # Remove 's' from index name
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
            response = self.client.search(
                index=index,
                body=query,
                size=size
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
                },
                "size": size
            }
            response = await self.search_documents(index, query, size)
            return [hit["_source"] for hit in response["hits"]["hits"]]
        except Exception as e:
            logger.error(f"Failed to perform semantic search in {index}: {e}")
            raise

# Global instance
elasticsearch_service = ElasticsearchService()