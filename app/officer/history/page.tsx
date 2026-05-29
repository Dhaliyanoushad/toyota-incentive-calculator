'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Car, Trophy, Award, ChevronDown, RefreshCw } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-toyota-black">Incentive Logs</h1>
          <p className="mt-0.5 text-xs sm:text-sm text-toyota-charcoal">
            Review your historical monthly sales records and compiled payout calculations.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors tracking-wider cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Table grid */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-gray-250 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-250 rounded"></div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="bg-toyota-white p-12 text-center border border-gray-200 rounded-lg shadow-sm">
          <Calendar className="h-12 w-12 text-toyota-charcoal mx-auto mb-3" />
          <h3 className="text-lg font-bold text-toyota-black mb-1">No Logs Found</h3>
          <p className="text-sm text-toyota-charcoal max-w-sm mx-auto">
            You haven't submitted any sales performances yet. Head over to the logging tab to submit your first report!
          </p>
        </div>
      ) : (
        <div className="bg-toyota-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="min-w-full divide-y divide-gray-250 text-left text-sm text-toyota-black">
              <thead className="bg-toyota-light-gray text-xs font-bold uppercase tracking-wider text-toyota-charcoal">
                <tr>
                  <th className="px-6 py-4">Submission Period</th>
                  <th className="px-6 py-4 text-center">Total Volume Sold</th>
                  <th className="px-6 py-4">Slab Rate Reached</th>
                  <th className="px-6 py-4">Compiled Payout</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-toyota-white">
                {records.map((rec) => {
                  const isExpanded = expandedId === rec._id;
                  return (
                    <React.Fragment key={rec._id}>
                      <tr className="odd:bg-toyota-white even:bg-toyota-light-gray/25 hover:bg-toyota-light-gray/50 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 font-bold">
                          {getMonthName(rec.month)} {rec.year}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-center font-bold text-lg text-toyota-charcoal">
                          {rec.totalCars} Cars
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-toyota-charcoal font-semibold">
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
                          <td colSpan={5} className="px-8 py-4 border-t border-gray-200">
                            <div className="space-y-3">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-toyota-charcoal flex items-center gap-1">
                                <Car className="h-3.5 w-3.5 text-toyota-red" />
                                Model Volume breakdown:
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
      )}
    </div>
  );
}
