'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-toyota-light-gray text-toyota-black px-4 sm:px-6 font-sans antialiased">
      <div className="w-full max-w-md p-8 bg-white border border-gray-200 rounded-lg shadow-none flex flex-col items-stretch">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <img src="/toyota.svg" alt="Toyota Logo" className="h-8 w-auto mb-4 select-none" />
          <h1 className="text-xl font-bold tracking-tight text-toyota-black">
            Toyota Sales Incentive Calculator
          </h1>
          <p className="text-xs text-toyota-charcoal mt-2 max-w-xs leading-relaxed">
            Authorized employee portal for configured sales slab incentives, real-time volume multipliers, and payout tracking.
          </p>
        </div>

        {/* Action Gateways */}
        <div className="space-y-3 flex flex-col">
          <Link
            href="/login/admin"
            className="w-full h-11 flex items-center justify-center rounded bg-toyota-red hover:bg-[#c90717] active:bg-[#a60410] text-white font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer select-none"
          >
            Admin Login
          </Link>
          
          <Link
            href="/login/officer"
            className="w-full h-11 flex items-center justify-center rounded bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-toyota-black font-medium text-xs tracking-wider uppercase transition-colors cursor-pointer select-none"
          >
            Sales Officer Login
          </Link>
        </div>

        {/* Security Warning Notice */}
        {/* <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-[10px] text-toyota-charcoal leading-relaxed select-none">
            Access to this system is restricted to authorized Toyota personnel only. All activities and transactions are logged and monitored for compliance.
          </p>
        </div> */}

      </div>

      {/* Corporate Compliance Footer */}
      <footer className="mt-6 text-center text-[10px] text-toyota-charcoal select-none tracking-wide">
        &copy; {new Date().getFullYear()} Toyota India. All Rights Reserved.
      </footer>
    </div>
  );
}
