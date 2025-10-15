import React from 'react';
import { HelpCircle } from 'lucide-react';

interface HeaderProps {
  onAIClick?: () => void;
}

export default function Header({ onAIClick }: HeaderProps) {
  return (
    <header className="relative overflow-hidden" style={{ backgroundColor: '#f8f8f8' }}>
      {/* Subtle gradient overlay */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(240,240,240,0.4) 100%)'
        }}
      />
      
      {/* Content */}
      <div className="relative px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#232323' }}>
              <img 
                src="/runsheet_logo.svg" 
                alt="Runsheet Logo" 
                className="w-5 h-5"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#232323' }}>
              Runsheet
            </h1>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onAIClick}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm"
              style={{ 
                color: '#232323',
                backgroundColor: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(35,35,35,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,1)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.8)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img 
                src="/assistant.svg" 
                alt="Support Assistant" 
                className="w-5 h-5"
              />
              <span>Support</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}