import React, { useState, useEffect } from 'react';
import { Customer, LaundryOrder } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { ReceiptModal } from '../common/ReceiptModal';
import { 
  Search, 
  Sparkles, 
  Shirt, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  Building2, 
  Phone, 
  Package as PackageIcon, 
  User, 
  ArrowRight,
  PlusCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface NewLaundryProps {
  initialCustomerId?: string;
  onOrderCreated?: (order: LaundryOrder) => void;
  onRenewCustomer?: (customer: Customer) => void;
  onNavigateOrders?: () => void;
}

export const NewLaundry: React.FC<NewLaundryProps> = ({
  initialCustomerId,
  onOrderCreated,
  onRenewCustomer,
  onNavigateOrders,
}) => {
  const { success, error, warning } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [clothesCount, setClothesCount] = useState<number>(8);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [lastCreatedOrder, setLastCreatedOrder] = useState<LaundryOrder | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // If initial customer ID passed, auto-select
  useEffect(() => {
    if (initialCustomerId) {
      const c = dataService.getCustomerById(initialCustomerId);
      if (c) {
        setSelectedCustomer(c);
        setSearchQuery(`${c.customer_id} - ${c.name}`);
      }
    }
  }, [initialCustomerId]);

  // Handle Search Input
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const matched = dataService.searchCustomers(q);
    setSearchResults(matched.slice(0, 6));
  };

  const selectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setSearchQuery(`${c.customer_id} - ${c.name}`);
    setSearchResults([]);

    if (c.remaining_washes <= 0) {
      warning('Wash Limit Reached', `This customer's yearly wash limit of ${c.total_washes} washes has been reached.`);
    } else if (c.remaining_washes <= 5) {
      warning('Low Wash Balance', `Only ${c.remaining_washes} washes left for this customer.`);
    }
  };

  const clearSelection = () => {
    setSelectedCustomer(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      error('Please select a customer first');
      return;
    }

    // Safety check for wash limit
    if (selectedCustomer.remaining_washes <= 0) {
      error(
        'Submission Blocked',
        `This customer's yearly wash limit of ${selectedCustomer.total_washes} washes has been reached.`
      );
      return;
    }

    if (!clothesCount || clothesCount <= 0) {
      error('Invalid Clothes Count', 'Please specify at least 1 piece of clothing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = dataService.createOrder({
        customer_id: selectedCustomer.id,
        clothes_count: clothesCount,
        notes: notes.trim(),
        created_by: 'Staff Attendant',
      });

      // Confetti burst for quick staff delight
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {
        // ignore
      }

      success('Laundry Order Created!', `Order ID: ${order.order_id} for ${selectedCustomer.name}`);
      setLastCreatedOrder(order);
      setShowReceiptModal(true);

      if (onOrderCreated) {
        onOrderCreated(order);
      }

      // Refresh customer state
      const refreshed = dataService.getCustomerById(selectedCustomer.id);
      if (refreshed) setSelectedCustomer(refreshed);

      // Reset clothes count
      setClothesCount(8);
      setNotes('');
    } catch (err: any) {
      error('Failed to create order', err?.message || 'Error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLimitReached = selectedCustomer && selectedCustomer.remaining_washes <= 0;
  const isLowBalance = selectedCustomer && selectedCustomer.remaining_washes > 0 && selectedCustomer.remaining_washes <= 5;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-teal-500/10 text-teal-700 rounded-xl">
              <Shirt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Laundry Submission</h1>
              <p className="text-xs text-slate-500">Fast counter workflow: Search student, count clothes, generate order token</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer Lookup & Summary */}
        <div className="lg:col-span-7 space-y-5">
          {/* Customer Search Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Customer Lookup (ID, Name, or Mobile)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Type Customer ID (e.g. FFL-0001), Student Name, or Mobile..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-10 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900 transition-all font-medium"
              />
              {selectedCustomer && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectCustomer(c)}
                    className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono group-hover:bg-teal-100 group-hover:text-teal-800">
                          {c.customer_id}
                        </span>
                        <span className="font-semibold text-sm text-slate-900">{c.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {c.hostel_name} {c.room_number ? `(Rm ${c.room_number}) ` : ''}• {c.mobile}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        c.remaining_washes === 0 
                          ? 'bg-rose-100 text-rose-700' 
                          : c.remaining_washes <= 5 
                          ? 'bg-amber-100 text-amber-700' 
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {c.remaining_washes} left
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected Customer Card */}
          {selectedCustomer ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 text-teal-300 flex items-center justify-center font-bold text-lg shadow-sm">
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-900">{selectedCustomer.name}</h3>
                      <span className="bg-teal-50 text-teal-700 border border-teal-200 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                        {selectedCustomer.customer_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {selectedCustomer.hostel_name} {selectedCustomer.room_number ? `• Room ${selectedCustomer.room_number}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">Plan</span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-lg mt-0.5">
                    <PackageIcon className="w-3 h-3" />
                    {selectedCustomer.package_name}
                  </span>
                </div>
              </div>

              {/* Customer Contact & Detail Pills */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Registered Mobile</span>
                  <span className="font-semibold text-slate-800 font-mono flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-teal-600" />
                    {selectedCustomer.mobile}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Plan Validity</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCustomer.package_end_date ? `Until ${new Date(selectedCustomer.package_end_date).toLocaleDateString()}` : 'Academic Year Plan'}
                  </span>
                </div>
              </div>

              {/* Wash Balance Progress & Status Indicator */}
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">Annual Wash Usage</span>
                  <span className="text-slate-900 font-mono">
                    <strong className="text-teal-700">{selectedCustomer.used_washes}</strong> / {selectedCustomer.total_washes} Used
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isLimitReached
                        ? 'bg-rose-600'
                        : isLowBalance
                        ? 'bg-amber-500'
                        : 'bg-teal-600'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        (selectedCustomer.used_washes / selectedCustomer.total_washes) * 100
                      )}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">
                    Remaining Quota:
                  </span>
                  <span className={`font-black text-sm ${
                    isLimitReached ? 'text-rose-600' : isLowBalance ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    {selectedCustomer.remaining_washes} Washes Left
                  </span>
                </div>
              </div>

              {/* CRITICAL WARNING MESSAGES */}
              {isLimitReached && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 space-y-2 animate-in shake duration-300">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-sm text-rose-800">WASH LIMIT REACHED</h4>
                      <p className="text-xs text-rose-700 font-medium mt-0.5">
                        This customer's yearly wash limit of {selectedCustomer.total_washes} washes has been reached.
                      </p>
                    </div>
                  </div>
                  {onRenewCustomer && (
                    <button
                      type="button"
                      onClick={() => onRenewCustomer(selectedCustomer)}
                      className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Renew / Assign New Package
                    </button>
                  )}
                </div>
              )}

              {isLowBalance && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold">LOW WASH BALANCE WARNING: </span>
                    Customer has only {selectedCustomer.remaining_washes} washes remaining. Please remind them to renew soon.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-400">
              <User className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">No customer selected</p>
              <p className="text-xs text-slate-400 mt-1">
                Search by Student Name, ID (e.g. FFL-0001), or 10-digit mobile number above.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Clothes Count & Big Submit Button */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Number of Clothes Submitted
              </label>

              {/* Number Input with Incrementers */}
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={clothesCount}
                  onChange={e => setClothesCount(parseInt(e.target.value, 10) || 0)}
                  className="w-28 text-center text-3xl font-extrabold text-slate-900 p-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:bg-white"
                />
                <div className="flex-1 grid grid-cols-3 gap-1.5">
                  {[5, 8, 10, 12, 15, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setClothesCount(cnt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        clothesCount === cnt
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cnt} pcs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Special Instructions / Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Notes / Special Garment Instructions (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g., 2 Blazers, 1 Bed Sheet, Delicate woolen knitwear..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
              />
            </div>

            {/* Workflow Step Indicators */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                Order will be registered as <span className="text-teal-700 font-mono">Submitted</span>
              </div>
              <div className="text-slate-500 pl-5">
                1 wash will be counted atomically upon laundry completion.
              </div>
            </div>

            {/* BIG SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={!selectedCustomer || isLimitReached || isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-3 cursor-pointer ${
                !selectedCustomer
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : isLimitReached
                  ? 'bg-rose-200 text-rose-500 cursor-not-allowed shadow-none'
                  : 'bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white shadow-teal-600/30 glow-teal'
              }`}
            >
              <Shirt className="w-5 h-5" />
              {isSubmitting ? 'PROCESSING SUBMISSION...' : 'SUBMIT LAUNDRY'}
            </button>

            {isLimitReached && (
              <p className="text-center text-xs font-bold text-rose-600">
                Action blocked: Wash quota exhausted. Renew package to continue.
              </p>
            )}
          </form>

          {/* Quick Nav Button */}
          {onNavigateOrders && (
            <button
              type="button"
              onClick={onNavigateOrders}
              className="w-full flex items-center justify-center gap-2 p-3 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              View All Active Laundry Orders
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        order={lastCreatedOrder}
        customer={selectedCustomer}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};
