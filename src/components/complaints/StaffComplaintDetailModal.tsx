import React, { useState } from 'react';
import { Complaint, ComplaintStatus, UserRole, AppUser } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { 
  X, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  User, 
  Phone, 
  Building2, 
  FileText, 
  Send, 
  ShieldAlert, 
  Lock, 
  Eye, 
  MessageSquare, 
  History,
  Maximize2
} from 'lucide-react';

interface StaffComplaintDetailModalProps {
  isOpen: boolean;
  complaint: Complaint | null;
  currentUser: AppUser;
  onClose: () => void;
  onUpdated: () => void;
}

export const StaffComplaintDetailModal: React.FC<StaffComplaintDetailModalProps> = ({
  isOpen,
  complaint,
  currentUser,
  onClose,
  onUpdated,
}) => {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'details' | 'responses' | 'audit'>('details');
  const [newStatus, setNewStatus] = useState<ComplaintStatus>('Submitted');
  const [replyMessage, setReplyMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  if (!isOpen || !complaint) return null;

  const handleUpdateStatus = (status: ComplaintStatus) => {
    try {
      dataService.updateComplaintStatus(complaint.id, status, {
        name: currentUser.name,
        role: currentUser.role,
      });
      success('Status Updated', `Complaint moved to ${status}`);
      onUpdated();
    } catch (err: any) {
      error('Failed to update status', err?.message);
    }
  };

  const handleAddResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setIsSubmittingReply(true);
    try {
      dataService.addComplaintResponse(complaint.id, {
        author_name: currentUser.name,
        author_role: currentUser.role,
        message: replyMessage.trim(),
        is_internal: isInternalNote,
      });

      success(
        isInternalNote ? 'Internal Note Saved' : 'Response Dispatched',
        isInternalNote 
          ? 'Internal note saved for staff reference only.' 
          : 'Response posted and visible to student in their portal.'
      );

      setReplyMessage('');
      onUpdated();
    } catch (err: any) {
      error('Failed to add response', err?.message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {complaint.complaint_number}
              </span>
              <div>
                <h3 className="font-bold text-base text-white">{complaint.subject}</h3>
                <div className="text-xs text-slate-400 mt-0.5">
                  Reported by {complaint.student_name} ({complaint.customer_ref_id}) • {new Date(complaint.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Quick Bar */}
          <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Current Status:</span>
              <span className={`px-2.5 py-1 rounded-full font-bold text-xs uppercase ${
                complaint.status === 'Submitted'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : complaint.status === 'Under Review'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : complaint.status === 'Resolved'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-200 text-slate-800'
              }`}>
                {complaint.status}
              </span>
            </div>

            {/* Quick Status Advance Buttons */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium mr-1">Move to:</span>
              {(['Submitted', 'Under Review', 'Resolved', 'Closed'] as ComplaintStatus[]).map(st => (
                <button
                  key={st}
                  disabled={complaint.status === st}
                  onClick={() => handleUpdateStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    complaint.status === st
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-teal-500 hover:text-teal-700 hover:bg-teal-50/50'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center px-6 border-b border-slate-200 bg-white">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Overview & Photos ({complaint.attachments.length})
            </button>
            <button
              onClick={() => setActiveTab('responses')}
              className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'responses'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Responses & Notes ({complaint.responses.length})
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-4 font-bold text-xs border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'audit'
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Audit Trail ({complaint.audit_log.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'details' && (
              <>
                {/* Student Info Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Student</span>
                    <span className="font-bold text-slate-900">{complaint.student_name}</span>
                    <span className="text-slate-500 font-mono ml-1">({complaint.customer_ref_id})</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Residence</span>
                    <span className="font-semibold text-slate-800">
                      {complaint.hostel_name} {complaint.room_number ? `• Rm ${complaint.room_number}` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Contact & Order</span>
                    <span className="font-mono text-slate-800">{complaint.mobile}</span>
                    {complaint.order_display_id && (
                      <span className="block text-[11px] text-teal-700 font-bold font-mono">
                        Ref Order: {complaint.order_display_id}
                      </span>
                    )}
                  </div>
                </div>

                {/* Complaint Details */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                      Category: {complaint.category}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-bold">
                      Priority: {complaint.priority}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {complaint.description}
                  </div>
                </div>

                {/* Photos Gallery */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Attached Evidence Photos ({complaint.attachments.length})
                  </h4>

                  {complaint.attachments.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                      No photos were attached with this complaint report.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {complaint.attachments.map(att => (
                        <div
                          key={att.id}
                          onClick={() => setLightboxImage(att.file_url)}
                          className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-all"
                        >
                          <img
                            src={att.file_url}
                            alt={att.file_name}
                            className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                          <div className="p-2 text-[10px] bg-white font-medium text-slate-700 truncate">
                            {att.file_name}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'responses' && (
              <div className="space-y-4">
                {/* Past Responses List */}
                <div className="space-y-3">
                  {complaint.responses.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl text-xs">
                      No responses or internal notes added yet. Use the composer below.
                    </div>
                  ) : (
                    complaint.responses.map(resp => (
                      <div
                        key={resp.id}
                        className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                          resp.is_internal
                            ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                            : 'bg-teal-50/50 border-teal-200 text-teal-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{resp.author_name}</span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/80 border text-slate-600">
                              {resp.author_role}
                            </span>
                            {resp.is_internal ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                                <Lock className="w-3 h-3" /> Internal Staff Note (Hidden from Student)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-200 text-teal-900 border border-teal-300">
                                <Eye className="w-3 h-3" /> Student-Visible Response
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(resp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(resp.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-800">{resp.message}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Response / Internal Note Box */}
                <form onSubmit={handleAddResponse} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Add Message / Action Note</span>

                    {/* Mode toggle */}
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(false)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          !isInternalNote
                            ? 'bg-teal-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Public to Student
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsInternalNote(true)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                          isInternalNote
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        Internal Staff Note
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    value={replyMessage}
                    onChange={e => setReplyMessage(e.target.value)}
                    placeholder={
                      isInternalNote
                        ? 'Enter internal staff notes (investigation details, laundry technician remarks - NOT shown to student)...'
                        : 'Enter response message that the student will see in their portal...'
                    }
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 text-slate-800 resize-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      {isInternalNote
                        ? '🔒 Internal notes are strictly hidden from students.'
                        : '🌐 Student will be able to read this message in their portal.'}
                    </span>

                    <button
                      type="submit"
                      disabled={isSubmittingReply || !replyMessage.trim()}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
                        isInternalNote ? 'bg-amber-600 hover:bg-amber-700' : 'bg-teal-600 hover:bg-teal-700'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" /> {isInternalNote ? 'Save Internal Note' : 'Send Student Response'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-500 font-medium mb-1">
                  Complete immutable audit history for compliance and oversight:
                </div>
                <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden text-xs">
                  {complaint.audit_log.map(item => (
                    <div key={item.id} className="p-3.5 hover:bg-white transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.actor_name}</span>
                          <span className="text-[10px] uppercase font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                            {item.actor_role}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium">{item.action}</div>
                      {item.previous_status && item.new_status && (
                        <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                          Transition: {item.previous_status} ➔ <strong>{item.new_status}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              Hostel Laundry Complaints System • Secure Storage & Access Policies
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
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
    </>
  );
};
