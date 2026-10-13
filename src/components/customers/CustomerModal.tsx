import React, { useState, useEffect } from 'react';
import { Customer } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { UserPlus, UserCheck, X, Sparkles, Building2, Phone, Hash } from 'lucide-react';

interface CustomerModalProps {
  isOpen: boolean;
  customer?: Customer | null; // If provided, edit mode; else create mode
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}

export const CustomerModal: React.FC<CustomerModalProps> = ({
  isOpen,
  customer,
  onClose,
  onSaved,
}) => {
  const { success, error } = useToast();
  const hostels = dataService.getHostels().filter(h => h.is_active);
  const packages = dataService.getPackages();

  const isEdit = Boolean(customer);

  // Form states
  const [name, setName] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [hostelId, setHostelId] = useState(hostels[0]?.id || '');
  const [roomNumber, setRoomNumber] = useState('');
  const [mobile, setMobile] = useState('');
  const [packageId, setPackageId] = useState(packages[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalWashes, setTotalWashes] = useState(34);
  const [usedWashes, setUsedWashes] = useState(0);
  const [notes, setNotes] = useState('');

  // Auto-calculated remaining washes
  const remainingWashes = Math.max(0, totalWashes - usedWashes);

  // Setup form on open / mode change
  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setCustomerId(customer.customer_id);
      setHostelId(customer.hostel_id);
      setRoomNumber(customer.room_number || '');
      setMobile(customer.mobile);
      setPackageId(customer.package_id);
      setStartDate(customer.package_start_date || '');
      setEndDate(customer.package_end_date || '');
      setTotalWashes(customer.total_washes);
      setUsedWashes(customer.used_washes);
      setNotes(customer.notes || '');
    } else {
      // Auto-suggest next sequential ID
      const nextId = dataService.getNextCustomerId();
      setName('');
      setCustomerId(nextId);
      setHostelId(hostels[0]?.id || '');
      setRoomNumber('');
      setMobile('+91 ');
      setPackageId(packages[0]?.id || '');
      setStartDate('');
      setEndDate('');
      setTotalWashes(34);
      setUsedWashes(0);
      setNotes('');
    }
  }, [customer, isOpen]);

  // When package changes, update total washes if adding new
  const handlePackageChange = (pId: string) => {
    setPackageId(pId);
    if (!isEdit) {
      const selected = packages.find(p => p.id === pId);
      if (selected) {
        setTotalWashes(selected.annual_wash_limit);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validations
    if (!name.trim()) {
      error('Validation Error', 'Student name is required.');
      return;
    }

    // Validate Indian mobile format: 10 digits or starting with +91
    const cleanMobile = mobile.replace(/[^0-9]/g, '');
    if (cleanMobile.length < 10) {
      error('Invalid Mobile Number', 'Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (usedWashes > totalWashes) {
      error('Validation Error', `Used washes (${usedWashes}) cannot exceed total washes (${totalWashes}).`);
      return;
    }

    try {
      if (isEdit && customer) {
        const updated = dataService.updateCustomer(customer.id, {
          name: name.trim(),
          customer_id: customerId.trim().toUpperCase(),
          hostel_id: hostelId,
          room_number: roomNumber.trim(),
          mobile: mobile.trim(),
          package_id: packageId,
          package_start_date: startDate,
          package_end_date: endDate,
          total_washes: totalWashes,
          used_washes: usedWashes,
          notes: notes.trim(),
        });
        success('Customer Updated', `${updated.name} (${updated.customer_id}) updated successfully.`);
        onSaved(updated);
      } else {
        const created = dataService.addCustomer({
          name: name.trim(),
          customer_id: customerId.trim().toUpperCase(),
          hostel_id: hostelId,
          room_number: roomNumber.trim(),
          mobile: mobile.trim(),
          package_id: packageId,
          package_start_date: startDate,
          package_end_date: endDate,
          total_washes: totalWashes,
          used_washes: usedWashes,
          notes: notes.trim(),
        });
        success('Customer Registered!', `${created.name} registered with ID ${created.customer_id}`);
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      error('Save Failed', err?.message || 'Error occurred');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              {isEdit ? <UserCheck className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isEdit ? 'Edit Customer Details' : 'Register New Student Customer'}
              </h3>
              <p className="text-xs text-slate-400">
                {isEdit ? `Updating profile for ${customer?.customer_id}` : 'Create hostel laundry subscription profile'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Customer ID & Student Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block font-semibold text-slate-700 mb-1">
                Customer ID <span className="text-slate-400 font-normal">(Auto or custom)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={customerId}
                  onChange={e => setCustomerId(e.target.value)}
                  placeholder="FFL-0001"
                  className="w-full font-mono font-bold text-slate-900 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 uppercase"
                />
              </div>
            </div>
            <div className="sm:col-span-8">
              <label className="block font-semibold text-slate-700 mb-1">
                Student Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Aarav Sharma"
                className="w-full text-sm font-semibold p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
              />
            </div>
          </div>

          {/* Hostel & Room Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hostel Residence *
              </label>
              <select
                value={hostelId}
                onChange={e => setHostelId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium"
              >
                {hostels.map(h => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Room Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={roomNumber}
                onChange={e => setRoomNumber(e.target.value)}
                placeholder="e.g. A-204 (leave blank if unsupplied)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Mobile Number */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Registered Indian Mobile Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                required
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900 font-mono font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SMS completion notifications will be dispatched to this number automatically.</p>
          </div>

          {/* Package Selection */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Laundry Package Plan *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {packages.map(pkg => (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => handlePackageChange(pkg.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    packageId === pkg.id
                      ? 'border-teal-600 bg-teal-50/80 text-teal-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">{pkg.name}</div>
                  <div className="text-[11px] text-slate-500">₹{pkg.price.toLocaleString()}</div>
                  <div className="text-[10px] text-teal-700 mt-0.5">{pkg.annual_wash_limit} Washes</div>
                </button>
              ))}
            </div>
          </div>

          {/* Package Validity Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                End Date <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900 font-medium"
              />
            </div>
          </div>

          {/* Washes Quota Counter */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
              Wash Balance Configuration
            </span>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Total Washes</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={totalWashes}
                  onChange={e => setTotalWashes(parseInt(e.target.value, 10) || 34)}
                  className="w-full text-center font-bold text-sm p-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Used Washes</label>
                <input
                  type="number"
                  min="0"
                  max={totalWashes}
                  required
                  value={usedWashes}
                  onChange={e => setUsedWashes(parseInt(e.target.value, 10) || 0)}
                  className="w-full text-center font-bold text-sm p-2 bg-white border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Remaining</label>
                <div className={`p-2 rounded-xl border font-bold text-sm font-mono ${
                  remainingWashes === 0 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : remainingWashes <= 5 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {remainingWashes} Washes
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              * Remaining washes are calculated as (Total - Used). Default annual limit is 34 washes.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Notes (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Vegetarian detergent preference, Room key on desk..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-slate-900"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer"
            >
              {isEdit ? 'Save Changes' : 'Register Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
