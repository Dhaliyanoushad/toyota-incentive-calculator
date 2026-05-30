'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Car,
  Layers,
  FileText,
  LogOut,
  Menu,
  X,
  UserCheck
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch user details
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === 'admin') {
            setUser(data.user);
          } else {
            router.push('/login/admin');
          }
        } else {
          router.push('/login/admin');
        }
      } catch (err) {
        console.error(err);
        router.push('/login/admin');
      }
    }
    checkSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login/admin');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navLinks = [
    { href: '/admin/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/cars', name: 'Cars', icon: Car },
    { href: '/admin/slabs', name: 'Slabs', icon: Layers },
    { href: '/admin/sales', name: 'Sales', icon: FileText },
  ];

  if (!user) {
    // Loading skeleton during session verification
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-toyota-light-gray">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-toyota-red border-t-transparent"></div>
          <span className="text-sm font-semibold text-toyota-charcoal">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-toyota-light-gray flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-toyota-dark-gray text-toyota-white shadow-md">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="lg:hidden text-toyota-white hover:text-toyota-red focus:outline-none cursor-pointer"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-6 w-6" />
              </button>
              
              <div className="flex items-center gap-2">
                <img src="/toyota.svg" alt="Toyota Logo" className="h-6 w-auto shrink-0 brightness-0 invert" />
                <span className="text-xl font-bold tracking-tighter text-toyota-white">TOYOTA</span>
                <span className="hidden sm:inline-block h-4 w-[1px] bg-toyota-charcoal mx-1"></span>
                <span className="hidden sm:inline-block text-xs uppercase tracking-widest text-toyota-light-gray font-bold">
                  Incentive Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded text-xs font-medium border border-toyota-charcoal">
                <UserCheck className="h-4 w-4 text-toyota-red" />
                <span className="text-toyota-light-gray">{user.name}</span>
                <span className="text-[10px] bg-toyota-red text-toyota-white font-bold px-1.5 py-0.5 rounded uppercase">
                  Admin
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 bg-toyota-red hover:bg-red-700 text-toyota-white px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors tracking-wider cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DASHBOARD CORE */}
      <div className="flex flex-1 relative">
        {/* SIDEBAR FOR DESKTOP */}
        <aside className="hidden lg:block w-64 bg-toyota-dark-gray text-toyota-white border-t border-toyota-charcoal/30 flex-shrink-0 shadow-lg">
          <nav className="p-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-toyota-red text-toyota-white shadow'
                      : 'text-toyota-light-gray hover:bg-black/20 hover:text-toyota-white'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* MOBILE SIDEBAR DRAWSER */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            ></div>

            {/* Sidebar drawer content */}
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-toyota-dark-gray text-toyota-white p-6 shadow-2xl animate-in slide-in-from-left duration-200">
              <div className="flex items-center justify-between mb-8">
                <span className="text-sm font-bold uppercase tracking-wider text-toyota-red">Menu</span>
                <button
                  type="button"
                  className="rounded-md text-toyota-white hover:text-toyota-red cursor-pointer"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6 pb-6 border-b border-toyota-charcoal/55 flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-toyota-red flex items-center justify-center text-xs font-black">
                  A
                </div>
                <div>
                  <h4 className="text-xs font-bold">{user.name}</h4>
                  <p className="text-[10px] text-toyota-charcoal">{user.email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-semibold cursor-pointer ${
                        isActive
                          ? 'bg-toyota-red text-toyota-white'
                          : 'text-toyota-light-gray hover:bg-black/20 hover:text-toyota-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* MAIN DISPLAY AREA */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
