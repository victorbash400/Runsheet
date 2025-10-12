# Elasticsearch Data Structure for Runsheet Logistics Platform

## Overview
This document defines the Elasticsearch indices and mappings required to support the Runsheet logistics platform frontend components. The data will be sourced from Google Sheets and CSV uploads through the DataUpload component.

## Frontend Components Analysis

### 1. Fleet Tracking Component
**Data Requirements:**
- Real-time truck locations and status
- Driver information
- Route details with waypoints
- Cargo information
- Estimated arrival times
- Fleet summary statistics

### 2. Map View Component
**Data Requirements:**
- Truck positions (lat/lng coordinates)
- Location markers (stations, warehouses, depots)
- Route paths and waypoints
- Real-time position updates

### 3. Orders Component
**Data Requirements:**
- Order details and status tracking
- Customer information
- Item descriptions and values
- Delivery regions and ETAs
- Priority levels
- Truck assignments

### 4. Inventory Component
**Data Requirements:**
- Item catalog with quantities
- Location-based inventory
- Stock status (in_stock, low_stock, out_of_stock)
- Categories and units
- Last updated timestamps

### 5. Analytics Component
**Data Requirements:**
- Performance metrics aggregations
- Time-series data for trends
- Regional performance statistics
- Delay cause analysis
- Route performance data

### 6. Support Component
**Data Requirements:**
- Support ticket management
- Customer issue tracking
- Priority and status workflows
- Assignment tracking
- Related order linkage

## Elasticsearch Index Structure

### Index 1: `trucks`
**Purpose:** Store fleet vehicle information and real-time status

