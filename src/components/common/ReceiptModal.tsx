import React from 'react';
import { LaundryOrder, Customer } from '../../types';
import { Printer, X, CheckCircle2, Sparkles } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  order: LaundryOrder | null;
  customer?: Customer | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, order, customer, onClose }) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h3 className="font-bold text-sm tracking-wide">LAUNDRY DEPOSIT RECEIPT</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Card Area */}
        <div id="printable-receipt" className="p-6 overflow-y-auto bg-slate-50 text-slate-800 font-mono text-sm">
          <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 shadow-sm text-center">
            <div className="font-extrabold text-lg text-slate-900 tracking-tight">
              FABRICFOLD LAUNDRY SOLUTION
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Smart Laundry Management for Hostels</div>
            <div className="text-xs text-slate-400 mt-0.5">Central Hostel Service Complex</div>

            <div className="my-4 border-b border-dashed border-slate-200"></div>

            {/* Order Token Big Badge */}
            <div className="bg-teal-50 border border-teal-200 py-3 rounded-lg my-2">
              <div className="text-xs uppercase font-sans text-teal-700 font-bold tracking-wider">ORDER TOKEN</div>
              <div className="text-2xl font-black text-teal-950 font-sans tracking-wide mt-0.5">
                {order.order_id}
              </div>
              <div className="text-xs font-sans text-teal-600 font-medium">Status: {order.status}</div>
            </div>

            {/* Info Table */}
            <div className="space-y-2 text-left my-4 text-xs font-sans">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer ID:</span>
                <span className="font-bold text-slate-900">{order.customer_ref_id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Student Name:</span>
                <span className="font-semibold text-slate-900">{order.student_name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Hostel & Room:</span>
                <span className="font-semibold text-slate-900">{order.hostel_name} {order.room_number ? `(Rm: ${order.room_number})` : ''}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Mobile Number:</span>
                <span className="font-semibold text-slate-900">{order.mobile}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 bg-amber-50/60 px-2 rounded">
                <span className="text-amber-800 font-bold">Clothes Submitted:</span>
                <span className="font-black text-amber-900 text-sm">{order.clothes_count} Pieces</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Submission Date/Time:</span>
                <span className="text-slate-800">{new Date(order.submitted_at).toLocaleString()}</span>
              </div>
              {customer && (
                <div className="flex justify-between py-1 border-b border-slate-100 text-teal-700">
                  <span className="font-medium">Remaining Washes:</span>
                  <span className="font-bold">{customer.remaining_washes} of {customer.total_washes}</span>
                </div>
              )}
              {order.notes && (
                <div className="py-1">
                  <span className="text-slate-500 block">Notes:</span>
                  <span className="text-slate-700 italic">{order.notes}</span>
                </div>
              )}
            </div>

            {/* Simulated Barcode */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-200">
              <div className="h-10 bg-slate-900 w-4/5 mx-auto rounded opacity-80 flex items-center justify-center text-white text-[10px] tracking-widest font-mono select-none">
                |||| | |||||| || | |||| ||| |||||
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono tracking-widest">{order.order_id}</div>
            </div>

            <div className="mt-4 text-[11px] text-slate-500 leading-tight font-sans">
              * Please show this token or SMS at the counter when collecting your clothes.
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-teal-600" /> Print or share with student
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print Token
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
