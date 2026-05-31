'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, Download, Calendar, Car, Award, ChevronDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface SalesRecord {
  _id: string;
  officerId: {
    name: string;
    email: string;
  };
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

export default function AdminSalesPage() {
  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

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

  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = now.getFullYear();
  
  // Expanded sales breakdown item ID tracking
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
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
    fetchRecords();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  // Month code to name mapper
  const getMonthName = (monthStr: string) => {
    const months: Record<string, string> = {
      '01': 'January', '02': 'February', '03': 'March', '04': 'April',
      '05': 'May', '06': 'June', '07': 'July', '08': 'August',
      '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    };
    return months[monthStr] || monthStr;
  };

  // Search and Filter Logic
  const filteredRecords = records.filter((rec) => {
    const officerName = rec.officerId?.name?.toLowerCase() || '';
    const officerEmail = rec.officerId?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    
    const matchesSearch = officerName.includes(query) || officerEmail.includes(query);
    const matchesMonth = monthFilter === '' || rec.month === monthFilter;
    const matchesYear = yearFilter === '' || rec.year.toString() === yearFilter;
    
    return matchesSearch && matchesMonth && matchesYear;
  });

  // Dynamic CSV Export Engine
  const exportToCSV = () => {
    if (filteredRecords.length === 0) return;

    // Header array
    const headers = [
      'Sales Officer Name',
      'Officer Email',
      'Period',
      'Breakdown',
      'Total Cars Sold',
      'Rate (₹)',
      'Incentive (₹)',
      'Logged At'
    ];

    // Map records to rows
    const rows = filteredRecords.map((rec) => {
      const breakdown = rec.sales
        .map((s) => `${s.modelId?.modelName || 'Unknown'} (${s.quantity} units)`)
        .join(' | ');

      return [
        `"${rec.officerId?.name || 'Unknown'}"`,
        `"${rec.officerId?.email || 'N/A'}"`,
        `"${getMonthName(rec.month)} ${rec.year}"`,
        `"${breakdown}"`,
        rec.totalCars,
        rec.incentiveRate,
        rec.totalIncentive,
        `"${new Date(rec.createdAt).toLocaleDateString('en-IN')}"`
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(','))
    ].join('\n');

    // Create dynamic download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Toyota_Sales_Report_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 py-2">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Sales Logs</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Audit and export Sales Officers' monthly sheets and payout logs.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto self-start sm:self-center">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border border-neutral-200 hover:bg-neutral-50 px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider text-neutral-700 bg-white transition-colors cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
            Reload
          </button>
          
          <button
            onClick={exportToCSV}
            disabled={filteredRecords.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-toyota-red hover:bg-red-700 text-white px-4 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-5 border border-neutral-100 rounded-md shadow-xs">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-neutral-400" />
          </div>
          <input
            type="text"
            placeholder="Search by Sales Officer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-neutral-200 focus:border-toyota-red py-2 pl-9 pr-3 text-xs outline-none transition-all"
          />
        </div>

        {/* Custom Accounting Period Filter */}
        <div ref={filterRef} className="relative sm:col-span-2 select-none">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Calendar className="h-4 w-4 text-toyota-red" />
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="w-full h-full rounded border border-neutral-200 hover:border-neutral-300 focus:border-toyota-red py-2 pl-9 pr-10 text-xs outline-none font-semibold text-neutral-800 bg-white flex items-center justify-between cursor-pointer transition-all select-none shadow-xs min-h-[38px]"
          >
            <span>
              Period: {monthFilter ? getMonthName(monthFilter) : 'All Months'}{' '}
              {yearFilter ? yearFilter : 'All Years'}
            </span>
            <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-180 text-toyota-red' : ''}`} />
          </button>

          {isFilterOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-md border border-neutral-100 rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150 z-30">
              {/* Presets Header */}
              <div className="pb-3 border-b border-neutral-100">
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">Quick Presets</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMonthFilter('');
                      setYearFilter('');
                      setIsFilterOpen(false);
                    }}
                    className="flex-1 py-1 px-2 border border-neutral-200 hover:border-neutral-300 rounded text-[10px] font-bold text-neutral-600 hover:text-neutral-900 bg-white transition-all cursor-pointer text-center active:scale-95"
                  >
                    All Periods
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMonthFilter(currentMonth);
                      setYearFilter(String(currentYear));
                      setIsFilterOpen(false);
                    }}
                    className="flex-1 py-1 px-2 border border-toyota-red/30 hover:border-toyota-red/60 rounded text-[10px] font-bold text-toyota-red hover:bg-red-50/20 bg-white transition-all cursor-pointer text-center active:scale-95"
                  >
                    Current Month
                  </button>
                </div>
              </div>

              {/* Year Badges Selection */}
              <div className="py-3 border-b border-neutral-100">
                <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">Year Filter</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { code: '', label: 'All Years' },
                    { code: '2025', label: '2025' },
                    { code: '2026', label: '2026' },
                    { code: '2027', label: '2027' },
                  ].map((y) => {
                    const isSelected = yearFilter === y.code;
                    return (
                      <button
                        key={y.code}
                        type="button"
                        onClick={() => setYearFilter(y.code)}
                        className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-neutral-900 text-white font-bold'
                            : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                        }`}
                      >
                        {y.label}
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
                    setMonthFilter('');
                    setIsFilterOpen(false);
                  }}
                  className={`w-full py-1 rounded text-[10px] font-bold text-center border transition-all mb-2 cursor-pointer active:scale-95 ${
                    monthFilter === ''
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
                    const isSelected = monthFilter === m.code;
                    const isCurrent = m.code === currentMonth && (!yearFilter || yearFilter === String(currentYear));
                    
                    return (
                      <button
                        key={m.code}
                        type="button"
                        onClick={() => {
                          setMonthFilter(m.code);
                          setIsFilterOpen(false);
                        }}
                        className={`relative py-1.5 text-[10px] font-semibold rounded transition-all cursor-pointer text-center select-none active:scale-95 ${
                          isSelected
                            ? 'bg-toyota-red text-white shadow-sm shadow-toyota-red/10'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        {m.name}
                        {isCurrent && (
                          <span
                            className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-0.5 rounded-full ${
                              isSelected ? 'bg-white' : 'bg-toyota-red'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-11 bg-neutral-100 rounded animate-pulse"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-50/55 rounded border border-neutral-100 animate-pulse"></div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white py-16 px-6 text-center border border-neutral-100 rounded-md">
          <p className="text-xs text-neutral-400 font-medium">
            No sales logs matching the current search query or filter options.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-md border border-neutral-100 overflow-hidden shadow-xs">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-neutral-100 text-left text-sm text-neutral-900">
                <thead className="bg-neutral-50/50 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="px-6 py-4">Officer Name</th>
                    <th className="px-6 py-4">Month / Year</th>
                    <th className="px-6 py-4 text-center">Total Volume</th>
                    <th className="px-6 py-4">Rate</th>
                    <th className="px-6 py-4">Incentive</th>
                    <th className="px-6 py-4 text-right">Ledger</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {filteredRecords.map((rec) => {
                    const isExpanded = expandedId === rec._id;
                    return (
                      <React.Fragment key={rec._id}>
                        <tr className="hover:bg-neutral-50/40 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="font-semibold text-neutral-900 block">{rec.officerId?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-neutral-400 block mt-0.5">{rec.officerId?.email || 'N/A'}</span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-neutral-800 text-xs">
                            {getMonthName(rec.month)} {rec.year}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center font-bold text-neutral-800 text-sm">
                            {rec.totalCars} units
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-medium text-neutral-500 text-xs">
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
                              {isExpanded ? 'Hide' : 'View'}
                              <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180 text-toyota-red' : ''}`} />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-neutral-50/20">
                            <td colSpan={6} className="px-8 py-5 border-t border-neutral-100">
                              <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Details</span>
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

          {/* Mobile Stacked Card List */}
          <div className="block md:hidden space-y-4">
            {filteredRecords.map((rec) => {
              const isExpanded = expandedId === rec._id;
              return (
                <div key={rec._id} className="bg-white border border-neutral-100 rounded-md p-5 space-y-4 hover:border-neutral-200/80 transition-colors">
                  
                  {/* Header: Officer Info & Period */}
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div>
                      <span className="font-semibold text-sm text-neutral-900 block">{rec.officerId?.name || 'Unknown'}</span>
                      <span className="text-[10px] text-neutral-400 block mt-0.5">{rec.officerId?.email || 'N/A'}</span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-600 bg-neutral-50 border border-neutral-200/50 px-2 py-0.5 rounded">
                      {getMonthName(rec.month)} {rec.year}
                    </span>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-3 gap-4 py-1">
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Volume</span>
                      <span className="text-xs font-medium text-neutral-800 mt-0.5 block">{rec.totalCars} units</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Rate</span>
                      <span className="text-xs font-medium text-neutral-500 mt-0.5 block">₹{rec.incentiveRate}/unit</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400">Incentive</span>
                      <span className="text-xs font-bold text-toyota-red mt-0.5 block">₹{rec.totalIncentive.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Breakdown Toggle Button */}
                  <button
                    onClick={() => toggleExpand(rec._id)}
                    className="w-full flex items-center justify-center gap-1.5 bg-neutral-50 hover:bg-neutral-100/70 text-neutral-600 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    {isExpanded ? 'Hide Breakdowns' : 'View Model Volumes'}
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Breakdown Block */}
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
