import React from 'react';
import { MessageCircle } from 'lucide-react';

interface HeaderProps {
  onAIClick?: () => void;
}

export default function Header({ onAIClick }: HeaderProps) {
  return (
    <header className="relative bg-white rounded-tl-3xl overflow-hidden">
      {/* Curved background shape */}
      <div 
        className="absolute inset-0 bg-white"
        style={{
          clipPath: 'polygon(0% 0%, 35% 0%, 45% 100%, 55% 100%, 65% 0%, 100% 0%, 100% 100%, 0% 100%)'
        }}
      />
      
      {/* Content */}
      <div className="relative px-6 py-2.5">
        <div className="flex items-center justify-between">
          {/* Logo/Brand - Left side */}
          <div className="flex items-center space-x-3 flex-1">
            <img 
              src="/runsheet_logo.svg" 
              alt="Runsheet Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-2xl font-bold" style={{ color: '#232323' }}>
              Runsheet
            </h1>
          </div>
          
          {/* Spacer for middle contracted area */}
          <div className="flex-1 flex justify-center">
            <div className="w-px"></div>
          </div>
          
          {/* Header Actions - Right side */}
          <div className="flex items-center flex-1 justify-end">
            {/* Chat Button */}
            <button
              onClick={onAIClick}
              className="flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Assistant</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}