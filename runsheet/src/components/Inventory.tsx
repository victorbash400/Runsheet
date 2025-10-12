import React, { useState, useEffect } from 'react';
import { apiService, InventoryItem } from '../services/api';

export default function Inventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getInventory();
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to load inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'text-green-700 bg-green-50';
      case 'low_stock': return 'text-yellow-700 bg-yellow-50';
      case 'out_of_stock': return 'text-red-700 bg-red-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return status;
    }
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category.toLowerCase() === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(inventory.map(item => item.category.toLowerCase())))];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Inventory Management</h1>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Add Item
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compact Stats */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Total:</span>
            <span className="font-semibold text-gray-900">{inventory.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">In Stock:</span>
            <span className="font-semibold text-green-600">
              {inventory.filter(i => i.status === 'in_stock').length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Low Stock:</span>
            <span className="font-semibold text-yellow-600">
              {inventory.filter(i => i.status === 'low_stock').length}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-600">Out of Stock:</span>
            <span className="font-semibold text-red-600">
              {inventory.filter(i => i.status === 'out_of_stock').length}
            </span>
          </div>
        </div>
      </div>

      {/* Table View */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full">
          <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Item</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Location</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Quantity</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Last Updated</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredInventory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.id}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{item.category}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-700">{item.location}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">
                    {item.quantity.toLocaleString()} {item.unit}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-600">
                    {new Date(item.lastUpdated).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInventory.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>No inventory items found</p>
          </div>
        )}
      </div>
    </div>
  );
}