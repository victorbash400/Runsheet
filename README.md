# Runsheet

<div align="center">

[![Powered by Strands SDK](https://img.shields.io/badge/Powered%20by-Strands%20SDK-blue?style=for-the-badge)](https://strandsagents.com)
[![Google Gemini 2.5](https://img.shields.io/badge/Google-Gemini%202.5%20Flash-4285F4?style=for-the-badge&logo=google)](https://cloud.google.com/vertex-ai)
[![Elasticsearch](https://img.shields.io/badge/Elasticsearch-005571?style=for-the-badge&logo=elasticsearch)](https://www.elastic.co/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-4285F4?style=for-the-badge&logo=google-cloud)](https://cloud.google.com/)

**AI-powered logistics monitoring system with real-time fleet tracking, inventory management, and intelligent analytics.**

</div>

## Architecture

```mermaid
graph TB
    subgraph "Frontend (Next.js 15)"
        A[Dashboard] --> B[Fleet Tracking]
        A --> C[Analytics]
        A --> D[Inventory]
        A --> E[Support]
        A --> F[AI Chat]
        A --> G[Data Upload]
    end
    
    subgraph "Backend (FastAPI)"
        H[Main API] --> I[AI Agent]
        H --> J[Data Endpoints]
        I --> K[Search Tools]
        I --> L[Report Tools]
        I --> M[Summary Tools]
    end
    
    subgraph "Data Layer"
        N[Elasticsearch] --> O[Fleet Data]
        N --> P[Orders]
        N --> Q[Inventory]
        N --> R[Support Tickets]
        N --> S[Analytics Events]
    end
    
    subgraph "AI Services"
        T[Google Gemini 2.5] --> I
        U[Strands Framework] --> I
    end
    
    A --> H
    H --> N
    I --> T
```

## Components

### Frontend Structure
```
runsheet/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Main dashboard
│   │   └── signin/page.tsx    # Authentication
│   ├── components/
│   │   ├── AIChat.tsx         # AI assistant
│   │   ├── FleetTracking.tsx  # Fleet management
│   │   ├── Analytics.tsx      # Performance metrics
│   │   ├── MapView.tsx        # Google Maps
│   │   ├── Inventory.tsx      # Stock management
│   │   ├── Orders.tsx         # Order tracking
│   │   └── Support.tsx        # Ticket system
│   ├── services/
│   │   ├── api.ts            # Backend API
│   │   └── mockData.ts       # Test data
│   └── types/
│       └── api.ts            # TypeScript types
```

### Backend Structure
```
Runsheet-backend/
├── main.py                    # FastAPI server
├── Agents/
│   ├── mainagent.py          # AI agent controller
│   └── tools/
│       ├── search_tools.py   # Data search
│       ├── report_tools.py   # Report generation
│       ├── lookup_tools.py   # Data lookup
│       └── summary_tools.py  # Data summaries
├── services/
│   ├── elasticsearch_service.py  # Database layer
│   └── data_seeder.py        # Data management
└── demo-data/                # Sample CSV files
```

### AI Agent Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Chat Interface
    participant A as AI Agent
    participant T as Tools
    participant E as Elasticsearch
    
    U->>C: Send query
    C->>A: Process message
    A->>T: Execute search_fleet_data()
    T->>E: Semantic search
    E->>T: Return results
    T->>A: Formatted data
    A->>C: Stream response
    C->>U: Display results
```

## Technology Stack

**Frontend**
- Next.js 15 (React App Router)
- TypeScript
- Tailwind CSS
- React Google Maps
- Lucide React icons
- React Markdown

**Backend**
- FastAPI (Python)
- Strands AI Framework
- Google Gemini 2.5 Flash
- Elasticsearch
- Python 3.11+

**Infrastructure**
- Elasticsearch Cloud
- Google Cloud Platform
- CORS middleware
- Server-sent events

## Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Elasticsearch Cloud account
- Google Cloud Platform account

### Backend

```bash
cd Runsheet-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:
```
ELASTIC_API_KEY=your_elasticsearch_api_key
ELASTIC_ENDPOINT=your_elasticsearch_endpoint
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
```

Setup Google Cloud credentials:
- Place service account JSON in backend directory
- Update path in `mainagent.py`

Start server:
```bash
python main.py
```

### Frontend

```bash
cd runsheet
npm install
npm run dev
```

The system auto-seeds baseline data on startup. Upload additional data via the Data Upload interface using CSV files from `demo-data/`.

## Usage

### AI Assistant

The system supports natural language queries:

```
"Show me all delayed trucks"
"Find trucks carrying network equipment"
"Search for high priority orders"
"Check diesel fuel levels"
"Generate a performance report"
```

### Available Tools

```mermaid
graph LR
    A[AI Agent] --> B[Search Tools]
    A --> C[Report Tools]
    A --> D[Summary Tools]
    A --> E[Lookup Tools]
    
    B --> F[search_fleet_data]
    B --> G[search_orders]
    B --> H[search_inventory]
    B --> I[search_support_tickets]
    
    C --> J[generate_operations_report]
    C --> K[generate_performance_report]
    C --> L[generate_incident_analysis]
    
    D --> M[get_fleet_summary]
    D --> N[get_inventory_summary]
    D --> O[get_analytics_overview]
    
    E --> P[find_truck_by_id]
    E --> Q[get_all_locations]
```

## Data Models

### Elasticsearch Indices

```mermaid
erDiagram
    TRUCKS {
        string truck_id
        string plate_number
        string driver_name
        string status
        object current_location
        object destination
        datetime estimated_arrival
        object cargo
    }
    
    ORDERS {
        string order_id
        string customer
        string status
        float value
        string items
        string priority
        string truck_id
    }
    
    INVENTORY {
        string item_id
        string name
        string category
        int quantity
        string unit
        string location
        string status
    }
    
    SUPPORT_TICKETS {
        string ticket_id
        string customer
        string issue
        string description
        string priority
        string status
    }
    
    TRUCKS ||--o{ ORDERS : assigned
    ORDERS ||--o{ SUPPORT_TICKETS : related
```

### API Endpoints

```
GET  /api/fleet/trucks          # List all trucks
GET  /api/fleet/summary         # Fleet statistics
GET  /api/orders               # List orders
GET  /api/inventory            # List inventory
GET  /api/support              # List support tickets
POST /api/chat                 # AI assistant
POST /api/upload/csv           # Upload data
```

## Configuration

### Environment Variables

```bash
# Elasticsearch
ELASTIC_API_KEY=your_api_key
ELASTIC_ENDPOINT=https://your-cluster.es.region.aws.found.io

# Google Cloud
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json
```

### AI Agent Configuration

The AI agent uses the Strands framework with Google Gemini 2.5 Flash. Tools are automatically registered and available for natural language queries.

## Development

### Running Tests
```bash
# Backend
cd Runsheet-backend
python -m pytest

# Frontend
cd runsheet
npm test
```

### Building for Production
```bash
# Frontend
npm run build

# Backend
pip install gunicorn
gunicorn main:app
```