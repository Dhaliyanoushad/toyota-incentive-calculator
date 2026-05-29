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
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-toyota-black">Dynamic Slab Engine</h1>
          <p className="mt-1 text-sm text-toyota-charcoal">
            Define corporate volume incentive rates. Modifications instantly recalculate dashboard aggregates.
          </p>
        </div>
        
        <div className="flex gap-2 self-start sm:self-center">
          <button
            onClick={handleResetDefaults}
            disabled={saving}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-100 px-3 py-2 rounded text-xs font-bold uppercase transition-colors tracking-wider cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </button>
          
          <button
            onClick={handleAddSlab}
            disabled={saving}
            className="flex items-center gap-1.5 border border-toyota-red text-toyota-red hover:bg-red-50 px-3 py-2 rounded text-xs font-bold uppercase transition-colors tracking-wider cursor-pointer disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Bracket
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 bg-red-50 p-4 rounded border border-toyota-red/10 text-sm text-toyota-red">
          <AlertTriangle className="h-5 w-5 shrink-0 text-toyota-red" />
          <div>
            <span className="font-bold">Invalid Sequence Configuration: </span>
            {errorMsg}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2 bg-green-50 p-4 rounded border border-green-200 text-sm text-green-800">
          <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <span className="font-bold">Success: </span>
            {successMsg}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-gray-250 rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-250 rounded"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Slabs visual timeline preview */}
          <div className="bg-toyota-white p-6 border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-toyota-charcoal mb-4 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-toyota-red" />
              Interactive sequence visualizer
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {slabs.map((slab, i) => (
                <React.Fragment key={i}>
                  <div className="bg-toyota-light-gray border border-gray-200 rounded-lg p-3 flex flex-col items-center min-w-[120px] shadow-sm">
                    <span className="text-[10px] font-bold text-toyota-charcoal uppercase tracking-wider">
                      Tier {i + 1}
                    </span>
                    <span className="text-sm font-black text-toyota-black mt-1">
                      {slab.startCount} {slab.endCount !== null ? `- ${slab.endCount}` : '+'} Cars
                    </span>
                    <span className="text-xs font-bold text-toyota-red mt-1">
                      ₹{slab.rate.toLocaleString('en-IN')}/car
                    </span>
                  </div>
                  {i < slabs.length - 1 && (
                    <span className="text-toyota-charcoal font-black text-lg">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Slabs configurator sheet */}
          <div className="bg-toyota-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-250 text-left text-sm text-toyota-black">
                <thead className="bg-toyota-light-gray text-xs font-bold uppercase tracking-wider text-toyota-charcoal">
                  <tr>
                    <th className="px-6 py-4">Bracket Name</th>
                    <th className="px-6 py-4">Start Volume</th>
                    <th className="px-6 py-4">End Volume Limit</th>
                    <th className="px-6 py-4">Incentive Level (INR ₹)</th>
                    <th className="px-6 py-4 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-toyota-white">
                  {slabs.map((slab, i) => {
                    const isLast = i === slabs.length - 1;
                    return (
                      <tr key={i} className="hover:bg-toyota-light-gray/30 transition-colors">
                        <td className="whitespace-nowrap px-6 py-4 font-bold">
                          Tier {i + 1} {isLast && <span className="text-[10px] bg-red-100 text-toyota-red font-bold px-1.5 py-0.5 rounded ml-1">OPEN-ENDED</span>}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 font-bold text-toyota-charcoal">
                          {slab.startCount}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {isLast ? (
                            <span className="text-xs font-semibold text-toyota-charcoal">
                              Infinity (Any volume above {slab.startCount - 1})
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={slab.startCount}
                              value={slab.endCount || ''}
                              onChange={(e) => handleEndChange(i, e.target.value)}
                              className="w-24 rounded border border-gray-300 px-2.5 py-1.5 text-sm font-semibold outline-none"
                            />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="relative rounded-md shadow-sm max-w-[160px]">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                              <span className="text-gray-500 sm:text-xs">₹</span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              placeholder="0"
                              value={slab.rate || ''}
                              onChange={(e) => handleRateChange(i, e.target.value)}
                              className="w-full rounded border border-gray-300 py-1.5 pl-7 pr-3 text-sm font-bold outline-none"
                            />
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <button
                            onClick={() => handleRemoveSlab(i)}
                            disabled={slabs.length <= 1}
                            className="inline-flex items-center justify-center p-2 rounded border border-toyota-red text-toyota-red hover:bg-red-50 cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent"
                            title="Delete Slab Bracket"
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

            {/* Sync Save Button */}
            <div className="bg-toyota-light-gray p-4 flex justify-between items-center border-t border-gray-250">
              <span className="text-xs text-toyota-charcoal font-semibold">
                Note: Saving will immediately sync calculations across all user portals.
              </span>
              <button
                onClick={handleSaveSlabs}
                disabled={saving}
                className="flex items-center gap-1.5 bg-toyota-red hover:bg-red-700 text-toyota-white px-5 py-2.5 rounded text-xs font-bold uppercase transition-colors tracking-wider shadow cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Synchronizing...' : 'Save Configuration'}
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
