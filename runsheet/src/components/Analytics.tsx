import React, { useState, useEffect } from 'react';
import { apiService, AnalyticsMetrics } from '../services/api';
import { BarChart3, TrendingUp, Download, Activity } from 'lucide-react';

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
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const response = await fetch(`${API_BASE_URL}/analytics/time-series?metric=${metricField}&timeRange=${range}`);
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
          colors: ['#232323'],
          pointSize: 6,
          lineWidth: 3,
          pointShape: 'circle',
          series: {
            0: {
              areaOpacity: 0.1,
              color: '#232323'
            }
          }
        };
      case 'pie':
        return {
          ...baseOptions,
          colors: ['#232323', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6'],
          pieSliceText: 'percentage',
          pieSliceTextStyle: { fontSize: 11, color: 'white', bold: true },
          is3D: false,
          pieHole: 0.3,
          sliceVisibilityThreshold: 0.02
        };
      case 'bar':
        return {
          ...baseOptions,
          colors: ['#232323'],
          bar: { groupWidth: '65%' },
          series: {
            0: {
              color: '#232323'
            }
          }
        };
      default:
        return baseOptions;
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#232323] rounded-xl flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-[#232323]">Analytics Dashboard</h1>
              <p className="text-gray-500">Performance insights and operational metrics</p>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white font-medium"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
            <button className="bg-[#232323] hover:bg-gray-800 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#232323] mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading analytics...</p>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        {!loading && metrics && (
          <div className="grid grid-cols-4 gap-6 mb-8">
            {Object.entries(metrics).map(([key, metric], index) => {
              return (
                <div
                  key={key}
                  className={`p-6 rounded-2xl cursor-pointer transition-all border ${selectedMetric === key
                      ? 'bg-gray-50 border-[#232323] shadow-sm'
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  onClick={() => setSelectedMetric(key)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600">{metric.title}</h3>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${metric.trend === 'up'
                        ? 'text-green-700 bg-green-50'
                        : 'text-red-700 bg-red-50'
                      }`}>
                      <TrendingUp className={`w-3 h-3 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                      <span>{metric.change}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-semibold text-[#232323] mb-1">{metric.value}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Interactive Charts */}
        {!loading && metrics && chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Time Series Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-[#232323] rounded-full"></div>
                <h3 className="text-lg font-semibold text-[#232323]">
                  {metrics[selectedMetric as keyof typeof metrics].title} Trend
                </h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">{timeRange}</span>
              </div>
              <GoogleChart
                chartType="LineChart"
                data={chartData.timeSeriesData}
                options={getChartOptions('line')}
                height="280px"
              />
            </div>

            {/* Delay Causes Pie Chart */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-[#232323] rounded-full"></div>
                <h3 className="text-lg font-semibold text-[#232323]">
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
          <div className="bg-white rounded-2xl p-6 mb-8 border border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-[#232323] rounded-full"></div>
              <h3 className="text-lg font-semibold text-[#232323]">
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
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-[#232323] rounded-full"></div>
                <h3 className="text-lg font-semibold text-[#232323]">Fleet Utilization</h3>
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
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-[#232323] rounded-full"></div>
                <h3 className="text-lg font-semibold text-[#232323]">Customer Satisfaction</h3>
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
            <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 bg-[#232323] rounded-full"></div>
                <h3 className="text-lg font-semibold text-[#232323]">Regional Performance</h3>
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
                  colors: ['#232323', '#6B7280', '#9CA3AF', '#D1D5DB'],
                  animation: { duration: 1000, easing: 'out' }
                }}
              />
            </div>
          </div>
        )}

        {/* Key Insights */}
        {!loading && routePerformance.length > 0 && delayCauses.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-[#232323]" />
              <h3 className="text-lg font-semibold text-[#232323]">Key Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Best route: <span className="text-[#232323] font-semibold">{routePerformance.sort((a, b) => b.performance - a.performance)[0]?.name}</span> ({routePerformance.sort((a, b) => b.performance - a.performance)[0]?.performance}%)
                  </span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Needs attention: <span className="text-[#232323] font-semibold">{routePerformance.sort((a, b) => a.performance - b.performance)[0]?.name}</span> ({routePerformance.sort((a, b) => a.performance - b.performance)[0]?.performance}%)
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Main delay cause: <span className="text-[#232323] font-semibold">{delayCauses.sort((a, b) => b.percentage - a.percentage)[0]?.name}</span> ({delayCauses.sort((a, b) => b.percentage - a.percentage)[0]?.percentage}%)
                  </span>
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">
                    Fleet utilization: <span className="text-[#232323] font-semibold">{metrics?.fleet_utilization?.value || 'N/A'}</span>
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