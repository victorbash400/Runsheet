import React, { useState, useEffect } from 'react';
import { apiService, SupportTicket } from '../services/api';

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    loadSupportData();
  }, []);

  const loadSupportData = async () => {
    try {
      setLoading(true);
      const response = await apiService.getSupportTickets();
      setTickets(response.data);
    } catch (error) {
      console.error('Failed to load support tickets:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-red-700 bg-red-50';
      case 'in_progress': return 'text-blue-700 bg-blue-50';
      case 'resolved': return 'text-green-700 bg-green-50';
      case 'closed': return 'text-gray-700 bg-gray-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    return status.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.issue.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Tickets List */}
      <div className="flex-1 flex flex-col">
        {/* Compact Header */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900">Support Tickets</h1>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              New Ticket
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search tickets, customers, issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Compact Stats */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">Total:</span>
              <span className="font-semibold text-gray-900">{tickets.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">Open:</span>
              <span className="font-semibold text-red-600">
                {tickets.filter(t => t.status === 'open').length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">In Progress:</span>
              <span className="font-semibold text-blue-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-gray-600">Urgent:</span>
              <span className="font-semibold text-red-600">
                {tickets.filter(t => t.priority === 'urgent').length}
              </span>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Ticket</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Issue</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Priority</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Assigned</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 text-sm">{ticket.id}</div>
                    {ticket.relatedOrder && (
                      <div className="text-xs text-gray-500">Order: {ticket.relatedOrder}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-900">{ticket.customer}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-900">{ticket.issue}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{ticket.description}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700">
                      {ticket.assignedTo || <span className="text-gray-400">Unassigned</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTickets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No support tickets found</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details Panel - Compact */}
      {selectedTicket && (
        <div className="w-80 border-l border-gray-200 bg-gray-50 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Ticket Details</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ticket ID</label>
              <p className="text-sm text-gray-900 font-medium">{selectedTicket.id}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer</label>
              <p className="text-sm text-gray-900">{selectedTicket.customer}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Issue</label>
              <p className="text-sm text-gray-900">{selectedTicket.issue}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <p className="text-sm text-gray-900 leading-relaxed">{selectedTicket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusText(selectedTicket.status)}
                </span>
              </div>
            </div>

            {selectedTicket.assignedTo && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Assigned To</label>
                <p className="text-sm text-gray-900">{selectedTicket.assignedTo}</p>
              </div>
            )}

            {selectedTicket.relatedOrder && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Related Order</label>
                <p className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                  {selectedTicket.relatedOrder}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Created</label>
              <p className="text-sm text-gray-900">
                {new Date(selectedTicket.createdAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 space-y-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Update Status
            </button>
            <button className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Add Comment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}