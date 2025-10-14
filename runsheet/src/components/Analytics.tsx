import React, { useState, useEffect } from 'react';
import { apiService, AnalyticsMetrics } from '../services/api';

// Google Charts component
declare global {
  interface Window {
    google: any;
  }
}



interface GoogleChartProps {
  chartType: string;
  data: any[];
  options: any;
  width?: string;
  height?: string;
}

function GoogleChart({ chartType, data, options, width = '100%', height = '300px' }: GoogleChartProps) {
  const chartRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.visualization) {
      drawChart();
    } else {
      loadGoogleCharts();
    }
  }, [data, chartType, options]);

  const loadGoogleCharts = () => {
    if (typeof window === 'undefined') return;

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', { packages: ['corechart', 'gauge'] });
      window.google.charts.setOnLoadCallback(drawChart);
    };
    document.head.appendChild(script);
  };

  const drawChart = () => {
    if (!chartRef.current || !window.google?.visualization) return;

    const dataTable = window.google.visualization.arrayToDataTable(data);
    const chart = new window.google.visualization[chartType](chartRef.current);
    chart.draw(dataTable, options);
  };

  return <div ref={chartRef} style={{ width, height }} />;
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('delivery_performance');
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [routePerformance, setRoutePerformance] = useState<any[]>([]);
  const [delayCauses, setDelayCauses] = useState<any[]>([]);
  const [regionalPerformance, setRegionalPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);

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

      // Prepare chart data based on selected metric and time range
      prepareChartData(selectedMetric, timeRange);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const prepareChartData = async (metric: string, range: string) => {
    const metricFieldMap = {
      delivery_performance: 'delivery_performance_pct',
      average_delay: 'average_delay_minutes',
      fleet_utilization: 'fleet_utilization_pct',
      customer_satisfaction: 'customer_satisfaction'
    };

    const metricField = metricFieldMap[metric as keyof typeof metricFieldMap];
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/analytics/time-series?metric=${metricField}&timeRange=${range}`);
    const result = await response.json();

    setChartData({
      timeSeriesData: [
        ['Time', getMetricLabel(metric)],
        ...result.data.map((point: any) => [new Date(point.timestamp).toLocaleDateString(), point.value])
      ],
      pieChartData: [
        ['Cause', 'Percentage'],
        ...delayCauses.map(cause => [cause.name, cause.percentage])
      ],
      barChartData: [
        ['Route', 'Performance'],
        ...routePerformance.map(route => [route.name, route.performance])
      ]
    });
  };



  const getMetricLabel = (metric: string) => {
    const labels = {
      delivery_performance: 'Performance (%)',
      average_delay: 'Delay (minutes)',
      fleet_utilization: 'Utilization (%)',
      customer_satisfaction: 'Rating (1-5)'
    };
    return labels[metric as keyof typeof labels] || 'Value';
  };

  // Update chart data when metric or time range changes
  useEffect(() => {
    if (metrics && selectedMetric) {
      prepareChartData(selectedMetric, timeRange);
    }
  }, [selectedMetric, timeRange, metrics, delayCauses, routePerformance]);

  const getChartOptions = (type: string) => {
    const baseOptions = {
      backgroundColor: 'transparent',
      legend: { 
        position: 'bottom', 
        textStyle: { fontSize: 12, color: '#374151' },
        alignment: 'center'
      },
      titleTextStyle: { fontSize: 14, bold: true, color: '#111827' },
      hAxis: { 
        textStyle: { fontSize: 11, color: '#6B7280' },
        gridlines: { color: '#F3F4F6', count: 5 },
        baselineColor: '#E5E7EB'
      },
      vAxis: { 
        textStyle: { fontSize: 11, color: '#6B7280' },
        gridlines: { color: '#F3F4F6', count: 5 },
        baselineColor: '#E5E7EB'
      },
      chartArea: { left: 60, top: 20, width: '85%', height: '75%' }
    };

    switch (type) {
      case 'line':
        return {
          ...baseOptions,
          curveType: 'function',
          colors: ['#8B5CF6'], // Purple gradient
          pointSize: 6,
          lineWidth: 3,
          pointShape: 'circle',
          series: {
            0: {
              areaOpacity: 0.1,
              color: '#8B5CF6'
            }
          }
        };
      case 'pie':
        return {
          ...baseOptions,
          colors: ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#06B6D4', '#F97316'],
          pieSliceText: 'percentage',
          pieSliceTextStyle: { fontSize: 11, color: 'white', bold: true },
          is3D: false,
          pieHole: 0.3,
          sliceVisibilityThreshold: 0.02
        };
      case 'bar':
        return {
          ...baseOptions,
          colors: ['#10B981'], // Green gradient
          bar: { groupWidth: '65%' },
          series: {
            0: {
              color: '#10B981'
            }
          }
        };
      default:
        return baseOptions;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white shadow-sm font-medium"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
              📊 Export Report
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

        {/* Key Metrics - Enhanced Grid */}
        {!loading && metrics && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            {Object.entries(metrics).map(([key, metric], index) => {
              const gradients = [
                'from-blue-500 to-blue-600',
                'from-green-500 to-green-600', 
                'from-purple-500 to-purple-600',
                'from-orange-500 to-orange-600'
              ];
              const bgGradients = [
                'from-blue-50 to-blue-100',
                'from-green-50 to-green-100',
                'from-purple-50 to-purple-100', 
                'from-orange-50 to-orange-100'
              ];
              
              return (
                <div
                  key={key}
                  className={`relative p-5 rounded-xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg ${
                    selectedMetric === key
                      ? `bg-gradient-to-br ${bgGradients[index]} border-2 border-opacity-30 ${gradients[index].split(' ')[1].replace('to-', 'border-')} transform scale-105`
                      : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedMetric(key)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 leading-tight">{metric.title}</h3>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      metric.trend === 'up' 
                        ? 'text-green-700 bg-green-100' 
                        : 'text-red-700 bg-red-100'
                    }`}>
                      <svg className={`w-3 h-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                      </svg>
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</div>
                  {selectedMetric === key && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Charts */}
        {!loading && metrics && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Time Series Chart */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-900">
                  {metrics[selectedMetric as keyof typeof metrics].title} Trend
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{timeRange}</span>
              </div>
              <GoogleChart
                chartType="LineChart"
                data={chartData.timeSeriesData}
                options={getChartOptions('line')}
                height="280px"
              />
            </div>

            {/* Delay Causes Pie Chart */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-900">
                  Delay Causes Distribution
                </h3>
              </div>
              <GoogleChart
                chartType="PieChart"
                data={chartData.pieChartData}
                options={getChartOptions('pie')}
                height="280px"
              />
            </div>
          </div>
        )}

        {/* Route Performance Bar Chart */}
        {!loading && chartData && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-900">
                Route Performance Comparison
              </h3>
            </div>
            <GoogleChart
              chartType="ColumnChart"
              data={chartData.barChartData}
              options={getChartOptions('bar')}
              height="320px"
            />
          </div>
        )}

        {/* Additional Analytics Charts */}
        {!loading && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Fleet Utilization Gauge */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-900">Fleet Utilization</h3>
              </div>
              <GoogleChart
                chartType="Gauge"
                data={[
                  ['Label', 'Value'],
                  ['Utilization', metrics?.fleet_utilization ? parseFloat(metrics.fleet_utilization.value.replace('%', '')) : 92]
                ]}
                options={{
                  width: '100%',
                  height: 220,
                  redFrom: 0,
                  redTo: 25,
                  yellowFrom: 25,
                  yellowTo: 75,
                  greenFrom: 75,
                  greenTo: 100,
                  minorTicks: 5,
                  majorTicks: ['0', '25', '50', '75', '100'],
                  animation: { duration: 1000, easing: 'out' }
                }}
              />
            </div>

            {/* Customer Satisfaction Gauge */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-900">Customer Satisfaction</h3>
              </div>
              <GoogleChart
                chartType="Gauge"
                data={[
                  ['Label', 'Value'],
                  ['Rating', metrics?.customer_satisfaction ? parseFloat(metrics.customer_satisfaction.value.split('/')[0]) : 4.2]
                ]}
                options={{
                  width: '100%',
                  height: 220,
                  max: 5,
                  redFrom: 0,
                  redTo: 2,
                  yellowFrom: 2,
                  yellowTo: 3.5,
                  greenFrom: 3.5,
                  greenTo: 5,
                  minorTicks: 5,
                  majorTicks: ['0', '1', '2', '3', '4', '5'],
                  animation: { duration: 1000, easing: 'out' }
                }}
              />
            </div>

            {/* Regional Performance Donut */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-900">Regional Performance</h3>
              </div>
              <GoogleChart
                chartType="PieChart"
                data={[
                  ['Region', 'On-Time %'],
                  ...regionalPerformance.map(region => [region.name, region.onTimePercentage])
                ]}
                options={{
                  ...getChartOptions('pie'),
                  pieHole: 0.4,
                  height: 220,
                  colors: ['#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4'],
                  animation: { duration: 1000, easing: 'out' }
                }}
              />
            </div>
          </div>
        )}

        {/* Smart Performance Insights */}
        {!loading && routePerformance.length > 0 && delayCauses.length > 0 && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-900">Key Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-green-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800">
                    Best route: <span className="text-green-700 font-bold">{routePerformance.sort((a, b) => b.performance - a.performance)[0]?.name}</span> ({routePerformance.sort((a, b) => b.performance - a.performance)[0]?.performance}%)
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-3 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800">
                    Needs attention: <span className="text-red-700 font-bold">{routePerformance.sort((a, b) => a.performance - b.performance)[0]?.name}</span> ({routePerformance.sort((a, b) => a.performance - b.performance)[0]?.performance}%)
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-3 h-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800">
                    Main delay cause: <span className="text-orange-700 font-bold">{delayCauses.sort((a, b) => b.percentage - a.percentage)[0]?.name}</span> ({delayCauses.sort((a, b) => b.percentage - a.percentage)[0]?.percentage}%)
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-800">
                    Fleet utilization: <span className="text-blue-700 font-bold">{metrics?.fleet_utilization?.value || 'N/A'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}