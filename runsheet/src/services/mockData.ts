import { Truck, FleetSummary, Location, Route } from '../types/api';

// Mock locations
const locations: Location[] = [
  {
    id: 'nairobi-station',
    name: 'Nairobi Station',
    type: 'station',
    coordinates: { lat: -1.2921, lng: 36.8219 },
    address: 'Nairobi, Kenya'
  },
  {
    id: 'mombasa-port',
    name: 'Mombasa Port',
    type: 'station',
    coordinates: { lat: -4.0435, lng: 39.6682 },
    address: 'Mombasa, Kenya'
  },
  {
    id: 'kisumu-depot',
    name: 'Kisumu Depot',
    type: 'depot',
    coordinates: { lat: -0.0917, lng: 34.7680 },
    address: 'Kisumu, Kenya'
  },
  {
    id: 'kinara-warehouse',
    name: 'Kinara Warehouse',
    type: 'warehouse',
    coordinates: { lat: -1.3733, lng: 36.7516 },
    address: 'Kinara, Kenya'
  }
];

// Mock routes
const routes: Route[] = [
  {
    id: 'kisumu-mombasa',
    origin: locations[2],
    destination: locations[1],
    waypoints: [locations[0]],
    distance: 580,
    estimatedDuration: 480
  }
];

// Mock truck data
export const mockTrucks: Truck[] = [
  {
    id: 'GI-58A',
    plateNumber: 'GI-58A',
    driverId: 'driver-001',
    driverName: 'John Kamau',
    currentLocation: locations[2],
    destination: locations[1],
    route: routes[0],
    status: 'on_time',
    estimatedArrival: '2024-01-15T14:15:00Z',
    lastUpdate: '2024-01-15T12:00:00Z',
    cargo: {
      type: 'General Cargo',
      weight: 15000,
      volume: 45,
      description: 'Mixed goods',
      priority: 'medium'
    }
  },
  {
    id: 'MO-84A',
    plateNumber: 'MO-84A',
    driverId: 'driver-002',
    driverName: 'Mary Wanjiku',
    currentLocation: locations[0],
    destination: locations[3],
    route: routes[0],
    status: 'delayed',
    estimatedArrival: '2024-01-15T16:25:00Z',
    lastUpdate: '2024-01-15T12:05:00Z',
    cargo: {
      type: 'Perishables',
      weight: 8000,
      volume: 25,
      description: 'Fresh produce',
      priority: 'high'
    }
  },
  {
    id: 'CE-57A',
    plateNumber: 'CE-57A',
    driverId: 'driver-003',
    driverName: 'Peter Ochieng',
    currentLocation: locations[2],
    destination: locations[1],
    route: routes[0],
    status: 'delayed',
    estimatedArrival: '2024-01-15T12:25:00Z',
    lastUpdate: '2024-01-15T12:10:00Z'
  },
  {
    id: 'AL-94J',
    plateNumber: 'AL-94J',
    driverId: 'driver-004',
    driverName: 'Grace Mutua',
    currentLocation: locations[1],
    destination: locations[0],
    route: routes[0],
    status: 'delayed',
    estimatedArrival: '2024-01-15T12:25:00Z',
    lastUpdate: '2024-01-15T12:15:00Z'
  },
  {
    id: 'PL-56A',
    plateNumber: 'PL-56A',
    driverId: 'driver-005',
    driverName: 'Samuel Kiprotich',
    currentLocation: locations[0],
    destination: locations[2],
    route: routes[0],
    status: 'delayed',
    estimatedArrival: '2024-01-15T12:25:00Z',
    lastUpdate: '2024-01-15T12:20:00Z'
  },
  {
    id: 'DU-265',
    plateNumber: 'DU-265',
    driverId: 'driver-006',
    driverName: 'Alice Nyong',
    currentLocation: locations[1],
    destination: locations[0],
    route: routes[0],
    status: 'delayed',
    estimatedArrival: '2024-01-15T19:23:00Z',
    lastUpdate: '2024-01-15T12:25:00Z'
  }
];

export const mockFleetSummary: FleetSummary = {
  totalTrucks: mockTrucks.length,
  activeTrucks: mockTrucks.filter(t => ['on_time', 'delayed'].includes(t.status)).length,
  onTimeTrucks: mockTrucks.filter(t => t.status === 'on_time').length,
  delayedTrucks: mockTrucks.filter(t => t.status === 'delayed').length,
  averageDelay: 45
};

// Mock API functions
export const mockApiService = {
  async getFleetSummary() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: mockFleetSummary,
          success: true,
          timestamp: new Date().toISOString()
        });
      }, 500);
    });
  },

  async getTrucks() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          data: mockTrucks,
          success: true,
          timestamp: new Date().toISOString()
        });
      }, 300);
    });
  },

  async getTruckById(id: string) {
    return new Promise(resolve => {
      setTimeout(() => {
        const truck = mockTrucks.find(t => t.id === id);
        resolve({
          data: truck,
          success: !!truck,
          timestamp: new Date().toISOString()
        });
      }, 200);
    });
  }
};