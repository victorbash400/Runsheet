import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Package,
  FileText,
  Truck,
  BarChart3,
  HelpCircle,
  ChevronLeft,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeItem?: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onNavigate: (item: string) => void;
}

export default function Sidebar({ activeItem = 'Fleet', isCollapsed, onToggle, onNavigate }: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    // Clear authentication state
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');

    // Redirect to sign-in page
    router.push('/signin');
  };

  const menuItems = [
    { id: 'upload-data', label: 'Upload Data', icon: Upload },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'fleet', label: 'Fleet', icon: Truck },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  const handleItemClick = (itemId: string) => {
    onNavigate(itemId);
  };

  return (
    <aside
      className={`h-full transition-all duration-300 ease-in-out relative flex-shrink-0`}
      style={{
        backgroundColor: '#232323',
        width: isCollapsed ? '64px' : '256px'
      }}
    >
      {/* This creates the visual connection - no curved corner needed since header has rounded-tl-3xl */}

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 border rounded-full p-1 z-20 transition-colors"
        style={{ backgroundColor: '#575757', borderColor: '#404040', top: '60px' }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#404040'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#575757'}
      >
        <ChevronLeft className={`w-4 h-4 text-gray-300 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <div
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeItem.toLowerCase() === item.id ? 'bg-white' : 'text-gray-300 hover:text-white'
                  }`}
                style={{
                  color: activeItem.toLowerCase() === item.id ? '#232323' : undefined,
                  backgroundColor: activeItem.toLowerCase() === item.id ? 'white' : undefined
                }}
                onMouseEnter={(e) => {
                  if (activeItem.toLowerCase() !== item.id) {
                    e.currentTarget.style.backgroundColor = '#575757';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeItem.toLowerCase() !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                onClick={() => handleItemClick(item.id)}
                title={isCollapsed ? item.label : ''}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                  <item.icon className={`w-5 h-5 ${activeItem.toLowerCase() === item.id ? '' : 'text-gray-400'}`} style={{
                    color: activeItem.toLowerCase() === item.id ? '#232323' : undefined
                  }} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      {!isCollapsed && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-black">IM</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Ismall</p>
            <p className="text-xs text-gray-400 truncate">Mohammed</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 flex-shrink-0 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collapsed User Avatar */}
      {isCollapsed && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="Logout"
          >
            <span className="text-sm font-medium" style={{ color: '#232323' }}>IM</span>
          </button>
        </div>
      )}
    </aside>
  );
}