'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Save, CheckCircle, Lock, ShieldAlert, FileClock, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface CarModel {
  _id: string;
  modelName: string;
  baseSuffix: string;
  variant: string;
  isActive: boolean;
}

interface Slab {
  _id: string;
  startCount: number;
  endCount: number | null;
  rate: number;
}

interface PreviewData {
  totalCars: number;
  calculationMode: string;
  totalIncentive: number;
  nominalRate: number;
  breakdown: {
    slabRange: string;
    count: number;
    rate: number;
    subtotal: number;
  }[];
}

export default function OfficerDashboardPage() {
  const [cars, setCars] = useState<CarModel[]>([]);
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector state
  const [selectedMonth, setSelectedMonth] = useState('05');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Click outside to close custom period picker
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    }
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  // Locked state
  const [isLocked, setIsLocked] = useState(false);

  // Custom confirm submit modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Volumes entered per modelId
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  // Preview results from API
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Dates and Locking constraints configuration
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = now.getFullYear();

  const isCurrentMonth = selectedMonth === currentMonth && selectedYear === currentYear;
  const isFutureMonth = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);
  const isPastMonth = selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth);

  const isEditable = isCurrentMonth && !isLocked;

  // Load cars and slabs on mount
  useEffect(() => {
    async function initData() {
      try {
        const [carsRes, slabsRes] = await Promise.all([
          fetch('/api/admin/cars'),
          fetch('/api/admin/slabs')
        ]);

        if (carsRes.ok && slabsRes.ok) {
          const carsData = await carsRes.json();
          const slabsData = await slabsRes.json();
          
          const activeCars = (carsData.cars || []).filter((c: CarModel) => c.isActive);
          setCars(activeCars);
          setSlabs(slabsData.slabs || []);

          const initialVolumes: Record<string, number> = {};
          activeCars.forEach((c: CarModel) => {
            initialVolumes[c._id] = 0;
          });
          setVolumes(initialVolumes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Fetch or populate existing record when month/year changes
  useEffect(() => {
    if (cars.length === 0) return;

    const isFuture = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);
    if (isFuture) {
      const newVolumes: Record<string, number> = {};
      cars.forEach((c) => {
        newVolumes[c._id] = 0;
      });
      setVolumes(newVolumes);
      setIsLocked(false);
      setPreview(null);
      return;
    }

    async function fetchExistingSales() {
      setPreviewLoading(true);
      try {
        const res = await fetch('/api/officer/history');
        if (res.ok) {
          const data = await res.json();
          const record = (data.records || []).find(
            (r: any) => r.month === selectedMonth && r.year === selectedYear
          );

          const newVolumes: Record<string, number> = {};
          cars.forEach((c) => {
            newVolumes[c._id] = 0;
          });

          // Reset locked state
          setIsLocked(false);

          if (record && Array.isArray(record.sales)) {
            record.sales.forEach((item: any) => {
              if (item.modelId) {
                const modelIdStr = typeof item.modelId === 'object' ? item.modelId._id : item.modelId;
                newVolumes[modelIdStr] = item.quantity;
              }
            });
            if (record.status === 'submitted') {
              setIsLocked(true);
            }
            setNotification({
              type: 'success',
              message: `Sales records synced for ${getMonthName(selectedMonth)} ${selectedYear}.`
            });
            setTimeout(() => setNotification(null), 3000);
          }
          setVolumes(newVolumes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setPreviewLoading(false);
      }
    }
    fetchExistingSales();
  }, [selectedMonth, selectedYear, cars]);

  // Run calculation preview as volumes change
  useEffect(() => {
    if (loading || cars.length === 0) return;

    const isFuture = selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth);
    if (isFuture) {
      setPreview(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      
      const salesPayload = Object.entries(volumes).map(([modelId, quantity]) => ({
        modelId,
        quantity
      }));

      try {
        const res = await fetch('/api/officer/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            month: selectedMonth,
            year: Number(selectedYear),
            sales: salesPayload,
            previewOnly: true
          })
        });

        if (res.ok) {
          const data = await res.json();
          setPreview(data.preview);
        }
      } catch (err) {
        console.error('Preview calc error:', err);
      } finally {
        setPreviewLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [volumes, selectedMonth, selectedYear, loading, cars]);

  const handleQtyChange = (modelId: string, value: string) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setVolumes((prev) => ({
      ...prev,
      [modelId]: qty
    }));
  };

  const handleSubmit = async (action: 'save_draft' | 'submit') => {
    setSubmitting(true);
    setNotification(null);

    const salesPayload = Object.entries(volumes).map(([modelId, quantity]) => ({
      modelId,
      quantity
    }));

    try {
      const res = await fetch('/api/officer/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: selectedMonth,
          year: Number(selectedYear),
          sales: salesPayload,
          previewOnly: false,
          action
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: 'success',
          message: action === 'submit'
            ? `Sales sheet submitted and locked permanently. Total incentive: ₹${data.record.totalIncentive.toLocaleString('en-IN')}`
            : `Sales draft saved successfully.`
        });
        if (action === 'submit') {
          setIsLocked(true);
        }
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to save sales.'
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: 'Submission failed due to network error.'
      });
    } finally {
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getMonthName = (monthStr: string) => {
    const months: Record<string, string> = {
      '01': 'January', '02': 'February', '03': 'March', '04': 'April',
      '05': 'May', '06': 'June', '07': 'July', '08': 'August',
      '09': 'September', '10': 'October', '11': 'November', '12': 'December'
    };
    return months[monthStr] || monthStr;
  };

  const getNextTierGap = () => {
    if (!preview || slabs.length === 0) return null;
    const total = preview.totalCars;
    
    const sorted = [...slabs].sort((a, b) => a.startCount - b.startCount);
    const nextSlab = sorted.find((s) => total < s.startCount);

    if (!nextSlab) {
      return { completed: true, message: 'Max slab rate unlocked.' };
    }

    const gap = nextSlab.startCount - total;
    return {
      completed: false,
      gap,
      nextRate: nextSlab.rate,
      message: `+${gap} units to unlock ₹${nextSlab.rate.toLocaleString('en-IN')}/car rate.`
    };
  };

  const gapInfo = getNextTierGap();

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-xs font-medium text-neutral-400">
        <div className="h-4 w-4 border-2 border-neutral-200 border-t-toyota-red rounded-full animate-spin" />
        <span>Loading sales dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-neutral-100 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900">Sales Worksheet</h1>
            <p className="text-xs text-neutral-400 mt-1">Input monthly unit sales to automatically calculate incentives.</p>
          </div>
          {/* Dynamic Status Badge */}
          <div className="shrink-0 self-center">
            {isLocked ? (
              <span className="inline-flex items-center gap-1 bg-red-50 text-toyota-red border border-red-100 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider select-none">
                <Lock className="h-3 w-3" /> Locked
              </span>
            ) : isFutureMonth ? (
              <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-500 border border-neutral-200/60 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider select-none">
                Blocked
              </span>
            ) : isPastMonth ? (
              <span className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 border border-neutral-200/60 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider select-none">
                Read-Only
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider select-none">
                Draft
              </span>
            )}
          </div>
        </div>
        
        {/* Month Selector */}
        <div ref={pickerRef} className="relative select-none z-40">
          <button
            type="button"
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="flex items-center gap-2 bg-neutral-50 hover:bg-neutral-100/70 border border-neutral-200/60 px-3.5 py-1.5 rounded text-xs font-semibold text-neutral-800 transition-all cursor-pointer shadow-xs select-none focus:outline-none"
          >
            <Calendar className="h-3.5 w-3.5 text-toyota-red shrink-0" />
            <span>{getMonthName(selectedMonth)} {selectedYear}</span>
            <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${isPickerOpen ? 'rotate-180 text-toyota-red' : ''}`} />
          </button>

          {isPickerOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md border border-neutral-100 rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Year Navigation */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => Math.max(2025, y - 1))}
                  disabled={selectedYear <= 2025}
                  className="p-1 rounded-full text-neutral-400 hover:text-toyota-red hover:bg-neutral-50 transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold text-neutral-800 tracking-tight select-none">
                  {selectedYear}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedYear((y) => Math.min(2027, y + 1))}
                  disabled={selectedYear >= 2027}
                  className="p-1 rounded-full text-neutral-400 hover:text-toyota-red hover:bg-neutral-50 transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Month Grid */}
              <div className="grid grid-cols-3 gap-1.5 pt-3">
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
                  const isCurrent = m.code === currentMonth && selectedYear === currentYear;

                  return (
                    <button
                      key={m.code}
                      type="button"
                      onClick={() => {
                        setSelectedMonth(m.code);
                        setIsPickerOpen(false);
                      }}
                      className={`relative py-2 text-[11px] font-semibold rounded transition-all cursor-pointer text-center select-none active:scale-95 ${
                        isSelected
                          ? 'bg-toyota-red text-white shadow-sm shadow-toyota-red/10'
                          : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                    >
                      {m.name}
                      {isCurrent && (
                        <span
                          className={`absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full ${
                            isSelected ? 'bg-white' : 'bg-toyota-red'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div className={`p-4 border rounded-md transition-all ${
          notification.type === 'success'
            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800'
            : 'bg-rose-50/50 border-rose-100 text-toyota-red'
        }`}>
          <p className="text-xs font-semibold">{notification.message}</p>
        </div>
      )}

      {/* THREE SIMPLE STATS */}
      {preview && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-neutral-100 rounded-md">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Total Units Sold
            </span>
            <span className="block text-2xl font-light tracking-tight text-neutral-900 mt-1">
              {preview.totalCars} <span className="text-xs font-normal text-neutral-400">units</span>
            </span>
          </div>

          <div className="bg-white p-6 border border-neutral-100 rounded-md">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              Calculated Rate
            </span>
            <span className="block text-2xl font-light tracking-tight text-neutral-900 mt-1">
              ₹{preview.nominalRate.toLocaleString('en-IN')} <span className="text-xs font-normal text-neutral-400">/ unit</span>
            </span>
          </div>

          <div className="bg-white p-6 border border-neutral-100 rounded-md">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
              {isLocked ? 'Final Incentive' : 'Estimated Incentive'}
            </span>
            <span className="block text-2xl font-semibold tracking-tight text-toyota-red mt-1">
              ₹{preview.totalIncentive.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* COMPACT SLAB GUIDE ROADMAP */}
      {slabs.length > 0 && (
        <div className="bg-white p-6 rounded-md border border-neutral-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Incentive Tiers</h3>
            {gapInfo && !gapInfo.completed && (
              <span className="text-xs text-toyota-red font-medium">
                {gapInfo.message}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {slabs.map((slab) => {
              const isActive = preview && preview.totalCars >= slab.startCount && (slab.endCount === null || preview.totalCars <= slab.endCount);
              return (
                <div
                  key={slab._id}
                  className={`px-4 py-3 rounded border transition-all ${
                    isActive
                      ? 'bg-toyota-red/5 border-toyota-red/30'
                      : 'bg-neutral-50/50 border-neutral-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? 'text-toyota-red' : 'text-neutral-400'}`}>
                      {slab.endCount ? `${slab.startCount}–${slab.endCount} units` : `${slab.startCount}+ units`}
                    </span>
                    {isActive && (
                      <span className="h-1.5 w-1.5 rounded-full bg-toyota-red animate-pulse" />
                    )}
                  </div>
                  <div className={`text-base font-semibold mt-1 ${isActive ? 'text-toyota-red' : 'text-neutral-800'}`}>
                    ₹{slab.rate.toLocaleString('en-IN')}
                    <span className="text-[10px] font-normal text-neutral-400 block sm:inline sm:ml-0.5">/unit</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ENTRY SHEET & INCENTIVE DETAILS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Sales Ledger Sheet */}
        <div className="bg-white p-8 rounded-md border border-neutral-100 space-y-6">
          <div className="border-b border-neutral-100 pb-4">
            <h3 className="text-base font-semibold text-neutral-900 tracking-tight">Sales Entry</h3>
            <p className="text-xs text-neutral-400 mt-1">Record the units delivered for each Toyota model below.</p>
          </div>

          {cars.length === 0 ? (
            <div className="text-center text-neutral-400 text-xs py-8">No active vehicle models found.</div>
          ) : (
            <div className="space-y-6">
              <div className="divide-y divide-neutral-100">
                {cars.map((car) => {
                  const val = volumes[car._id] || 0;
                  return (
                    <div key={car._id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0 gap-6">
                      <div className="space-y-0.5">
                        <span className="block font-semibold text-sm text-neutral-900 tracking-tight">{car.modelName}</span>
                        <span className="block text-[11px] text-neutral-400">{car.baseSuffix} · {car.variant}</span>
                      </div>
                      {isEditable ? (
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            min="0"
                            value={val || ''}
                            onChange={(e) => handleQtyChange(car._id, e.target.value)}
                            className="w-24 bg-white border border-neutral-200 focus:border-toyota-red rounded px-3 py-1.5 text-right font-semibold text-sm text-neutral-800 outline-none transition-all"
                            placeholder="0"
                          />
                          <span className="text-[10px] font-medium text-neutral-400 ml-2 uppercase">units</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded border border-neutral-100">
                          <span className="text-sm font-bold text-neutral-800">{val}</span>
                          <span className="text-[10px] font-medium text-neutral-400 uppercase">units</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-neutral-100 flex flex-wrap gap-3 justify-end">
                {isEditable ? (
                  <>
                    <button
                      onClick={() => handleSubmit('save_draft')}
                      disabled={submitting || previewLoading}
                      className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Save className="h-3.5 w-3.5 text-neutral-500" />
                      Save Draft
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={submitting || previewLoading}
                      className="px-4 py-2 bg-toyota-red hover:bg-red-700 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      Submit & Lock
                    </button>
                  </>
                ) : (
                  <div className="p-3.5 bg-neutral-50 border border-neutral-100 rounded text-center w-full flex items-center justify-center gap-2">
                    {isLocked ? (
                      <>
                        <Lock className="h-3.5 w-3.5 text-toyota-red animate-pulse" />
                        <span className="text-xs text-neutral-600 font-medium">
                          Calculations are frozen. Submission has been finalized and locked.
                        </span>
                      </>
                    ) : isFutureMonth ? (
                      <>
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-xs text-neutral-500 font-medium">
                          Future months are locked and cannot be edited.
                        </span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-3.5 w-3.5 text-neutral-400" />
                        <span className="text-xs text-neutral-500 font-medium">
                          Past months are archived in read-only audit mode.
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Live Calculation Panel */}
        <div className="bg-white p-8 rounded-md border border-neutral-100 flex flex-col justify-between min-h-[400px]">
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-4">
              <h3 className="text-base font-semibold text-neutral-900 tracking-tight">Calculation Summary</h3>
              <p className="text-xs text-neutral-400 mt-1">Real-time incentive audit based on active slabs.</p>
            </div>

            {previewLoading ? (
              <div className="h-48 flex flex-col items-center justify-center text-xs text-neutral-400 gap-2">
                <div className="h-4 w-4 border-2 border-neutral-200 border-t-toyota-red rounded-full animate-spin" />
                <span>Recalculating details...</span>
              </div>
            ) : !preview || preview.totalCars === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-100 rounded-lg">
                <span className="text-xs font-semibold text-neutral-400">No units entered</span>
                <span className="text-[11px] text-neutral-400 mt-1.5 max-w-[220px] leading-relaxed">
                  Input sold quantities in the entry sheet to preview calculation breakdowns.
                </span>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Detailed breakdown list */}
                <div className="space-y-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 block">Slab Breakdown</span>
                  <div className="border border-neutral-100 rounded bg-neutral-50/30 divide-y divide-neutral-100 overflow-hidden">
                    {preview.breakdown && preview.breakdown.length > 0 ? (
                      preview.breakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center px-4 py-3 text-xs">
                          <div>
                            <span className="font-semibold text-neutral-800 block">{item.slabRange} Units</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">{item.count} units sold at this rate</span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-neutral-800 block">₹{item.subtotal.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-neutral-400 mt-0.5">₹{item.rate.toLocaleString('en-IN')}/unit</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between items-center px-4 py-3 text-xs">
                        <div>
                          <span className="font-semibold text-neutral-800 block">Standard Rate</span>
                          <span className="text-[10px] text-neutral-400 mt-0.5">{preview.totalCars} units sold</span>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-neutral-800 block">₹{preview.totalIncentive.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-neutral-400 mt-0.5">₹{preview.nominalRate.toLocaleString('en-IN')}/unit</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Receipt Total */}
                <div className="bg-neutral-50 border border-neutral-100 rounded p-4 space-y-2.5">
                  <div className="flex justify-between text-xs text-neutral-500 font-medium">
                    <span>Gross Sales Volume</span>
                    <span className="font-semibold text-neutral-700">{preview.totalCars} units</span>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-500 font-medium">
                    <span>Final Slab Rate</span>
                    <span className="font-semibold text-neutral-700">₹{preview.nominalRate.toLocaleString('en-IN')}/unit</span>
                  </div>
                  <div className="h-[1px] bg-neutral-200 my-1" />
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="text-xs font-semibold text-neutral-800">Total Incentive Payout</span>
                    <span className="text-xl font-bold text-toyota-red">
                      ₹{preview.totalIncentive.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Note block at the bottom */}
          {preview && preview.totalCars > 0 && (
            <div className="text-[11px] text-neutral-500 leading-relaxed p-3.5 bg-neutral-50 border border-neutral-100 rounded mt-6">
              <span className="font-semibold text-neutral-800 uppercase tracking-wider block text-[9px] mb-1">Incentive Audit Protocol</span>
              {isLocked ? (
                <span className="text-toyota-red font-medium">
                  ★ Frozen payout record. This month is permanently locked in the ledger; administrative slab changes will not affect this payout.
                </span>
              ) : (
                <span>
                  Payout is computed live using the highest unlocked slab applied flat to all sold units. Saving or submitting finalizes these values.
                </span>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Simple Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white max-w-sm w-full p-6 shadow-xl border border-neutral-100 rounded-md animate-in zoom-in-95 duration-150">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                  Submit Monthly Sheet
                </h3>
                <p className="text-xs text-neutral-500 mt-2.5 leading-relaxed">
                  This will finalize and lock your sales worksheet for <strong className="text-neutral-800 font-semibold">{getMonthName(selectedMonth)} {selectedYear}</strong>. Once submitted, you cannot make further edits.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-600 rounded bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmModal(false);
                    handleSubmit('submit');
                  }}
                  className="px-4 py-2 bg-toyota-red hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider rounded cursor-pointer transition-colors shadow-sm"
                >
                  Submit & Lock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
