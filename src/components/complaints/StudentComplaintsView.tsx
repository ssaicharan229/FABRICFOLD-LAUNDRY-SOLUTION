import React, { useState } from 'react';
import { Customer, Complaint } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { StudentComplaintForm } from './StudentComplaintForm';
import { 
  AlertCircle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Image as ImageIcon, 
  Calendar, 
  ChevronRight,
  ShieldCheck,
  Maximize2,
  X,
  Send,
  Loader2
} from 'lucide-react';

interface StudentComplaintsViewProps {
  customer: Customer;
}

export const StudentComplaintsView: React.FC<StudentComplaintsViewProps> = ({ customer }) => {
  const { success, error } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>(() => 
    dataService.getComplaints({ customerId: customer.id })
  );
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  const reloadComplaints = () => {
    setComplaints(dataService.getComplaints({ customerId: customer.id }));
    if (selectedComplaint) {
      const refreshed = dataService.getComplaintById(selectedComplaint.id);
      setSelectedComplaint(refreshed || null);
    }
  };

  const handleSendReply = (complaintId: string) => {
    const msg = (replyTexts[complaintId] || '').trim();
    if (!msg) return;

    setSubmittingReply(prev => ({ ...prev, [complaintId]: true }));
    try {
      dataService.addComplaintResponse(complaintId, {
        author_name: customer.name,
        author_role: 'student',
        message: msg,
        is_internal: false,
      });

      setReplyTexts(prev => ({ ...prev, [complaintId]: '' }));
      reloadComplaints();
      success('Reply Posted', 'Your message has been sent to the laundry staff.');
    } catch (err: any) {
      error('Reply Failed', err?.message || 'Failed to submit response.');
    } finally {
      setSubmittingReply(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & New Complaint Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">My Laundry Complaints & Service Inquiries</h2>
          <p className="text-xs text-slate-500">
            Submit issues regarding damaged clothes, stains, shortages, or delivery delays. Track resolution status in real-time.
          </p>
        </div>

        {!showNewForm && (
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> File New Complaint
          </button>
        )}
      </div>

      {/* New Complaint Form toggle */}
      {showNewForm && (
        <StudentComplaintForm
          customer={customer}
          onComplaintSubmitted={() => {
            setShowNewForm(false);
            reloadComplaints();
          }}
          onCancel={() => setShowNewForm(false)}
        />
      )}

      {/* List of Submitted Complaints */}
      <div className="space-y-4">
        {complaints.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-3 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No Complaints on Record</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You haven't reported any laundry issues yet. If you ever encounter a damaged garment or missing item, tap "File New Complaint" above.
            </p>
          </div>
        ) : (
          complaints.map(cmp => {
            // Filter strictly student-visible responses (is_internal === false)
            const studentVisibleResponses = cmp.responses.filter(r => !r.is_internal);

            return (
              <div
                key={cmp.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Top Row: Ref #, Status, Date */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {cmp.complaint_number}
                    </span>
                    <span className="text-xs font-bold text-teal-700 uppercase">
                      {cmp.category}
                    </span>
                    {cmp.order_display_id && (
                      <span className="text-xs font-mono text-slate-500">
                        • Order Ref: {cmp.order_display_id}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(cmp.created_at).toLocaleDateString()}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full font-bold text-xs uppercase ${
                      cmp.status === 'Submitted'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : cmp.status === 'Under Review'
                        ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                        : cmp.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {cmp.status}
                    </span>
                  </div>
                </div>

                {/* Subject & Description */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-1">{cmp.subject}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-sans">
                    {cmp.description}
                  </p>
                </div>

                {/* Evidence Photos */}
                {cmp.attachments.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Attached Photos ({cmp.attachments.length})
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      {cmp.attachments.map(att => (
                        <div
                          key={att.id}
                          onClick={() => setLightboxImage(att.file_url)}
                          className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:scale-105 transition-transform"
                        >
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="w-4 h-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Staff Responses (Visible to Student Only - Internal Notes are Filtered Out!) */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
                    <span>Staff Resolution Messages ({studentVisibleResponses.length})</span>
                  </div>

                  {studentVisibleResponses.length === 0 ? (
                    <div className="p-3 bg-slate-50 rounded-xl text-slate-400 text-xs italic">
                      {cmp.status === 'Submitted'
                        ? 'Your complaint is awaiting staff review. We typically inspect items within 24 hours.'
                        : 'Complaint is under active review. Staff response will appear here.'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {studentVisibleResponses.map(resp => (
                        <div
                          key={resp.id}
                          className="p-3.5 bg-teal-50/60 border border-teal-200 rounded-xl text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between text-teal-950 font-bold">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-teal-500" />
                              {resp.author_name} ({resp.author_role.toUpperCase()})
                            </span>
                            <span className="text-[10px] text-teal-700 font-mono font-normal">
                              {new Date(resp.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{resp.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Student Reply Composer (Active when status is not Closed) */}
                  {cmp.status !== 'Closed' && (
                    <div className="pt-3 border-t border-slate-100 mt-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type a reply or additional information for laundry staff..."
                          value={replyTexts[cmp.id] || ''}
                          onChange={e => setReplyTexts(prev => ({ ...prev, [cmp.id]: e.target.value }))}
                          onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply(cmp.id);
                            }
                          }}
                          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-800"
                        />
                        <button
                          type="button"
                          disabled={submittingReply[cmp.id] || !(replyTexts[cmp.id] || '').trim()}
                          onClick={() => handleSendReply(cmp.id)}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
                        >
                          {submittingReply[cmp.id] ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>Reply</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={lightboxImage}
              alt="Evidence Full View"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-rose-600 text-white rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
