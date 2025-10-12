'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your logistics AI assistant. I can help you search orders, track fleet status, analyze delays, and answer questions about your operations. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolStatus, setToolStatus] = useState<string>('');
  const [mode, setMode] = useState<'chat' | 'agent'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const simulateStreamingResponse = async (userMessage: string) => {
    // Mock streaming response based on user input
    let response = '';
    
    if (userMessage.toLowerCase().includes('fleet') || userMessage.toLowerCase().includes('truck')) {
      setToolStatus('🔍 Searching fleet data...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      setToolStatus('');
      response = `I found information about your fleet. Currently, you have 6 trucks in operation:

• **GI-58A**: On time, Kisumu → Mombasa route
• **MO-84A**: Delayed by 2h 25m, Nakuru → Kisumu route  
• **CE-57A**: Delayed by 25m, Kisumu → Mombasa route
• **AL-94J**: Delayed, Malad → Bakaharif route
• **PL-56A**: Delayed, Algia → Lukathing route
• **DU-265**: Delayed by 7h 23m, Malaria → Pikom route

**Summary**: 1 truck on time, 5 trucks delayed. Would you like me to analyze the delay patterns or get more details about specific trucks?`;
    } else if (userMessage.toLowerCase().includes('order') || userMessage.toLowerCase().includes('customer')) {
      setToolStatus('🔍 Searching order database...');
      await new Promise(resolve => setTimeout(resolve, 800));
      setToolStatus('');
      response = `I found recent order activity:

• **ORD-001**: Safaricom Ltd - Network equipment (KSh 125,000) - In Transit
• **ORD-002**: Kenya Power - Electrical transformers (KSh 89,000) - Pending  
• **ORD-003**: Equity Bank - ATM machines (KSh 45,000) - Delivered

**Total Value**: KSh 259,000 across 3 active orders. The Safaricom order is currently on truck GI-58A and should arrive on schedule.`;
    } else if (userMessage.toLowerCase().includes('delay') || userMessage.toLowerCase().includes('late')) {
      setToolStatus('📊 Analyzing delay patterns...');
      await new Promise(resolve => setTimeout(resolve, 1200));
      setToolStatus('');
      response = `**Delay Analysis Results:**

🚨 **Current Status**: 83% of trucks are experiencing delays (5 out of 6)

**Delay Breakdown**:
• Average delay: 2.5 hours
• Longest delay: 7h 23m (DU-265)
• Most affected route: Kisumu → Mombasa (2 trucks delayed)

**Recommendations**:
1. Investigate route conditions on Kisumu-Mombasa corridor
2. Contact drivers of severely delayed trucks (DU-265, MO-84A)
3. Consider rerouting future shipments to avoid bottlenecks

Would you like me to get real-time updates from specific trucks or analyze historical delay patterns?`;
    } else if (userMessage.toLowerCase().includes('inventory') || userMessage.toLowerCase().includes('stock')) {
      setToolStatus('📦 Checking inventory levels...');
      await new Promise(resolve => setTimeout(resolve, 600));
      setToolStatus('');
      response = `**Inventory Status Summary:**

✅ **In Stock**: 1 item
⚠️ **Low Stock**: 1 item  
❌ **Out of Stock**: 1 item

**Details**:
• Diesel Fuel: 15,000 liters (Nairobi Depot) - ✅ In Stock
• Spare Tires: 25 pieces (Mombasa Warehouse) - ⚠️ Low Stock
• Engine Oil: 0 bottles (Kisumu Station) - ❌ Out of Stock

**Action Required**: Reorder engine oil immediately and monitor spare tire levels.`;
    } else {
      response = `I understand you're asking about "${userMessage}". I can help you with:

🚛 **Fleet Tracking**: "Show me fleet status" or "Which trucks are delayed?"
📋 **Orders**: "Find orders for Safaricom" or "Show pending orders"  
📊 **Analytics**: "Analyze delays this week" or "Show delivery performance"
📦 **Inventory**: "Check stock levels" or "What's out of stock?"
🎫 **Support**: "Find high priority tickets" or "Search customer issues"

Try asking me something specific about your logistics operations!`;
    }

    // Simulate streaming by adding text gradually
    const words = response.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += (i > 0 ? ' ' : '') + words[i];
      
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === 'assistant' && lastMsg.isStreaming) {
          lastMsg.content = currentText;
        }
        return updated;
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      await simulateStreamingResponse(userMessage.content);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === 'assistant') {
          lastMsg.content = '❌ Sorry, I encountered an error. Please try again.';
        }
        return updated;
      });
    } finally {
      setIsStreaming(false);
      setToolStatus('');
      setMessages(prev => {
        const updated = [...prev];
        const lastMsg = updated[updated.length - 1];
        if (lastMsg.role === 'assistant') {
          lastMsg.isStreaming = false;
        }
        return updated;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Chat cleared! How can I help you with your logistics operations?',
      timestamp: new Date()
    }]);
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col rounded-l-3xl transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-900">AI Assistant</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={clearChat}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              title="Clear chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
              title="Close chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('chat')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'chat'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-700 hover:bg-white hover:shadow-sm'
            }`}
          >
            Chat
          </button>
          <button
            onClick={() => setMode('agent')}
            className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              mode === 'agent'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-700 hover:bg-white hover:shadow-sm'
            }`}
          >
            Agent
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {msg.content}
              </div>
              {msg.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
              )}
              <div className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        
        {toolStatus && (
          <div className="flex justify-center">
            <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-sm font-medium">
              {toolStatus}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-3 flex-shrink-0">
        <div className="flex space-x-2 mb-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              mode === 'chat'
                ? 'Ask about fleet, orders, delays...'
                : 'Describe analysis needed...'
            }
            disabled={isStreaming}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors text-sm"
          >
            {isStreaming ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-1 justify-center">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
          <span className="text-xs text-gray-500">
            {isStreaming ? 'Thinking...' : 'Ready'}
          </span>
        </div>
      </div>
    </div>
  );
}