'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  DollarSign,
  Layers,
  Settings as SettingsIcon,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';

interface DashboardData {
  kpis: {
    totalOfficers: number;
    totalCarsSold: number;
    totalIncentivePaid: number;
    activeSlabsCount: number;
  };
  records: any[];
  charts: {
    monthlyTrend: { period: string; carsSold: number; incentivePaid: number }[];
    officerLeaderboard: { name: string; email: string; totalCars: number; totalIncentives: number }[];
    carModelBreakdown: { modelName: string; baseSuffix: string; variant: string; quantitySold: number }[];
  };
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calcMode, setCalcMode] = useState<'progressive' | 'flat'>('progressive');
  const [updatingMode, setUpdatingMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      }
      
      const settingsRes = await fetch('/api/admin/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.settings) {
          setCalcMode(settingsData.settings.calculationMode);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const getMonthName = (monthStr: string) => {
    const months: Record<string, string> = {
      '01': 'January', '02': 'February', '03': 'March', '04': 'April',
      '05': 'May', '06': 'June', '07': 'July', '08': 'August',
      '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    };
    return months[monthStr] || monthStr;
  };

  const handleToggleMode = async (mode: 'progressive' | 'flat') => {
    setUpdatingMode(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calculationMode: mode }),
      });
      if (res.ok) {
        setCalcMode(mode);
        const modeText = mode === 'progressive' ? 'Step-by-Step (Brackets)' : 'Flat Rate (All Cars)';
        setSuccessMsg(`Calculation Method switched to ${modeText}! Recalculating payouts...`);
        // Refresh stats since payouts are dynamically re-calculated based on mode
        await fetchDashboardStats();
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingMode(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-gray-250 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-250 rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-250 rounded-lg"></div>
          <div className="h-96 bg-gray-250 rounded-lg"></div>
        </div>
      </div>
    );
  }

  // Find max value in monthly trend to scale CSS graphs properly
  const maxCarsTrend = Math.max(...data.charts.monthlyTrend.map(m => m.carsSold), 1);
  const maxIncentivesTrend = Math.max(...data.charts.monthlyTrend.map(m => m.incentivePaid), 1);
  
  // Find max for leaderboards
  const maxOfficerIncentives = Math.max(...data.charts.officerLeaderboard.map(o => o.totalIncentives), 1);
  const maxCarModelSold = Math.max(...data.charts.carModelBreakdown.map(c => c.quantitySold), 1);

  return (
    <div className="space-y-8">
      {/* Page Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-toyota-black">Analytics Overview</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-toyota-charcoal">
            Corporate performance stats, active payout configurations, and sales logs.
          </p>
        </div>
        
        {/* Toggle Calculation Mode Settings Panel */}
        <div className="bg-toyota-white p-2 sm:p-2.5 rounded-lg border border-gray-200 shadow-sm flex flex-row items-center gap-2.5 self-start md:self-center">
          <div className="flex items-center gap-1 text-toyota-charcoal text-[10px] sm:text-xs font-semibold uppercase tracking-wider">
            <SettingsIcon className="h-3.5 w-3.5 text-toyota-red shrink-0" />
            <span className="hidden sm:inline">Method:</span>
          </div>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => handleToggleMode('progressive')}
              disabled={updatingMode}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-l transition-colors cursor-pointer border-y border-l ${
                calcMode === 'progressive'
                  ? 'bg-toyota-red text-toyota-white border-toyota-red'
                  : 'bg-toyota-light-gray text-toyota-charcoal border-gray-300 hover:bg-gray-100'
              }`}
            >
              Step-by-Step
            </button>
            <button
              onClick={() => handleToggleMode('flat')}
              disabled={updatingMode}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-r transition-colors cursor-pointer border ${
                calcMode === 'flat'
                  ? 'bg-toyota-red text-toyota-white border-toyota-red'
                  : 'bg-toyota-light-gray text-toyota-charcoal border-gray-300 hover:bg-gray-100'
              }`}
            >
              Flat Rate
            </button>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-50 p-4 rounded-md text-sm text-green-800 border border-green-200 flex items-center gap-2 animate-bounce">
          <Sparkles className="h-5 w-5 text-green-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* 1. Total Officers */}
        <div className="bg-toyota-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-toyota-charcoal">
              Sales Officers
            </span>
            <span className="block mt-1 text-xl sm:text-2xl font-bold text-toyota-black whitespace-nowrap">
              {data.kpis.totalOfficers}
            </span>
          </div>
          <div className="p-2.5 bg-gray-100 text-toyota-charcoal rounded-lg shrink-0">
            <Users className="h-5 w-5 text-toyota-dark-gray" />
          </div>
        </div>

        {/* 2. Total Cars Sold */}
        <div className="bg-toyota-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-toyota-charcoal">
              Total Cars Sold
            </span>
            <span className="block mt-1 text-xl sm:text-2xl font-bold text-toyota-black whitespace-nowrap">
              {data.kpis.totalCarsSold}
            </span>
          </div>
          <div className="p-2.5 bg-gray-100 text-toyota-charcoal rounded-lg shrink-0">
            <Car className="h-5 w-5 text-toyota-dark-gray" />
          </div>
        </div>

        {/* 3. Total Incentive Paid */}
        <div className="bg-toyota-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-toyota-charcoal">
              Incentives Disbursed
            </span>
            <span className="block mt-1 text-xl sm:text-2xl font-bold text-toyota-red whitespace-nowrap">
              ₹{data.kpis.totalIncentivePaid.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="p-2.5 bg-red-50 text-toyota-red rounded-lg shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* 4. Active Incentive Slabs */}
        <div className="bg-toyota-white p-4 sm:p-5 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-toyota-charcoal">
              Active Slabs
            </span>
            <span className="block mt-1 text-xl sm:text-2xl font-bold text-toyota-black whitespace-nowrap">
              {data.kpis.activeSlabsCount}
            </span>
          </div>
          <div className="p-2.5 bg-gray-100 text-toyota-charcoal rounded-lg shrink-0">
            <Layers className="h-5 w-5 text-toyota-dark-gray" />
          </div>
        </div>
      </div>

      {/* ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART 1: Monthly Sales & Payout Trend */}
        <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold uppercase tracking-wider text-toyota-black border-b border-gray-100 pb-3 mb-6">
            Monthly Payouts & Sales Trend
          </h3>
          {data.charts.monthlyTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-toyota-charcoal text-sm">
              No historical data available. Submit a sales entry to see trends.
            </div>
          ) : (
            <div className="space-y-6">
              {data.charts.monthlyTrend.map((trend) => {
                const carsPercentage = (trend.carsSold / maxCarsTrend) * 100;
                const costPercentage = (trend.incentivePaid / maxIncentivesTrend) * 100;
                return (
                  <div key={trend.period} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-toyota-black">
                      <span>{trend.period}</span>
                      <span className="text-toyota-charcoal">
                        {trend.carsSold} Cars Sold (₹{trend.incentivePaid.toLocaleString('en-IN')})
                      </span>
                    </div>
                    {/* Cars bar */}
                    <div className="w-full bg-toyota-light-gray h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-toyota-charcoal h-full rounded-full transition-all duration-500"
                        style={{ width: `${carsPercentage}%` }}
                      ></div>
                    </div>
                    {/* Incentive bar */}
                    <div className="w-full bg-toyota-light-gray h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-toyota-red h-full rounded-full transition-all duration-500"
                        style={{ width: `${costPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 text-[10px] font-bold text-toyota-charcoal pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 bg-toyota-charcoal rounded-sm"></span>
                  CARS SOLD
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-3 w-3 bg-toyota-red rounded-sm"></span>
                  INCENTIVES PAID
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: Officer Leaderboard (Incentive Distribution) */}
        <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold uppercase tracking-wider text-toyota-black border-b border-gray-100 pb-3 mb-6">
            Incentive Distribution & Leaderboard
          </h3>
          {data.charts.officerLeaderboard.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-toyota-charcoal text-sm">
              No sales logged by officers yet.
            </div>
          ) : (
            <div className="space-y-6">
              {data.charts.officerLeaderboard.map((officer) => {
                const percentage = (officer.totalIncentives / maxOfficerIncentives) * 100;
                return (
                  <div key={officer.email} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-toyota-black">
                      <span>{officer.name}</span>
                      <span className="text-toyota-red">
                        ₹{officer.totalIncentives.toLocaleString('en-IN')}{' '}
                        <span className="text-toyota-charcoal font-normal text-[10px]">
                          ({officer.totalCars} cars)
                        </span>
                      </span>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-toyota-light-gray h-4 rounded overflow-hidden">
                        <div
                          className="bg-toyota-red h-full rounded transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CHART 3: Car Model Performance Breakdown */}
        <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold uppercase tracking-wider text-toyota-black border-b border-gray-100 pb-3 mb-6">
            Vehicle Volume Breakdown
          </h3>
          {data.charts.carModelBreakdown.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-toyota-charcoal text-sm">
              No model logs registered.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.charts.carModelBreakdown.map((car) => {
                const percentage = (car.quantitySold / maxCarModelSold) * 100;
                return (
                  <div key={car.modelName + car.baseSuffix} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-toyota-black">
                      <span>
                        {car.modelName}{' '}
                        <span className="text-toyota-charcoal font-semibold text-[10px]">
                          {car.baseSuffix} {car.variant}
                        </span>
                      </span>
                      <span>{car.quantitySold} Sold</span>
                    </div>
                    <div className="w-full bg-toyota-light-gray h-3.5 rounded overflow-hidden">
                      <div
                        className="bg-toyota-dark-gray h-full rounded transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Panel */}
        <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm lg:col-span-2">
          <h3 className="text-base font-bold uppercase tracking-wider text-toyota-black border-b border-gray-100 pb-3 mb-6">
            Recent Sales Activities
          </h3>
          {data.records.length === 0 ? (
            <div className="py-8 text-center text-toyota-charcoal text-sm">
              No recent sales records logged in the database.
            </div>
          ) : (
            <div className="space-y-3">
              {data.records.slice(0, 4).map((rec, idx) => (
                <div key={rec._id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-toyota-light-gray/40 border border-gray-200/60 rounded-md gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-toyota-dark-gray text-toyota-white flex items-center justify-center text-xs font-bold shrink-0">
                      {rec.officerId?.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <span className="font-bold text-sm text-toyota-black block">
                        {rec.officerId?.name || 'Unknown Officer'}
                      </span>
                      <span className="text-[11px] text-toyota-charcoal block">
                        Submitted sales for {getMonthName(rec.month)} {rec.year}
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start border-t sm:border-t-0 border-gray-200/60 pt-2 sm:pt-0 gap-1 sm:gap-0 sm:text-right shrink-0">
                    <span className="font-bold text-xs sm:text-sm text-toyota-black whitespace-nowrap">
                      {rec.totalCars} Cars Sold
                    </span>
                    <span className="font-bold text-toyota-red text-xs whitespace-nowrap">
                      ₹{rec.totalIncentive.toLocaleString('en-IN')} paid
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
