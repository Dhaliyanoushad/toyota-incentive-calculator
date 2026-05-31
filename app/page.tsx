'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 px-4 font-sans antialiased select-none">
      <div className="w-full max-w-sm p-8 bg-white border border-slate-200 rounded shadow-xs flex flex-col items-stretch">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/toyota.svg" alt="Toyota Logo" className="h-6 w-auto mb-4 select-none opacity-90" />
          <h1 className="text-sm font-semibold tracking-wider uppercase text-slate-900">
            Toyota Incentive Portal
          </h1>
          <p className="text-[11px] text-slate-500 mt-1.5 leading-normal">
            Authorized portal login for dealer incentive calculations
          </p>
        </div>

        {/* Action Gateways */}
        <div className="space-y-2.5 flex flex-col">
          <Link
            href="/login/admin"
            className="w-full py-2.5 flex items-center justify-center rounded bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer select-none active:scale-98"
          >
            Admin Login
          </Link>
          
          <Link
            href="/login/officer"
            className="w-full py-2.5 flex items-center justify-center rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer select-none active:scale-98"
          >
            Sales Officer Login
          </Link>
        </div>

      </div>

      {/* Corporate Compliance Footer */}
      <footer className="mt-6 text-center text-[9px] text-slate-400 select-none tracking-normal">
        &copy; {new Date().getFullYear()} Toyota India. Authorized Personnel Only.
      </footer>
    </div>
  );
}
