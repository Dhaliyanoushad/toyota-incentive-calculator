'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Lock, AlertCircle, ShieldAlert, Award } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  // Auto-seed helper to make sure database is ready
  const handleAutoSeed = async () => {
    setSeeding(true);
    setError('');
    try {
      const res = await fetch('/api/auth/seed', { method: 'POST' });
      if (res.ok) {
        setSeedSuccess(true);
        setTimeout(() => setSeedSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Autoseeding failed.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to seeding API failed.');
    } finally {
      setSeeding(false);
    }
  };

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

  const fillCredentials = (role: 'admin' | 'officer1' | 'officer2') => {
    setError('');
    if (role === 'admin') {
      setEmail('admin@toyota.in');
      setPassword('toyota');
    } else if (role === 'officer1') {
      setEmail('officer1@toyota.in');
      setPassword('toyota');
    } else {
      setEmail('officer2@toyota.in');
      setPassword('toyota');
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

          {seedSuccess && (
            <div className="mb-5 flex items-start gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700 ring-1 ring-green-600/10">
              <span>Database seed completed! Try logging in below.</span>
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
                disabled={loading || seeding}
                className="flex w-full justify-center rounded-md bg-toyota-red px-3 py-3 text-sm font-bold leading-6 text-toyota-white shadow-sm hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-toyota-red disabled:opacity-50 transition-colors uppercase tracking-wider cursor-pointer"
              >
                {loading ? 'Verifying Session...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-8 border-t border-gray-150 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-toyota-charcoal flex items-center gap-1.5 mb-3">
              <KeyRound className="h-4 w-4" />
              Quick-Demo Credentials
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillCredentials('admin')}
                className="rounded bg-toyota-dark-gray px-2 py-2 text-xs font-semibold text-toyota-white hover:bg-toyota-black transition-colors cursor-pointer"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('officer1')}
                className="rounded bg-toyota-charcoal px-2 py-2 text-xs font-semibold text-toyota-white hover:bg-toyota-black transition-colors cursor-pointer"
              >
                Officer 1
              </button>
              <button
                type="button"
                onClick={() => fillCredentials('officer2')}
                className="rounded bg-toyota-charcoal px-2 py-2 text-xs font-semibold text-toyota-white hover:bg-toyota-black transition-colors cursor-pointer"
              >
                Officer 2
              </button>
            </div>
            
            {/* Database seed shortcut */}
            <div className="mt-4 pt-4 border-t border-dashed border-gray-250 flex items-center justify-between">
              <span className="text-[11px] text-toyota-charcoal flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                First time? Click Reset & Seed
              </span>
              <button
                type="button"
                onClick={handleAutoSeed}
                disabled={seeding || loading}
                className="rounded border border-toyota-red px-2 py-1 text-[11px] font-bold text-toyota-red hover:bg-red-50 disabled:opacity-50 cursor-pointer"
              >
                {seeding ? 'Seeding...' : 'Reset & Seed DB'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