```json
{
  "mappings": {
    "properties": {
      "truck_id": { "type": "keyword" },
      "plate_number": { "type": "keyword" },
      "driver_id": { "type": "keyword" },
      "driver_name": { "type": "text" },
      "current_location": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "text" },
          "type": { "type": "keyword" },
          "coordinates": { "type": "geo_point" },
          "address": { "type": "text" }
        }
      },
      "destination": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "text" },
          "type": { "type": "keyword" },
          "coordinates": { "type": "geo_point" },
          "address": { "type": "text" }
        }
      },
      "route": {
        "properties": {
          "id": { "type": "keyword" },
          "origin_id": { "type": "keyword" },
          "destination_id": { "type": "keyword" },
          "waypoints": { "type": "geo_point" },
          "distance_km": { "type": "float" },
          "estimated_duration_minutes": { "type": "integer" },
          "actual_duration_minutes": { "type": "integer" }
        }
      },
      "status": { "type": "keyword" },
      "estimated_arrival": { "type": "date" },
      "last_update": { "type": "date" },
      "cargo": {
        "properties": {
          "type": { "type": "keyword" },
          "weight_kg": { "type": "float" },
          "volume_m3": { "type": "float" },
          "description": { "type": "text" },
          "priority": { "type": "keyword" }
        }
      },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

### Index 2: `locations`
**Purpose:** Store depot, warehouse, and station information

```json
{
  "mappings": {
    "properties": {
      "location_id": { "type": "keyword" },
      "name": { "type": "text" },
      "type": { "type": "keyword" },
      "coordinates": { "type": "geo_point" },
      "address": { "type": "text" },
      "region": { "type": "keyword" },
      "capacity": { "type": "integer" },
      "operating_hours": {
        "properties": {
          "open": { "type": "keyword" },
          "close": { "type": "keyword" },
          "timezone": { "type": "keyword" }
        }
      },
      "contact_info": {
        "properties": {
          "phone": { "type": "keyword" },
          "email": { "type": "keyword" },
          "manager": { "type": "text" }
        }
      },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

### Index 3: `orders`
**Purpose:** Store order information and delivery tracking

```json
{
  "mappings": {
    "properties": {
      "order_id": { "type": "keyword" },
      "customer": { "type": "text" },
      "customer_id": { "type": "keyword" },
      "status": { "type": "keyword" },
      "value": { "type": "float" },
      "currency": { "type": "keyword" },
      "items": { "type": "text" },
      "item_count": { "type": "integer" },
      "truck_id": { "type": "keyword" },
      "region": { "type": "keyword" },
      "priority": { "type": "keyword" },
      "pickup_location": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "text" },
          "coordinates": { "type": "geo_point" },
          "address": { "type": "text" }
        }
      },
      "delivery_location": {
        "properties": {
          "id": { "type": "keyword" },
          "name": { "type": "text" },
          "coordinates": { "type": "geo_point" },
          "address": { "type": "text" }
        }
      },
      "created_at": { "type": "date" },
      "delivery_eta": { "type": "date" },
      "delivered_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

### Index 4: `inventory`
**Purpose:** Store inventory items and stock levels

```json
{
  "mappings": {
    "properties": {
      "item_id": { "type": "keyword" },
      "name": { "type": "text" },
      "category": { "type": "keyword" },
      "quantity": { "type": "integer" },
      "unit": { "type": "keyword" },
      "location_id": { "type": "keyword" },
      "location_name": { "type": "text" },
      "status": { "type": "keyword" },
      "min_stock_level": { "type": "integer" },
      "max_stock_level": { "type": "integer" },
      "unit_cost": { "type": "float" },
      "supplier": { "type": "text" },
      "supplier_id": { "type": "keyword" },
      "last_restocked": { "type": "date" },
      "expiry_date": { "type": "date" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" }
    }
  }
}
```

### Index 5: `support_tickets`
**Purpose:** Store customer support tickets and issue tracking

```json
{
  "mappings": {
    "properties": {
      "ticket_id": { "type": "keyword" },
      "customer": { "type": "text" },
      "customer_id": { "type": "keyword" },
      "issue": { "type": "text" },
      "description": { "type": "text" },
      "priority": { "type": "keyword" },
      "status": { "type": "keyword" },
      "category": { "type": "keyword" },
      "assigned_to": { "type": "keyword" },
      "assigned_to_name": { "type": "text" },
      "related_order_id": { "type": "keyword" },
      "related_truck_id": { "type": "keyword" },
      "resolution": { "type": "text" },
      "created_at": { "type": "date" },
      "updated_at": { "type": "date" },
      "resolved_at": { "type": "date" },
      "closed_at": { "type": "date" }
    }
  }
}
```

### Index 6: `analytics_events`
**Purpose:** Store time-series data for analytics and reporting

```json
{
  "mappings": {
    "properties": {
      "event_id": { "type": "keyword" },
      "event_type": { "type": "keyword" },
      "timestamp": { "type": "date" },
      "truck_id": { "type": "keyword" },
      "order_id": { "type": "keyword" },
      "location_id": { "type": "keyword" },
      "region": { "type": "keyword" },
      "metrics": {
        "properties": {
          "delivery_time_minutes": { "type": "integer" },
          "delay_minutes": { "type": "integer" },
          "distance_km": { "type": "float" },
          "fuel_consumed": { "type": "float" },
          "customer_rating": { "type": "float" }
        }
      },
      "delay_causes": { "type": "keyword" },
      "weather_conditions": { "type": "keyword" },
      "traffic_level": { "type": "keyword" },
      "created_at": { "type": "date" }
    }
  }
}
```

## Data Upload Mapping from Sheets/CSV

### CSV Column Mappings

#### Orders CSV Format:
```
order_id,customer,region,status,value,items,truck_id,description,priority,delivery_eta
```

#### Fleet CSV Format:
```
truck_id,driver,status,route,location,cargo,destination,plate_number,coordinates
```

#### Inventory CSV Format:
```
item_id,name,category,quantity,unit,location,status,min_level,supplier
```

#### Support CSV Format:
```
ticket_id,customer,issue,description,priority,status,assigned_to,related_order
```

## API Endpoints for Frontend Integration

### Fleet Tracking Endpoints:
- `GET /api/trucks` - Get all trucks with filters
- `GET /api/trucks/{id}` - Get specific truck details
- `GET /api/fleet/summary` - Get fleet summary statistics
- `WebSocket /api/fleet/live` - Real-time truck updates

### Orders Endpoints:
- `GET /api/orders` - Get orders with filters
- `GET /api/orders/{id}` - Get specific order details
- `POST /api/orders` - Create new order
- `PATCH /api/orders/{id}` - Update order status

### Inventory Endpoints:
- `GET /api/inventory` - Get inventory items with filters
- `GET /api/inventory/summary` - Get inventory statistics
- `POST /api/inventory` - Add inventory item
- `PATCH /api/inventory/{id}` - Update inventory levels

### Support Endpoints:
- `GET /api/support/tickets` - Get support tickets with filters
- `GET /api/support/tickets/{id}` - Get specific ticket details
- `POST /api/support/tickets` - Create new ticket
- `PATCH /api/support/tickets/{id}` - Update ticket status

### Analytics Endpoints:
- `GET /api/analytics/performance` - Get performance metrics
- `GET /api/analytics/trends` - Get time-series data
- `GET /api/analytics/regional` - Get regional statistics

## Real-time Data Requirements

### WebSocket Events:
1. **Truck Location Updates** - Every 30 seconds
2. **Order Status Changes** - Immediate
3. **Inventory Level Changes** - Immediate
4. **Support Ticket Updates** - Immediate

### Elasticsearch Refresh Strategy:
- **trucks**: Near real-time (1s refresh)
- **orders**: Near real-time (1s refresh)
- **inventory**: Real-time (immediate refresh)
- **support_tickets**: Real-time (immediate refresh)
- **analytics_events**: 30s refresh
- **locations**: 5m refresh (static data)

## Data Ingestion Pipeline

### Google Sheets Integration:
1. **Authentication**: Service account with read access
2. **Polling**: Every 5 minutes for changes
3. **Change Detection**: Compare timestamps/checksums
4. **Batch Processing**: Process changes in batches of 100

### CSV Upload Processing:
1. **Validation**: Schema validation against expected format
2. **Transformation**: Map CSV columns to Elasticsearch fields
3. **Deduplication**: Check for existing records
4. **Indexing**: Bulk index to appropriate Elasticsearch index

### Data Quality Checks:
- Required field validation
- Data type validation
- Coordinate validation for geo_point fields
- Date format validation
- Enum value validation for status fields

## Performance Considerations

### Index Settings:
```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1,
    "refresh_interval": "1s",
    "index.mapping.total_fields.limit": 2000
  }
}
```

### Query Optimization:
- Use filters instead of queries where possible
- Implement proper field mappings for sorting
- Use aggregations for analytics data
- Implement caching for frequently accessed data

### Monitoring:
- Track query performance
- Monitor index size and growth
- Set up alerts for data ingestion failures
- Monitor real-time update latency

This structure provides a comprehensive foundation for feeding all frontend components with the required data from Elasticsearch, sourced from Google Sheets and CSV uploads.