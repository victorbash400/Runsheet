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
  LogOut,
  User
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
        backgroundColor: '#f8f8f8',
        width: isCollapsed ? '72px' : '240px',
        borderRight: '1px solid rgba(35,35,35,0.08)'
      }}
    >
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 border rounded-full p-1.5 z-20 transition-all duration-200 shadow-sm"
        style={{ 
          backgroundColor: 'white', 
          borderColor: 'rgba(35,35,35,0.12)', 
          top: '20px' 
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#232323';
          e.currentTarget.style.borderColor = '#232323';
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.borderColor = 'rgba(35,35,35,0.12)';
          const icon = e.currentTarget.querySelector('svg');
          if (icon) icon.style.color = '#232323';
        }}
      >
        <ChevronLeft 
          className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          style={{ color: '#232323' }}
        />
      </button>

      <nav className="p-4 pt-6">
        <ul className="space-y-1.5">
          {menuItems.map((item) => (
            <li key={item.id}>
              <div
                className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start'} px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200`}
                style={{
                  color: activeItem.toLowerCase() === item.id ? 'white' : '#232323',
                  backgroundColor: activeItem.toLowerCase() === item.id ? '#232323' : 'transparent'
                }}
                onMouseEnter={(e) => {
                  if (activeItem.toLowerCase() !== item.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(35,35,35,0.06)';
                  } else {
                    e.currentTarget.style.backgroundColor = '#1a1a1a';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeItem.toLowerCase() !== item.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  } else {
                    e.currentTarget.style.backgroundColor = '#232323';
                  }
                }}
                onClick={() => handleItemClick(item.id)}
                title={isCollapsed ? item.label : ''}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                  <item.icon 
                    className={`w-5 h-5 transition-colors`} 
                    style={{
                      color: activeItem.toLowerCase() === item.id ? 'white' : '#232323'
                    }} 
                  />
                  {!isCollapsed && (
                    <span 
                      className="font-medium text-sm transition-opacity duration-200"
                      style={{ opacity: isCollapsed ? 0 : 1 }}
                    >
                      {item.label}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile - Expanded */}
      <div 
        className={`absolute bottom-4 left-4 right-4 transition-all duration-300 ${isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div 
          className="flex items-center space-x-3 p-3 rounded-lg transition-colors"
          style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}
        >
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#232323' }}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: '#232323' }}>User</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex-shrink-0 transition-all duration-200 p-1.5 rounded-md"
            style={{ color: '#666' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#666';
            }}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Profile - Collapsed */}
      <div 
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${isCollapsed ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
          style={{ backgroundColor: '#232323' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1a1a1a';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#232323';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Logout"
        >
          <User className="w-5 h-5 text-white" />
        </button>
      </div>
    </aside>
  );
}