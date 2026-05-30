'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

export default function OfficerLoginPage() {
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

      if (data.user.role !== 'officer') {
        await fetch('/api/auth/logout', { method: 'POST' });
        throw new Error('Access Denied: Officer only.');
      }

      router.push('/officer/dashboard');
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-toyota-light-gray flex flex-col justify-center items-center px-4 font-sans text-toyota-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2">
            <img src="/toyota.svg" alt="Toyota Logo" className="h-8 w-auto" />
            <span className="text-2xl font-bold tracking-tight">TOYOTA</span>
          </div>
          <h2 className="mt-4 text-xl font-bold">Sales Officer Login</h2>
        </div>

        <div className="bg-toyota-white border border-gray-200 p-8 shadow-md rounded-lg">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 border border-toyota-red/20 p-3 text-sm text-toyota-red">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-toyota-charcoal">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 py-2.5 px-3 text-toyota-black placeholder:text-gray-400 focus:border-toyota-red focus:ring-1 focus:ring-toyota-red outline-none transition-all"
                placeholder="sales@toyota.in"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-toyota-charcoal">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-2.5 pl-3 pr-16 text-toyota-black placeholder:text-gray-400 focus:border-toyota-red focus:ring-1 focus:ring-toyota-red outline-none transition-all"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-toyota-charcoal hover:text-toyota-red transition-colors cursor-pointer select-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-toyota-red hover:bg-red-700 text-white py-3 text-sm font-bold uppercase transition-all tracking-wider disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* Link to Admin portal */}
        <div className="mt-4 text-center">
          <Link href="/login/admin" className="text-sm font-semibold text-toyota-red hover:underline">
            Not a sales officer? Login as an Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
