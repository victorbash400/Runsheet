# Temporal Data Implementation

## Overview
The Runsheet Logistics Platform now supports temporal data management, allowing real-time operational updates throughout the day. This simulates how logistics systems handle data from IoT devices, field reports, and external systems.

## Architecture

### Backend Changes

#### Data Seeder (`services/data_seeder.py`)
- **New Method:** `seed_baseline_data()` - Creates morning operations baseline
- **New Method:** `upsert_batch_data()` - Handles temporal data updates
- **Temporal Metadata:** All documents now include:
  - `batch_id`: Identifies data source/period
  - `operational_time`: Business time the data represents
  - `ingestion_timestamp`: When data was loaded
  - `data_version`: Version tracking for updates

#### API Endpoints (`main.py`)
- **POST `/api/upload/csv`** - Upload CSV with temporal metadata
- **POST `/api/upload/sheets`** - Upload from Google Sheets with temporal metadata
- **Data Conversion:** Automatic CSV-to-document transformation
- **Demo Data Generation:** Simulated Google Sheets data for demo

#### Elasticsearch Service
- **Upsert Logic:** Updates existing documents, inserts new ones
- **Temporal Queries:** Time-based data retrieval
- **Metadata Indexing:** Temporal fields are searchable

### Frontend Changes

#### DataUpload Component (`components/DataUpload.tsx`)
- **Temporal Controls:** Batch ID and operational time selectors
- **Demo Buttons:** Quick simulation of afternoon/evening data
- **Enhanced UI:** Visual indicators for temporal data settings
- **Real-time Feedback:** Upload progress and results

#### API Service (`services/api.ts`)
- **New Methods:** `uploadTemporalCSV()` and `uploadTemporalSheets()`
- **Backward Compatibility:** Legacy upload methods preserved
- **Temporal Metadata:** Batch and time information in requests

## Data Flow

### 1. Morning Baseline
```
System Startup → seed_baseline_data() → Elasticsearch
- All trucks on time
- Full inventory
- Minimal support tickets
```

### 2. Afternoon Updates
```
CSV Upload → convert_csv_row_to_document() → upsert_batch_data() → Elasticsearch
- Truck delays from traffic
- Inventory consumption
- New support tickets
```

### 3. Evening Updates
```
Sheets Simulation → generate_demo_sheets_data() → upsert_batch_data() → Elasticsearch
- Order completions
- New bookings
- Shift changes
```

## Demo Data Structure

### Fleet Updates (`afternoon_fleet.csv`)
```csv
truck_id,plate_number,driver_name,status,current_location,destination,estimated_arrival,cargo_type,cargo_description
GI-58A,GI-58A,John Kamau,delayed,Highway A104 - Traffic Jam,Mombasa Port,2024-01-15T17:30:00Z,General Cargo,Network equipment - delayed due to traffic congestion
```

### Inventory Updates (`afternoon_inventory.csv`)
```csv
item_id,name,category,quantity,unit,location,status
INV-001,Diesel Fuel Premium Grade,Fuel,12000,liters,Nairobi Depot,in_stock
INV-002,Heavy Duty Truck Tires,Parts,25,pieces,Mombasa Warehouse,low_stock
```

### Support Tickets (`afternoon_support.csv`)
```csv
ticket_id,customer,issue,description,priority,status
TKT-002,Safaricom Ltd,Delivery delay notification,Truck GI-58A delayed due to traffic congestion...,high,open
```

## Usage

### Reset to Morning Baseline
```bash
cd Runsheet-backend
python cleanup_data.py
```

### Upload Temporal Data (Frontend)
1. Navigate to Data Upload component
2. Select data type (fleet, inventory, orders, support)
3. Choose batch ID (afternoon_ops, evening_ops, etc.)
4. Set operational time (14:00, 17:00, etc.)
5. Upload CSV file or use demo buttons

### Upload Temporal Data (API)
```bash
curl -X POST "http://localhost:8000/api/upload/csv" \
  -F "file=@afternoon_fleet.csv" \
  -F "data_type=fleet" \
  -F "batch_id=afternoon_ops" \
  -F "operational_time=14:00"
```

## AI Agent Integration

The AI agent automatically uses the latest temporal data:

**Before afternoon upload:**
- "Show delayed trucks" → Returns empty or minimal results

**After afternoon upload:**
- "Show delayed trucks" → Returns GI-58A with traffic delay
- "Any inventory alerts?" → Returns low stock items
- "What changed since morning?" → Compares temporal data

## Benefits

### For Demos
- **Real-time Impact:** Immediate visual changes across all components
- **Realistic Scenarios:** Simulates actual logistics operations
- **Interactive Experience:** Audience can see system responsiveness
- **Multiple Data Sources:** Shows integration capabilities

### For Development
- **Temporal Testing:** Easy to test time-based features
- **Data Versioning:** Track changes and rollback if needed
- **Scalable Architecture:** Easy to add new data sources
- **Operational Intelligence:** Foundation for advanced analytics

## Technical Details

### Document Structure
```json
{
  "truck_id": "GI-58A",
  "status": "delayed",
  "batch_id": "afternoon_ops",
  "operational_time": "14:00",
  "ingestion_timestamp": "2024-01-15T14:05:00Z",
  "data_version": "v2",
  "operational_timestamp": "2024-01-15T14:00:00Z"
}
```

### Upsert Logic
- **Same ID + Latest Timestamp:** Updates existing document
- **New ID:** Creates new document
- **Metadata Preservation:** Maintains audit trail
- **Relationship Integrity:** Preserves foreign key relationships

### Performance Considerations
- **Bulk Operations:** Uses Elasticsearch bulk API
- **Efficient Updates:** Only updates changed fields
- **Index Optimization:** Temporal fields are indexed for fast queries
- **Memory Management:** Streams large files instead of loading entirely

## Future Enhancements

### Real-time Streaming
- WebSocket connections for live updates
- Event-driven architecture
- Real-time dashboard updates

### Advanced Analytics
- Temporal trend analysis
- Predictive modeling based on historical patterns
- Anomaly detection in operational data

### Data Sources
- IoT device integration
- GPS tracking systems
- Weather and traffic APIs
- ERP system connectors

---

This temporal data implementation transforms the platform from a static demo to a dynamic operational tool that showcases real-world logistics complexity and system responsiveness.