import { ApiResponse, Truck, FleetSummary, FleetFilters } from '../types/api';

// API base URL - replace with actual API endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Types for other components
export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  lastUpdated: string;
}

export interface Order {
  id: string;
  customer: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  value: number;
  items: string;
  truckId?: string;
  region: string;
  createdAt: string;
  deliveryEta: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

export interface SupportTicket {
  id: string;
  customer: string;
  issue: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  assignedTo?: string;
  relatedOrder?: string;
}

export interface AnalyticsMetrics {
  delivery_performance: { title: string; value: string; change: string; trend: 'up' | 'down' };
  average_delay: { title: string; value: string; change: string; trend: 'up' | 'down' };
  fleet_utilization: { title: string; value: string; change: string; trend: 'up' | 'down' };
  customer_satisfaction: { title: string; value: string; change: string; trend: 'up' | 'down' };
}

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

  // Inventory Management
  async getInventory(): Promise<ApiResponse<InventoryItem[]>> {
    return this.request<InventoryItem[]>('/inventory');
  }

  async getInventoryById(id: string): Promise<ApiResponse<InventoryItem>> {
    return this.request<InventoryItem>(`/inventory/${id}`);
  }

  async updateInventoryItem(id: string, data: Partial<InventoryItem>): Promise<ApiResponse<InventoryItem>> {
    return this.request<InventoryItem>(`/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Orders Management
  async getOrders(): Promise<ApiResponse<Order[]>> {
    return this.request<Order[]>('/orders');
  }

  async getOrderById(id: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${id}`);
  }

  async createOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<ApiResponse<Order>> {
    return this.request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async updateOrderStatus(id: string, status: string): Promise<ApiResponse<Order>> {
    return this.request<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // Support Management
  async getSupportTickets(): Promise<ApiResponse<SupportTicket[]>> {
    return this.request<SupportTicket[]>('/support/tickets');
  }

  async getSupportTicketById(id: string): Promise<ApiResponse<SupportTicket>> {
    return this.request<SupportTicket>(`/support/tickets/${id}`);
  }

  async createSupportTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt'>): Promise<ApiResponse<SupportTicket>> {
    return this.request<SupportTicket>('/support/tickets', {
      method: 'POST',
      body: JSON.stringify(ticket),
    });
  }

  async updateSupportTicket(id: string, data: Partial<SupportTicket>): Promise<ApiResponse<SupportTicket>> {
    return this.request<SupportTicket>(`/support/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Analytics
  async getAnalyticsMetrics(timeRange: string = '7d'): Promise<ApiResponse<AnalyticsMetrics>> {
    return this.request<AnalyticsMetrics>(`/analytics/metrics?timeRange=${timeRange}`);
  }

  async getAnalyticsRoutePerformance(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/analytics/routes');
  }

  async getAnalyticsDelayCauses(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/analytics/delay-causes');
  }

  async getAnalyticsRegionalPerformance(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/analytics/regional');
  }

  // Data Upload - Legacy methods (keeping for compatibility)
  async uploadFromSheets(url: string, dataType: string): Promise<ApiResponse<{ recordCount: number }>> {
    return this.request<{ recordCount: number }>('/data/upload/sheets', {
      method: 'POST',
      body: JSON.stringify({ url, dataType }),
    });
  }

  async uploadCSV(file: File, dataType: string): Promise<ApiResponse<{ recordCount: number }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataType', dataType);

    return this.request<{ recordCount: number }>('/data/upload/csv', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Temporal Data Upload - New methods for demo
  async uploadTemporalCSV(
    file: File, 
    dataType: string, 
    batchId: string, 
    operationalTime: string
  ): Promise<ApiResponse<{ recordCount: number; batch_id: string; operational_time: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('data_type', dataType);
    formData.append('batch_id', batchId);
    formData.append('operational_time', operationalTime);

    return this.request<{ recordCount: number; batch_id: string; operational_time: string }>('/upload/csv', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  async uploadTemporalSheets(
    url: string, 
    dataType: string, 
    batchId: string, 
    operationalTime: string
  ): Promise<ApiResponse<{ recordCount: number; batch_id: string; operational_time: string }>> {
    return this.request<{ recordCount: number; batch_id: string; operational_time: string }>('/upload/sheets', {
      method: 'POST',
      body: JSON.stringify({ 
        data_type: dataType, 
        batch_id: batchId, 
        operational_time: operationalTime,
        sheets_url: url 
      }),
    });
  }

  async uploadBatchTemporal(
    batchId: string, 
    operationalTime: string
  ): Promise<ApiResponse<{ recordCount: number; batch_id: string; operational_time: string; breakdown: Record<string, number> }>> {
    return this.request<{ recordCount: number; batch_id: string; operational_time: string; breakdown: Record<string, number> }>('/upload/batch', {
      method: 'POST',
      body: JSON.stringify({ 
        batch_id: batchId, 
        operational_time: operationalTime
      }),
    });
  }

  async uploadSelectiveTemporal(
    dataTypes: string[],
    batchId: string, 
    operationalTime: string
  ): Promise<ApiResponse<{ recordCount: number; batch_id: string; operational_time: string; breakdown: Record<string, number> }>> {
    return this.request<{ recordCount: number; batch_id: string; operational_time: string; breakdown: Record<string, number> }>('/upload/selective', {
      method: 'POST',
      body: JSON.stringify({ 
        data_types: dataTypes,
        batch_id: batchId, 
        operational_time: operationalTime
      }),
    });
  }

  // Demo Management
  async resetDemo(): Promise<ApiResponse<{ state: string; message: string }>> {
    return this.request<{ state: string; message: string }>('/demo/reset', {
      method: 'POST',
    });
  }

  async getDemoStatus(): Promise<{ current_state: string; total_trucks: number; success: boolean; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/demo/status`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
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