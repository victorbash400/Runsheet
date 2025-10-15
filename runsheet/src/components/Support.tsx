import React, { useState, useEffect } from 'react';
import { apiService, SupportTicket } from '../services/api';
import { Search, Filter, MessageSquare, X } from 'lucide-react';

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#232323] mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading support tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white">
      {/* Tickets List */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-100 px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#232323] rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#232323]">Support Tickets</h1>
              <p className="text-gray-500">Manage customer support requests</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets, customers, issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="pl-10 pr-8 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white min-w-[140px]"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white min-w-[120px]"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="border-b border-gray-100 px-8 py-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-semibold text-[#232323]">{tickets.length}</div>
              <div className="text-sm text-gray-500">Total Tickets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-red-600">
                {tickets.filter(t => t.status === 'open').length}
              </div>
              <div className="text-sm text-gray-500">Open</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-blue-600">
                {tickets.filter(t => t.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-500">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-semibold text-orange-600">
                {tickets.filter(t => t.priority === 'urgent').length}
              </div>
              <div className="text-sm text-gray-500">Urgent</div>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Assigned</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className={`cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? 'bg-gray-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <td className="px-8 py-4">
                    <div className="font-medium text-[#232323]">{ticket.id}</div>
                    {ticket.relatedOrder && (
                      <div className="text-sm text-gray-500">Order: {ticket.relatedOrder}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#232323]">{ticket.customer}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#232323]">{ticket.issue}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{ticket.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700">
                      {ticket.assignedTo || <span className="text-gray-400">Unassigned</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-400">No support tickets found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Details Panel */}
      {selectedTicket && (
        <div className="w-96 border-l border-gray-100 bg-gray-50 flex flex-col">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-[#232323]">Ticket Details</h3>
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-gray-400 hover:text-[#232323] p-2 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Ticket ID</label>
              <p className="text-sm text-[#232323] font-medium">{selectedTicket.id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Customer</label>
              <p className="text-sm text-[#232323]">{selectedTicket.customer}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Issue</label>
              <p className="text-sm text-[#232323]">{selectedTicket.issue}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Description</label>
              <p className="text-sm text-[#232323] leading-relaxed">{selectedTicket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Priority</label>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Status</label>
                <span className={`inline-block px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                  {getStatusText(selectedTicket.status)}
                </span>
              </div>
            </div>

            {selectedTicket.assignedTo && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Assigned To</label>
                <p className="text-sm text-[#232323]">{selectedTicket.assignedTo}</p>
              </div>
            )}

            {selectedTicket.relatedOrder && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Related Order</label>
                <p className="text-sm text-[#232323] hover:text-gray-600 cursor-pointer font-medium">
                  {selectedTicket.relatedOrder}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Created</label>
              <p className="text-sm text-[#232323]">
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
        </div>
      )}
    </div>
  );
}