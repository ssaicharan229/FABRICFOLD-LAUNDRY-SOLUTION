import React, { useState } from 'react';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { resetSupabaseClient, isSupabaseConfigured, testSupabaseConnection } from '../../supabase/client';
import { 
  Settings, 
  Building, 
  MessageSquare, 
  Database, 
  ShieldCheck, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Sparkles,
  Users,
  Mail,
  Bell,
  Smartphone
} from 'lucide-react';

interface SettingsViewProps {
  onDataReset?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onDataReset }) => {
  const { success, error, info } = useToast();
  const currentSettings = dataService.getSettings();

  // Settings form states
  const [businessName, setBusinessName] = useState(currentSettings.business_name);
  const [tagline, setTagline] = useState(currentSettings.tagline);
  const [businessMobile, setBusinessMobile] = useState(currentSettings.business_mobile);
  const [businessEmail, setBusinessEmail] = useState(currentSettings.business_email || 'laundry@fabricfold.com');
  const [businessAddress, setBusinessAddress] = useState(currentSettings.business_address);
  const [defaultLimit, setDefaultLimit] = useState(currentSettings.default_wash_limit);
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState(currentSettings.low_balance_threshold);

  // Notification configuration states
  const [notificationChannels, setNotificationChannels] = useState<'both' | 'sms' | 'email' | 'none'>(
    currentSettings.notification_channels || 'both'
  );
  const [smsProvider, setSmsProvider] = useState(currentSettings.sms_provider);
  const [smsSenderId, setSmsSenderId] = useState(currentSettings.sms_sender_id || 'FABRIC');
  const [emailProvider, setEmailProvider] = useState(currentSettings.email_provider || 'mock');
  const [emailFromAddress, setEmailFromAddress] = useState(currentSettings.email_from_address || 'notifications@fabricfold.com');

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState(() => localStorage.getItem('ffl_supabase_url') || '');
  const [supabaseKey, setSupabaseKey] = useState(() => localStorage.getItem('ffl_supabase_anon_key') || '');
  const [isSupabaseActive, setIsSupabaseActive] = useState(() => isSupabaseConfigured());
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [testResult, setTestResult] = useState<{ connected: boolean; message: string } | null>(null);

  // Confirm dialog state for data reset
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      dataService.updateSettings({
        business_name: businessName.trim(),
        tagline: tagline.trim(),
        business_mobile: businessMobile.trim(),
        business_email: businessEmail.trim(),
        business_address: businessAddress.trim(),
        default_wash_limit: defaultLimit,
        low_balance_threshold: lowBalanceThreshold,
        notification_channels: notificationChannels,
        sms_provider: smsProvider,
        sms_sender_id: smsSenderId.trim().toUpperCase(),
        email_provider: emailProvider,
        email_from_address: emailFromAddress.trim(),
      });
      success('Settings Saved', 'Business and notification preferences updated successfully.');
    } catch (err: any) {
      error('Save Failed', err?.message);
    }
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      error('Missing Credentials', 'Please enter both Supabase URL and Anon Key before testing.');
      return;
    }
    setIsTestingSupabase(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
      if (res.connected) {
        setTestResult({
          connected: true,
          message: `Connection Verified! Supabase responded successfully (${res.latencyMs}ms).`,
        });
        success('Supabase Connected', `Successfully connected in ${res.latencyMs}ms`);
      } else {
        setTestResult({
          connected: false,
          message: res.error || 'Connection failed. Check project URL and public anon key.',
        });
        error('Supabase Test Failed', res.error || 'Could not connect.');
      }
    } finally {
      setIsTestingSupabase(false);
    }
  };

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrl && !supabaseUrl.startsWith('http')) {
      error('Invalid URL', 'Supabase project URL must begin with https://');
      return;
    }

    try {
      resetSupabaseClient(supabaseUrl.trim(), supabaseKey.trim());
      const active = Boolean(supabaseUrl.trim() && supabaseKey.trim());
      setIsSupabaseActive(active);
      success(
        'Supabase Configured',
        active 
          ? 'Credentials stored and Supabase client reinitialized.' 
          : 'Credentials cleared. Local demo storage active.'
      );
    } catch (err: any) {
      error('Configuration Error', err?.message);
    }
  };

  const handleExecuteReset = () => {
    dataService.resetToInitialRealData();
    success('Initial State Restored', 'Restored to Gampa Saicharan real record and Ganga Hostel with zero sample orders.');
    setShowResetDialog(false);
    if (onDataReset) onDataReset();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Integrations</h1>
          <p className="text-xs text-slate-500">Configure laundry brand identity, default wash quotas, SMS & Email alerts, and Supabase database connection</p>
        </div>

        <button
          onClick={() => setShowResetDialog(true)}
          className="flex items-center gap-2 px-4 py-2 border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" /> Reset Real State
        </button>
      </div>

      {/* 1. Brand Identity & Quota Config */}
      <form onSubmit={handleSaveGeneral} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 bg-teal-50 text-teal-700 rounded-lg">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Brand Identity & Wash Policy</h3>
            <p className="text-[11px] text-slate-400">Hostel business details and student counter policies</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Name</label>
            <input
              type="text"
              required
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
            <input
              type="text"
              value={tagline}
              onChange={e => setTagline(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Mobile</label>
            <input
              type="text"
              value={businessMobile}
              onChange={e => setBusinessMobile(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Facility Email</label>
            <input
              type="email"
              value={businessEmail}
              onChange={e => setBusinessEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Facility Address</label>
            <input
              type="text"
              value={businessAddress}
              onChange={e => setBusinessAddress(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Annual Wash Limit Default</label>
            <input
              type="number"
              min="1"
              max="100"
              value={defaultLimit}
              onChange={e => setDefaultLimit(parseInt(e.target.value, 10) || 34)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Low Balance Warning Threshold</label>
            <input
              type="number"
              min="1"
              max="15"
              value={lowBalanceThreshold}
              onChange={e => setLowBalanceThreshold(parseInt(e.target.value, 10) || 5)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-amber-700"
            />
          </div>
        </div>

        {/* Multi-Channel Wash Completion Notifications */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Automatic Wash Completion Notifications</h3>
              <p className="text-[11px] text-slate-400">Dispatches pickup notices when staff marks orders Completed</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Active Notification Channels</label>
              <select
                value={notificationChannels}
                onChange={e => setNotificationChannels(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              >
                <option value="both">Both SMS and Email (Recommended)</option>
                <option value="sms">SMS Only</option>
                <option value="email">Email Only</option>
                <option value="none">Disabled / Manual Only</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">SMS Gateway</label>
              <select
                value={smsProvider}
                onChange={e => setSmsProvider(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              >
                <option value="mock">Mock Simulator (Sandbox)</option>
                <option value="msg91">MSG91 (India DLT Gateway)</option>
                <option value="twilio">Twilio Programmable SMS</option>
                <option value="textlocal">Textlocal India</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Provider</label>
              <select
                value={emailProvider}
                onChange={e => setEmailProvider(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              >
                <option value="mock">Mock Simulator (Sandbox)</option>
                <option value="resend">Resend API</option>
                <option value="sendgrid">SendGrid Mail API</option>
                <option value="smtp">Custom SMTP Server</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
          >
            <Save className="w-4 h-4" /> Save Business & Notification Configuration
          </button>
        </div>
      </form>

      {/* 2. Supabase Integration Card */}
      <form onSubmit={handleSaveSupabase} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Supabase Cloud Database & Auth</h3>
              <p className="text-[11px] text-slate-400">Credentials enable authentication only; operational records currently remain in browser storage</p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            testResult?.connected
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              : testResult && !testResult.connected
              ? 'bg-rose-50 text-rose-700 border border-rose-300'
              : isSupabaseActive
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              testResult?.connected
                ? 'bg-emerald-500'
                : testResult && !testResult.connected
                ? 'bg-rose-500'
                : isSupabaseActive
                ? 'bg-blue-500'
                : 'bg-amber-500'
            }`} />
            {testResult?.connected
              ? 'Connection Verified ✓'
              : testResult && !testResult.connected
              ? 'Connection Failed'
              : isSupabaseActive
              ? 'Credentials Stored'
              : 'Local Demo Storage'}
          </span>
        </div>

        {testResult && (
          <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
            testResult.connected
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.connected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Project URL (<code className="text-teal-700">VITE_SUPABASE_URL</code>)
            </label>
            <input
              type="text"
              placeholder="https://xyzcompany.supabase.co"
              value={supabaseUrl}
              onChange={e => setSupabaseUrl(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Anon Public API Key (<code className="text-teal-700">VITE_SUPABASE_ANON_KEY</code>)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={e => setSupabaseKey(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Anon key is safe for public browser use. Never use the <code>service_role</code> key.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTestingSupabase}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer transition-all disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              {isTestingSupabase ? 'Testing Connection...' : 'Test Connection'}
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <Save className="w-4 h-4" /> Save Credentials
            </button>
          </div>
        </div>
      </form>

      {/* Confirmation Dialog for System Reset */}
      <ConfirmDialog
        isOpen={showResetDialog}
        title="Restore Initial State?"
        message="This will reset local storage to the initial state containing ONLY Gampa Saicharan's real record and Ganga Hostel. All test orders and newly added records will be cleared. This action cannot be undone."
        confirmText="Yes, Restore Real State"
        variant="danger"
        onConfirm={handleExecuteReset}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  );
};
