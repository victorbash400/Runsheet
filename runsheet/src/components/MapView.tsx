import React, { useState } from 'react';

interface MapViewProps {
  selectedTruck?: any | null;
}

export default function MapView({ selectedTruck }: MapViewProps) {
  const [mapMode, setMapMode] = useState<'map' | 'satellite' | 'city'>('map');
  const [showInfo, setShowInfo] = useState(true);
  
  const getMapBackground = () => {
    switch (mapMode) {
      case 'satellite':
        return 'bg-gradient-to-br from-emerald-50 via-green-100 to-amber-50';
      case 'city':
        return 'bg-gradient-to-br from-slate-50 via-gray-100 to-blue-50';
      default:
        return 'bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50';
    }
  };

  return (
    <div className="h-full relative overflow-hidden flex flex-col bg-white">
      {/* Map Controls */}
      <div className="border-b border-gray-200 bg-white p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-200">
            {(['map', 'satellite', 'city'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
                  mapMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          
          {selectedTruck && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <span>Tracking: <span className="font-semibold text-gray-900">{selectedTruck.plateNumber}</span></span>
              </div>
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {showInfo ? 'Hide' : 'Show'} Info
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map View */}
      <div className={`flex-1 relative overflow-hidden ${getMapBackground()} transition-colors duration-300`}>
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-gray-400"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Road paths */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600">
          <defs>
            <linearGradient id="roadGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e5e7eb" />
              <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          
          <path
            d="M50 100 Q200 150 350 200 Q300 300 250 400 Q200 500 150 550"
            stroke="url(#roadGradient)"
            strokeWidth="10"
            fill="none"
            className="opacity-40"
            strokeLinecap="round"
          />
          <path
            d="M50 100 Q200 150 350 200 Q300 300 250 400 Q200 500 150 550"
            stroke="white"
            strokeWidth="6"
            fill="none"
            className="opacity-60"
            strokeLinecap="round"
          />
          
          <path
            d="M100 50 Q250 100 300 250 Q350 350 320 450 Q280 520 200 580"
            stroke="url(#roadGradient)"
            strokeWidth="8"
            fill="none"
            className="opacity-30"
            strokeLinecap="round"
          />
          <path
            d="M100 50 Q250 100 300 250 Q350 350 320 450 Q280 520 200 580"
            stroke="white"
            strokeWidth="5"
            fill="none"
            className="opacity-50"
            strokeLinecap="round"
          />
          
          {/* Selected truck route */}
          {selectedTruck && (
            <>
              <path
                d="M100 50 Q250 100 300 250"
                stroke="#60a5fa"
                strokeWidth="5"
                fill="none"
                className="opacity-30"
                strokeLinecap="round"
              />
              <path
                d="M100 50 Q250 100 300 250"
                stroke="#3b82f6"
                strokeWidth="2"
                fill="none"
                className="opacity-80"
                strokeDasharray="6,6"
                strokeLinecap="round"
              />
            </>
          )}
        </svg>

        {/* Truck markers */}
        <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold flex items-center space-x-1.5 shadow-md transition-all ${
            selectedTruck?.plateNumber === 'GI-58A' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
              : 'bg-gray-900 text-white hover:scale-105'
          }`}>
            <span>🚛</span>
            <span>15</span>
          </div>
        </div>

        <div className="absolute top-1/2 right-1/3 transform translate-x-1/2 -translate-y-1/2">
          <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold flex items-center space-x-1.5 shadow-md transition-all ${
            selectedTruck?.plateNumber === 'MO-84A' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
              : 'bg-gray-900 text-white hover:scale-105'
          }`}>
            <span>🚛</span>
            <span>25</span>
          </div>
        </div>

        <div className="absolute bottom-1/3 left-1/4 transform -translate-x-1/2 translate-y-1/2">
          <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold flex items-center space-x-1.5 shadow-md transition-all ${
            selectedTruck?.plateNumber === 'CE-57A' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
              : 'bg-gray-900 text-white hover:scale-105'
          }`}>
            <span>🚛</span>
            <span>15</span>
          </div>
        </div>

        <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2">
          <div className={`px-2.5 py-1.5 rounded-lg text-sm font-bold flex items-center space-x-1.5 shadow-md transition-all ${
            selectedTruck?.plateNumber === 'AL-94J' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-400' 
              : 'bg-gray-900 text-white hover:scale-105'
          }`}>
            <span>🚛</span>
            <span>25</span>
          </div>
        </div>

        {/* Location markers - simple, no pulse */}
        <div className="absolute top-20 left-20 group" title="Nairobi Station">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform"></div>
        </div>
        
        <div className="absolute top-40 right-32 group" title="Mombasa Port">
          <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform"></div>
        </div>
        
        <div className="absolute bottom-32 left-32 group" title="Kisumu Depot">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg group-hover:scale-110 transition-transform"></div>
        </div>

        {/* Compact info panel with close button */}
        {selectedTruck && showInfo && (
          <div className="absolute top-3 right-3 bg-white rounded-lg shadow-lg p-3 w-64 border border-gray-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-gray-900">{selectedTruck.plateNumber}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  selectedTruck.status === 'on_time' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {selectedTruck.status.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Driver:</span>
                <span className="text-gray-900 font-medium">{selectedTruck.driverName}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Route:</span>
                <span className="text-gray-900 text-right">{selectedTruck.route.origin.name} → {selectedTruck.route.destination.name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-500">Distance:</span>
                <span className="text-gray-900 font-medium">{selectedTruck.route.distance} km</span>
              </div>
              
              {selectedTruck.cargo && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Cargo:</span>
                  <span className="text-gray-900">{selectedTruck.cargo.type}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom overlay */}
        <div className="absolute bottom-3 left-3 bg-white/90 px-2.5 py-1.5 rounded text-xs text-gray-600 shadow-sm">
          Map ©2024 | <span className="capitalize">{mapMode}</span>
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex flex-col space-y-1">
          <button className="w-8 h-8 bg-white rounded shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-gray-700 hover:text-gray-900">
            <span className="text-base font-bold">+</span>
          </button>
          <button className="w-8 h-8 bg-white rounded shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-gray-700 hover:text-gray-900">
            <span className="text-base font-bold">−</span>
          </button>
        </div>
      </div>
    </div>
  );
}