'use client';

import React, { useState } from 'react';
import { Truck, Eye, EyeOff } from 'lucide-react';

interface SignInProps {
  onSignIn?: (email: string, password: string) => void;
}

export default function SignIn({ onSignIn }: SignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setIsLoading(false);
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (onSignIn) {
        onSignIn(email, password);
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      {/* Left Side - Image Section with Split Design */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Diagonal Split Background */}
        <div className="absolute inset-0">
          {/* Dark section (left side) */}
          <div
            className="absolute inset-0"
            style={{
              background: ' #f3f4f6',
              clipPath: 'polygon(0 0, 60% 0, 35% 100%, 0 100%)'
            }}
          />
          {/* Light gray section (right side) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: '#BDC4D4',
              clipPath: 'polygon(60% 0, 100% 0, 100% 100%, 35% 100%)'
            }}
          />
        </div>

        {/* Content Container */}
        <div className="relative w-full h-full flex items-center justify-center p-16">
          {/* Image with shadow and border */}
          <div className="relative w-full max-w-2xl mt-16">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-8 border-white/20 backdrop-blur-sm">
              <img
                src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&auto=format&fit=crop"
                alt="Fleet Management"
                className="w-full h-full object-cover"
              />
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Floating text below image */}
            <div className="mt-8 text-center">
              <p className="text-gray-900 text-lg font-light leading-relaxed max-w-xl mx-auto">
                Streamlined fleet management that transforms operations.<br />
                The attention to detail and ease of use are unmatched.
              </p>
              <p className="text-gray-700 text-sm mt-4 font-light">
                Runsheet — Your gateway to fleet excellence
              </p>
            </div>
          </div>
        </div>

        {/* Simple Logo */}
        <div className="absolute top-4 left-4">
          <Truck className="w-8 h-8 text-black" />
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-10">
            {/* Mobile Logo */}
            <div className="flex justify-center mb-8 lg:hidden">
              <div className="bg-gray-900 rounded-full p-4">
                <Truck className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sign in to your Account
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Welcome back! Please enter your details
            </p>
          </div>

          {/* Sign In Form */}
          <div className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400"
                placeholder="Enter your email"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <a href="#" className="text-sm text-gray-900 hover:underline transition-all">
                  Forgot?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 pr-12 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-all placeholder:text-gray-400"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Sign In Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="w-full bg-gray-900 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</p>
              <p className="text-xs text-gray-600">Email: admin@runsheet.com</p>
              <p className="text-xs text-gray-600">Password: demo123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}