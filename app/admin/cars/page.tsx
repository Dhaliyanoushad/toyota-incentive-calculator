'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Check, EyeOff, AlertCircle } from 'lucide-react';

interface CarModel {
  _id: string;
  modelName: string;
  baseSuffix: string;
  variant: string;
  isActive: boolean;
}

export default function AdminCarsPage() {
  const [cars, setCars] = useState<CarModel[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [modelName, setModelName] = useState('');
  const [baseSuffix, setBaseSuffix] = useState('');
  const [variant, setVariant] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [formError, setFormError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCars = async () => {
    try {
      const res = await fetch('/api/admin/cars');
      if (res.ok) {
        const data = await res.json();
        setCars(data.cars || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleOpenAdd = () => {
    setEditId(null);
    setModelName('');
    setBaseSuffix('');
    setVariant('');
    setIsActive(true);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (car: CarModel) => {
    setEditId(car._id);
    setModelName(car.modelName);
    setBaseSuffix(car.baseSuffix);
    setVariant(car.variant);
    setIsActive(car.isActive);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim() || !baseSuffix.trim() || !variant.trim()) {
      setFormError('All fields are required.');
      return;
    }

    setFormError('');
    setActionLoading(true);

    try {
      const url = editId ? `/api/admin/cars/${editId}` : '/api/admin/cars';
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: modelName.trim(),
          baseSuffix: baseSuffix.trim(),
          variant: variant.trim(),
          isActive
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save car model');
      }

      setIsFormOpen(false);
      fetchCars();

    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this car model? This will affect reports containing this model.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/cars/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCars();
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed.');
      }
    } catch (err) {
      console.error(err);
      alert('Delete request failed.');
    }
  };

  const toggleCarStatus = async (car: CarModel) => {
    try {
      const res = await fetch(`/api/admin/cars/${car._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !car.isActive })
      });
      if (res.ok) {
        fetchCars();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 py-2">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Car Inventory</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Manage your active and retired Toyota catalog models.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 bg-toyota-red hover:bg-red-700 text-white px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          Add Car
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-11 bg-neutral-100 rounded animate-pulse"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-50/55 rounded border border-neutral-100 animate-pulse"></div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="bg-white py-16 px-6 text-center border border-neutral-100 rounded-md">
          <AlertCircle className="h-8 w-8 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-neutral-800">No vehicle models</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto mb-5">
            Your Toyota inventory catalog is currently empty.
          </p>
          <button
            onClick={handleOpenAdd}
            className="border border-neutral-200 hover:bg-neutral-50 text-neutral-700 px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider cursor-pointer bg-white transition-colors"
          >
            Add Car
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-md border border-neutral-100 overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-neutral-100 text-left text-sm text-neutral-900">
                <thead className="bg-neutral-50/50 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-100">
                  <tr>
                    <th className="px-6 py-4">Model Name</th>
                    <th className="px-6 py-4">Trim</th>
                    <th className="px-6 py-4">Variant</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {cars.map((car) => (
                    <tr key={car._id} className="hover:bg-neutral-50/40 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4 font-semibold text-neutral-900">{car.modelName}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-neutral-500 font-medium text-xs">{car.baseSuffix}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-neutral-500 font-medium text-xs">{car.variant}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <button
                          onClick={() => toggleCarStatus(car)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold cursor-pointer transition-all uppercase tracking-wider ${
                            car.isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80 hover:bg-emerald-100/50'
                              : 'bg-rose-50 text-toyota-red border border-rose-100/80 hover:bg-rose-100/50'
                          }`}
                        >
                          {car.isActive ? (
                            <>
                              <Check className="h-3 w-3 shrink-0" /> Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 shrink-0" /> Retired
                            </>
                          )}
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEdit(car)}
                          className="inline-flex items-center justify-center p-1.5 rounded border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
                          title="Edit Model"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(car._id)}
                          className="inline-flex items-center justify-center p-1.5 rounded border border-rose-100 text-toyota-red hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Model"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="block md:hidden space-y-4">
            {cars.map((car) => (
              <div key={car._id} className="bg-white border border-neutral-100 rounded-md p-5 space-y-4 hover:border-neutral-200/80 transition-colors">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <span className="font-semibold text-sm text-neutral-900 block">{car.modelName}</span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">{car.baseSuffix} Trim · {car.variant}</span>
                  </div>
                  <button
                    onClick={() => toggleCarStatus(car)}
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[10px] font-semibold cursor-pointer transition-colors uppercase tracking-wider ${
                      car.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-rose-50 text-toyota-red border border-rose-100'
                    }`}
                  >
                    {car.isActive ? 'Active' : 'Retired'}
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleOpenEdit(car)}
                    className="inline-flex items-center justify-center gap-1 border border-neutral-200 hover:bg-neutral-50 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider text-neutral-600 bg-white cursor-pointer transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(car._id)}
                    className="inline-flex items-center justify-center gap-1 border border-rose-100 text-toyota-red hover:bg-rose-50 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Slide-over or Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-md shadow-xl border border-neutral-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-white">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">
                {editId ? 'Edit Car Model' : 'Add Car Model'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-neutral-400 hover:text-toyota-red cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 bg-white">
              {formError && (
                <div className="flex items-start gap-2 bg-rose-50 p-3.5 rounded text-xs text-toyota-red border border-rose-100">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Corolla"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full rounded border border-neutral-200 focus:border-toyota-red px-3 py-2 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Trim suffix
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LE, SE, XLE"
                  value={baseSuffix}
                  onChange={(e) => setBaseSuffix(e.target.value)}
                  className="w-full rounded border border-neutral-200 focus:border-toyota-red px-3 py-2 text-sm outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                  Variant
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hybrid, AWD, Gas"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full rounded border border-neutral-200 focus:border-toyota-red px-3 py-2 text-sm outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <input
                  id="formIsActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-toyota-red focus:ring-toyota-red cursor-pointer"
                />
                <label htmlFor="formIsActive" className="text-xs font-semibold uppercase tracking-wider text-neutral-500 select-none cursor-pointer">
                  Active in Inventory
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-5 border-t border-neutral-100 mt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-xs font-semibold uppercase tracking-wider text-neutral-600 rounded bg-white cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-toyota-red hover:bg-red-700 text-white rounded text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
