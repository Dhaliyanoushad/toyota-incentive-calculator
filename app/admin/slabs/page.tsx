'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, Trash2, Save, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';

interface Slab {
  startCount: number;
  endCount: number | null;
  rate: number;
}

export default function AdminSlabsPage() {
  const [slabs, setSlabs] = useState<Slab[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchSlabs = async () => {
    try {
      const res = await fetch('/api/admin/slabs');
      if (res.ok) {
        const data = await res.json();
        setSlabs(data.slabs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlabs();
  }, []);

  const handleRateChange = (index: number, val: string) => {
    const rateVal = Math.max(0, Number(val) || 0);
    const updated = [...slabs];
    updated[index].rate = rateVal;
    setSlabs(updated);
    setErrorMsg('');
  };

  const handleEndChange = (index: number, val: string) => {
    const endVal = val === '' ? null : Math.max(1, Number(val) || 0);
    const updated = [...slabs];
    updated[index].endCount = endVal;
    
    // Automatically re-sequence subsequent start counts to ensure contiguity
    for (let i = index + 1; i < updated.length; i++) {
      const prevEnd = updated[i - 1].endCount;
      if (prevEnd !== null) {
        updated[i].startCount = prevEnd + 1;
      }
    }
    
    setSlabs(updated);
    setErrorMsg('');
  };

  const handleAddSlab = () => {
    setErrorMsg('');
    const updated = [...slabs];
    
    if (updated.length === 0) {
      updated.push({ startCount: 1, endCount: null, rate: 1000 });
    } else {
      // Re-structure the old final slab to have a finite limit
      const lastIndex = updated.length - 1;
      const prevStart = updated[lastIndex].startCount;
      
      // Default new limits
      updated[lastIndex].endCount = prevStart + 2;
      updated.push({
        startCount: prevStart + 3,
        endCount: null,
        rate: updated[lastIndex].rate + 1000
      });
    }
    setSlabs(updated);
  };

  const handleRemoveSlab = (index: number) => {
    setErrorMsg('');
    if (slabs.length <= 1) {
      setErrorMsg('You must have at least one incentive slab.');
      return;
    }

    const updated = slabs.filter((_, i) => i !== index);
    
    // Fix start counts for remaining sequence
    updated[0].startCount = 1;
    for (let i = 1; i < updated.length; i++) {
      const prevEnd = updated[i - 1].endCount;
      if (prevEnd !== null) {
        updated[i].startCount = prevEnd + 1;
      }
    }
    
    // Ensure final slab is open-ended
    updated[updated.length - 1].endCount = null;
    
    setSlabs(updated);
  };

  const handleResetDefaults = () => {
    setErrorMsg('');
    setSlabs([
      { startCount: 1, endCount: 3, rate: 1000 },
      { startCount: 4, endCount: 7, rate: 2000 },
      { startCount: 8, endCount: null, rate: 3500 }
    ]);
  };

  const handleSaveSlabs = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // Quick validation before API submit
    for (let i = 0; i < slabs.length; i++) {
      if (slabs[i].rate <= 0) {
        setErrorMsg(`Slab ${i + 1} rate must be a positive number greater than ₹0.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch('/api/admin/slabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slabs })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Incentive slabs successfully synchronized! Corporate calculations are updated.');
        setSlabs(data.slabs || []);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(data.error || 'Failed to save slab configurations');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error. Failed to save slabs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Incentive Slabs</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Define calculation rules and payout rates for sales volume tiers.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 bg-rose-50 p-4 border border-rose-100 rounded-md text-xs text-toyota-red">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Configuration warning:</span>
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 bg-emerald-50 p-4 border border-emerald-100 rounded-md text-xs text-emerald-800 animate-in fade-in duration-200">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <div>
            <span className="font-semibold block mb-0.5">Success:</span>
            {successMsg}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-11 bg-neutral-100 rounded animate-pulse"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-50/55 rounded border border-neutral-100 animate-pulse"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Slabs visual timeline preview */}
          <div className="bg-white p-6 border border-neutral-100 rounded-md space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-toyota-red" />
              Active Incentive Timeline
            </h3>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
              {slabs.map((slab, i) => (
                <React.Fragment key={i}>
                  <div className="bg-neutral-50/50 border border-neutral-100/60 rounded p-4 flex flex-row md:flex-col items-center justify-between md:justify-center min-w-[120px] flex-1 shadow-xs">
                    <div className="flex flex-col items-start md:items-center">
                      <span className="text-[9px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Tier {i + 1}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-800 mt-0.5 whitespace-nowrap">
                        {slab.startCount} {slab.endCount !== null ? `– ${slab.endCount}` : '+'} Units
                      </span>
                    </div>
                    <span className="text-xs font-bold text-toyota-red mt-0 md:mt-1 whitespace-nowrap">
                      ₹{slab.rate.toLocaleString('en-IN')}/unit
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Slabs configurator sheet */}
          <div className="bg-white rounded-md border border-neutral-100 overflow-hidden shadow-xs">
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-neutral-100 text-left text-sm text-neutral-900">
                <thead className="bg-neutral-50/50 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="px-6 py-4">Slab Tier</th>
                    <th className="px-6 py-4">Start Count</th>
                    <th className="px-6 py-4">End Count</th>
                    <th className="px-6 py-4">Rate (₹)</th>
                    <th className="px-6 py-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {slabs.map((slab, i) => {
                    const isLast = i === slabs.length - 1;
                    return (
                      <tr key={i} className="hover:bg-neutral-50/40 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 font-semibold text-neutral-900">
                          Tier {i + 1} {isLast && <span className="text-[9px] bg-rose-50 text-toyota-red border border-rose-100 font-bold px-1.5 py-0.5 rounded ml-1.5 uppercase tracking-wider">Open-Ended</span>}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-neutral-600">
                          {slab.startCount}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {isLast ? (
                            <span className="text-xs font-medium text-neutral-400">
                              No upper limit
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={slab.startCount}
                              value={slab.endCount || ''}
                              onChange={(e) => handleEndChange(i, e.target.value)}
                              className="w-24 bg-white border border-neutral-200 focus:border-toyota-red rounded px-2.5 py-1.5 text-xs font-semibold outline-none transition-all text-neutral-800"
                            />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="relative rounded shadow-xs max-w-[160px]">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                              <span className="text-neutral-400 text-xs">₹</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={slab.rate || ''}
                              onChange={(e) => handleRateChange(i, e.target.value)}
                              className="w-full rounded border border-neutral-200 focus:border-toyota-red py-1.5 pl-7 pr-3 text-xs font-semibold outline-none transition-all bg-white text-neutral-800"
                            />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveSlab(i)}
                            disabled={slabs.length <= 1}
                            className="inline-flex items-center justify-center p-1.5 rounded border border-rose-100 text-toyota-red hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Delete Slab"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block md:hidden divide-y divide-neutral-100 bg-white">
              {slabs.map((slab, i) => {
                const isLast = i === slabs.length - 1;
                return (
                  <div key={i} className="p-5 space-y-4 hover:bg-neutral-50/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-neutral-900 flex items-center gap-1.5">
                        Tier {i + 1}
                        {isLast && (
                          <span className="text-[9px] bg-rose-50 text-toyota-red border border-rose-100 font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Open-Ended
                          </span>
                        )}
                      </span>
                      <button
                        onClick={() => handleRemoveSlab(i)}
                        disabled={slabs.length <= 1}
                        className="inline-flex items-center justify-center p-1.5 rounded border border-rose-100 text-toyota-red hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                          Volume Limit
                        </label>
                        {isLast ? (
                          <span className="block text-xs font-semibold text-neutral-600 py-1.5 bg-neutral-50 px-2.5 rounded border border-neutral-200/50">
                            {slab.startCount}+ Cars
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-neutral-600 bg-neutral-50 border border-neutral-200/50 px-2.5 py-1.5 rounded">
                              {slab.startCount}
                            </span>
                            <span className="text-[10px] font-semibold text-neutral-400 uppercase">to</span>
                            <input
                              type="number"
                              min={slab.startCount}
                              value={slab.endCount || ''}
                              onChange={(e) => handleEndChange(i, e.target.value)}
                              className="w-full rounded border border-neutral-200 focus:border-toyota-red px-2 py-1.5 text-xs font-semibold outline-none text-center bg-white text-neutral-800"
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                          Rate
                        </label>
                        <div className="relative rounded shadow-xs">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                            <span className="text-neutral-400 text-xs">₹</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={slab.rate || ''}
                            onChange={(e) => handleRateChange(i, e.target.value)}
                            className="w-full rounded border border-neutral-200 focus:border-toyota-red py-1.5 pl-6 pr-2 text-xs font-semibold outline-none bg-white text-neutral-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form Action Controls inside the white form container */}
            <div className="p-5 bg-white border-t border-neutral-100 flex flex-col sm:flex-row gap-2.5 justify-start">
              <button
                type="button"
                onClick={handleAddSlab}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                Add Slab
              </button>
              
              <button
                type="button"
                onClick={handleResetDefaults}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs cursor-pointer disabled:opacity-50 w-full sm:w-auto"
              >
                <RotateCcw className="h-4 w-4 text-neutral-500" />
                Reset Defaults
              </button>
            </div>

            {/* Sync Save Configuration Footer */}
            <div className="bg-neutral-50/50 p-5 border-t border-neutral-100 flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
              <span className="text-[11px] sm:text-xs text-neutral-400 font-medium">
                Changes apply instantly across all active dashboard logs.
              </span>
              <button
                type="button"
                onClick={handleSaveSlabs}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 bg-toyota-red hover:bg-red-700 text-white px-5 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50 w-full sm:w-auto shrink-0"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Applying...' : 'Apply Changes'}
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
