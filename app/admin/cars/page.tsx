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
    <div className="space-y-6">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-toyota-black">Car Inventory</h1>
          <p className="mt-1 text-sm text-toyota-charcoal">
            Add, configure, or retire Toyota model variants sold by officers.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 bg-toyota-red hover:bg-red-700 text-toyota-white px-4 py-2.5 rounded text-xs font-bold uppercase transition-colors tracking-wider shadow cursor-pointer self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          Add Vehicle Model
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-gray-250 rounded"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-250 rounded"></div>
          ))}
        </div>
      ) : cars.length === 0 ? (
        <div className="bg-toyota-white p-12 text-center border border-gray-200 rounded-lg shadow-sm">
          <AlertCircle className="h-12 w-12 text-toyota-charcoal mx-auto mb-3" />
          <h3 className="text-lg font-bold text-toyota-black mb-1">No Cars Configured</h3>
          <p className="text-sm text-toyota-charcoal max-w-sm mx-auto mb-5">
            Get started by adding your first Toyota vehicle model or reset the database on the login page!
          </p>
          <button
            onClick={handleOpenAdd}
            className="border border-toyota-red text-toyota-red px-4 py-2 rounded text-xs font-bold uppercase hover:bg-red-50 cursor-pointer"
          >
            Add First Model
          </button>
        </div>
      ) : (
        <div className="bg-toyota-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-250 text-left text-sm text-toyota-black">
              <thead className="bg-toyota-light-gray text-xs font-bold uppercase tracking-wider text-toyota-charcoal">
                <tr>
                  <th className="px-6 py-4">Model Name</th>
                  <th className="px-6 py-4">Trim / Suffix</th>
                  <th className="px-6 py-4">Variant Specs</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-toyota-white">
                {cars.map((car) => (
                  <tr key={car._id} className="hover:bg-toyota-light-gray/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-bold">{car.modelName}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-toyota-charcoal">{car.baseSuffix}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-toyota-charcoal">{car.variant}</td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <button
                        onClick={() => toggleCarStatus(car)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-colors uppercase tracking-wide ${
                          car.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-toyota-red hover:bg-red-200'
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
                        className="inline-flex items-center justify-center p-2 rounded border border-gray-300 text-toyota-charcoal hover:bg-gray-100 cursor-pointer"
                        title="Edit Model"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(car._id)}
                        className="inline-flex items-center justify-center p-2 rounded border border-toyota-red text-toyota-red hover:bg-red-50 cursor-pointer"
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
      )}

      {/* Slide-over or Modal Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-toyota-white rounded-lg shadow-xl border border-gray-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="bg-toyota-dark-gray text-toyota-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider">
                {editId ? 'Modify Vehicle Specs' : 'Add Vehicle Model'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-toyota-white hover:text-toyota-red cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="flex items-start gap-2 bg-red-50 p-3 rounded text-xs text-toyota-red border border-toyota-red/10">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-toyota-charcoal mb-1">
                  Model Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toyota Corolla"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-toyota-charcoal mb-1">
                  Trim / Suffix
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LE, SE, XLE"
                  value={baseSuffix}
                  onChange={(e) => setBaseSuffix(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-toyota-charcoal mb-1">
                  Variant / Engine specs
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hybrid, AWD, Gas"
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  id="formIsActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-toyota-red focus:ring-toyota-red"
                />
                <label htmlFor="formIsActive" className="text-xs font-bold uppercase tracking-wider text-toyota-charcoal select-none">
                  Available for selection (Active)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded text-xs font-bold uppercase hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-toyota-red hover:bg-red-700 text-toyota-white rounded text-xs font-bold uppercase transition-colors tracking-wider shadow cursor-pointer disabled:opacity-50"
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
