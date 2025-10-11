// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

// Fleet Types
export interface Truck {
  id: string;
  plateNumber: string;
  driverId: string;
  driverName: string;
  currentLocation: Location;
  destination: Location;
  route: Route;
  status: TruckStatus;
  estimatedArrival: string;
  lastUpdate: string;
  cargo?: CargoInfo;
}

export interface Location {
  id: string;
  name: string;
  type: 'station' | 'warehouse' | 'depot';
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
}

export interface Route {
  id: string;
  origin: Location;
  destination: Location;
  waypoints: Location[];
  distance: number; // in km
  estimatedDuration: number; // in minutes
  actualDuration?: number;
}

export interface CargoInfo {
  type: string;
  weight: number;
  volume: number;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export type TruckStatus = 'on_time' | 'delayed' | 'stopped' | 'loading' | 'unloading' | 'maintenance';

// Fleet Tracking
export interface FleetSummary {
  totalTrucks: number;
  activeTrucks: number;
  onTimeTrucks: number;
  delayedTrucks: number;
  averageDelay: number; // in minutes
}

// Map Types
export interface MapMarker {
  id: string;
  type: 'truck' | 'location' | 'incident';
  position: {
    lat: number;
    lng: number;
  };
  data: any;
}

// Filter and Search
export interface FleetFilters {
  status?: TruckStatus[];
  route?: string[];
  driver?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
}