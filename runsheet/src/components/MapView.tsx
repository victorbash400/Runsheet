import React, { useState, useEffect } from 'react';
import { Truck } from '../types/api';

interface MapViewProps {
  selectedTruck?: Truck | null;
}

export default function MapView({ selectedTruck }: MapViewProps) {
  const [mapMode, setMapMode] = useState<'map' | 'satellite' | 'city'>('map');
  const getMapBackground = () => {
    switch (mapMode) {
      case 'satellite':
        return 'bg-gradient-to-br from-green-100 to-brown-200';
      case 'city':
        return 'bg-gradient-to-br from-gray-100 to-gray-300';
      default:
        return 'bg-gradient-to-br from-blue-100 to-blue-200';
    }
  };

  return (
    <div className="h-full relative overflow-hidden flex flex-col">
      {/* Map Controls */}
      <div className="border-b border-gray-200 p-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['map', 'satellite', 'city'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setMapMode(mode)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors capitalize ${
                  mapMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          
          {selectedTruck && (
            <div className="text-xs text-gray-600">
              Tracking: <span className="font-medium">{selectedTruck.plateNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Map View */}
      <div className={`flex-1 relative overflow-hidden ${getMapBackground()}`}>
        {/* Simulated map paths */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 600">
          {/* Road paths */}
          <path
            d="M50 100 Q200 150 350 200 Q300 300 250 400 Q200 500 150 550"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
            className="opacity-60"
          />
          <path
            d="M100 50 Q250 100 300 250 Q350 350 320 450 Q280 520 200 580"
            stroke="#e5e7eb"
            strokeWidth="6"
            fill="none"
            className="opacity-40"
          />
          
          {/* Selected truck route highlight */}
          {selectedTruck && (
            <path
              d="M100 50 Q250 100 300 250"
              stroke="#3b82f6"
              strokeWidth="4"
              fill="none"
              className="opacity-80"
              strokeDasharray="5,5"
            />
          )}
        </svg>

        {/* Truck markers */}
        <div className="absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2">
          <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
            selectedTruck?.plateNumber === 'GI-58A' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-300' 
              : 'bg-black text-white'
          }`}>
            <span>🚛</span>
            <span>15</span>
          </div>
        </div>

        <div className="absolute top-1/2 right-1/3 transform translate-x-1/2 -translate-y-1/2">
          <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
            selectedTruck?.plateNumber === 'MO-84A' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-300' 
              : 'bg-black text-white'
          }`}>
            <span>🚛</span>
            <span>25</span>
          </div>
        </div>

        <div className="absolute bottom-1/3 left-1/4 transform -translate-x-1/2 translate-y-1/2">
          <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
            selectedTruck?.plateNumber === 'CE-57A' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-300' 
              : 'bg-black text-white'
          }`}>
            <span>🚛</span>
            <span>15</span>
          </div>
        </div>

        <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2">
          <div className={`px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${
            selectedTruck?.plateNumber === 'AL-94J' 
              ? 'bg-blue-600 text-white ring-2 ring-blue-300' 
              : 'bg-black text-white'
          }`}>
            <span>🚛</span>
            <span>25</span>
          </div>
        </div>

        {/* Location markers */}
        <div className="absolute top-20 left-20" title="Nairobi Station">
          <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>
        <div className="absolute top-40 right-32" title="Mombasa Port">
          <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>
        <div className="absolute bottom-32 left-32" title="Kisumu Depot">
          <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg"></div>
        </div>

        {/* Selected truck info panel */}
        {selectedTruck && (
          <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-3 max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{selectedTruck.plateNumber}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedTruck.status === 'on_time' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedTruck.status.replace('_', ' ')}
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-600">
              <p><span className="font-medium">Driver:</span> {selectedTruck.driverName}</p>
              <p><span className="font-medium">Route:</span> {selectedTruck.route.origin.name} → {selectedTruck.route.destination.name}</p>
              <p><span className="font-medium">Distance:</span> {selectedTruck.route.distance} km</p>
              {selectedTruck.cargo && (
                <p><span className="font-medium">Cargo:</span> {selectedTruck.cargo.type}</p>
              )}
            </div>
          </div>
        )}

        {/* Map overlay text */}
        <div className="absolute bottom-4 left-4 text-xs text-gray-500">
          Map data ©2024 | Mode: {mapMode}
        </div>
      </div>
    </div>
  );
}