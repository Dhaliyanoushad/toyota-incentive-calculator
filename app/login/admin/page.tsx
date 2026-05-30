'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Mail, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials.');
      }

      if (data.user.role !== 'admin') {
        await fetch('/api/auth/logout', { method: 'POST' });
        throw new Error('Access Denied: Admin only.');
      }

      router.push('/admin/dashboard');
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-toyota-light-gray text-toyota-black px-4 sm:px-6 font-sans antialiased">
      <div className="w-full max-w-sm p-6 sm:p-10 rounded-xl bg-white border border-gray-200 shadow-none flex flex-col items-stretch relative">
        
        {/* Sleek Circular Back Button */}
        <Link 
          href="/" 
          className="absolute top-5 left-5 p-1.5 rounded-full text-toyota-charcoal hover:text-toyota-black hover:bg-gray-150 transition-colors select-none group"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        </Link>

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8 mt-4">
          <img src="/toyota.svg" alt="Toyota Logo" className="h-8 w-auto mb-3" />
          <h1 className="text-xl font-bold tracking-tight text-toyota-black">Admin Login</h1>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-toyota-red/20 text-toyota-red text-xs mb-5 font-semibold flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-toyota-charcoal" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              required
              className="w-full h-11 pl-10 pr-3 rounded-lg bg-white border border-gray-300 text-toyota-black placeholder-gray-400 text-xs focus:outline-none focus:border-toyota-red focus:ring-1 focus:ring-toyota-red transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-toyota-charcoal" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full h-11 pl-10 pr-10 rounded-lg bg-white border border-gray-300 text-toyota-black placeholder-gray-400 text-xs focus:outline-none focus:border-toyota-red focus:ring-1 focus:ring-toyota-red transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-toyota-charcoal hover:text-toyota-red transition-colors cursor-pointer select-none"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 mt-6 rounded-lg bg-toyota-red text-white font-bold tracking-wider text-xs uppercase transition-all hover:bg-red-700 active:scale-98 disabled:opacity-50 cursor-pointer border-none"
          >
            {loading ? 'Logging In...' : 'Login'}
          </button>
        </form>

        {/* Route Transition */}
        <div className="mt-8 text-center border-t border-gray-100 pt-5">
          <Link 
            href="/login/officer" 
            className="text-xs font-semibold text-toyota-red hover:underline transition-colors duration-200"
          >
            Login as Sales Officer
          </Link>
        </div>

      </div>
    </div>
  );
}
