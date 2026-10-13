import React, { useState, useMemo } from 'react';
import { Customer, Hostel } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { CustomerModal } from './CustomerModal';
import { CustomerProfileModal } from './CustomerProfileModal';
import { RenewPackageModal } from './RenewPackageModal';
import { 
  Search, 
  UserPlus, 
  Filter, 
  Building2, 
  Phone, 
  RotateCcw, 
  Eye, 
  Edit2, 
  Shirt, 
  AlertTriangle, 
  CheckCircle2, 
  MoreVertical,
  Users
} from 'lucide-react';

interface CustomerListProps {
  onNewLaundryForCustomer?: (customer: Customer) => void;
  onNavigateImport?: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ onNewLaundryForCustomer, onNavigateImport }) => {
  const { success, warning } = useToast();

  const [customers, setCustomers] = useState<Customer[]>(() => dataService.getCustomers());
  const [hostels, setHostels] = useState<Hostel[]>(() => dataService.getHostels());

  const [searchQuery, setSearchQuery] = useState('');
  const [hostelFilter, setHostelFilter] = useState('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'normal' | 'low' | 'zero'>('all');

  // Modal controls
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [viewingCustomerId, setViewingCustomerId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [renewingCustomer, setRenewingCustomer] = useState<Customer | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);

  const reloadData = () => {
    setCustomers(dataService.getCustomers());
  };

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return customers.filter(c => {
      // Search
      const matchesSearch = !q || (
        c.customer_id.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.mobile.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
        (c.hostel_name && c.hostel_name.toLowerCase().includes(q)) ||
        (c.room_number && c.room_number.toLowerCase().includes(q))
      );

      // Hostel Filter
      const matchesHostel = hostelFilter === 'all' || c.hostel_id === hostelFilter;

      // Balance Filter
      let matchesBalance = true;
      if (balanceFilter === 'low') {
        matchesBalance = c.remaining_washes <= 5 && c.remaining_washes > 0;
      } else if (balanceFilter === 'zero') {
        matchesBalance = c.remaining_washes === 0;
      } else if (balanceFilter === 'normal') {
        matchesBalance = c.remaining_washes > 5;
      }

      return matchesSearch && matchesHostel && matchesBalance;
    });
  }, [customers, searchQuery, hostelFilter, balanceFilter]);

  const handleOpenProfile = (customerId: string) => {
    setViewingCustomerId(customerId);
    setShowProfileModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowAddEditModal(true);
  };

  const handleOpenRenew = (customer: Customer) => {
    setRenewingCustomer(customer);
    setShowRenewModal(true);
  };

  const handleAddClick = () => {
    setEditingCustomer(null);
    setShowAddEditModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Customers Directory</h1>
          <p className="text-xs text-slate-500">Manage student profiles, hostel rooms, wash allocations and active package tiers</p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateImport && (
            <button
              onClick={onNavigateImport}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200"
            >
              Import Original Data (CSV)
            </button>
          )}
          <button
            onClick={handleAddClick}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> + Add Customer
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Customer ID (FFL-...), Student Name, Mobile (+91), Hostel, Room..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Hostel Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={hostelFilter}
              onChange={e => setHostelFilter(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none text-slate-800"
            >
              <option value="all">All Hostels ({hostels.length})</option>
              {hostels.map(h => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          {/* Balance Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setBalanceFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                balanceFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Balances
            </button>
            <button
              onClick={() => setBalanceFilter('low')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                balanceFilter === 'low' ? 'bg-amber-100 text-amber-900 font-bold shadow-sm' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> Low Balance (≤5)
            </button>
            <button
              onClick={() => setBalanceFilter('zero')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                balanceFilter === 'zero' ? 'bg-rose-100 text-rose-900 font-bold shadow-sm' : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              Quota Limit (0)
            </button>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Customer Cards (< md) */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">No customers found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search criteria</p>
          </div>
        ) : (
          filteredCustomers.map(cust => (
            <div
              key={cust.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenProfile(cust.id)}
                      className="font-mono font-bold text-xs bg-slate-900 text-teal-300 px-2 py-0.5 rounded-md"
                    >
                      {cust.customer_id}
                    </button>
                    <h3 className="font-bold text-sm text-slate-900">{cust.name}</h3>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{cust.hostel_name} {cust.room_number ? `• Rm ${cust.room_number}` : ''}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-black text-xs font-mono ${
                    cust.remaining_washes === 0
                      ? 'bg-rose-100 text-rose-700'
                      : cust.remaining_washes <= 5
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {cust.remaining_washes} Left
                  </span>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    {cust.used_washes}/{cust.total_washes} used
                  </div>
                </div>
              </div>

              {/* Contact & Plan */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <a
                  href={`tel:${cust.mobile}`}
                  className="font-mono text-teal-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 text-teal-600" />
                  {cust.mobile}
                </a>

                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {cust.package_name}
                </span>
              </div>

              {/* Action Buttons Row */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={cust.remaining_washes <= 0}
                  onClick={() => onNewLaundryForCustomer && onNewLaundryForCustomer(cust)}
                  className={`py-2 px-1 text-xs font-bold rounded-xl flex items-center justify-center gap-1 ${
                    cust.remaining_washes <= 0
                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      : 'bg-teal-600 text-white shadow-sm active:scale-95'
                  }`}
                >
                  <Shirt className="w-3.5 h-3.5" />
                  <span>+Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenProfile(cust.id)}
                  className="py-2 px-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1 active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(cust)}
                  className="py-2 px-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-1 active:scale-95"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenRenew(cust)}
                  className="py-2 px-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center gap-1 active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Renew</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Directory Table (Desktop & Tablet >= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Customer ID</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Hostel & Room</th>
                <th className="py-3.5 px-4">Mobile</th>
                <th className="py-3.5 px-4">Package Plan</th>
                <th className="py-3.5 px-4 text-center">Used Washes</th>
                <th className="py-3.5 px-4 text-center">Remaining Washes</th>
                <th className="py-3.5 px-4">Balance Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No customers found</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your search criteria or register a new customer</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenProfile(cust.id)}
                        className="font-mono font-bold text-xs bg-slate-900 hover:bg-teal-700 text-teal-300 px-2.5 py-1 rounded-lg transition-colors shadow-sm inline-flex items-center gap-1.5"
                      >
                        {cust.customer_id}
                      </button>
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-sm">{cust.name}</div>
                      <div className="text-[11px] text-slate-400">Joined {new Date(cust.created_at).toLocaleDateString()}</div>
                    </td>

                    {/* Hostel & Room */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                      <div className="font-medium">{cust.hostel_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {cust.room_number ? `Room ${cust.room_number}` : <span className="italic text-slate-400">Room: Not specified</span>}
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                      {cust.mobile}
                    </td>

                    {/* Package */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {cust.package_name}
                      </span>
                    </td>

                    {/* Used Washes */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700 whitespace-nowrap">
                      {cust.used_washes} <span className="text-[11px] font-normal text-slate-400">/ {cust.total_washes}</span>
                    </td>

                    {/* Remaining Washes */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-black text-xs font-mono ${
                        cust.remaining_washes === 0
                          ? 'bg-rose-100 text-rose-700'
                          : cust.remaining_washes <= 5
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {cust.remaining_washes} Left
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {cust.remaining_washes === 0 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-lg">
                          <AlertTriangle className="w-3 h-3" /> LIMIT REACHED
                        </span>
                      ) : cust.remaining_washes <= 5 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                          <AlertTriangle className="w-3 h-3" /> LOW BALANCE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          <CheckCircle2 className="w-3 h-3" /> Active ({cust.status})
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* New Laundry Order Quick Action */}
                        <button
                          type="button"
                          disabled={cust.remaining_washes <= 0}
                          onClick={() => onNewLaundryForCustomer && onNewLaundryForCustomer(cust)}
                          title={cust.remaining_washes <= 0 ? 'Limit reached' : 'Submit New Laundry'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            cust.remaining_washes <= 0
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-teal-700 bg-teal-50 hover:bg-teal-100'
                          }`}
                        >
                          <Shirt className="w-4 h-4" />
                        </button>

                        {/* View Profile */}
                        <button
                          type="button"
                          onClick={() => handleOpenProfile(cust.id)}
                          title="View Profile & Wash History"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Customer */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cust)}
                          title="Edit Customer Details"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Renew Package */}
                        <button
                          type="button"
                          onClick={() => handleOpenRenew(cust)}
                          title="Renew Package / Reset Quota"
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      <CustomerModal
        isOpen={showAddEditModal}
        customer={editingCustomer}
        onClose={() => {
          setShowAddEditModal(false);
          setEditingCustomer(null);
        }}
        onSaved={reloadData}
      />

      {/* Profile & Wash History Modal */}
      <CustomerProfileModal
        isOpen={showProfileModal}
        customerId={viewingCustomerId}
        onClose={() => {
          setShowProfileModal(false);
          setViewingCustomerId(null);
        }}
        onEdit={cust => {
          setShowProfileModal(false);
          handleOpenEdit(cust);
        }}
        onNewLaundry={cust => {
          setShowProfileModal(false);
          if (onNewLaundryForCustomer) onNewLaundryForCustomer(cust);
        }}
      />

      {/* Renew Package Modal */}
      <RenewPackageModal
        isOpen={showRenewModal}
        customer={renewingCustomer}
        onClose={() => {
          setShowRenewModal(false);
          setRenewingCustomer(null);
        }}
        onRenewed={reloadData}
      />
    </div>
  );
};
