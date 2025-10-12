import React, { useState, useEffect } from 'react';
import { apiService, AnalyticsMetrics } from '../services/api';

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('delivery_performance');
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [routePerformance, setRoutePerformance] = useState<any[]>([]);
  const [delayCauses, setDelayCauses] = useState<any[]>([]);
  const [regionalPerformance, setRegionalPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [metricsResponse, routesResponse, delayResponse, regionalResponse] = await Promise.all([
        apiService.getAnalyticsMetrics(timeRange),
        apiService.getAnalyticsRoutePerformance(),
        apiService.getAnalyticsDelayCauses(),
        apiService.getAnalyticsRegionalPerformance()
      ]);

      setMetrics(metricsResponse.data);
      setRoutePerformance(routesResponse.data);
      setDelayCauses(delayResponse.data);
      setRegionalPerformance(regionalResponse.data);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
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
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Key Metrics - Compact Grid */}
        {!loading && metrics && (
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

        )}

        {/* Chart Placeholder - More Compact */}
        {!loading && metrics && (
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
        )}

        {/* Insights - Side by Side */}
        {!loading && (
          <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Top Performing Routes</h3>
            <div className="space-y-2">
              {routePerformance.map((route, index) => (
                <div key={index} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{route.name}</span>
                  <span className={`text-sm font-semibold ${route.performance >= 90 ? 'text-green-600' : route.performance >= 80 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {route.performance}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Delay Causes</h3>
            <div className="space-y-2">
              {delayCauses.map((cause, index) => (
                <div key={index} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700">{cause.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full ${cause.percentage >= 40 ? 'bg-red-600' : cause.percentage >= 25 ? 'bg-yellow-600' : cause.percentage >= 15 ? 'bg-orange-600' : 'bg-gray-600'}`}
                        style={{ width: `${cause.percentage}%` }}
                      ></div>
                    </div>
                    <span className={`text-sm font-semibold w-10 text-right ${cause.percentage >= 40 ? 'text-red-600' : cause.percentage >= 25 ? 'text-yellow-600' : cause.percentage >= 15 ? 'text-orange-600' : 'text-gray-600'}`}>
                      {cause.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        )}

        {/* Regional Performance */}
        {!loading && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Regional Performance</h3>
            <div className="grid grid-cols-4 gap-4">
              {regionalPerformance.map((region, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{region.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{region.onTimePercentage}% On Time</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}