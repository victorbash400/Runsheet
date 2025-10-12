import React from 'react';
import { MessageCircle } from 'lucide-react';

interface HeaderProps {
  onAIClick?: () => void;
}

export default function Header({ onAIClick }: HeaderProps) {
  return (
    <header className="bg-white px-6 py-2.5 rounded-tl-3xl">
      <div className="flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-3">
          <img 
            src="/runsheet_logo.svg" 
            alt="Runsheet Logo" 
            className="w-8 h-8"
          />
          <h1 className="text-2xl font-bold" style={{ color: '#232323' }}>
            Runsheet
          </h1>
        </div>
        {/* Header Actions */}
        <div className="flex items-center">
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
    </header>
  );
}