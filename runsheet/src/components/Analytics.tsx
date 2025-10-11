import React, { useState } from 'react';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('delivery_performance');

  const metrics = {
    delivery_performance: {
      title: 'Delivery Performance',
      value: '87.5%',
      change: '+2.3%',
      trend: 'up'
    },
    average_delay: {
      title: 'Average Delay',
      value: '2.4 hrs',
      change: '-0.8 hrs',
      trend: 'down'
    },
    fleet_utilization: {
      title: 'Fleet Utilization',
      value: '92%',
      change: '+5%',
      trend: 'up'
    },
    customer_satisfaction: {
      title: 'Customer Satisfaction',
      value: '4.2/5',
      change: '+0.1',
      trend: 'up'
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Compact Header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Key Metrics - Compact Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {Object.entries(metrics).map(([key, metric]) => (
            <div
              key={key}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedMetric === key
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => setSelectedMetric(key)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xs font-medium text-gray-600 leading-tight">{metric.title}</h3>
                <div className={`flex items-center gap-0.5 ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <svg className={`w-3 h-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                  </svg>
                  <span className="text-xs font-medium">{metric.change}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            </div>
          ))}
        </div>

        {/* Chart Placeholder - More Compact */}
        <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            {metrics[selectedMetric as keyof typeof metrics].title} Trend
          </h3>
          <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <div className="text-center">
              <svg className="w-10 h-10 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm text-gray-500">Interactive chart will be displayed here</p>
              <p className="text-xs text-gray-400 mt-1">Showing {timeRange} data</p>
            </div>
          </div>
        </div>

        {/* Insights - Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Routes</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">Nairobi → Mombasa</span>
                <span className="text-sm font-semibold text-green-600">94%</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">Kisumu → Nakuru</span>
                <span className="text-sm font-semibold text-green-600">91%</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">Eldoret → Nairobi</span>
                <span className="text-sm font-semibold text-yellow-600">78%</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-700">Mombasa → Kisumu</span>
                <span className="text-sm font-semibold text-yellow-600">75%</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Delay Causes</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">Traffic Congestion</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-red-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-red-600 w-10 text-right">45%</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">Weather Conditions</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-yellow-600 h-1.5 rounded-full" style={{ width: '28%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-yellow-600 w-10 text-right">28%</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">Vehicle Maintenance</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-orange-600 h-1.5 rounded-full" style={{ width: '18%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-orange-600 w-10 text-right">18%</span>
                </div>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-700">Other</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                    <div className="bg-gray-600 h-1.5 rounded-full" style={{ width: '9%' }}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-10 text-right">9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Performance */}
        <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Regional Performance</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">Nairobi</div>
              <div className="text-xs text-gray-600 mt-1">92% On Time</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">Mombasa</div>
              <div className="text-xs text-gray-600 mt-1">88% On Time</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">Kisumu</div>
              <div className="text-xs text-gray-600 mt-1">85% On Time</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-gray-900">Eldoret</div>
              <div className="text-xs text-gray-600 mt-1">81% On Time</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}