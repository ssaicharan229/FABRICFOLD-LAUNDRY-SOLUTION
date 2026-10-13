import React, { useState, useMemo } from 'react';
import { Complaint, ComplaintStatus, AppUser } from '../../types';
import { dataService } from '../../services/dataService';
import { exportToCSV, formatComplaintExport } from '../../services/exportService';
import { useToast } from '../common/Toast';
import { StaffComplaintDetailModal } from './StaffComplaintDetailModal';
import { 
  AlertCircle, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  Calendar, 
  Eye, 
  MessageSquare, 
  Image as ImageIcon,
  ShieldAlert,
  Sparkles,
  Inbox,
  Download
} from 'lucide-react';

interface ComplaintsViewProps {
  currentUser: AppUser;
}

export const ComplaintsView: React.FC<ComplaintsViewProps> = ({ currentUser }) => {
  const { success } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>(() => dataService.getComplaints());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const reloadComplaints = () => {
    setComplaints(dataService.getComplaints());
    if (selectedComplaint) {
      const refreshed = dataService.getComplaintById(selectedComplaint.id);
      setSelectedComplaint(refreshed || null);
    }
  };

  const filteredComplaints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return complaints.filter(c => {
      const matchesSearch = !q || (
        c.complaint_number.toLowerCase().includes(q) ||
        c.student_name.toLowerCase().includes(q) ||
        c.customer_ref_id.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.mobile.includes(q)
      );

      const matchesStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchesCat = categoryFilter === 'All' || c.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCat;
    });
  }, [complaints, searchQuery, statusFilter, categoryFilter]);

  const handleOpenDetail = (cmp: Complaint) => {
    setSelectedComplaint(cmp);
    setShowDetailModal(true);
  };

  // KPI Metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold uppercase tracking-wider mb-1">
            <AlertCircle className="w-3.5 h-3.5" /> Complaints Management & Quality Assurance
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Hostel Laundry Complaints</h1>
          <p className="text-xs text-slate-500">
            Review student service issues, investigate damage/shortages, inspect evidence photos, and track resolution.
          </p>
        </div>

        {complaints.length > 0 && (
          <button
            onClick={() => {
              exportToCSV('fabricfold_complaints_register', formatComplaintExport(filteredComplaints));
              success('Export Completed', 'Complaints register CSV exported.');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4 text-rose-600" /> Export CSV
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Filed</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalCount}</span>
            <span className="text-[11px] text-slate-500">Across hostel residences</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Inbox className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Pending Action</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{pendingCount}</span>
            <span className="text-[11px] text-slate-500">Submitted or Under Review</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Resolved & Closed</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{resolvedCount}</span>
            <span className="text-[11px] text-slate-500">Completed solutions</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Complaint # (CMP-0001), Student Name, ID (FFL-...), Subject..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-900"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            {['All', 'Submitted', 'Under Review', 'Resolved', 'Closed'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-medium focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Damaged Garment">Damaged Garment</option>
              <option value="Stained / Discolored">Stained / Discolored</option>
              <option value="Missing Cloth">Missing Cloth</option>
              <option value="Delivery Delay">Delivery Delay</option>
              <option value="Fold & Iron Quality">Fold & Iron Quality</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mobile-Friendly Complaints Cards (< md) */}
      <div className="md:hidden space-y-3">
        {filteredComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700 text-sm">No complaints found</p>
            <p className="text-xs text-slate-400 mt-0.5">Try clearing filters or search keywords</p>
          </div>
        ) : (
          filteredComplaints.map(cmp => (
            <div
              key={cmp.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3"
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                  {cmp.complaint_number}
                </span>

                <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] uppercase ${
                  cmp.status === 'Submitted'
                    ? 'bg-amber-100 text-amber-800'
                    : cmp.status === 'Under Review'
                    ? 'bg-indigo-100 text-indigo-800'
                    : cmp.status === 'Resolved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {cmp.status}
                </span>
              </div>

              {/* Student info & subject */}
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{cmp.student_name}</span>
                  <span className="font-mono text-slate-500 text-[11px]">{cmp.customer_ref_id} • {cmp.hostel_name}</span>
                </div>
                <h4 className="font-semibold text-xs text-slate-800 mt-1 leading-snug">{cmp.subject}</h4>
                <div className="text-[10px] text-teal-700 font-bold uppercase mt-0.5">{cmp.category}</div>
              </div>

              {/* Meta: photos, date, replies */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  {cmp.attachments.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-teal-700 font-medium">
                      <ImageIcon className="w-3 h-3" /> {cmp.attachments.length} {cmp.attachments.length === 1 ? 'photo' : 'photos'}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-slate-600">
                    <MessageSquare className="w-3 h-3 text-slate-400" /> {cmp.responses.length}
                  </span>
                </div>

                <span className="font-mono text-slate-400 text-[10px]">
                  {new Date(cmp.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Action */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleOpenDetail(cmp)}
                  className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review & Respond</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complaints Table (Desktop & Tablet >= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Ref #</th>
                <th className="py-3.5 px-4">Student & Residence</th>
                <th className="py-3.5 px-4">Subject & Category</th>
                <th className="py-3.5 px-4 text-center">Evidence Photos</th>
                <th className="py-3.5 px-4">Filed Time</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Replies</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No complaints found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {searchQuery || statusFilter !== 'All' 
                        ? 'Try clearing your filters or search keywords' 
                        : 'No hostel student complaints currently reported'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map(cmp => (
                  <tr key={cmp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Complaint ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {cmp.complaint_number}
                      </span>
                    </td>

                    {/* Student Info */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{cmp.student_name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {cmp.customer_ref_id} • {cmp.hostel_name}
                      </div>
                    </td>

                    {/* Subject & Category */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate" title={cmp.subject}>
                        {cmp.subject}
                      </div>
                      <div className="text-[10px] text-teal-700 font-bold uppercase mt-0.5">
                        {cmp.category}
                      </div>
                    </td>

                    {/* Evidence Photos */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {cmp.attachments.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 font-semibold text-[11px]">
                          <ImageIcon className="w-3 h-3 text-teal-600" />
                          {cmp.attachments.length} {cmp.attachments.length === 1 ? 'photo' : 'photos'}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">None</span>
                      )}
                    </td>

                    {/* Filed Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      <div>{new Date(cmp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-[10px] text-slate-400">{new Date(cmp.created_at).toLocaleDateString()}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs uppercase ${
                        cmp.status === 'Submitted'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : cmp.status === 'Under Review'
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : cmp.status === 'Resolved'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {cmp.status}
                      </span>
                    </td>

                    {/* Replies count */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-slate-600 font-mono text-xs">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        {cmp.responses.length}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(cmp)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer shadow-sm text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect & Action
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Action Modal */}
      <StaffComplaintDetailModal
        isOpen={showDetailModal}
        complaint={selectedComplaint}
        currentUser={currentUser}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedComplaint(null);
        }}
        onUpdated={reloadComplaints}
      />
    </div>
  );
};
