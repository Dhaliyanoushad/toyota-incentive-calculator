'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Car,
  Layers,
  TrendingUp
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

  // Find max value in monthly trend to scale CSS graphs properly
  const maxCarsTrend = Math.max(...data.charts.monthlyTrend.map(m => m.carsSold), 1);
  const maxIncentivesTrend = Math.max(...data.charts.monthlyTrend.map(m => m.incentivePaid), 1);
  
  // Find max for leaderboards
  const maxOfficerIncentives = Math.max(...data.charts.officerLeaderboard.map(o => o.totalIncentives), 1);
  const maxCarModelSold = Math.max(...data.charts.carModelBreakdown.map(c => c.quantitySold), 1);

  return (
    <div className="space-y-8 py-2">
      {/* Page Title & Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Incentive Dashboard</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Performance overview, leaderboard, and finalized incentive sales statistics.
          </p>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Total Officers */}
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

        {/* 2. Total Cars Sold */}
        <div className="bg-white p-6 rounded-md border border-neutral-100 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Units Sold
            </span>
            <span className="block mt-1.5 text-2xl font-light tracking-tight text-neutral-900">
              {data.kpis.totalCarsSold}
            </span>
          </div>
          <Car className="h-4.5 w-4.5 text-neutral-400 shrink-0" />
        </div>

        {/* 3. Total Incentive Paid */}
        <div className="bg-white p-6 rounded-md border border-neutral-100 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Total Payouts
            </span>
            <span className="block mt-1.5 text-2xl font-semibold tracking-tight text-toyota-red">
              ₹{data.kpis.totalIncentivePaid.toLocaleString('en-IN')}
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
          
          {data.charts.monthlyTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
              No historical data logs available yet.
            </div>
          ) : (
            <div className="space-y-6">
              {data.charts.monthlyTrend.map((trend) => {
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

          {data.charts.officerLeaderboard.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-neutral-400 text-xs">
              No sales logged in active ledger sheets.
            </div>
          ) : (
            <div className="space-y-6">
              {data.charts.officerLeaderboard.map((officer) => {
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

          {data.charts.carModelBreakdown.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-neutral-400 text-xs">
              No registered model breakdown values.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              {data.charts.carModelBreakdown.map((car) => {
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
