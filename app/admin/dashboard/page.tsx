'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Users,
  Car,
  Layers,
  TrendingUp,
  Calendar,
  ChevronDown
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
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Click outside to close custom period filter
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterOpen]);

  // Fetch Dashboard Stats
  const fetchDashboardStats = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
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

  if (loading || !data) {
    return (
      <div className="space-y-8 py-2">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-neutral-100 rounded animate-pulse"></div>
          <div className="h-4 w-64 bg-neutral-50/50 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-neutral-50/70 border border-neutral-100 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 bg-neutral-50/70 border border-neutral-100 rounded animate-pulse"></div>
          <div className="h-80 bg-neutral-50/70 border border-neutral-100 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Extract unique years and months with data to populate the filters
  const uniqueYears = Array.from(new Set(data.records.map((r) => r.year))).sort((a, b) => b - a);
  const monthOrder = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const uniqueMonths = Array.from(new Set(data.records.map((r) => r.month))).sort(
    (a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b)
  );

  // Client-side filtering logic based on selectedMonth and selectedYear
  const filteredRecords = data.records.filter((rec) => {
    const matchesYear = selectedYear === 'all' || rec.year === parseInt(selectedYear);
    const matchesMonth = selectedMonth === 'all' || rec.month === selectedMonth;
    return matchesYear && matchesMonth;
  });

  // Dynamically compute KPIs
  const dynamicTotalCarsSold = filteredRecords.reduce((sum, rec) => sum + (rec.totalCars || 0), 0);
  const dynamicTotalIncentivePaid = filteredRecords.reduce((sum, rec) => sum + (rec.totalIncentive || 0), 0);

  // Dynamically compute Officer Leaderboard based on filtered records
  const officerMap: Record<string, { name: string; email: string; totalCars: number; totalIncentives: number }> = {};
  filteredRecords.forEach((rec) => {
    const officer = rec.officerId;
    if (!officer) return;
    const email = officer.email;
    if (!officerMap[email]) {
      officerMap[email] = {
        name: officer.name || 'Unknown Officer',
        email: email,
        totalCars: 0,
        totalIncentives: 0
      };
    }
    officerMap[email].totalCars += rec.totalCars || 0;
    officerMap[email].totalIncentives += rec.totalIncentive || 0;
  });
  const dynamicLeaderboard = Object.values(officerMap).sort((a, b) => b.totalIncentives - a.totalIncentives);

  // Dynamically compute Car Model Performance Breakdown based on filtered records
  const modelMap: Record<string, { modelName: string; baseSuffix: string; variant: string; quantitySold: number }> = {};
  filteredRecords.forEach((rec) => {
    if (!rec.sales) return;
    rec.sales.forEach((item: any) => {
      const model = item.modelId;
      if (!model) return;
      const modelKey = model._id || `${model.modelName}-${model.baseSuffix}-${model.variant}`;
      if (!modelMap[modelKey]) {
        modelMap[modelKey] = {
          modelName: model.modelName || 'Unknown Model',
          baseSuffix: model.baseSuffix || '',
          variant: model.variant || '',
          quantitySold: 0
        };
      }
      modelMap[modelKey].quantitySold += item.quantity || 0;
    });
  });
  const dynamicCarModelBreakdown = Object.values(modelMap).sort((a, b) => b.quantitySold - a.quantitySold);

  // Dynamically compute Monthly Trend Chart data, filtered by selectedYear for relevant progression
  const dynamicMonthlyTrend = data.charts.monthlyTrend.filter((trend) => {
    const parts = trend.period.split('/');
    if (parts.length === 2) {
      const year = parts[1];
      return selectedYear === 'all' || year === selectedYear;
    }
    return true;
  });

  // Calculate dynamic scaling constraints for bar graphs
  const maxCarsTrend = Math.max(...dynamicMonthlyTrend.map((m) => m.carsSold), 1);
  const maxIncentivesTrend = Math.max(...dynamicMonthlyTrend.map((m) => m.incentivePaid), 1);
  const maxOfficerIncentives = Math.max(...dynamicLeaderboard.map((o) => o.totalIncentives), 1);
  const maxCarModelSold = Math.max(...dynamicCarModelBreakdown.map((c) => c.quantitySold), 1);

  return (
    <div className="space-y-8 py-2">
      {/* Page Title & Banner with Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Incentive Dashboard</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Performance overview, leaderboard, and finalized incentive sales statistics.
          </p>
        </div>

        {/* Dynamic Month/Year Selector Popover */}
        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0 select-none">
          <div ref={filterRef} className="relative select-none shrink-0">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-toyota-red" />
            </div>
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="min-w-[210px] h-[38px] rounded border border-neutral-200 hover:border-neutral-300 focus:border-toyota-red py-2 pl-9 pr-10 text-xs outline-none font-semibold text-neutral-800 bg-white flex items-center justify-between cursor-pointer transition-all select-none shadow-xs"
            >
              <span>
                Period: {selectedMonth !== 'all' ? getMonthName(selectedMonth) : 'All Months'}{' '}
                {selectedYear !== 'all' ? selectedYear : 'All Years'}
              </span>
              <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-180 text-toyota-red' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-md border border-neutral-100 rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150 z-30">
                {/* Year Selection */}
                <div className="pb-3 border-b border-neutral-100">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">Year Filter</span>
                  <div className="flex gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedYear('all')}
                      className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer active:scale-95 ${
                        selectedYear === 'all'
                          ? 'bg-neutral-900 text-white font-bold'
                          : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                      }`}
                    >
                      All Years
                    </button>
                    {uniqueYears.map((year) => {
                      const isSelected = selectedYear === year.toString();
                      return (
                        <button
                          key={year}
                          type="button"
                          onClick={() => setSelectedYear(year.toString())}
                          className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer active:scale-95 ${
                            isSelected
                              ? 'bg-neutral-900 text-white font-bold'
                              : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                          }`}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Month Selection */}
                <div className="pt-3">
                  <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">Month Filter</span>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMonth('all');
                      setIsFilterOpen(false);
                    }}
                    className={`w-full py-1 rounded text-[10px] font-bold text-center border transition-all mb-2 cursor-pointer active:scale-95 ${
                      selectedMonth === 'all'
                        ? 'bg-toyota-red border-toyota-red text-white shadow-sm shadow-toyota-red/10'
                        : 'border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 bg-white'
                    }`}
                  >
                    All Months
                  </button>

                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { code: '01', name: 'Jan' },
                      { code: '02', name: 'Feb' },
                      { code: '03', name: 'Mar' },
                      { code: '04', name: 'Apr' },
                      { code: '05', name: 'May' },
                      { code: '06', name: 'Jun' },
                      { code: '07', name: 'Jul' },
                      { code: '08', name: 'Aug' },
                      { code: '09', name: 'Sep' },
                      { code: '10', name: 'Oct' },
                      { code: '11', name: 'Nov' },
                      { code: '12', name: 'Dec' },
                    ].map((m) => {
                      const isSelected = selectedMonth === m.code;
                      const hasData = uniqueMonths.includes(m.code);
                      
                      return (
                        <button
                          key={m.code}
                          type="button"
                          disabled={!hasData}
                          onClick={() => {
                            setSelectedMonth(m.code);
                            setIsFilterOpen(false);
                          }}
                          className={`relative py-1.5 text-[10px] font-semibold rounded transition-all cursor-pointer text-center select-none active:scale-95 ${
                            isSelected
                              ? 'bg-toyota-red text-white shadow-sm shadow-toyota-red/10'
                              : hasData
                                ? 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                : 'text-neutral-300 opacity-40 cursor-not-allowed'
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Reset Filters Trigger */}
          {(selectedYear !== 'all' || selectedMonth !== 'all') && (
            <button
              onClick={() => {
                setSelectedYear('all');
                setSelectedMonth('all');
              }}
              className="text-[10px] font-bold uppercase tracking-wider text-toyota-red hover:text-red-700 bg-red-50 hover:bg-red-100/50 border border-red-100 rounded px-3 py-1.5 cursor-pointer h-[38px] flex items-center justify-center transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Total Officers (Overall registered, does not change) */}
        <div className="bg-white p-6 rounded-md border border-neutral-100 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Active Officers
            </span>
            <span className="block mt-1.5 text-2xl font-light tracking-tight text-neutral-900">
              {data.kpis.totalOfficers}
            </span>
          </div>
          <Users className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
        </div>

        {/* 2. Total Cars Sold (Filtered) */}
        <div className="bg-white p-6 rounded-md border border-neutral-100 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Units Sold
            </span>
            <span className="block mt-1.5 text-2xl font-light tracking-tight text-neutral-900 transition-all duration-300">
              {dynamicTotalCarsSold}
            </span>
          </div>
          <Car className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
        </div>

        {/* 3. Total Incentive Paid (Filtered) */}
        <div className="bg-white p-6 rounded-md border border-neutral-100 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Total Payouts
            </span>
            <span className="block mt-1.5 text-2xl font-semibold tracking-tight text-toyota-red transition-all duration-300">
              ₹{dynamicTotalIncentivePaid.toLocaleString('en-IN')}
            </span>
          </div>
          <TrendingUp className="h-4.5 w-4.5 text-toyota-red shrink-0" />
        </div>

        {/* 4. Active Incentive Slabs */}
        <div className="bg-white p-6 rounded-md border border-neutral-100 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Active Tiers
            </span>
            <span className="block mt-1.5 text-2xl font-light tracking-tight text-neutral-900">
              {data.kpis.activeSlabsCount}
            </span>
          </div>
          <Layers className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
        </div>
      </div>

      {/* ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART 1: Monthly Sales & Payout Trend */}
        <div className="bg-white p-8 rounded-md border border-neutral-100 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">Monthly Sales Trend</h3>
            <p className="text-xs text-neutral-400 mt-1">Audit historic aggregates of sold volume and incentive budgets.</p>
          </div>
          
          {dynamicMonthlyTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
              No historical data logs available yet for this filter.
            </div>
          ) : (
            <div className="space-y-6">
              {dynamicMonthlyTrend.map((trend) => {
                const carsPercentage = (trend.carsSold / maxCarsTrend) * 100;
                const costPercentage = (trend.incentivePaid / maxIncentivesTrend) * 100;
                return (
                  <div key={trend.period} className="space-y-3">
                    <div className="flex justify-between text-xs items-baseline">
                      <span className="font-semibold text-neutral-800">{trend.period}</span>
                      <span className="text-[11px] text-neutral-500 font-medium">
                        {trend.carsSold} units sold · ₹{trend.incentivePaid.toLocaleString('en-IN')} paid
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {/* Cars bar */}
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-neutral-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${carsPercentage}%` }}
                        ></div>
                      </div>
                      {/* Incentive bar */}
                      <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-toyota-red h-full rounded-full transition-all duration-500"
                          style={{ width: `${costPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center gap-4 text-[10px] font-semibold text-neutral-500 pt-4 border-t border-neutral-100">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 bg-neutral-600 rounded-sm"></span>
                  Units Sold
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 bg-toyota-red rounded-sm"></span>
                  Incentives Paid
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CHART 2: Officer Leaderboard */}
        <div className="bg-white p-8 rounded-md border border-neutral-100 space-y-6">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">Officer Leaderboard</h3>
            <p className="text-xs text-neutral-400 mt-1">Ranking of Sales Officers by locked payout volumes.</p>
          </div>

          {dynamicLeaderboard.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
              No sales logged for this selection.
            </div>
          ) : (
            <div className="space-y-6">
              {dynamicLeaderboard.map((officer) => {
                const percentage = (officer.totalIncentives / maxOfficerIncentives) * 100;
                return (
                  <div key={officer.email} className="space-y-2">
                    <div className="flex justify-between text-xs items-baseline">
                      <span className="font-semibold text-neutral-800">{officer.name}</span>
                      <span className="font-semibold text-toyota-red text-xs">
                        ₹{officer.totalIncentives.toLocaleString('en-IN')}{' '}
                        <span className="text-neutral-400 font-normal text-[10px] ml-1">
                          ({officer.totalCars} units)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded overflow-hidden">
                      <div
                        className="bg-toyota-red h-full rounded transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CHART 3: Car Model Performance Breakdown */}
        <div className="bg-white p-8 rounded-md border border-neutral-100 space-y-6 lg:col-span-2">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">Model Performance Breakdown</h3>
            <p className="text-xs text-neutral-400 mt-1">Distribution of sales volume across active Toyota catalog models.</p>
          </div>

          {dynamicCarModelBreakdown.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-neutral-400 text-xs">
              No registered model breakdown values for this selection.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {dynamicCarModelBreakdown.map((car) => {
                const percentage = (car.quantitySold / maxCarModelSold) * 100;
                return (
                  <div key={car.modelName + car.baseSuffix} className="space-y-2">
                    <div className="flex justify-between text-xs items-baseline">
                      <span className="font-semibold text-neutral-800">
                        {car.modelName}{' '}
                        <span className="text-neutral-400 font-normal text-[10px] ml-1">
                          {car.baseSuffix} Trim · {car.variant}
                        </span>
                      </span>
                      <span className="font-medium text-neutral-600 text-xs">{car.quantitySold} units</span>
                    </div>
                    <div className="w-full bg-neutral-100 h-1.5 rounded overflow-hidden">
                      <div
                        className="bg-neutral-800 h-full rounded transition-all duration-500"
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
        <div className="bg-white p-8 rounded-md border border-neutral-100 space-y-6 lg:col-span-2">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">Recent Finalized Reports</h3>
            <p className="text-xs text-neutral-400 mt-1">Review finalized monthly logs and payouts recorded in the system.</p>
          </div>

          {data.records.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-xs">
              No recent finalized sheets recorded.
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {data.records.slice(0, 4).map((rec, idx) => (
                <div key={rec._id || idx} className="flex items-center justify-between py-4 first:pt-0 last:pb-0 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-neutral-50 border border-neutral-200/50 text-neutral-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {rec.officerId?.name?.charAt(0) || 'O'}
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-neutral-900 block">
                        {rec.officerId?.name || 'Unknown Officer'}
                      </span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">
                        Logged report for {getMonthName(rec.month)} {rec.year}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-semibold text-xs text-neutral-800 block">
                      {rec.totalCars} units sold
                    </span>
                    <span className="font-bold text-toyota-red text-xs block mt-0.5">
                      ₹{rec.totalIncentive.toLocaleString('en-IN')}
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
