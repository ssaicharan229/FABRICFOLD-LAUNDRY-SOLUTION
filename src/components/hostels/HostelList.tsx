import React, { useState } from 'react';
import { Hostel } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { Building2, Plus, Edit2, Users, CheckCircle2, XCircle, X } from 'lucide-react';

export const HostelList: React.FC = () => {
  const { success, error } = useToast();
  const [hostels, setHostels] = useState<Hostel[]>(() => dataService.getHostels());
  const customers = dataService.getCustomers();

  const [editingHostel, setEditingHostel] = useState<Hostel | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [roomCount, setRoomCount] = useState(100);
  const [isActive, setIsActive] = useState(true);

  const reload = () => {
    setHostels(dataService.getHostels());
  };

  const getStudentCount = (hostelId: string) => {
    return customers.filter(c => c.hostel_id === hostelId).length;
  };

  const openEdit = (h: Hostel) => {
    setEditingHostel(h);
    setName(h.name);
    setCode(h.code);
    setDescription(h.description || '');
    setRoomCount(h.room_count || 100);
    setIsActive(h.is_active);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingHostel(null);
    setName('');
    setCode(`HOSTEL-${String.fromCharCode(65 + hostels.length)}`);
    setDescription('');
    setRoomCount(120);
    setIsActive(true);
    setShowModal(true);
  };

  const handleToggleActive = (h: Hostel) => {
    try {
      const updated = dataService.updateHostel(h.id, { is_active: !h.is_active });
      success('Hostel Status Updated', `${updated.name} is now ${updated.is_active ? 'Active' : 'Inactive'}.`);
      reload();
    } catch (err: any) {
      error('Failed to update status', err?.message);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHostel) {
        dataService.updateHostel(editingHostel.id, {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          room_count: roomCount,
          is_active: isActive,
        });
        success('Hostel Updated', `Saved settings for ${name}`);
      } else {
        dataService.addHostel({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          room_count: roomCount,
          is_active: isActive,
        });
        success('Hostel Added', `New hostel residence ${name} created`);
      }
      setShowModal(false);
      reload();
    } catch (err: any) {
      error('Failed to save hostel', err?.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Hostel Residences Management</h1>
          <p className="text-xs text-slate-500">Configure campus hostel residences, room capacities, and active service zones</p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Hostel Residence
        </button>
      </div>

      {/* Hostels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {hostels.map(h => {
          const studentCount = getStudentCount(h.id);

          return (
            <div
              key={h.id}
              className={`bg-white rounded-3xl p-6 border shadow-sm transition-all duration-200 flex flex-col justify-between ${
                h.is_active ? 'border-slate-200 hover:shadow-md' : 'border-slate-200/60 opacity-70 bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{h.name}</h3>
                      <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {h.code}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => openEdit(h)}
                    className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                  {h.description || 'Hostel campus building'}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 my-5 pt-4 border-t border-slate-100">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Active Students</span>
                    <span className="font-bold text-sm text-slate-900 font-mono flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-600" />
                      {studentCount} Students
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[11px] text-slate-400 block mb-0.5">Capacity</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">
                      {h.room_count || 100} Rooms
                    </span>
                  </div>
                </div>
              </div>

              {/* Status footer & toggle */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                  h.is_active ? 'text-emerald-700' : 'text-slate-400'
                }`}>
                  {h.is_active ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Receiving Laundry
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-slate-400" /> Inactive
                    </>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleActive(h)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                    h.is_active
                      ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                      : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {h.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingHostel ? `Edit ${editingHostel.name}` : 'Add New Hostel Residence'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hostel Residence Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Sahyadri Hostel"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hostel Code *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="e.g. SY-A"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Total Rooms</label>
                  <input
                    type="number"
                    min="1"
                    value={roomCount}
                    onChange={e => setRoomCount(parseInt(e.target.value, 10) || 100)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Campus Description / Block</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. South Campus Wing 3"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                />
                <label htmlFor="isActiveCheck" className="font-semibold text-slate-700 cursor-pointer">
                  Active for laundry intake
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md cursor-pointer"
                >
                  Save Hostel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
