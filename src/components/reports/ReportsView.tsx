import React, { useState, useMemo } from 'react';
import { Customer, LaundryOrder, Package, Hostel, Complaint } from '../../types';
import { dataService } from '../../services/dataService';
import { exportToCSV, formatCustomerExport, formatOrderExport, formatSMSLogExport, formatComplaintExport } from '../../services/exportService';
import { useToast } from '../common/Toast';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Users, 
  Shirt, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Package as PackageIcon, 
  Building2, 
  FileSpreadsheet,
  TrendingUp,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { success } = useToast();

  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const customers = dataService.getCustomers();
  const orders = dataService.getOrders();
  const packages = dataService.getPackages();
  const hostels = dataService.getHostels();
  const smsLogs = dataService.getSMSLogs();
  const complaints = dataService.getComplaints();

  // Filter orders by selected timeframe
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return orders.filter(o => {
      const orderDate = o.submitted_at;
      if (dateRange === 'today') {
        return orderDate.startsWith(todayStr);
      }
      if (dateRange === 'week') {
        return new Date(orderDate) >= weekAgo;
      }
      if (dateRange === 'month') {
        return new Date(orderDate) >= monthAgo;
      }
      if (dateRange === 'custom') {
        const d = orderDate.split('T')[0];
        return d >= customStartDate && d <= customEndDate;
      }
      return true;
    });
  }, [orders, dateRange, customStartDate, customEndDate]);

  // Aggregate stats
  const totalCustomers = customers.length;
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.status === 'Completed').length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'Submitted' || o.status === 'Washing').length;
  const totalClothes = filteredOrders.reduce((sum, o) => sum + (o.clothes_count || 0), 0);
  const totalWashesUsed = customers.reduce((sum, c) => sum + (c.used_washes || 0), 0);

  // Group by Package
  const customersByPackage = useMemo(() => {
    const map: Record<string, number> = {};
    packages.forEach(p => (map[p.name] = 0));
    customers.forEach(c => {
      const pName = c.package_name || 'BASIC';
      map[pName] = (map[pName] || 0) + 1;
    });
    return map;
  }, [customers, packages]);

  // Group by Hostel
  const customersByHostel = useMemo(() => {
    const map: Record<string, number> = {};
    hostels.forEach(h => (map[h.name] = 0));
    customers.forEach(c => {
      const hName = c.hostel_name || 'Unknown';
      map[hName] = (map[hName] || 0) + 1;
    });
    return map;
  }, [customers, hostels]);

  // Daily Orders Breakdown (Last 7 days active)
  const dailyBreakdown = useMemo(() => {
    const days: Record<string, { date: string; count: number; clothes: number }> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString([], { weekday: 'short', month: 'numeric', day: 'numeric' });
      days[key] = { date: label, count: 0, clothes: 0 };
    }

    orders.forEach(o => {
      const key = o.submitted_at.split('T')[0];
      if (days[key]) {
        days[key].count += 1;
        days[key].clothes += o.clothes_count;
      }
    });

    return Object.values(days);
  }, [orders]);

  // Export handlers
  const handleExportOrders = () => {
    exportToCSV('fabricfold_laundry_orders', formatOrderExport(filteredOrders));
    success('Export Completed', 'Laundry orders CSV exported.');
  };

  const handleExportCustomers = () => {
    exportToCSV('fabricfold_customers_roster', formatCustomerExport(customers));
    success('Export Completed', 'Customers directory CSV exported.');
  };

  const handleExportSMS = () => {
    exportToCSV('fabricfold_sms_dispatch_logs', formatSMSLogExport(smsLogs));
    success('Export Completed', 'SMS delivery logs CSV exported.');
  };

  const handleExportComplaints = () => {
    exportToCSV('fabricfold_complaints_register', formatComplaintExport(complaints));
    success('Export Completed', 'Complaints register CSV exported.');
  };

  return (
    <div className="space-y-6">
      {/* Header and Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laundry Reports & Analytics</h1>
          <p className="text-xs text-slate-500">Service metrics, garment volumes, hostel resident distributions, and data export</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportOrders}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600" /> Export Orders CSV
          </button>
          <button
            onClick={handleExportCustomers}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-teal-600" /> Export Students CSV
          </button>
          <button
            onClick={handleExportComplaints}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-rose-600" /> Export Complaints CSV
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-teal-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date Period:</span>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  dateRange === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {dateRange === 'custom' && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            />
          </div>
        )}
      </div>

      {/* 6 Metric Summaries */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Enrolled Students</span>
          <div className="text-2xl font-black text-slate-900 mt-2 font-mono">{totalCustomers}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total active profiles</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Laundry Orders</span>
          <div className="text-2xl font-black text-teal-700 mt-2 font-mono">{totalOrders}</div>
          <div className="text-[10px] text-slate-400 mt-1">In selected period</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Completed Washes</span>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-mono">{completedOrders}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">100% processed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Pending Orders</span>
          <div className="text-2xl font-black text-amber-700 mt-2 font-mono">{pendingOrders}</div>
          <div className="text-[10px] text-slate-400 mt-1">Submitted / Washing</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Clothes Processed</span>
          <div className="text-2xl font-black text-indigo-900 mt-2 font-mono">{totalClothes}</div>
          <div className="text-[10px] text-slate-400 mt-1">Pieces laundered</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Washes Used</span>
          <div className="text-2xl font-black text-purple-900 mt-2 font-mono">{totalWashesUsed}</div>
          <div className="text-[10px] text-slate-400 mt-1">Across all students</div>
        </div>
      </div>

      {/* Visual Charts & Breakdown Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Laundry Activity Bar Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-teal-600" /> Daily Intake & Garment Volume (Past 7 Days)
              </h3>
              <p className="text-xs text-slate-400">Order count and garment pieces processed</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-3 h-3 bg-teal-600 rounded-sm"></span> Orders
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-3 h-3 bg-indigo-400 rounded-sm"></span> Clothes
              </span>
            </div>
          </div>

          <div className="pt-4 grid grid-cols-7 gap-3 h-48 items-end border-b border-slate-100 pb-2">
            {dailyBreakdown.map((item, idx) => {
              const maxClothes = Math.max(...dailyBreakdown.map(d => d.clothes), 25);
              const barHeightPct = Math.min(100, (item.clothes / maxClothes) * 100);

              return (
                <div key={idx} className="flex flex-col items-center justify-end h-full gap-1 group">
                  <div className="text-[11px] font-bold text-slate-800 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count} ord ({item.clothes} pcs)
                  </div>
                  <div className="w-full flex items-end justify-center gap-1 h-32">
                    <div
                      className="w-4 bg-teal-600 rounded-t-lg transition-all duration-500 hover:bg-teal-500"
                      style={{ height: `${Math.max(12, (item.count / 8) * 100)}%` }}
                    />
                    <div
                      className="w-4 bg-indigo-300 rounded-t-lg transition-all duration-500 hover:bg-indigo-400"
                      style={{ height: `${Math.max(10, barHeightPct)}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap mt-1">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown by Package */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <PackageIcon className="w-4 h-4 text-teal-600" /> Students by Package
            </h3>
            <p className="text-xs text-slate-400">Distribution of enrolled package tiers</p>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(customersByPackage).map(([name, count]) => {
              const pct = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;
              return (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-800">{name}</span>
                    <span className="text-slate-500 font-mono">{count} ({pct.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-indigo-600 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breakdown by Hostel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" /> Student Distribution Across Hostels
          </h3>
          <p className="text-xs text-slate-400">Resident count and proportion across active campus hostels</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {Object.entries(customersByHostel).map(([hostelName, count]) => {
            const pct = totalCustomers > 0 ? (count / totalCustomers) * 100 : 0;
            return (
              <div key={hostelName} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <span className="font-bold text-xs text-slate-800 block">{hostelName}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-teal-700 font-mono">{count}</span>
                  <span className="text-xs font-semibold text-slate-400">{pct.toFixed(1)}% of students</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-600 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Section Footer */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/20 text-teal-400 rounded-2xl">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Download Full Historical Data</h4>
            <p className="text-xs text-slate-400">Export audit-ready CSV spreadsheets for finance, inventory and hostel administration</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportOrders}
            className="px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Export All Orders
          </button>
          <button
            onClick={handleExportComplaints}
            className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Export Complaints
          </button>
          <button
            onClick={handleExportSMS}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Export SMS Logs
          </button>
        </div>
      </div>
    </div>
  );
};
