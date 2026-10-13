import React, { useState } from 'react';
import { Customer, LaundryOrder } from '../../types';
import { dataService } from '../../services/dataService';
import { 
  X, 
  Building2, 
  Phone, 
  Calendar, 
  Package as PackageIcon, 
  Shirt, 
  RotateCcw, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Printer, 
  ExternalLink 
} from 'lucide-react';
import { RenewPackageModal } from './RenewPackageModal';
import { ReceiptModal } from '../common/ReceiptModal';

interface CustomerProfileModalProps {
  isOpen: boolean;
  customerId: string | null;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onNewLaundry: (customer: Customer) => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  customerId,
  onClose,
  onEdit,
  onNewLaundry,
}) => {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    return customerId ? dataService.getCustomerById(customerId) || null : null;
  });

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<LaundryOrder | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Sync if customerId changes
  React.useEffect(() => {
    if (customerId) {
      setCustomer(dataService.getCustomerById(customerId) || null);
    }
  }, [customerId]);

  if (!isOpen || !customer) return null;

  // Retrieve customer's wash orders
  const orders = dataService.getOrdersByCustomerId(customer.id);
  const completedOrders = orders.filter(o => o.status === 'Completed');

  const isLimitReached = customer.remaining_washes <= 0;
  const isLowBalance = customer.remaining_washes > 0 && customer.remaining_washes <= 5;
  const usagePercentage = Math.min(100, (customer.used_washes / customer.total_washes) * 100);

  const handleRenewSuccess = (updated: Customer) => {
    setCustomer(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Prominent ID Badge */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-400/30 text-teal-300 font-extrabold text-2xl flex items-center justify-center shadow-inner">
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-extrabold tracking-tight">{customer.name}</h2>
                  <span className="bg-teal-400/20 border border-teal-400/40 text-teal-300 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold tracking-wider">
                    {customer.customer_id}
                  </span>
                </div>
                <div className="text-xs text-slate-300 flex items-center gap-3 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-teal-400" />
                    {customer.hostel_name} {customer.room_number ? `(Room ${customer.room_number})` : <span className="text-slate-400 italic">(Room not specified)</span>}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-teal-400" />
                    {customer.mobile}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onEdit(customer)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                type="button"
                onClick={() => setShowRenewModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-teal-200 hover:text-white bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/30 rounded-xl transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Renew Plan
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Wash Balance Progress & Quota Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Package Subscription
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-bold text-slate-900">{customer.package_name}</span>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    ₹{customer.package_price?.toLocaleString()}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {customer.package_start_date && customer.package_end_date ? (
                    `Valid: ${customer.package_start_date} to ${customer.package_end_date}`
                  ) : (
                    <span className="italic text-slate-400">Validity dates: Not specified</span>
                  )}
                </div>
              </div>

              {/* Prominent Balance Digits */}
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Remaining Washes
                </span>
                <div className={`text-3xl font-black font-mono mt-0.5 ${
                  isLimitReached ? 'text-rose-600' : isLowBalance ? 'text-amber-600' : 'text-teal-700'
                }`}>
                  {customer.remaining_washes} <span className="text-sm font-semibold text-slate-400">/ {customer.total_washes}</span>
                </div>
                <div className="text-xs font-bold text-slate-700">
                  {customer.used_washes} / {customer.total_washes} used
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1">
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-700 ${
                    isLimitReached ? 'bg-rose-500' : isLowBalance ? 'bg-amber-500' : 'bg-teal-600'
                  }`}
                  style={{ width: `${usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-semibold font-mono">
                <span>0 Washes</span>
                <span>{usagePercentage.toFixed(0)}% Quota Consumed</span>
                <span>Max {customer.total_washes} Washes</span>
              </div>
            </div>

            {/* Status alerts */}
            {isLimitReached && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span><strong>WASH LIMIT REACHED:</strong> This customer has used all {customer.total_washes} yearly washes.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenewModal(true)}
                  className="font-bold underline ml-2 shrink-0 hover:text-rose-950"
                >
                  Renew Now
                </button>
              </div>
            )}

            {isLowBalance && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong>LOW WASH BALANCE:</strong> Only {customer.remaining_washes} washes remaining.</span>
              </div>
            )}
          </div>

          {/* Wash History Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                Customer Wash History ({orders.length} Submissions)
              </h3>

              {!isLimitReached && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNewLaundry(customer);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-all"
                >
                  <Shirt className="w-3.5 h-3.5" /> + New Laundry
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3">Wash #</th>
                    <th className="py-2.5 px-3">Order ID</th>
                    <th className="py-2.5 px-3">Clothes</th>
                    <th className="py-2.5 px-3">Submitted</th>
                    <th className="py-2.5 px-3">Completed</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No laundry submissions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o, idx) => (
                      <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-500">
                          #{orders.length - idx}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {o.order_id}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {o.clothes_count} pcs
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {new Date(o.submitted_at).toLocaleDateString()} {new Date(o.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {o.completed_at ? (
                            <span className="text-emerald-700 font-medium">
                              {new Date(o.completed_at).toLocaleDateString()} {new Date(o.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">In Progress</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : o.status === 'Washing'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-sky-50 text-sky-700 border border-sky-200'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveReceiptOrder(o);
                              setShowReceiptModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Customer Profile: {customer.customer_id}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Renew Modal */}
      <RenewPackageModal
        isOpen={showRenewModal}
        customer={customer}
        onClose={() => setShowRenewModal(false)}
        onRenewed={handleRenewSuccess}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        order={activeReceiptOrder}
        customer={customer}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};
