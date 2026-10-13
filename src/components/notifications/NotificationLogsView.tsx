import React, { useState } from 'react';
import { NotificationLog, NotificationChannel } from '../../types';
import { dataService } from '../../services/dataService';
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Filter, 
  Clock, 
  RefreshCw,
  Send,
  Eye,
  FileText
} from 'lucide-react';

export const NotificationLogsView: React.FC = () => {
  const [logs, setLogs] = useState<NotificationLog[]>(() => dataService.getNotificationLogs());
  const [channelFilter, setChannelFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);

  const reloadLogs = () => {
    setLogs(dataService.getNotificationLogs());
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || (
      log.customer_name.toLowerCase().includes(q) ||
      log.recipient.toLowerCase().includes(q) ||
      (log.order_display_id && log.order_display_id.toLowerCase().includes(q)) ||
      log.message.toLowerCase().includes(q)
    );

    const matchesChannel = channelFilter === 'All' || log.channel === channelFilter.toLowerCase();

    return matchesSearch && matchesChannel;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5 text-teal-600" /> Multi-Channel Alerts
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notification & Dispatch Logs</h1>
          <p className="text-xs text-slate-500">
            Audit history of automatic and manual SMS & Email wash-completion notifications
          </p>
        </div>

        <button
          type="button"
          onClick={reloadLogs}
          className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, mobile, email, or order ID..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {['All', 'SMS', 'Email'].map(ch => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                channelFilter === ch
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-4">Student & Recipient</th>
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Message Snippet</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Delivery Status</th>
                <th className="py-3.5 px-4">Dispatched Time</th>
                <th className="py-3.5 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No notification logs recorded</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed laundry orders will generate automated notifications here.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                        log.channel === 'sms'
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      }`}>
                        {log.channel === 'sms' ? <Smartphone className="w-3 h-3" /> : <Mail className="w-3 h-3" />}
                        {log.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{log.customer_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{log.recipient}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {log.order_display_id || '—'}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600 font-mono text-[11px]" title={log.message}>
                      {log.message}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {log.provider}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        log.status === 'Sent'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.status === 'Mock_Delivered'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.status === 'Sent' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : log.status === 'Mock_Delivered' ? (
                          <ShieldCheck className="w-3 h-3 text-sky-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-rose-600" />
                        )}
                        {log.status === 'Mock_Delivered' ? 'Mock / Test Delivered' : log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-slate-500 text-[11px]">
                      <div>{new Date(log.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-400">{new Date(log.sent_at).toLocaleDateString()}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payload Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">Delivery Receipt & Response Payload</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close
              </button>
            </div>
            <div className="text-xs space-y-2">
              <div><strong>Recipient:</strong> {selectedLog.recipient}</div>
              <div><strong>Gateway:</strong> {selectedLog.provider}</div>
              <div><strong>Dispatched:</strong> {new Date(selectedLog.sent_at).toLocaleString()}</div>
              <div>
                <strong>Complete Message:</strong>
                <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl mt-1 text-slate-700 whitespace-pre-wrap font-mono">
                  {selectedLog.message}
                </p>
              </div>
              {selectedLog.response_payload && (
                <div>
                  <strong>Gateway Ack:</strong>
                  <pre className="p-3 bg-slate-900 text-teal-400 rounded-xl mt-1 text-[11px] font-mono overflow-x-auto">
                    {JSON.stringify(selectedLog.response_payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
