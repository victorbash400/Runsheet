import React, { useState } from 'react';
import { apiService } from '../services/api';

interface UploadResult {
  status: 'success' | 'error';
  recordCount?: number;
  errors?: string[];
  dataType: string;
  breakdown?: Record<string, number>;
}

export default function DataUpload() {
  const [uploadMethod, setUploadMethod] = useState<'sheets' | 'csv' | 'batch'>('sheets');
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [dataType, setDataType] = useState('orders');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Batch upload options
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['fleet', 'orders']);
  const [batchMode, setBatchMode] = useState<'all' | 'selective'>('selective');
  
  // Temporal data fields
  const [batchId, setBatchId] = useState('afternoon_ops');
  const [operationalTime, setOperationalTime] = useState('14:00');

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

  const handleDemoUpload = async (period: 'afternoon' | 'evening' | 'night') => {
    setUploading(true);
    setResult(null);

    try {
      const batchId = period === 'afternoon' ? 'afternoon_ops' : 
                     period === 'evening' ? 'evening_ops' : 'night_shift';
      const operationalTime = period === 'afternoon' ? '14:00' : 
                             period === 'evening' ? '17:00' : '23:00';
      
      let response;
      
      if (uploadMethod === 'batch') {
        if (batchMode === 'all') {
          // Upload all data types
          response = await apiService.uploadBatchTemporal(batchId, operationalTime);
        } else {
          // Upload selected data types
          response = await apiService.uploadSelectiveTemporal(selectedDataTypes, batchId, operationalTime);
        }
        
        setResult({
          status: 'success',
          recordCount: response.data.recordCount,
          dataType: batchMode === 'all' ? 'all data types' : selectedDataTypes.join(', '),
          breakdown: response.data.breakdown
        });
      } else {
        // Single data type upload (existing behavior)
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
      
      // Update the UI controls to match what was uploaded
      setBatchId(batchId);
      setOperationalTime(operationalTime);
      
    } catch (error) {
      setResult({
        status: 'error',
        errors: [`Failed to simulate ${period} data upload. Please try again.`],
        dataType: uploadMethod === 'batch' ? 'batch' : dataType
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDataTypeToggle = (type: string) => {
    setSelectedDataTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Compact Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Data Upload</h1>
        <p className="text-sm text-gray-600">Import data from Google Sheets or CSV files</p>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Column - Upload Interface */}
        <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
          {/* Upload Method + Data Type - Side by Side */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Method</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setUploadMethod('sheets')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploadMethod === 'sheets'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Google Sheets
                </button>
                <button
                  onClick={() => setUploadMethod('csv')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploadMethod === 'csv'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  CSV File
                </button>
                <button
                  onClick={() => setUploadMethod('batch')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    uploadMethod === 'batch'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Batch Upload
                </button>
              </div>
            </div>

            {uploadMethod !== 'batch' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data Type</label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="orders">Orders</option>
                  <option value="fleet">Fleet</option>
                  <option value="inventory">Inventory</option>
                  <option value="support">Support Tickets</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Mode</label>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBatchMode('all')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        batchMode === 'all'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      All Data Types
                    </button>
                    <button
                      onClick={() => setBatchMode('selective')}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        batchMode === 'selective'
                          ? 'bg-purple-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Select Types
                    </button>
                  </div>
                  
                  {batchMode === 'selective' && (
                    <div className="grid grid-cols-2 gap-2">
                      {['fleet', 'orders', 'inventory', 'support'].map(type => (
                        <label key={type} className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedDataTypes.includes(type)}
                            onChange={() => handleDataTypeToggle(type)}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <span className="text-sm font-medium text-gray-700 capitalize">{type}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Temporal Data Controls */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-3">📊 Temporal Data Settings</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Batch ID</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="afternoon_ops">Afternoon Operations</option>
                  <option value="evening_ops">Evening Operations</option>
                  <option value="night_shift">Night Shift</option>
                  <option value="weekend_ops">Weekend Operations</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">Operational Time</label>
                <select
                  value={operationalTime}
                  onChange={(e) => setOperationalTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="14:00">2:00 PM</option>
                  <option value="17:00">5:00 PM</option>
                  <option value="20:00">8:00 PM</option>
                  <option value="23:00">11:00 PM</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              💡 This simulates data updates from different operational periods (IoT sensors, field reports, etc.)
            </p>
          </div>

          {/* Quick Demo Buttons */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-sm font-semibold text-green-900 mb-3">🚀 Quick Demo</h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => handleDemoUpload('afternoon')}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                📊 Simulate Afternoon Data
              </button>
              <button
                onClick={() => handleDemoUpload('evening')}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                🌅 Simulate Evening Data
              </button>
              <button
                onClick={() => handleDemoUpload('night')}
                disabled={uploading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
              >
                🌙 Simulate Night Shift
              </button>
            </div>
            <p className="text-xs text-green-700 mt-2">
              Click to automatically upload demo data without files (simulates Google Sheets integration)
            </p>
          </div>

          {/* Google Sheets Upload */}
          {uploadMethod === 'sheets' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Sheets URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={sheetsUrl}
                  onChange={(e) => setSheetsUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={uploading}
                />
                <button
                  onClick={handleSheetsUpload}
                  disabled={!sheetsUrl.trim() || uploading}
                  className="px-6 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {uploading ? 'Importing...' : 'Import'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                Sheet must be publicly accessible or shared with the service account
              </p>
            </div>
          )}

          {/* CSV File Upload */}
          {uploadMethod === 'csv' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSV File
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <svg className="w-10 h-10 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Drop CSV file here or click to browse
                </p>
                <p className="text-xs text-gray-500 mb-4">
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
                  className="inline-block px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer font-medium transition-colors"
                >
                  Choose File
                </label>
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm text-blue-900 font-medium">
                  Processing {dataType} data...
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5">
                <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {result && (
            <div className={`p-4 rounded-lg border mb-6 ${
              result.status === 'success'
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              {result.status === 'success' ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-semibold text-green-900">Upload Successful</span>
                  </div>
                  <div className="text-sm text-green-800 mb-3">
                    <p>Successfully imported {result.recordCount} records for {result.dataType}</p>
                    {result.breakdown && (
                      <div className="mt-2 space-y-1">
                        <p className="font-medium">Breakdown:</p>
                        {Object.entries(result.breakdown).map(([type, count]) => (
                          <p key={type} className="ml-2">• {type}: {count} records</p>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setResult(null)}
                    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 font-medium transition-colors"
                  >
                    Upload More
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-semibold text-red-900">Upload Failed</span>
                  </div>
                  {result.errors?.map((error, index) => (
                    <p key={index} className="text-sm text-red-800 mb-1">{error}</p>
                  ))}
                  <button
                    onClick={() => setResult(null)}
                    className="mt-2 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Guidelines and Help */}
        <div className="w-1/2 p-6 bg-gray-50 overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Format Guidelines</h3>
          
          {/* Data Format Guidelines - Enhanced */}
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">Required CSV Columns</h4>
              </div>
              <div className="divide-y divide-gray-200">
                <div className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm mb-1">Orders</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    order_id, customer, region, status, value, items, truck_id, description
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm mb-1">Fleet</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    truck_id, driver, status, route, location, cargo, destination
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm mb-1">Inventory</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    item_id, name, category, quantity, unit, location, status
                  </div>
                </div>
                <div className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-sm mb-1">Support</div>
                  <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
                    ticket_id, customer, issue, description, priority, status
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">Upload Tips</h4>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">CSV Format:</span> Use comma-separated values with headers in the first row
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Google Sheets:</span> Make sure the sheet is publicly accessible or shared
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">File Size:</span> Maximum 10MB per file for optimal performance
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Data Validation:</span> Ensure all required fields are filled before upload
                  </div>
                </div>
              </div>
            </div>

            {/* Sample Data Section */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
              <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900">Sample Data</h4>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">Download sample CSV templates:</p>
                <div className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors">
                    📄 Orders Template
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors">
                    🚛 Fleet Template
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded border border-blue-200 transition-colors">
                    📦 Inventory Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}