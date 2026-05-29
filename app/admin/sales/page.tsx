'use client';

import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Calendar, Car, Award, ChevronDown, RefreshCw } from 'lucide-react';

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
      'Vehicle Models Sold Breakdowns',
      'Total Cars Sold',
      'Nominal Incentive Rate (₹)',
      'Total Incentive Disbursed (₹)',
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
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-toyota-black">Sales Record Ledger</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-toyota-charcoal">
            Review detailed monthly quantity adjustments and final pay disbursements.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full sm:w-auto self-start sm:self-center">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-100 px-3 py-2.5 rounded text-xs font-bold uppercase transition-colors tracking-wider cursor-pointer"
            title="Refresh Logs"
          >
            <RefreshCw className="h-4 w-4" />
            Reload
          </button>
          
          <button
            onClick={exportToCSV}
            disabled={filteredRecords.length === 0}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 bg-toyota-red hover:bg-red-700 text-toyota-white px-4 py-2.5 rounded text-xs font-bold uppercase transition-colors tracking-wider shadow cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-toyota-white p-4 border border-gray-200 rounded-lg shadow-sm">
        {/* Search */}
        <div className="relative sm:col-span-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-toyota-charcoal" />
          </div>
          <input
            type="text"
            placeholder="Search by Sales Officer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none"
          />
        </div>

        {/* Month Filter */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Calendar className="h-4 w-4 text-toyota-charcoal" />
          </div>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none appearance-none font-semibold text-toyota-charcoal bg-toyota-white"
          >
            <option value="">All Months</option>
            <option value="01">January</option>
            <option value="02">February</option>
            <option value="03">March</option>
            <option value="04">April</option>
            <option value="05">May</option>
            <option value="06">June</option>
            <option value="07">July</option>
            <option value="08">August</option>
            <option value="09">September</option>
            <option value="10">October</option>
            <option value="11">November</option>
            <option value="12">December</option>
          </select>
        </div>

        {/* Year Filter */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="h-4 w-4 text-toyota-charcoal" />
          </div>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none appearance-none font-semibold text-toyota-charcoal bg-toyota-white"
          >
            <option value="">All Years</option>
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-gray-250 rounded"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-250 rounded"></div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-toyota-white p-12 text-center border border-gray-200 rounded-lg shadow-sm">
          <p className="text-sm text-toyota-charcoal font-semibold">
            No sales logs matching the current search criteria or filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Desktop Table View (visible on screen widths >= md) */}
          <div className="hidden md:block bg-toyota-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-250 text-left text-sm text-toyota-black">
                <thead className="bg-toyota-light-gray text-xs font-bold uppercase tracking-wider text-toyota-charcoal">
                  <tr>
                    <th className="px-6 py-4">Officer Name</th>
                    <th className="px-6 py-4">Month / Year</th>
                    <th className="px-6 py-4 text-center">Total Volume</th>
                    <th className="px-6 py-4">Highest Tier</th>
                    <th className="px-6 py-4">Payout Amount (INR)</th>
                    <th className="px-6 py-4 text-right">Model Breakdowns</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-toyota-white">
                  {filteredRecords.map((rec) => {
                    const isExpanded = expandedId === rec._id;
                    return (
                      <React.Fragment key={rec._id}>
                        <tr className="odd:bg-toyota-white even:bg-toyota-light-gray/25 hover:bg-toyota-light-gray/50 transition-colors">
                          <td className="whitespace-nowrap px-6 py-4">
                            <span className="font-bold block">{rec.officerId?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-toyota-charcoal">{rec.officerId?.email || 'N/A'}</span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-semibold">
                            {getMonthName(rec.month)} {rec.year}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-center font-bold text-lg">
                            {rec.totalCars}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-semibold text-toyota-charcoal">
                            ₹{rec.incentiveRate.toLocaleString('en-IN')}/car
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 font-black text-toyota-red text-md">
                            ₹{rec.totalIncentive.toLocaleString('en-IN')}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right">
                            <button
                              onClick={() => toggleExpand(rec._id)}
                              className="inline-flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              <Car className="h-4 w-4" />
                              {isExpanded ? 'Hide' : 'Expand'}
                              <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-toyota-light-gray/50">
                            <td colSpan={6} className="px-8 py-4 border-t border-gray-200">
                              <div className="space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-toyota-charcoal flex items-center gap-1">
                                  <Car className="h-3.5 w-3.5 text-toyota-red" />
                                  Individual Model quantities sold:
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                  {rec.sales.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="bg-toyota-white p-3 border border-gray-200 rounded shadow-sm flex items-center justify-between"
                                    >
                                      <div>
                                        <span className="block font-bold text-sm">
                                          {item.modelId?.modelName || 'Deleted Model'}
                                        </span>
                                        <span className="block text-[10px] text-toyota-charcoal">
                                          {item.modelId?.baseSuffix} {item.modelId?.variant}
                                        </span>
                                      </div>
                                      <span className="text-lg font-black text-toyota-black bg-toyota-light-gray px-2 py-0.5 rounded">
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

          {/* Mobile Stacked Card List (visible on screen widths < md) */}
          <div className="block md:hidden space-y-4">
            {filteredRecords.map((rec) => {
              const isExpanded = expandedId === rec._id;
              return (
                <div key={rec._id} className="bg-toyota-white border border-gray-200 rounded-lg p-4 shadow-sm hover:border-gray-300 transition-colors space-y-3">
                  
                  {/* Header: Officer Info & Period */}
                  <div className="flex items-center justify-between border-b border-gray-150 pb-2.5">
                    <div>
                      <span className="font-bold text-sm text-toyota-black block">{rec.officerId?.name || 'Unknown'}</span>
                      <span className="text-[10px] text-toyota-charcoal block">{rec.officerId?.email || 'N/A'}</span>
                    </div>
                    <span className="text-xs font-bold text-toyota-charcoal bg-toyota-light-gray px-2 py-1 rounded">
                      {getMonthName(rec.month)} {rec.year}
                    </span>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 py-1">
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-toyota-charcoal">Volume</span>
                      <span className="text-sm font-bold text-toyota-black mt-0.5 block">{rec.totalCars} Cars</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-toyota-charcoal">Slab Rate</span>
                      <span className="text-xs font-semibold text-toyota-charcoal mt-0.5 block">₹{rec.incentiveRate}/car</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-toyota-charcoal">Payout</span>
                      <span className="text-sm font-bold text-toyota-red mt-0.5 block">₹{rec.totalIncentive.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Breakdown Toggle Button */}
                  <button
                    onClick={() => toggleExpand(rec._id)}
                    className="w-full flex items-center justify-center gap-1.5 border border-gray-300 hover:bg-gray-100 py-2 rounded text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    <Car className="h-3.5 w-3.5 text-toyota-charcoal" />
                    {isExpanded ? 'Hide Breakdowns' : 'View Model Volumes'}
                    <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Breakdown Block */}
                  {isExpanded && (
                    <div className="bg-toyota-light-gray/50 p-3 rounded-md border border-gray-200/50 space-y-2 animate-in slide-in-from-top-1 duration-150">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-toyota-charcoal flex items-center gap-1">
                        <Car className="h-3.5 w-3.5 text-toyota-red" />
                        Individual Model Breakdown:
                      </h4>
                      <div className="space-y-1.5">
                        {rec.sales.map((item, idx) => (
                          <div key={idx} className="bg-toyota-white px-3 py-2 border border-gray-150 rounded flex items-center justify-between text-xs">
                            <div>
                              <span className="font-bold text-toyota-black block">{item.modelId?.modelName || 'Deleted Model'}</span>
                              <span className="text-[9px] text-toyota-charcoal block">{item.modelId?.baseSuffix} {item.modelId?.variant}</span>
                            </div>
                            <span className="font-bold bg-toyota-light-gray px-2 py-0.5 rounded text-toyota-black shrink-0">
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
