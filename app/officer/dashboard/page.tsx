'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Car, Trophy, Sparkles, HelpCircle, Save, Info } from 'lucide-react';

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
  calculationMode: 'progressive' | 'flat';
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

  // Volumes entered per modelId
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  // Preview results from API
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
          
          // Only show active models
          const activeCars = (carsData.cars || []).filter((c: CarModel) => c.isActive);
          setCars(activeCars);
          setSlabs(slabsData.slabs || []);

          // Initialize volumes
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
          // Initialize with 0
          cars.forEach((c) => {
            newVolumes[c._id] = 0;
          });

          if (record && Array.isArray(record.sales)) {
            record.sales.forEach((item: any) => {
              if (item.modelId) {
                const modelIdStr = typeof item.modelId === 'object' ? item.modelId._id : item.modelId;
                newVolumes[modelIdStr] = item.quantity;
              }
            });
            setNotification({
              type: 'success',
              message: `Retrieved saved sales records for ${getMonthName(selectedMonth)} ${selectedYear}.`
            });
            setTimeout(() => setNotification(null), 4000);
          }
          setVolumes(newVolumes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setPreviewLoading(false);
      }
    }
    fetchExistingSales();
  }, [selectedMonth, selectedYear, cars]);

  // Run calculation preview as volumes change
  useEffect(() => {
    if (loading || cars.length === 0) return;

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
    }, 300); // Debounce typing by 300ms

    return () => clearTimeout(timer);
  }, [volumes, selectedMonth, selectedYear, loading, cars]);

  const handleQtyChange = (modelId: string, value: string) => {
    const qty = Math.max(0, parseInt(value) || 0);
    setVolumes((prev) => ({
      ...prev,
      [modelId]: qty
    }));
  };

  const handleIncrement = (modelId: string) => {
    setVolumes((prev) => ({
      ...prev,
      [modelId]: (prev[modelId] || 0) + 1
    }));
  };

  const handleDecrement = (modelId: string) => {
    setVolumes((prev) => ({
      ...prev,
      [modelId]: Math.max(0, (prev[modelId] || 0) - 1)
    }));
  };

  const handleSubmit = async () => {
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
          previewOnly: false
        })
      });

      const data = await res.json();
      if (res.ok) {
        setNotification({
          type: 'success',
          message: `Successfully logged May sales performance! Total Incentive calculated: ₹${data.record.totalIncentive.toLocaleString('en-IN')}`
        });
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to submit monthly sales record.'
        });
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: 'Network error. Submission failed.'
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

  // GAP ANALYSER: Calculates units needed to hit the next tier rate
  const getNextTierGap = () => {
    if (!preview || slabs.length === 0) return null;
    const total = preview.totalCars;
    
    // Find the next slab that starts higher than total
    const sorted = [...slabs].sort((a, b) => a.startCount - b.startCount);
    const nextSlab = sorted.find((s) => total < s.startCount);

    if (!nextSlab) {
      return { completed: true, message: 'Top Incentive Tier Reached!' };
    }

    const gap = nextSlab.startCount - total;
    return {
      completed: false,
      gap,
      nextRate: nextSlab.rate,
      message: `Sell ${gap} more car${gap > 1 ? 's' : ''} to reach the ₹${nextSlab.rate}/car tier!`
    };
  };

  const gapInfo = getNextTierGap();

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-gray-250 rounded"></div>
        <div className="h-44 bg-gray-250 rounded-lg"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-gray-250 rounded-lg"></div>
          <div className="h-96 bg-gray-250 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-toyota-black">Sales Submission Portal</h1>
          <p className="mt-1 text-sm text-toyota-charcoal">
            Log your vehicle volumes and view dynamic tiered incentive calculations in real time.
          </p>
        </div>
        
        {/* Month Picker Selection Panel */}
        <div className="bg-toyota-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
          <Calendar className="h-4 w-4 text-toyota-red" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs font-bold text-toyota-charcoal outline-none cursor-pointer bg-toyota-white"
          >
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
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded border border-gray-300 px-2 py-1 text-xs font-bold text-toyota-charcoal outline-none cursor-pointer bg-toyota-white"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-md text-sm border flex items-center gap-2 ${
          notification.type === 'success'
            ? 'bg-green-50 text-green-800 border-green-200'
            : 'bg-red-50 text-toyota-red border-toyota-red/10'
        }`}>
          <Info className="h-5 w-5 shrink-0" />
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      {/* TRACKER KPI GRID */}
      {preview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Cars Sold */}
          <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold uppercase tracking-widest text-toyota-charcoal">
                Volume Sold
              </span>
              <span className="block mt-2 text-3xl font-black text-toyota-black">
                {preview.totalCars} Cars
              </span>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg text-toyota-charcoal">
              <Car className="h-6 w-6 text-toyota-dark-gray" />
            </div>
          </div>

          {/* 2. Calculated Incentive */}
          <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold uppercase tracking-widest text-toyota-charcoal">
                Calculated Payout
              </span>
              <span className="block mt-2 text-3xl font-black text-toyota-red">
                ₹{preview.totalIncentive.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="p-3 bg-red-50 text-toyota-red rounded-lg">
              <Trophy className="h-6 w-6" />
            </div>
          </div>

          {/* 3. Current Tier Rate */}
          <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold uppercase tracking-widest text-toyota-charcoal">
                Highest Rate Reached
              </span>
              <span className="block mt-2 text-3xl font-black text-toyota-black">
                ₹{preview.nominalRate.toLocaleString('en-IN')}/car
              </span>
            </div>
            <div className="p-3 bg-gray-100 rounded-lg text-toyota-charcoal">
              <Sparkles className="h-6 w-6 text-toyota-dark-gray" />
            </div>
          </div>

          {/* 4. Gap Analyser */}
          <div className={`p-6 rounded-lg border shadow-sm flex items-center justify-between ${
            gapInfo?.completed
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div>
              <span className="block text-xs font-bold uppercase tracking-widest text-toyota-charcoal">
                Gap Analysis
              </span>
              <span className="block mt-2 text-sm font-bold leading-tight">
                {gapInfo?.message}
              </span>
            </div>
            <div className={`p-3 rounded-lg ${gapInfo?.completed ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
              <Trophy className="h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      {/* SEGMENTED PROGRESS METERS */}
      {preview && slabs.length > 0 && (
        <div className="bg-toyota-white p-6 border border-gray-200 rounded-lg shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-toyota-charcoal mb-4 flex items-center gap-1">
            <Trophy className="h-4 w-4 text-toyota-red" />
            Volume Incentive Slab Unlocks
          </h3>
          <div className="space-y-4">
            <div className="flex w-full bg-toyota-light-gray h-5 rounded-full overflow-hidden border border-gray-200">
              {slabs.map((slab, i) => {
                const start = slab.startCount;
                const end = slab.endCount !== null ? slab.endCount : Math.max(preview.totalCars + 2, start + 2);
                
                // Calculate percentage width of this segment relative to the total scale
                const totalMax = slabs[slabs.length - 1].endCount !== null 
                  ? slabs[slabs.length - 1].endCount || 10
                  : Math.max(preview.totalCars + 3, slabs[slabs.length - 1].startCount + 2);
                
                const segmentWidth = ((end - (start - 1)) / totalMax) * 100;
                
                // Check how much of this segment is filled by totalCars
                const filledCars = Math.max(0, Math.min(end, preview.totalCars) - (start - 1));
                const filledPercentage = (filledCars / (end - (start - 1))) * 100;

                return (
                  <div
                    key={slab._id}
                    className="h-full border-r border-gray-300/40 relative flex"
                    style={{ width: `${segmentWidth}%` }}
                  >
                    <div
                      className="bg-toyota-red h-full transition-all duration-300"
                      style={{ width: `${filledPercentage}%` }}
                    ></div>
                  </div>
                );
              })}
            </div>
            
            <div className="grid grid-cols-3 text-center gap-2">
              {slabs.map((slab, i) => {
                const isActive = preview.totalCars >= slab.startCount && (slab.endCount === null || preview.totalCars <= slab.endCount);
                const isPassed = preview.totalCars > (slab.endCount || Infinity);
                return (
                  <div key={slab._id} className="space-y-1">
                    <span className={`block text-xs font-bold ${isActive ? 'text-toyota-red' : isPassed ? 'text-toyota-black' : 'text-toyota-charcoal'}`}>
                      Tier {i + 1} ({slab.startCount}{slab.endCount ? `-${slab.endCount}` : '+'} Cars)
                    </span>
                    <span className="block text-[11px] font-semibold text-toyota-charcoal">
                      ₹{slab.rate.toLocaleString('en-IN')}/car
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CORE LOGGING SHEET */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Forms block - Log sales */}
        <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-150 pb-3">
            <h3 className="text-base font-bold uppercase tracking-wider text-toyota-black">
              Vehicle Volume Ledger
            </h3>
            <p className="text-xs text-toyota-charcoal mt-1">
              Enter your monthly quantities sold per active model line.
            </p>
          </div>

          {cars.length === 0 ? (
            <div className="p-8 text-center text-toyota-charcoal text-sm font-semibold">
              No active vehicle models registered in the database inventory. Contact your Administrator.
            </div>
          ) : (
            <div className="space-y-4">
              {cars.map((car) => {
                const val = volumes[car._id] || 0;
                return (
                  <div
                    key={car._id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-toyota-light-gray/20 transition-colors"
                  >
                    <div>
                      <span className="block font-bold text-sm text-toyota-black">{car.modelName}</span>
                      <span className="block text-[11px] font-semibold text-toyota-charcoal">
                        {car.baseSuffix} Trim · {car.variant}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecrement(car._id)}
                        className="h-8 w-8 rounded border border-gray-300 flex items-center justify-center text-md font-black hover:bg-gray-100 cursor-pointer select-none"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        value={val || ''}
                        onChange={(e) => handleQtyChange(car._id, e.target.value)}
                        className="w-16 rounded border border-gray-300 text-center py-1 font-bold text-sm outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleIncrement(car._id)}
                        className="h-8 w-8 rounded border border-gray-300 flex items-center justify-center text-md font-black hover:bg-gray-100 cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
              
              <div className="pt-4 border-t border-gray-150 flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={submitting || previewLoading}
                  className="flex items-center gap-1.5 bg-toyota-red hover:bg-red-700 text-toyota-white px-5 py-3 rounded text-xs font-bold uppercase transition-colors tracking-wider shadow cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? 'Saving Performance...' : 'Submit Monthly Sales'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Calculation Preview Breakdown drawer */}
        <div className="bg-toyota-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
          <div className="border-b border-gray-150 pb-3">
            <h3 className="text-base font-bold uppercase tracking-wider text-toyota-black flex items-center gap-1">
              <Info className="h-4 w-4 text-toyota-red shrink-0" />
              Live Calculations Breakdown
            </h3>
            <p className="text-xs text-toyota-charcoal mt-1">
              Step-by-step mathematical breakdown of estimated incentives.
            </p>
          </div>

          {previewLoading ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-toyota-red border-t-transparent"></div>
              <span className="text-xs text-toyota-charcoal font-semibold">Recalculating Preview...</span>
            </div>
          ) : !preview || preview.totalCars === 0 ? (
            <div className="p-12 text-center text-toyota-charcoal text-sm">
              Adjust volumes in the vehicle ledger to trigger the real-time calculations preview.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Calc details */}
              <div className="bg-toyota-light-gray p-4 rounded-lg border border-gray-200">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-toyota-charcoal mb-2">
                  Calculation Mode: {preview.calculationMode === 'progressive' ? 'Step Progressive' : 'Flat Retroactive'}
                </span>
                
                <div className="space-y-2">
                  {preview.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs font-semibold text-toyota-black py-1.5 border-b border-gray-200/50 last:border-b-0">
                      <span>
                        Tier Bracket {item.slabRange} ({item.count} Car{item.count > 1 ? 's' : ''})
                      </span>
                      <span>
                        {item.count} * ₹{item.rate.toLocaleString('en-IN')} = ₹{item.subtotal.toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs font-bold text-toyota-black pt-3 mt-1 border-t border-toyota-charcoal/30">
                  <span>TOTAL ESTIMATED PAYOUT</span>
                  <span className="text-toyota-red text-sm font-black">
                    ₹{preview.totalIncentive.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Explanatory notes */}
              <div className="text-[11px] text-toyota-charcoal space-y-2 border-t border-gray-150 pt-4">
                <h4 className="font-bold uppercase tracking-wider text-toyota-black flex items-center gap-1">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Understanding the math
                </h4>
                {preview.calculationMode === 'progressive' ? (
                  <p>
                    <span className="font-semibold text-toyota-black">Step Progressive Mode is active: </span>
                    Your incentive rate escalates as you cross volume thresholds. 
                    First 3 cars are paid at Tier 1, next 4 cars are paid at Tier 2, and any cars above 8 are paid at Tier 3.
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold text-toyota-black">Flat Retroactive Mode is active: </span>
                    Once you hit a volume slab, the highest rate reached is retroactively applied to <span className="font-bold text-toyota-black">all</span> cars sold during the month.
                  </p>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
