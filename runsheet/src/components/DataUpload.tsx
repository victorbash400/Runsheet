import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import {
  Upload,
  FileText,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  RotateCcw,
  AlertCircle
} from 'lucide-react';

interface UploadResult {
  status: 'success' | 'error';
  recordCount?: number;
  errors?: string[];
  dataType: string;
  breakdown?: Record<string, number>;
}

interface DemoStatus {
  current_state: string;
  total_trucks: number;
}

export default function DataUpload() {
  const [uploadMethod, setUploadMethod] = useState<'sheets' | 'csv' | 'batch'>('batch');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [dataType, setDataType] = useState('orders');
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [demoStatus, setDemoStatus] = useState<DemoStatus | null>(null);

  // Batch upload options
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['fleet', 'orders', 'inventory', 'support']);
  const [batchMode, setBatchMode] = useState<'all' | 'selective'>('all');

  // Temporal data fields
  const [selectedPeriod, setSelectedPeriod] = useState<'afternoon' | 'evening' | 'night'>('afternoon');
  const [batchId, setBatchId] = useState('afternoon_ops');
  const [operationalTime, setOperationalTime] = useState('14:00');

  useEffect(() => {
    loadDemoStatus();
  }, []);

  const loadDemoStatus = async () => {
    try {
      const response = await apiService.getDemoStatus();
      setDemoStatus({
        current_state: response.current_state,
        total_trucks: response.total_trucks
      });
    } catch (error) {
      console.error('Failed to load demo status:', error);
    }
  };

  const handleSheetsUpload = async () => {
    if (!sheetsUrl.trim()) return;

    setUploading(true);
    setResult(null);

    try {
      const response = await apiService.uploadTemporalSheets(sheetsUrl, dataType, batchId, operationalTime);
      setResult({
        status: 'success',
        recordCount: response.data.recordCount,
        dataType
      });
    } catch (error) {
      setResult({
        status: 'error',
        errors: ['Failed to fetch data from Google Sheets. Please check the URL and permissions.'],
        dataType
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const response = await apiService.uploadTemporalCSV(file, dataType, batchId, operationalTime);
      setResult({
        status: 'success',
        recordCount: response.data.recordCount,
        dataType
      });
    } catch (error) {
      setResult({
        status: 'error',
        errors: ['Failed to process CSV file. Please check the format.'],
        dataType
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        handleFileUpload(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };



  const handleDataTypeToggle = (type: string) => {
    setSelectedDataTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleBatchModeChange = (mode: 'all' | 'selective') => {
    setBatchMode(mode);
    if (mode === 'all') {
      setSelectedDataTypes(['fleet', 'orders', 'inventory', 'support']);
    }
  };

  const handlePeriodSelect = (period: 'afternoon' | 'evening' | 'night') => {
    setSelectedPeriod(period);
    const batchId = period === 'afternoon' ? 'afternoon_ops' :
      period === 'evening' ? 'evening_ops' : 'night_shift';
    const operationalTime = period === 'afternoon' ? '14:00' :
      period === 'evening' ? '17:00' : '23:00';
    setBatchId(batchId);
    setOperationalTime(operationalTime);
  };

  const handleConfirmUpload = async () => {
    if (!confirm(`Upload ${selectedPeriod} data? This will update the current demo state.`)) {
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      let response;

      if (uploadMethod === 'batch') {
        // Always use selective upload - simpler and more reliable
        const dataTypesToUpload = batchMode === 'all' 
          ? ['fleet', 'orders', 'inventory', 'support'] 
          : selectedDataTypes;
          
        response = await apiService.uploadSelectiveTemporal(dataTypesToUpload, batchId, operationalTime);

        setResult({
          status: 'success',
          recordCount: response.data.recordCount,
          dataType: batchMode === 'all' ? 'all data types' : selectedDataTypes.join(', '),
          breakdown: response.data.breakdown
        });
      } else {
        response = await apiService.uploadTemporalSheets(
          'https://demo-sheets-url',
          dataType,
          batchId,
          operationalTime
        );

        setResult({
          status: 'success',
          recordCount: response.data.recordCount,
          dataType
        });
      }

      await loadDemoStatus();

    } catch (error) {
      setResult({
        status: 'error',
        errors: [`Failed to upload ${selectedPeriod} data. Please try again.`],
        dataType: uploadMethod === 'batch' ? 'batch' : dataType
      });
    } finally {
      setUploading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('This will reset all data to morning baseline. Continue?')) {
      return;
    }

    setResetting(true);
    try {
      await apiService.resetDemo();
      await loadDemoStatus();
      setResult({
        status: 'success',
        recordCount: 0,
        dataType: 'Demo reset to morning baseline'
      });
    } catch (error) {
      setResult({
        status: 'error',
        errors: ['Failed to reset demo. Please try again.'],
        dataType: 'reset'
      });
    } finally {
      setResetting(false);
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'morning_baseline': return <Sun className="w-4 h-4" />;
      case 'afternoon': return <Sun className="w-4 h-4" />;
      case 'evening': return <Sunset className="w-4 h-4" />;
      case 'night': return <Moon className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStateLabel = (state: string) => {
    switch (state) {
      case 'morning_baseline': return 'Morning Baseline';
      case 'afternoon': return 'Afternoon Operations';
      case 'evening': return 'Evening Operations';
      case 'night': return 'Night Shift';
      default: return 'Unknown State';
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#232323] mb-1">Data Management</h1>
            <p className="text-gray-500">Simulate temporal data changes and manage demo state</p>
          </div>

          {/* Demo Status and Reset */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl">
              {demoStatus ? (
                <>
                  {getStateIcon(demoStatus.current_state)}
                  <span className="text-sm font-medium text-[#232323]">
                    {getStateLabel(demoStatus.current_state)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({demoStatus.total_trucks} trucks)
                  </span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-500">Loading status...</span>
                </>
              )}
            </div>

            <button
              onClick={handleResetDemo}
              disabled={resetting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-[#232323] hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
            >
              {resetting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              Reset Demo
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Column - Upload Interface */}
        <div className="w-1/2 p-8 border-r border-gray-100 overflow-y-auto">
          {/* Time Period Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-[#232323] mb-4">Select Time Period</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => handlePeriodSelect('afternoon')}
                disabled={uploading}
                className={`flex flex-col items-center gap-3 p-6 border rounded-2xl transition-all disabled:opacity-50 ${selectedPeriod === 'afternoon'
                  ? 'bg-orange-50 border-orange-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Sun className={`w-8 h-8 ${selectedPeriod === 'afternoon' ? 'text-orange-600' : 'text-orange-500'}`} />
                <div className="text-center">
                  <div className="font-medium text-[#232323]">Afternoon</div>
                  <div className="text-sm text-gray-500">2:00 PM Operations</div>
                </div>
              </button>

              <button
                onClick={() => handlePeriodSelect('evening')}
                disabled={uploading}
                className={`flex flex-col items-center gap-3 p-6 border rounded-2xl transition-all disabled:opacity-50 ${selectedPeriod === 'evening'
                  ? 'bg-purple-50 border-purple-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Sunset className={`w-8 h-8 ${selectedPeriod === 'evening' ? 'text-purple-600' : 'text-purple-500'}`} />
                <div className="text-center">
                  <div className="font-medium text-[#232323]">Evening</div>
                  <div className="text-sm text-gray-500">5:00 PM Operations</div>
                </div>
              </button>

              <button
                onClick={() => handlePeriodSelect('night')}
                disabled={uploading}
                className={`flex flex-col items-center gap-3 p-6 border rounded-2xl transition-all disabled:opacity-50 ${selectedPeriod === 'night'
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
              >
                <Moon className={`w-8 h-8 ${selectedPeriod === 'night' ? 'text-blue-600' : 'text-blue-500'}`} />
                <div className="text-center">
                  <div className="font-medium text-[#232323]">Night</div>
                  <div className="text-sm text-gray-500">11:00 PM Shift</div>
                </div>
              </button>
            </div>

            {/* Upload Button */}
            <button
              onClick={handleConfirmUpload}
              disabled={uploading || (batchMode === 'selective' && selectedDataTypes.length === 0)}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#232323] text-white rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Uploading {selectedPeriod} data...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload {selectedPeriod} data
                </>
              )}
            </button>
          </div>

          {/* Upload Method Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#232323] mb-3">Upload Method</label>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                onClick={() => setUploadMethod('batch')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadMethod === 'batch'
                  ? 'bg-white text-[#232323] shadow-sm'
                  : 'text-gray-600 hover:text-[#232323]'
                  }`}
              >
                <Database className="w-4 h-4" />
                Batch Upload
              </button>
              <button
                onClick={() => setUploadMethod('sheets')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadMethod === 'sheets'
                  ? 'bg-white text-[#232323] shadow-sm'
                  : 'text-gray-600 hover:text-[#232323]'
                  }`}
              >
                <FileText className="w-4 h-4" />
                Google Sheets
              </button>
              <button
                onClick={() => setUploadMethod('csv')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${uploadMethod === 'csv'
                  ? 'bg-white text-[#232323] shadow-sm'
                  : 'text-gray-600 hover:text-[#232323]'
                  }`}
              >
                <Upload className="w-4 h-4" />
                CSV File
              </button>
            </div>
          </div>

          {/* Batch Mode Configuration */}
          {uploadMethod === 'batch' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#232323] mb-3">Batch Configuration</label>
              <div className="space-y-4">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => handleBatchModeChange('all')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${batchMode === 'all'
                      ? 'bg-white text-[#232323] shadow-sm'
                      : 'text-gray-600 hover:text-[#232323]'
                      }`}
                  >
                    All Data Types
                  </button>
                  <button
                    onClick={() => handleBatchModeChange('selective')}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${batchMode === 'selective'
                      ? 'bg-white text-[#232323] shadow-sm'
                      : 'text-gray-600 hover:text-[#232323]'
                      }`}
                  >
                    Select Types
                  </button>
                </div>

                {batchMode === 'all' ? (
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-[#232323]">All data types selected:</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Fleet, Orders, Inventory, Support Tickets
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {['fleet', 'orders', 'inventory', 'support'].map(type => (
                      <label key={type} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-gray-300 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedDataTypes.includes(type)}
                          onChange={() => handleDataTypeToggle(type)}
                          className="w-4 h-4 rounded border-gray-300 text-[#232323] focus:ring-2 focus:ring-gray-200"
                        />
                        <span className="text-sm font-medium text-[#232323] capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Single Data Type Selection */}
          {uploadMethod !== 'batch' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#232323] mb-3">Data Type</label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white"
              >
                <option value="orders">Orders</option>
                <option value="fleet">Fleet</option>
                <option value="inventory">Inventory</option>
                <option value="support">Support Tickets</option>
              </select>
            </div>
          )}

          {/* Temporal Settings */}
          <div className="mb-6 p-6 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-[#232323]">Temporal Settings</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch ID</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white"
                >
                  <option value="afternoon_ops">Afternoon Operations</option>
                  <option value="evening_ops">Evening Operations</option>
                  <option value="night_shift">Night Shift</option>
                  <option value="weekend_ops">Weekend Operations</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Operational Time</label>
                <select
                  value={operationalTime}
                  onChange={(e) => setOperationalTime(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white"
                >
                  <option value="14:00">2:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="23:00">11:00 PM</option>
                </select>
              </div>
            </div>
            <div className="flex items-start gap-2 mt-3 p-3 bg-white rounded-xl">
              <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                Simulates data updates from different operational periods including IoT sensors and field reports
              </p>
            </div>
          </div>



          {/* Google Sheets Upload */}
          {uploadMethod === 'sheets' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#232323] mb-3">
                Google Sheets URL
              </label>
              <div className="space-y-3">
                <input
                  type="url"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                  disabled={uploading}
                />
                <button
                  onClick={handleSheetsUpload}
                  disabled={!sheetsUrl.trim() || uploading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#232323] text-white text-sm rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Import from Sheets
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500">
                  Sheet must be publicly accessible or shared with the service account
                </p>
              </div>
            </div>
          )}

          {/* CSV File Upload */}
          {uploadMethod === 'csv' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#232323] mb-3">
                CSV File Upload
              </label>
              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${dragActive
                  ? 'border-gray-400 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm font-medium text-[#232323] mb-1">
                  Drop CSV file here or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-6">
                  Maximum file size: 10MB
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#232323] text-white text-sm rounded-xl hover:bg-gray-800 cursor-pointer font-medium transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Choose File
                </label>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {(uploading || resetting) && (
            <div className="mb-6 p-6 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <RefreshCw className="w-5 h-5 text-gray-600 animate-spin" />
                <span className="text-sm text-[#232323] font-medium">
                  {resetting ? 'Resetting demo data...' : `Processing ${dataType} data...`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#232323] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {result && (
            <div className={`p-6 rounded-2xl mb-6 ${result.status === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
              }`}>
              {result.status === 'success' ? (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <span className="font-semibold text-green-900">Success</span>
                  </div>
                  <div className="text-sm text-green-800 mb-4">
                    <p className="mb-2">Successfully processed {result.recordCount} records for {result.dataType}</p>
                    {result.breakdown && (
                      <div className="space-y-1">
                        <p className="font-medium">Breakdown:</p>
                        {Object.entries(result.breakdown).map(([type, count]) => (
                          <p key={type} className="ml-3">• {type}: {count} records</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setResult(null);
                      loadDemoStatus();
                    }}
                    className="px-6 py-2 bg-green-600 text-white text-sm rounded-xl hover:bg-green-700 font-medium transition-colors"
                  >
                    Continue
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <span className="font-semibold text-red-900">Error</span>
                  </div>
                  <div className="text-sm text-red-800 mb-4">
                    {result.errors?.map((error, index) => (
                      <p key={index} className="mb-1">{error}</p>
                    ))}
                  </div>
                  <button
                    onClick={() => setResult(null)}
                    className="px-6 py-2 bg-red-600 text-white text-sm rounded-xl hover:bg-red-700 font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Guidelines and Help */}
        <div className="w-1/2 p-8 bg-gray-50 overflow-y-auto">
          <h3 className="text-xl font-semibold text-[#232323] mb-6">Data Format Guidelines</h3>

          <div className="space-y-6">
            {/* CSV Format Requirements */}
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-100">
                <h4 className="font-semibold text-[#232323]">Required CSV Columns</h4>
              </div>
              <div className="divide-y divide-gray-100">
                <div className="px-6 py-4">
                  <div className="font-medium text-[#232323] mb-2">Orders</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded-xl">
                    order_id, customer, region, status, value, items, truck_id, description
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="font-medium text-[#232323] mb-2">Fleet</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded-xl">
                    truck_id, driver, status, route, location, cargo, destination
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="font-medium text-[#232323] mb-2">Inventory</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded-xl">
                    item_id, name, category, quantity, unit, location, status
                  </div>
                </div>
                <div className="px-6 py-4">
                  <div className="font-medium text-[#232323] mb-2">Support</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-3 rounded-xl">
                    ticket_id, customer, issue, description, priority, status
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Tips */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h4 className="font-semibold text-[#232323] mb-4">Upload Guidelines</h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-[#232323]">CSV Format:</span> Use comma-separated values with headers in the first row
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-[#232323]">Google Sheets:</span> Ensure the sheet is publicly accessible or properly shared
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-[#232323]">File Size:</span> Maximum 10MB per file for optimal performance
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-[#232323]">Validation:</span> Ensure all required fields are populated before upload
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Templates */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h4 className="font-semibold text-[#232323] mb-4">Sample Templates</h4>
              <p className="text-sm text-gray-600 mb-4">Download CSV templates to get started:</p>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-[#232323] hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors">
                  <FileText className="w-4 h-4" />
                  Orders Template
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-[#232323] hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors">
                  <Database className="w-4 h-4" />
                  Fleet Template
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:text-[#232323] hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors">
                  <Upload className="w-4 h-4" />
                  Inventory Template
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}