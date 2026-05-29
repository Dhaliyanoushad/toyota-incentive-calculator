'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Car, ChevronDown, RefreshCw } from 'lucide-react';

interface SalesRecord {
  _id: string;
  month: string;
  year: number;
  sales: {
    modelId: {
      modelName: string;
      baseSuffix: string;
      variant: string;
    };
    quantity: number;
  }[];
  totalCars: number;
  incentiveRate: number;
  totalIncentive: number;
  createdAt: string;
}

export default function OfficerHistoryPage() {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/officer/history');
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getMonthName = (monthStr: string) => {
    const months: Record<string, string> = {
      '01': 'January', '02': 'February', '03': 'March', '04': 'April',
      '05': 'May', '06': 'June', '07': 'July', '08': 'August',
      '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    };
    return months[monthStr] || monthStr;
  };

  return (
    <div className="space-y-8 py-2">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Sales Logs</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Audit historical monthly reports and finalized payouts.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-1.5 border border-neutral-200 hover:bg-neutral-50 px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider text-neutral-700 bg-white transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-11 bg-neutral-100 rounded animate-pulse"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-50/55 rounded border border-neutral-100 animate-pulse"></div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-white py-16 px-6 text-center border border-neutral-100 rounded-md">
          <Calendar className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-800">No logs discovered</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            You haven't submitted or saved any monthly worksheets yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-md border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-100 text-left text-sm text-neutral-900">
                <thead className="bg-neutral-50/50 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="px-6 py-4">Accounting Period</th>
                    <th className="px-6 py-4 text-center">Total Volume</th>
                    <th className="px-6 py-4">Nominal Rate</th>
                    <th className="px-6 py-4">Final Payout</th>
                    <th className="px-6 py-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {records.map((rec) => {
                    const isExpanded = expandedId === rec._id;
                    return (
                      <React.Fragment key={rec._id}>
                        <tr className="hover:bg-neutral-50/40 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-neutral-900">
                            {getMonthName(rec.month)} {rec.year}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center font-medium text-neutral-600">
                            {rec.totalCars} units
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-neutral-500 font-medium text-xs">
                            ₹{rec.incentiveRate.toLocaleString('en-IN')}/unit
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-toyota-red">
                            ₹{rec.totalIncentive.toLocaleString('en-IN')}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <button
                              onClick={() => toggleExpand(rec._id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 hover:text-toyota-red px-3 py-1.5 rounded bg-neutral-50 hover:bg-neutral-100/70 transition-colors cursor-pointer"
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180 text-toyota-red' : ''}`} />
                            </button>
                          </td>
                        </tr>
                        
                        {isExpanded && (
                          <tr className="bg-neutral-50/20">
                            <td colSpan={5} className="px-8 py-5 border-t border-neutral-100">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Ledger Details</span>
                                  <span className="h-[1px] flex-1 bg-neutral-100" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                  {rec.sales.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-white p-3.5 border border-neutral-100 rounded flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="block font-semibold text-xs text-neutral-800 tracking-tight">
                                          {item.modelId?.modelName || 'Deleted Model'}
                                        </span>
                                        <span className="block text-[10px] text-neutral-400 mt-0.5">
                                          {item.modelId?.baseSuffix} Trim · {item.modelId?.variant}
                                        </span>
                                      </div>
                                      <span className="text-xs font-bold text-neutral-800 bg-neutral-50 px-2 py-0.5 border border-neutral-200/50 rounded-sm shrink-0">
                                        {item.quantity} units
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="block md:hidden space-y-4">
            {records.map((rec) => {
              const isExpanded = expandedId === rec._id;
              return (
                <div key={rec._id} className="bg-white border border-neutral-100 rounded-md p-5 space-y-4 hover:border-neutral-200/80 transition-colors">
                  {/* Header: Period & Incentive */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <span className="font-semibold text-sm text-neutral-900">
                      {getMonthName(rec.month)} {rec.year}
                    </span>
                    <span className="text-sm font-bold text-toyota-red">
                      ₹{rec.totalIncentive.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 py-1">
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Total Volume</span>
                      <span className="text-xs font-medium text-neutral-800 mt-0.5 block">{rec.totalCars} units</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Slab Rate</span>
                      <span className="text-xs font-medium text-neutral-500 mt-0.5 block">₹{rec.incentiveRate.toLocaleString('en-IN')}/unit</span>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => toggleExpand(rec._id)}
                    className="w-full flex items-center justify-center gap-1.5 bg-neutral-50 hover:bg-neutral-100/70 text-neutral-600 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isExpanded ? 'Hide Details' : 'Expand Details'}
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <div className="bg-neutral-50/50 p-4 rounded border border-neutral-100 space-y-3 animate-in slide-in-from-top-1 duration-150">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Ledger Details</span>
                        <span className="h-[1px] flex-1 bg-neutral-200/50" />
                      </div>
                      <div className="space-y-2">
                        {rec.sales.map((item, idx) => (
                          <div key={idx} className="bg-white px-3 py-2.5 border border-neutral-100 rounded flex items-center justify-between text-xs">
                            <div>
                              <span className="font-semibold text-neutral-800 block">{item.modelId?.modelName || 'Deleted Model'}</span>
                              <span className="text-[10px] text-neutral-400 mt-0.5 block">{item.modelId?.baseSuffix} Trim · {item.modelId?.variant}</span>
                            </div>
                            <span className="text-xs font-bold text-neutral-800 bg-neutral-50 px-2 py-0.5 border border-neutral-200/50 rounded-sm shrink-0">
                              {item.quantity} units
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
}
