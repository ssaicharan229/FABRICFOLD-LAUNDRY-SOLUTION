import React, { useState } from 'react';
import { Customer, LaundryOrder, AppUser, NotificationLog } from '../../types';
import { dataService } from '../../services/dataService';
import { StudentComplaintsView } from '../complaints/StudentComplaintsView';
import { 
  Shirt, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Bell, 
  FileText, 
  User, 
  Building2, 
  Phone, 
  Sparkles, 
  Play, 
  PackageCheck,
  Smartphone,
  Mail,
  ShieldCheck
} from 'lucide-react';

interface StudentPortalViewProps {
  currentUser: AppUser;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({ currentUser }) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'orders' | 'complaints' | 'notifications'>('overview');

  // Lookup the actual customer record
  let customer = dataService.getCustomers().find(
    c => c.id === currentUser.customer_id || 
         c.customer_id === currentUser.customer_ref_id ||
         (currentUser.mobile && c.mobile === currentUser.mobile) ||
         (currentUser.email && c.email?.toLowerCase() === currentUser.email.toLowerCase())
  );

  // If not yet linked, auto-provision student laundry quota & customer record
  if (!customer && currentUser.role === 'student') {
    try {
      customer = dataService.addCustomer({
        name: currentUser.name || 'Student Resident',
        mobile: currentUser.mobile || '9948445878',
        email: currentUser.email || undefined,
        hostel_id: 'hostel-ganga',
        package_id: 'pkg-basic',
        total_washes: 34,
        used_washes: 0
      });
      const updatedUser = {
        ...currentUser,
        customer_id: customer.id,
        customer_ref_id: customer.customer_id,
        mobile: customer.mobile,
        hostel_name: customer.hostel_name,
      };
      localStorage.setItem('ffl_current_user_v3', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn('Student auto-provision notice:', e);
    }
  }

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">Student Profile Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">Please contact hostel laundry administration to assign your student ID.</p>
      </div>
    );
  }

  const orders = dataService.getOrdersByCustomerId(customer.id);
  const notifications = dataService.getNotificationLogs({ customerId: customer.id });

  // Determine if there is any completed order awaiting pickup
  const readyForPickupOrders = orders.filter(o => o.status === 'Completed');
  const activeWashingOrders = orders.filter(o => o.status === 'Submitted' || o.status === 'Washing');

  const usagePercent = Math.min(100, Math.round((customer.used_washes / customer.total_washes) * 100));

  return (
    <div className="space-y-6">
      {/* Student Welcome Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider border border-teal-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Hostel Student Resident Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome, {customer.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="font-mono bg-white/10 px-2.5 py-0.5 rounded-md font-bold text-teal-300">
                {customer.customer_id}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                {customer.hostel_name} {customer.room_number ? `(Room ${customer.room_number})` : ''}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                {customer.mobile}
              </span>
            </div>
          </div>

          {/* Package Badge Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 shrink-0 text-right">
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-wider block">
              Enrolled Package
            </span>
            <div className="text-lg font-black text-white mt-0.5">{customer.package_name || 'PREMIUM'}</div>
            <div className="text-xs text-slate-300 font-mono">
              ₹{(customer.package_price || 6500).toLocaleString()} • {customer.total_washes} Washes/Yr
            </div>
          </div>
        </div>
      </div>

      {/* Ready for Pickup Banner Alert */}
      {readyForPickupOrders.length > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 border-2 border-emerald-500/40 rounded-3xl flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Laundry Ready for Pickup! ({readyForPickupOrders.length} Order)
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Your clothes have finished washing and tumble folding. Please visit the Ganga Hostel laundry counter to collect Order #{readyForPickupOrders[0].order_id}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveSubTab('orders')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
          >
            View Order Token
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-2xl text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'overview'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-teal-600" />
          <span>Overview & Quota</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'orders'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Shirt className="w-4 h-4 text-teal-600" />
          <span>My Laundry Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('complaints')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'complaints'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>Complaints & Issues</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'notifications'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4 text-teal-600" />
          <span>Pickup Notifications ({notifications.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview & Quota */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Wash Counter & Quota Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Academic Year Wash Meter
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">
                  Remaining Washes: {customer.remaining_washes} of {customer.total_washes}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-2xl font-black text-teal-700">{customer.used_washes}</div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Washes Used</div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-900">{customer.remaining_washes}</div>
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Available</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    customer.remaining_washes === 0
                      ? 'bg-rose-500'
                      : customer.remaining_washes <= 5
                      ? 'bg-amber-500'
                      : 'bg-gradient-to-r from-teal-500 to-emerald-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>0 washes</span>
                <span>{usagePercent}% quota utilized</span>
                <span>{customer.total_washes} limit</span>
              </div>
            </div>

            {/* Quota Safeguard Info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-900">Exactly-Once Wash Deductions:</strong> Each time your clothes complete the full washing and folding cycle, exactly 1 wash is deducted from your balance. Orders that are in progress or canceled never deplete your quota.
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Submissions</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{orders.length}</span>
              <span className="text-[11px] text-slate-500">Recorded orders</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">In Washing Cycle</span>
              <span className="text-2xl font-black text-indigo-700 mt-1 block">{activeWashingOrders.length}</span>
              <span className="text-[11px] text-slate-500">Currently in machine</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Completed Clean</span>
              <span className="text-2xl font-black text-emerald-700 mt-1 block">{readyForPickupOrders.length}</span>
              <span className="text-[11px] text-slate-500">Ready or collected</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: My Laundry Orders */}
      {activeSubTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-slate-900">Laundry Submissions History</h3>
              <p className="text-xs text-slate-500">Track stages of your clothes from check-in to collection</p>
            </div>
          </div>

          {/* Mobile Orders Cards (< md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {orders.length === 0 ? (
              <div className="py-12 px-4 text-center text-slate-400">
                <Shirt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No laundry submissions yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Drop off your clothes at the hostel laundry counter to create your first order.
                </p>
              </div>
            ) : (
              orders.map(ord => (
                <div key={ord.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {ord.order_id}
                    </span>
                    <span className="font-bold text-xs bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-200 font-mono">
                      {ord.clothes_count} clothes
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      {ord.status === 'Submitted' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          <Clock className="w-3 h-3 text-sky-500" /> Submitted
                        </span>
                      )}
                      {ord.status === 'Washing' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          <Play className="w-3 h-3 text-indigo-500 animate-pulse" /> Washing
                        </span>
                      )}
                      {ord.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                        </span>
                      )}
                    </div>

                    <div>
                      {ord.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                          <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> Ready for Collection
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Washing in progress</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-50">
                    <span>Submitted: {new Date(ord.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(ord.submitted_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    {ord.completed_at && (
                      <span className="text-teal-700 font-semibold">Done: {new Date(ord.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Garments</th>
                  <th className="py-3.5 px-4">Submitted Time</th>
                  <th className="py-3.5 px-4">Completed Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Pickup Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <Shirt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700 text-sm">No laundry submissions yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Drop off your clothes at the hostel laundry counter to create your first order.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {ord.order_id}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs">
                          {ord.clothes_count} clothes
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                        <div>{new Date(ord.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-400">{new Date(ord.submitted_at).toLocaleDateString()}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap text-[11px]">
                        {ord.completed_at ? (
                          <>
                            <div className="text-teal-700 font-semibold">
                              {new Date(ord.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px] text-slate-400">{new Date(ord.completed_at).toLocaleDateString()}</div>
                          </>
                        ) : (
                          <span className="text-slate-300 italic">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {ord.status === 'Submitted' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                            <Clock className="w-3 h-3 text-sky-500" /> Submitted
                          </span>
                        )}
                        {ord.status === 'Washing' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Play className="w-3 h-3 text-indigo-500 animate-pulse" /> Washing
                          </span>
                        )}
                        {ord.status === 'Completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Completed
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {ord.status === 'Completed' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                            <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> Ready at Counter
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">In Process</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Complaints */}
      {activeSubTab === 'complaints' && (
        <StudentComplaintsView customer={customer} />
      )}

      {/* Tab 4: Notifications Log */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-base text-slate-900">Pickup Notifications Log</h3>
              <p className="text-xs text-slate-500">
                Alerts dispatched to your mobile ({customer.mobile}) or email on order completion
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="font-semibold text-slate-700 text-sm">No notifications on record</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When your laundry order is completed, automated SMS and email notifications will appear here.
                </p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        notif.channel === 'sms'
                          ? 'bg-teal-100 text-teal-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {notif.channel === 'sms' ? <Smartphone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {notif.channel.toUpperCase()}
                      </span>
                      <span className="font-bold text-slate-900">
                        {notif.order_display_id ? `Order ${notif.order_display_id}` : 'Notice'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        via {notif.provider}
                      </span>
                    </div>
                    <p className="text-slate-600 font-mono text-[11px]">{notif.message}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> {notif.status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      {new Date(notif.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(notif.sent_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
