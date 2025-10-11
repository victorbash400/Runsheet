import React, { useState, useEffect } from 'react';

interface Order {
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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Mock data - replace with actual API call
    setTimeout(() => {
      setOrders([
        {
          id: 'ORD-001',
          customer: 'Safaricom Ltd',
          status: 'in_transit',
          value: 125000,
          items: 'Network equipment, cables',
          truckId: 'GI-58A',
          region: 'Nairobi',
          createdAt: '2024-01-14T08:00:00Z',
          deliveryEta: '2024-01-15T14:00:00Z',
          priority: 'high'
        },
        {
          id: 'ORD-002',
          customer: 'Kenya Power',
          status: 'pending',
          value: 89000,
          items: 'Electrical transformers',
          region: 'Mombasa',
          createdAt: '2024-01-15T09:30:00Z',
          deliveryEta: '2024-01-16T16:00:00Z',
          priority: 'medium'
        },
        {
          id: 'ORD-003',
          customer: 'Equity Bank',
          status: 'delivered',
          value: 45000,
          items: 'ATM machines, security equipment',
          truckId: 'MO-84A',
          region: 'Kisumu',
          createdAt: '2024-01-13T10:15:00Z',
          deliveryEta: '2024-01-14T12:00:00Z',
          priority: 'urgent'
        },
        {
          id: 'ORD-004',
          customer: 'Tusker Breweries',
          status: 'in_transit',
          value: 210000,
          items: 'Brewing equipment, containers',
          truckId: 'NA-45B',
          region: 'Nakuru',
          createdAt: '2024-01-14T11:20:00Z',
          deliveryEta: '2024-01-15T18:00:00Z',
          priority: 'medium'
        },
        {
          id: 'ORD-005',
          customer: 'Naivas Supermarket',
          status: 'pending',
          value: 67000,
          items: 'Refrigeration units, shelving',
          region: 'Eldoret',
          createdAt: '2024-01-15T07:45:00Z',
          deliveryEta: '2024-01-16T10:00:00Z',
          priority: 'low'
        }
      ]);
      setLoading(false);
    }, 600);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-50';
      case 'in_transit': return 'text-blue-700 bg-blue-50';
      case 'delivered': return 'text-green-700 bg-green-50';
      case 'cancelled': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-50';
      case 'high': return 'text-orange-700 bg-orange-50';
      case 'medium': return 'text-yellow-700 bg-yellow-50';
      case 'low': return 'text-gray-700 bg-gray-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Order Management</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            New Order
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search orders, customers, items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{orders.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">In Transit:</span>
            <span className="font-semibold text-blue-600">
              {orders.filter(o => o.status === 'in_transit').length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Pending:</span>
            <span className="font-semibold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Delivered:</span>
            <span className="font-semibold text-green-600">
              {orders.filter(o => o.status === 'delivered').length}
            </span>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Order</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Items</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Region</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Priority</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Value</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">ETA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredOrders.map((order) => (
              <tr 
                key={order.id}
                className={`cursor-pointer transition-colors ${
                  selectedOrder?.id === order.id 
                    ? 'bg-blue-50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">{order.id}</div>
                  {order.truckId && (
                    <div className="text-xs text-gray-500">Truck: {order.truckId}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-900">{order.customer}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{order.items}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{order.region}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(order.priority)}`}>
                    {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">
                    KSh {order.value.toLocaleString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {new Date(order.deliveryEta).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric'
                    })}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* Order Details Panel */}
      {selectedOrder && (
        <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Selected Order Details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <span className="ml-2 text-gray-900 font-medium">{selectedOrder.customer}</span>
                </div>
                <div>
                  <span className="text-gray-600">Value:</span>
                  <span className="ml-2 text-gray-900 font-medium">KSh {selectedOrder.value.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-600">Items:</span>
                  <span className="ml-2 text-gray-900">{selectedOrder.items}</span>
                </div>
                <div>
                  <span className="text-gray-600">Region:</span>
                  <span className="ml-2 text-gray-900">{selectedOrder.region}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setSelectedOrder(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}