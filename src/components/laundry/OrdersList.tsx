import React, { useState, useMemo } from 'react';
import { LaundryOrder, OrderStatus, Customer } from '../../types';
import { dataService } from '../../services/dataService';
import { notificationService } from '../../services/notificationService';
import { useToast } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SmsModal } from './SmsModal';
import { ReceiptModal } from '../common/ReceiptModal';
import { 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Play, 
  Send, 
  MessageSquare, 
  Printer, 
  ArrowUpDown, 
  Eye, 
  RotateCcw,
  Sparkles,
  Shirt,
  Building2,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OrdersListProps {
  onViewCustomer?: (customerId: string) => void;
  onNewSubmission?: () => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({ onViewCustomer, onNewSubmission }) => {
  const { success, error, warning } = useToast();

  const [orders, setOrders] = useState<LaundryOrder[]>(() => dataService.getOrders());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'yesterday' | 'week'>('all');

  // Modals state
  const [completingOrderId, setCompletingOrderId] = useState<string | null>(null);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);

  const [activeSmsOrder, setActiveSmsOrder] = useState<LaundryOrder | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);

  const [activeReceiptOrder, setActiveReceiptOrder] = useState<LaundryOrder | null>(null);
  const [activeReceiptCustomer, setActiveReceiptCustomer] = useState<Customer | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const reloadOrders = () => {
    setOrders(dataService.getOrders());
  };

  // Filtered orders computation
  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    return orders.filter(o => {
      // Search match
      const matchesSearch = !q || (
        o.order_id.toLowerCase().includes(q) ||
        o.customer_ref_id.toLowerCase().includes(q) ||
        o.student_name.toLowerCase().includes(q) ||
        o.mobile.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
        o.hostel_name.toLowerCase().includes(q)
      );

      // Status match
      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;

      // Date match
      let matchesDate = true;
      if (dateFilter === 'today') {
        matchesDate = o.submitted_at.startsWith(todayStr);
      } else if (dateFilter === 'yesterday') {
        matchesDate = o.submitted_at.startsWith(yesterday);
      } else if (dateFilter === 'week') {
        matchesDate = o.submitted_at >= weekAgo;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  // Handle advancing to Washing
  const handleStartWashing = (orderId: string) => {
    try {
      dataService.updateOrderStatus(orderId, 'Washing');
      success('Status Updated', 'Order moved to Washing in progress.');
      reloadOrders();
    } catch (err: any) {
      error('Failed to update status', err?.message);
    }
  };

  // Trigger Complete Confirmation
  const promptCompleteOrder = (orderId: string) => {
    setCompletingOrderId(orderId);
    setShowConfirmComplete(true);
  };

  // Execute Complete Order with exactly-once wash deduction
  const executeCompleteOrder = () => {
    if (!completingOrderId) return;
    try {
      const order = dataService.getOrderById(completingOrderId);
      const updated = dataService.completeOrder(completingOrderId);

      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      success(
        'Laundry Completed!',
        `Order ${updated.order_id} marked complete. Exactly 1 wash deducted from ${updated.student_name}'s balance.`
      );

      // Automatically dispatch wash completion notifications via SMS and/or Email
      notificationService.notifyWashCompletion(updated).then(res => {
        if (res.dispatchedChannels.some(c => c.success)) {
          success('Notification Dispatched', res.overallSummary);
        } else {
          warning('Notification Notice', res.overallSummary);
        }
        reloadOrders();
      }).catch(err => {
        console.warn('Auto notification dispatch error:', err);
      });

      reloadOrders();
      setShowConfirmComplete(false);
    } catch (err: any) {
      error('Completion Failed', err?.message || 'Error occurred');
      setShowConfirmComplete(false);
    }
  };

  const handleOpenReceipt = (order: LaundryOrder) => {
    const cust = dataService.getCustomerById(order.customer_id);
    setActiveReceiptOrder(order);
    setActiveReceiptCustomer(cust || null);
    setShowReceiptModal(true);
  };

  const handleOpenSms = (order: LaundryOrder) => {
    setActiveSmsOrder(order);
    setShowSmsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laundry Orders & Wash Tracking</h1>
          <p className="text-xs text-slate-500">Track stages from Submitted to Washing & Completed with exactly-once wash deduction</p>
        </div>

        {onNewSubmission && (
          <button
            onClick={onNewSubmission}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Shirt className="w-4 h-4" /> + New Submission
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID (LD-...), Customer ID (FFL-...), Student Name, Mobile..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Status Tab Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            {['All', 'Submitted', 'Washing', 'Completed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="bg-transparent text-xs font-medium focus:outline-none"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Orders Cards (< md) */}
      <div className="md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <Shirt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm">No laundry orders found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try adjusting your search or filters</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    {order.order_id}
                  </span>
                  <span className="font-bold text-sm text-slate-900">{order.student_name}</span>
                </div>

                {/* Status Badge */}
                {order.status === 'Submitted' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-sky-50 text-sky-700 border border-sky-200">
                    <Clock className="w-3 h-3 text-sky-500" /> Submitted
                  </span>
                )}
                {order.status === 'Washing' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Play className="w-3 h-3 text-indigo-500 animate-pulse" /> Washing
                  </span>
                )}
                {order.status === 'Completed' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                  </span>
                )}
              </div>

              {/* Student details & clothes */}
              <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewCustomer && onViewCustomer(order.customer_id)}
                    className="font-mono text-teal-700 font-bold hover:underline"
                  >
                    {order.customer_ref_id}
                  </button>
                  <span>• {order.hostel_name} {order.room_number ? `(Rm ${order.room_number})` : ''}</span>
                </div>

                <span className="font-bold bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 font-mono text-xs">
                  {order.clothes_count} pcs
                </span>
              </div>

              {/* Times */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                <span>In: {new Date(order.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(order.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                {order.completed_at ? (
                  <span className="text-emerald-700 font-semibold">Done: {new Date(order.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                ) : (
                  <span className="italic text-slate-400">In cycle</span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                {order.status === 'Submitted' && (
                  <button
                    type="button"
                    onClick={() => handleStartWashing(order.id)}
                    className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" /> Start Washing
                  </button>
                )}

                {order.status === 'Washing' && (
                  <button
                    type="button"
                    onClick={() => promptCompleteOrder(order.id)}
                    className="flex-1 py-2.5 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete Wash (Deduct 1)
                  </button>
                )}

                {order.status === 'Completed' && (
                  <button
                    type="button"
                    onClick={() => handleOpenSms(order)}
                    className="flex-1 py-2.5 px-3 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-teal-600" />
                    {order.sms_status === 'Mock_Delivered' || order.sms_status === 'Sent' ? 'SMS Sent' : 'Send SMS'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleOpenReceipt(order)}
                  className="p-2.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors active:scale-95 cursor-pointer"
                  title="Print Token Receipt"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Orders Table Container (Desktop & Tablet >= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Student & Customer ID</th>
                <th className="py-3.5 px-4">Hostel / Room</th>
                <th className="py-3.5 px-4 text-center">Clothes</th>
                <th className="py-3.5 px-4">Submitted Time</th>
                <th className="py-3.5 px-4">Completed Time</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4">SMS Notification</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Shirt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No laundry orders found</p>
                    <p className="text-[11px] text-slate-400">Try adjusting your search or filters</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {order.order_id}
                      </span>
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">
                        {order.student_name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <button
                          type="button"
                          onClick={() => onViewCustomer && onViewCustomer(order.customer_id)}
                          className="font-mono text-[11px] text-teal-700 hover:underline flex items-center gap-1 font-bold"
                        >
                          {order.customer_ref_id}
                        </button>
                        <span className="text-slate-400 text-[10px]">• {order.mobile}</span>
                      </div>
                    </td>

                    {/* Hostel & Room */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                      <div>{order.hostel_name}</div>
                      <div className="text-[11px] text-slate-400">{order.room_number ? `Room ${order.room_number}` : 'Room: Not specified'}</div>
                    </td>

                    {/* Clothes count */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold bg-amber-50 text-amber-800 border border-amber-200 text-xs">
                        {order.clothes_count} pcs
                      </span>
                    </td>

                    {/* Submitted Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      <div>{new Date(order.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-400">{new Date(order.submitted_at).toLocaleDateString()}</div>
                    </td>

                    {/* Completed Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {order.completed_at ? (
                        <>
                          <div className="text-teal-700 font-semibold">{new Date(order.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          <div className="text-[10px] text-slate-400">{new Date(order.completed_at).toLocaleDateString()}</div>
                        </>
                      ) : (
                        <span className="text-slate-300 italic">—</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {order.status === 'Submitted' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-sky-50 text-sky-700 border border-sky-200">
                          <Clock className="w-3.5 h-3.5 text-sky-500" />
                          Submitted
                        </span>
                      )}
                      {order.status === 'Washing' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Play className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                          Washing
                        </span>
                      )}
                      {order.status === 'Completed' && (
                        <div className="inline-flex flex-col">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            Completed
                          </span>
                          {order.wash_counted && (
                            <span className="text-[10px] font-semibold text-emerald-600 mt-0.5">
                              ✓ 1 wash counted
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* SMS Status / Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {order.status === 'Completed' ? (
                        order.sms_status === 'Mock_Delivered' || order.sms_status === 'Sent' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenSms(order)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-emerald-800 bg-emerald-50 border border-emerald-200 font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            SMS Sent
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenSms(order)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white bg-teal-600 hover:bg-teal-700 font-bold shadow-sm transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            SEND SMS
                          </button>
                        )
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Available on completion</span>
                      )}
                    </td>

                    {/* Action Controls */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'Submitted' && (
                          <button
                            type="button"
                            onClick={() => handleStartWashing(order.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Start Washing
                          </button>
                        )}

                        {order.status === 'Washing' && (
                          <button
                            type="button"
                            onClick={() => promptCompleteOrder(order.id)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                          </button>
                        )}

                        {/* Print Receipt */}
                        <button
                          type="button"
                          onClick={() => handleOpenReceipt(order)}
                          title="Print Laundry Token"
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Printer className="w-4 h-4" />
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

      {/* Confirmation Dialog for Completing Order */}
      <ConfirmDialog
        isOpen={showConfirmComplete}
        title="Complete Laundry & Count Wash?"
        message="Marking this laundry as completed will record the completion timestamp and atomically increment the student's used wash count by exactly 1. This action cannot be double-counted."
        confirmText="Yes, Complete & Count 1 Wash"
        variant="primary"
        onConfirm={executeCompleteOrder}
        onCancel={() => setShowConfirmComplete(false)}
      />

      {/* SMS Sender Modal */}
      <SmsModal
        isOpen={showSmsModal}
        order={activeSmsOrder}
        onClose={() => setShowSmsModal(false)}
        onSent={reloadOrders}
      />

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={showReceiptModal}
        order={activeReceiptOrder}
        customer={activeReceiptCustomer}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};
