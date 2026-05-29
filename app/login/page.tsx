'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, AlertCircle, Award } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
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
        throw new Error(data.error || 'Login failed');
      }

      // Successful login
      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/officer/dashboard');
      }
      router.refresh();

    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-toyota-light-gray px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 text-toyota-red">
          <Award className="h-10 w-10 stroke-[2.5]" />
          <span className="text-2xl font-black tracking-tighter text-toyota-black">TOYOTA</span>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold leading-9 tracking-tight text-toyota-black">
          Incentive Management Portal
        </h2>
        <p className="mt-1 text-center text-sm text-toyota-charcoal">
          Sign in to access your administrative tools or sales performance tracker.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-toyota-white px-8 py-10 shadow-md ring-1 ring-black/5 rounded-lg">
          {error && (
            <div className="mb-5 flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-toyota-red ring-1 ring-toyota-red/10">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold leading-6 text-toyota-black">
                Corporate Email Address
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-toyota-black ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-toyota-red sm:text-sm sm:leading-6 outline-none"
                  placeholder="name@toyota.in"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold leading-6 text-toyota-black">
                Password
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-2.5 pl-10 pr-3 text-toyota-black ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-toyota-red sm:text-sm sm:leading-6 outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md bg-toyota-red px-3 py-3 text-sm font-bold leading-6 text-toyota-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-toyota-red disabled:opacity-50 transition-colors uppercase tracking-wider cursor-pointer"
              >
                {loading ? 'Verifying Session...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
