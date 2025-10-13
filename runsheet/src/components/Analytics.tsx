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
      legend: { position: 'bottom', textStyle: { fontSize: 12 } },
      titleTextStyle: { fontSize: 14, bold: true },
      hAxis: { textStyle: { fontSize: 11 } },
      vAxis: { textStyle: { fontSize: 11 } }
    };

    switch (type) {
      case 'line':
        return {
          ...baseOptions,
          curveType: 'function',
          colors: ['#3B82F6'],
          pointSize: 4,
          lineWidth: 2
        };
      case 'pie':
        return {
          ...baseOptions,
          colors: ['#EF4444', '#F59E0B', '#10B981', '#6B7280'],
          pieSliceText: 'percentage'
        };
      case 'bar':
        return {
          ...baseOptions,
          colors: ['#3B82F6'],
          bar: { groupWidth: '75%' }
        };
      default:
        return baseOptions;
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
                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedMetric === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                onClick={() => setSelectedMetric(key)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xs font-medium text-gray-600 leading-tight">{metric.title}</h3>
                  <div className={`flex items-center gap-0.5 ${metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
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

        {/* Interactive Charts */}
        {!loading && metrics && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Time Series Chart */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {metrics[selectedMetric as keyof typeof metrics].title} Trend ({timeRange})
              </h3>
              <GoogleChart
                chartType="LineChart"
                data={chartData.timeSeriesData}
                options={getChartOptions('line')}
                height="250px"
              />
            </div>

            {/* Delay Causes Pie Chart */}
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Delay Causes Distribution
              </h3>
              <GoogleChart
                chartType="PieChart"
                data={chartData.pieChartData}
                options={getChartOptions('pie')}
                height="250px"
              />
            </div>
          </div>
        )}

        {/* Route Performance Bar Chart */}
        {!loading && chartData && (
          <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Route Performance Comparison
            </h3>
            <GoogleChart
              chartType="ColumnChart"
              data={chartData.barChartData}
              options={getChartOptions('bar')}
              height="300px"
            />
          </div>
        )}

        {/* Additional Analytics Charts */}
        {!loading && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {/* Fleet Utilization Gauge */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Fleet Utilization</h3>
              <GoogleChart
                chartType="Gauge"
                data={[
                  ['Label', 'Value'],
                  ['Utilization', metrics?.fleet_utilization ? parseFloat(metrics.fleet_utilization.value.replace('%', '')) : 92]
                ]}
                options={{
                  width: '100%',
                  height: 200,
                  redFrom: 0,
                  redTo: 25,
                  yellowFrom: 25,
                  yellowTo: 75,
                  greenFrom: 75,
                  greenTo: 100,
                  minorTicks: 5
                }}
              />
            </div>

            {/* Customer Satisfaction Gauge */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Satisfaction</h3>
              <GoogleChart
                chartType="Gauge"
                data={[
                  ['Label', 'Value'],
                  ['Rating', metrics?.customer_satisfaction ? parseFloat(metrics.customer_satisfaction.value.split('/')[0]) : 4.2]
                ]}
                options={{
                  width: '100%',
                  height: 200,
                  max: 5,
                  redFrom: 0,
                  redTo: 2,
                  yellowFrom: 2,
                  yellowTo: 3.5,
                  greenFrom: 3.5,
                  greenTo: 5,
                  minorTicks: 5
                }}
              />
            </div>

            {/* Regional Performance Donut */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Regional Performance</h3>
              <GoogleChart
                chartType="PieChart"
                data={[
                  ['Region', 'On-Time %'],
                  ...regionalPerformance.map(region => [region.name, region.onTimePercentage])
                ]}
                options={{
                  ...getChartOptions('pie'),
                  pieHole: 0.4,
                  height: 200,
                  colors: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
                }}
              />
            </div>
          </div>
        )}

        {/* Smart Performance Insights */}
        {!loading && routePerformance.length > 0 && delayCauses.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Best route: {routePerformance.sort((a, b) => b.performance - a.performance)[0]?.name} ({routePerformance.sort((a, b) => b.performance - a.performance)[0]?.performance}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Needs attention: {routePerformance.sort((a, b) => a.performance - b.performance)[0]?.name} ({routePerformance.sort((a, b) => a.performance - b.performance)[0]?.performance}%)
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Main delay cause: {delayCauses.sort((a, b) => b.percentage - a.percentage)[0]?.name} ({delayCauses.sort((a, b) => b.percentage - a.percentage)[0]?.percentage}%)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-700">
                    Fleet utilization: {metrics?.fleet_utilization?.value || 'N/A'}
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