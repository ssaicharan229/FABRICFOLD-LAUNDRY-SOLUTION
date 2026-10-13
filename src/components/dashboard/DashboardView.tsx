import React, { useState } from 'react';
import { Customer, LaundryOrder } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { SmsModal } from '../laundry/SmsModal';
import { ReceiptModal } from '../common/ReceiptModal';
import { 
  Users, 
  Shirt, 
  Clock, 
  CheckCircle2, 
  Layers, 
  Package as PackageIcon, 
  AlertTriangle, 
  Plus, 
  ArrowRight, 
  Sparkles, 
  Send, 
  Play, 
  Eye, 
  Printer, 
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface DashboardViewProps {
  onNavigateTab: (tab: any) => void;
  onNewLaundryWithCustomer?: (customer: Customer) => void;
  onViewCustomerProfile?: (customerId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onNewLaundryWithCustomer,
  onViewCustomerProfile,
}) => {
  const { success, error } = useToast();
  const [stats, setStats] = useState(() => dataService.getDashboardStats());

  // Modals state
  const [activeSmsOrder, setActiveSmsOrder] = useState<LaundryOrder | null>(null);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<LaundryOrder | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const refreshDashboard = () => {
    setStats(dataService.getDashboardStats());
  };

  const handleStartWashing = (orderId: string) => {
    try {
      dataService.updateOrderStatus(orderId, 'Washing');
      success('Order Updated', 'Laundry is now in Washing stage.');
      refreshDashboard();
    } catch (err: any) {
      error('Failed to update status', err?.message);
    }
  };

  const handleCompleteOrder = (orderId: string) => {
    try {
      const updated = dataService.completeOrder(orderId);
      success('Wash Completed!', `1 wash deducted. Order ${updated.order_id} ready.`);
      refreshDashboard();
      setActiveSmsOrder(updated);
      setShowSmsModal(true);
    } catch (err: any) {
      error('Failed to complete order', err?.message);
    }
  };

  return (
    <div className="space-y-7">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" /> FABRICFOLD HOSTEL OPERATIONS
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Laundry Counter Operations
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Real-time student wash tracking, automatic balance deductions, and instant pickup SMS alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateTab('new-laundry')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs tracking-wider uppercase transition-all shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 cursor-pointer"
            >
              <Shirt className="w-4 h-4" /> + New Laundry
            </button>
            <button
              onClick={() => onNavigateTab('customers')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition-all cursor-pointer"
            >
              <Users className="w-4 h-4" /> Customers Directory
            </button>
          </div>
        </div>
      </div>

      {/* 7 KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
        {/* 1. Total Customers */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Customers</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
            {stats.totalCustomers}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Hostel students enrolled</div>
        </div>

        {/* 2. Today's Submissions */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Intake</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Shirt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-700 mt-2 font-mono">
            {stats.todaySubmissions}
          </div>
          <div className="text-[10px] text-teal-600 font-medium mt-1">New batches received</div>
        </div>

        {/* 3. Pending Orders */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Orders</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2 font-mono">
            {stats.pendingOrders}
          </div>
          <div className="text-[10px] text-amber-600 font-medium mt-1">Submitted + Washing</div>
        </div>

        {/* 4. Completed Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Today</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">
            {stats.completedToday}
          </div>
          <div className="text-[10px] text-emerald-600 font-medium mt-1">Ready for collection</div>
        </div>

        {/* 5. Total Clothes Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Clothes Today</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-900 mt-2 font-mono">
            {stats.totalClothesToday} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Garments counted</div>
        </div>

        {/* 6. Open Complaints */}
        <div 
          onClick={() => onNavigateTab('complaints')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-rose-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Open Complaints</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2 font-mono">
            {stats.openComplaintsCount}
          </div>
          <div className="text-[10px] text-rose-600 font-medium mt-1">Pending student issues</div>
        </div>

        {/* 7. Low Wash Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Low Balance</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2 font-mono">
            {stats.lowBalanceCount + stats.exhaustedBalanceCount}
          </div>
          <div className="text-[10px] text-rose-600 font-bold mt-1">≤ 5 washes left</div>
        </div>
      </div>

      {/* Low Balance Alert Banner (if any) */}
      {(stats.lowBalanceCount > 0 || stats.exhaustedBalanceCount > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-amber-900 uppercase tracking-wider">
                Student Wash Balance Alert ({stats.lowBalanceCount + stats.exhaustedBalanceCount} Students)
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {stats.exhaustedBalanceCount} students have completely exhausted their annual wash quota (0 remaining), and {stats.lowBalanceCount} have 5 or fewer washes remaining.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('customers')}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            Review Students <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Recent / Today's Laundry Submissions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Laundry Submissions</h3>
            <p className="text-xs text-slate-500">Live operational feed from counter check-in to wash completion</p>
          </div>

          <button
            onClick={() => onNavigateTab('orders')}
            className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1.5"
          >
            View All Laundry Orders ({dataService.getOrders().length}) <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Recent Orders Cards (< md) */}
        <div className="md:hidden divide-y divide-slate-100">
          {stats.recentOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No recent laundry submissions. Tap "+ New Laundry" to intake garments.
            </div>
          ) : (
            stats.recentOrders.map(order => (
              <div key={order.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onViewCustomerProfile && onViewCustomerProfile(order.customer_id)}
                      className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200"
                    >
                      {order.customer_ref_id}
                    </button>
                    <span className="font-bold text-xs text-slate-900">{order.student_name}</span>
                  </div>
                  <span className="font-mono font-bold text-xs bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                    {order.clothes_count} pcs
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{order.hostel_name} {order.room_number ? `(${order.room_number})` : ''}</span>
                  <span className="font-mono text-slate-400">
                    {new Date(order.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-50">
                  <div>
                    {order.status === 'Submitted' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-sky-50 text-sky-700 border border-sky-200">
                        <Clock className="w-3 h-3 text-sky-500" /> Submitted
                      </span>
                    )}
                    {order.status === 'Washing' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                        <Play className="w-3 h-3 text-indigo-500" /> Washing
                      </span>
                    )}
                    {order.status === 'Completed' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {order.status === 'Submitted' && (
                      <button
                        type="button"
                        onClick={() => handleStartWashing(order.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <Play className="w-3 h-3" /> Wash
                      </button>
                    )}
                    {order.status === 'Washing' && (
                      <button
                        type="button"
                        onClick={() => handleCompleteOrder(order.id)}
                        className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Complete
                      </button>
                    )}
                    {order.status === 'Completed' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSmsOrder(order);
                          setShowSmsModal(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1 active:scale-95 cursor-pointer"
                      >
                        <Send className="w-3 h-3" /> SMS
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReceiptOrder(order);
                        setShowReceiptModal(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Hostel Name</th>
                <th className="py-3 px-4 text-center">Clothes Count</th>
                <th className="py-3 px-4">Submission Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No recent laundry submissions. Click "+ New Laundry" to intake student garments.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Customer ID */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewCustomerProfile && onViewCustomerProfile(order.customer_id)}
                        className="font-mono font-bold text-teal-700 hover:underline bg-teal-50 px-2 py-0.5 rounded border border-teal-200"
                      >
                        {order.customer_ref_id}
                      </button>
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{order.student_name}</span>
                    </td>

                    {/* Hostel Name */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <span>{order.hostel_name}</span>
                      {order.room_number && (
                        <span className="text-[11px] text-slate-400 ml-1 font-mono">({order.room_number})</span>
                      )}
                    </td>

                    {/* Clothes count */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="font-black text-amber-900 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-mono">
                        {order.clothes_count} pcs
                      </span>
                    </td>

                    {/* Submission Time */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {new Date(order.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      <span className="text-slate-400 text-[10px] ml-1">
                        ({new Date(order.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {order.status === 'Submitted' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-sky-50 text-sky-700 border border-sky-200">
                          <Clock className="w-3 h-3 text-sky-500" /> Submitted
                        </span>
                      )}
                      {order.status === 'Washing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Play className="w-3 h-3 text-indigo-500" /> Washing
                        </span>
                      )}
                      {order.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {order.status === 'Submitted' && (
                          <button
                            type="button"
                            onClick={() => handleStartWashing(order.id)}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Play className="w-3 h-3" /> Wash
                          </button>
                        )}

                        {order.status === 'Washing' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteOrder(order.id)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3" /> Complete
                          </button>
                        )}

                        {order.status === 'Completed' && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveSmsOrder(order);
                              setShowSmsModal(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" /> SMS
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveReceiptOrder(order);
                            setShowReceiptModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
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

      {/* Modals */}
      <SmsModal
        isOpen={showSmsModal}
        order={activeSmsOrder}
        onClose={() => setShowSmsModal(false)}
        onSent={refreshDashboard}
      />

      <ReceiptModal
        isOpen={showReceiptModal}
        order={activeReceiptOrder}
        onClose={() => setShowReceiptModal(false)}
      />
    </div>
  );
};
