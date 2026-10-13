import React, { useState } from 'react';
import { LaundryOrder } from '../../types';
import { smsService } from '../../services/smsService';
import { MessageSquare, Send, CheckCircle2, Copy, ExternalLink, X, Smartphone, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '../common/Toast';

interface SmsModalProps {
  isOpen: boolean;
  order: LaundryOrder | null;
  onClose: () => void;
  onSent?: () => void;
}

export const SmsModal: React.FC<SmsModalProps> = ({ isOpen, order, onClose, onSent }) => {
  const { success, error } = useToast();
  const [provider, setProvider] = useState<'mock' | 'twilio' | 'msg91' | 'textlocal'>('mock');
  const [isSending, setIsSending] = useState(false);
  const [responseLog, setResponseLog] = useState<any>(null);
  const [messageText, setMessageText] = useState('');

  // Sync message when order changes or modal opens
  React.useEffect(() => {
    if (order) {
      setMessageText(
        smsService.generateCompletionMessage(order.student_name, order.customer_ref_id)
      );
      setResponseLog(null);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const handleSend = async () => {
    setIsSending(true);
    try {
      const res = await smsService.sendCompletionSMS({
        order,
        provider,
        customMessage: messageText,
      });

      setResponseLog(res);
      if (res.success) {
        success('SMS Simulated', `A test notification was recorded for ${order.mobile}. No real SMS was sent.`);
      } else {
        error('SMS Not Sent', res.errorMessage || 'The SMS provider is not available.');
      }
      if (onSent) onSent();
    } catch (err: any) {
      error('Failed to send SMS', err?.message || 'Network error');
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(messageText);
    success('Message Copied', 'SMS template copied to clipboard.');
  };

  const openWhatsApp = () => {
    const url = smsService.getWhatsAppUrl(order.mobile, messageText);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Send Completion SMS</h3>
              <p className="text-xs text-slate-400">Dispatch pickup notification to student</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Target Customer Info */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="text-xs text-slate-500 block">Recipient</span>
              <span className="font-bold text-slate-900">{order.student_name}</span>
              <span className="text-xs text-slate-500 ml-2 font-mono">({order.customer_ref_id})</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Registered Mobile</span>
              <div className="inline-flex items-center gap-1.5 font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs font-mono">
                <Smartphone className="w-3.5 h-3.5" />
                {order.mobile}
              </div>
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              SMS Gateway Provider
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setProvider('mock')}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                  provider === 'mock'
                    ? 'border-teal-500 bg-teal-50/70 text-teal-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${provider === 'mock' ? 'bg-teal-500' : 'bg-slate-300'}`} />
                <div>
                  <div>Mock Test Mode</div>
                  <div className="text-[10px] text-teal-700 font-normal">Instant Sandbox Simulator</div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setProvider('msg91')}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                  provider === 'msg91'
                    ? 'border-teal-500 bg-teal-50/70 text-teal-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${provider === 'msg91' ? 'bg-teal-500' : 'bg-slate-300'}`} />
                <div>
                  <div>MSG91 (India)</div>
                  <div className="text-[10px] text-slate-400 font-normal">DLT Approved Gateway</div>
                </div>
              </button>
            </div>
          </div>

          {/* SMS Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Message Body
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {messageText.length} chars (1 SMS credit)
              </span>
            </div>
            <textarea
              rows={4}
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
            />
          </div>

          {/* Fast Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Text
            </button>
            <button
              type="button"
              onClick={openWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> WhatsApp Web
            </button>
          </div>

          {/* Result or status badge */}
          {order.sms_status === 'Mock_Delivered' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold">Previously Dispatched: </span>
                Delivered via Mock Service on {order.sms_sent_at ? new Date(order.sms_sent_at).toLocaleTimeString() : 'recently'}.
              </div>
            </div>
          )}

          {responseLog && (
            <div className="p-3 bg-slate-900 text-teal-400 rounded-xl text-[11px] font-mono overflow-x-auto">
              <div className="flex items-center gap-1 text-white font-bold mb-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Gateway Delivery Ack:
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap">{JSON.stringify(responseLog.responsePayload, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Close
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={handleSend}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> SEND SMS NOW
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
