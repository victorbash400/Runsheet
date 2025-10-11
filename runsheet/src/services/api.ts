import { ApiResponse, Truck, FleetSummary, FleetFilters } from '../types/api';

// Mock API base URL - replace with actual API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Fleet Management
  async getFleetSummary(): Promise<ApiResponse<FleetSummary>> {
    return this.request<FleetSummary>('/fleet/summary');
  }

  async getTrucks(filters?: FleetFilters): Promise<ApiResponse<Truck[]>> {
    const queryParams = filters ? `?${new URLSearchParams(filters as any).toString()}` : '';
    return this.request<Truck[]>(`/fleet/trucks${queryParams}`);
  }

  async getTruckById(id: string): Promise<ApiResponse<Truck>> {
    return this.request<Truck>(`/fleet/trucks/${id}`);
  }

  async updateTruckStatus(id: string, status: string): Promise<ApiResponse<Truck>> {
    return this.request<Truck>(`/fleet/trucks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Real-time updates
  async subscribeToFleetUpdates(callback: (data: Truck[]) => void): Promise<() => void> {
    // WebSocket connection for real-time updates
    const ws = new WebSocket(`${API_BASE_URL.replace('http', 'ws')}/fleet/live`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      callback(data);
    };

    // Return cleanup function
    return () => {
      ws.close();
    };
  }
}

export const apiService = new ApiService();