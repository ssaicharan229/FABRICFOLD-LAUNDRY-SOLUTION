import React, { useState } from 'react';
import { Customer, ComplaintCategory, ComplaintPriority, ComplaintAttachment, LaundryOrder } from '../../types';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { 
  AlertCircle, 
  Upload, 
  X, 
  Image as ImageIcon, 
  FileText, 
  Send, 
  CheckCircle2, 
  Shirt, 
  Loader2,
  ShieldAlert,
  Camera
} from 'lucide-react';

interface StudentComplaintFormProps {
  customer: Customer;
  onComplaintSubmitted: () => void;
  onCancel?: () => void;
}

export const StudentComplaintForm: React.FC<StudentComplaintFormProps> = ({
  customer,
  onComplaintSubmitted,
  onCancel,
}) => {
  const { success, error, warning } = useToast();

  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Damaged Garment');
  const [orderId, setOrderId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student's recent laundry orders for optional linking
  const studentOrders = dataService.getOrdersByCustomerId(customer.id);

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(10);

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB

    const newAttachments: ComplaintAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate format
      if (!allowedTypes.includes(file.type)) {
        setUploadError(`Unsupported format: "${file.name}". Please upload JPEG, PNG, or WebP images only.`);
        setIsUploading(false);
        setUploadProgress(null);
        return;
      }

      // Validate size
      if (file.size > maxSizeBytes) {
        setUploadError(`File too large: "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)}MB). Max allowed size is 5MB.`);
        setIsUploading(false);
        setUploadProgress(null);
        return;
      }

      // Read file to data URL
      try {
        const fileUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: `att-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          file_name: file.name,
          file_url: fileUrl,
          file_size: file.size,
          file_type: file.type,
          uploaded_at: new Date().toISOString(),
        });
      } catch (err) {
        setUploadError(`Failed to process "${file.name}". Please try another file.`);
        setIsUploading(false);
        setUploadProgress(null);
        return;
      }
    }

    setUploadProgress(100);
    setTimeout(() => {
      setAttachments(prev => [...prev, ...newAttachments]);
      setIsUploading(false);
      setUploadProgress(null);
      success('Photos Uploaded', `${newAttachments.length} image(s) attached successfully.`);
    }, 400);

    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (attId: string) => {
    setAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      error('Subject Required', 'Please enter a brief subject for your complaint.');
      return;
    }
    if (!description.trim()) {
      error('Description Required', 'Please provide detailed information about the issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newCmp = dataService.createComplaint({
        customer_id: customer.id,
        order_id: orderId ? orderId : undefined,
        subject: subject.trim(),
        category,
        description: description.trim(),
        attachments,
        priority: 'Normal',
      });

      success(
        'Complaint Submitted Successfully',
        `Reference ${newCmp.complaint_number} registered. Our staff will review and respond promptly.`
      );
      onComplaintSubmitted();
    } catch (err: any) {
      error('Submission Failed', err?.message || 'Error creating complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" /> Report Issue
          </span>
          <h2 className="text-lg font-black tracking-tight">Submit Laundry Complaint</h2>
          <p className="text-xs text-slate-300">
            Registered for {customer.name} ({customer.customer_id}) • {customer.hostel_name}
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
        {/* Category & Order Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Issue Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ComplaintCategory)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
            >
              <option value="Damaged Garment">Damaged Garment (Tear, Burn, Stitching)</option>
              <option value="Stained / Discolored">Stained / Discolored / Color Bleed</option>
              <option value="Missing Cloth">Missing Cloth / Garment Shortage</option>
              <option value="Delivery Delay">Delivery Delay / Not Ready</option>
              <option value="Fold & Iron Quality">Fold & Steam Ironing Quality</option>
              <option value="Other">Other Laundry Concern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Related Laundry Order (Optional)
            </label>
            <select
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
            >
              <option value="">No specific order (General issue)</option>
              {studentOrders.map(ord => (
                <option key={ord.id} value={ord.id}>
                  {ord.order_id} — {ord.clothes_count} pcs ({ord.status} on {new Date(ord.submitted_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Subject / Headline <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Blue denim shirt has collar tear after washing"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            placeholder="Please describe the garment color, brand, exact problem observed, and when you collected the order..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900 resize-none"
          />
        </div>

        {/* Photo Upload Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Upload Problem Photos (Optional, Recommended)
            </label>
            <span className="text-[11px] text-slate-400">Accepted: JPEG, PNG, WebP (Max 5MB each)</span>
          </div>

          <div className="border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/70 hover:bg-teal-50/20 rounded-2xl p-5 sm:p-6 text-center transition-all">
            {/* Standard file input (Gallery / Multiple) */}
            <input
              type="file"
              id="complaint-photo-upload"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />
            {/* Direct Camera capture input (Mobile Camera) */}
            <input
              type="file"
              id="complaint-camera-upload"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={isUploading}
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>
              <div className="text-xs font-bold text-slate-800">
                {isUploading ? 'Validating & Uploading Photos...' : 'Attach Garment Photos'}
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm mb-3">
                Clear photos showing stains, tears, or order tags expedite review by hostel staff
              </p>

              {/* Mobile Touch Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 w-full max-w-sm">
                <label
                  htmlFor="complaint-camera-upload"
                  className="flex-1 min-w-[130px] py-2.5 px-3.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Take Photo</span>
                </label>

                <label
                  htmlFor="complaint-photo-upload"
                  className="flex-1 min-w-[130px] py-2.5 px-3.5 bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  <span>Choose Gallery</span>
                </label>
              </div>
            </div>

            {uploadProgress !== null && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-teal-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Uploading {uploadProgress}%</span>
              </div>
            )}

            {uploadError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium inline-flex items-center gap-2 text-left">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {uploadError}
              </div>
            )}
          </div>

          {/* Uploaded Attachments Preview Grid */}
          {attachments.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {attachments.map(att => (
                <div
                  key={att.id}
                  className="relative group bg-white border border-slate-200 rounded-xl p-2 shadow-sm overflow-hidden"
                >
                  <img
                    src={att.file_url}
                    alt={att.file_name}
                    className="w-full h-24 object-cover rounded-lg mb-1.5 bg-slate-100"
                  />
                  <div className="text-[10px] font-semibold text-slate-700 truncate" title={att.file_name}>
                    {att.file_name}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {(att.file_size / 1024).toFixed(0)} KB
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="absolute top-3 right-3 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-full transition-colors shadow-md"
                    title="Remove Photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            This complaint is securely associated only with your account (<strong>{customer.customer_id}</strong>). Other students cannot access your reports or photos.
          </span>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting Report...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit Complaint
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
