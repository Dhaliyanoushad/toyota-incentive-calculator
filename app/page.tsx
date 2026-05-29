'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-toyota-black text-white font-sans">
      {/* BACKGROUND IMAGE WITH OVERLAYS */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105"
        style={{ 
          backgroundImage: `url('/supra.jpg')` 
        }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

      {/* TOP BRANDING NAVBAR (Toyota and Logo only) */}
      <header className="relative z-20 w-full px-6 py-6 sm:px-12 flex items-center bg-black/10">
        <div className="flex items-center gap-3">
          <img src="/toyota.svg" alt="Toyota Logo" className="h-6 w-auto brightness-0 invert" />
          <span className="text-xl font-bold tracking-tighter text-white uppercase">Toyota</span>
        </div>
      </header>

      {/* HERO CONTENT AREA (One Tagline, Two Buttons) */}
      <main className="relative z-20 flex-1 flex flex-col justify-center px-6 sm:px-12 py-16 max-w-4xl">
        <div className="space-y-8">
          {/* ONE Tagline */}
          <h1 
            className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight"
            style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
          >
            Toyota drives incentives.
          </h1>

          {/* TWO Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link
              href="/login/admin"
              className="bg-toyota-red hover:bg-red-700 text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase transition-all tracking-wider shadow-lg text-center cursor-pointer border border-toyota-red"
            >
              Admin Portal
            </Link>
            
            <Link
              href="/login/officer"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase transition-all tracking-wider border border-white/25 shadow-lg backdrop-blur-md text-center cursor-pointer"
            >
              Officer Portal
            </Link>
          </div>
        </div>
      </main>

      {/* Empty bottom spacer to keep layout balanced */}
      <div className="relative z-20 h-16 w-full" />
    </div>
  );
}
