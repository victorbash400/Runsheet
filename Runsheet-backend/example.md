from elasticsearch import Elasticsearch
client = Elasticsearch(
  "https://runsheet-bc8c7e.es.us-central1.gcp.elastic.cloud:443",
  api_key="MVlWVjNaa0JYUVVqVjFlYjYzWkM6dHVkbzhhVEZKRW5lZXJGdGhOajZ2Zw=="
)
client.indices.create(
  index="search-3jv2",
  mappings={
        "properties": {
            "text": {"type": "semantic_text"}
        }
    }
)