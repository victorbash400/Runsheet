'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import FleetTracking from '../components/FleetTracking';
import MapView from '../components/MapView';
import AIChat from '../components/AIChat';
import DataUpload from '../components/DataUpload';
import Inventory from '../components/Inventory';
import Orders from '../components/Orders';
import Analytics from '../components/Analytics';
import Support from '../components/Support';
import { Truck } from '../types/api';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('fleet');
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = localStorage.getItem('isAuthenticated');

      if (authStatus === 'true') {
        setIsAuthenticated(true);
        setIsLoading(false);
      } else {
        // Clear any existing auth data
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('userEmail');

        // Redirect to signin
        router.replace('/signin');
        setIsLoading(false);
      }
    };

    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      checkAuth();
    }
  }, [router]);

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMenuNavigation = (item: string) => {
    setActiveMenuItem(item.toLowerCase());
  };

  const handleTruckSelect = (truck: Truck) => {
    setSelectedTruck(truck);
  };

  const handleAIClick = () => {
    setAiChatOpen(true);
  };

  const renderMainContent = () => {
    switch (activeMenuItem) {
      case 'upload-data':
        return (
          <div className="flex-1 p-6 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
              <DataUpload />
            </div>
          </div>
        );

      case 'inventory':
        return (
          <div className="flex-1 p-6 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
              <Inventory />
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="flex-1 p-6 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
              <Orders />
            </div>
          </div>
        );

      case 'fleet':
        return (
          <div className="flex-1 p-6 bg-gray-50">
            <div className="flex gap-6 h-full">
              {/* Fleet Tracking Panel */}
              <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <FleetTracking onTruckSelect={handleTruckSelect} />
              </div>

              {/* Map View */}
              <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <MapView selectedTruck={selectedTruck} />
              </div>
            </div>
          </div>
        );


      case 'analytics':
        return (
          <div className="flex-1 p-6 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
              <Analytics />
            </div>
          </div>
        );

      case 'support':
        return (
          <div className="flex-1 p-6 bg-gray-50">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden">
              <Support />
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center bg-white">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to RUNSHEET</h2>
              <p className="text-gray-500">Select a module from the sidebar to get started</p>
            </div>
          </div>
        );
    }
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render main app if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Full Height (minus top bar) */}
        <Sidebar
          activeItem={activeMenuItem}
          isCollapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          onNavigate={handleMenuNavigation}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ minWidth: 0 }}>
          <Header onAIClick={handleAIClick} />

          <main className="flex-1 flex bg-white relative z-0 overflow-hidden">
            <div className="flex-1 flex bg-white overflow-auto">
              {renderMainContent()}
            </div>
          </main>
        </div>
      </div>

      {/* AI Chat Overlay */}
      <AIChat
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
      />
    </div>
  );
}
