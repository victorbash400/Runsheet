# Runsheet

A comprehensive logistics platform for fleet management, inventory tracking, and order management.

## Features

- **Fleet Tracking**: Real-time vehicle monitoring and route optimization
- **Inventory Management**: Track stock levels and manage warehouse operations
- **Order Management**: Process and track customer orders
- **Data Upload**: Import data from various sources
- **Analytics**: Business intelligence and reporting
- **Support System**: Integrated ticketing and customer support

## Tech Stack

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide React Icons

### Backend
- Python
- FastAPI (planned)

## Getting Started

### Frontend Setup
```bash
cd runsheet
npm install
npm run dev
```

### Backend Setup
```bash
cd Runsheet-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

## Project Structure

```
├── runsheet/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
├── Runsheet-backend/        # Python backend
└── .kiro/                   # Kiro IDE configuration
```

## License

MIT License