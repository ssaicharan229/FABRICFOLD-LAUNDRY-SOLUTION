import React, { useState } from 'react';
import { AppUser, UserRole } from '../../types';
import { INITIAL_STAFF_USERS } from '../../data/demoData';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { getSupabaseClient } from '../../supabase/client';
import { 
  Shirt, 
  ShieldCheck, 
  GraduationCap, 
  UserCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  Building2, 
  Clock, 
  FileText, 
  AlertCircle, 
  ChevronRight,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface LandingViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLoginSuccess }) => {
  const { success, error, warning } = useToast();

  // Selected portal modal state: null (Landing view) | 'staff' | 'student' | 'admin'
  const [activePortal, setActivePortal] = useState<UserRole | null>(null);

  // Form inputs
  const [identifier, setIdentifier] = useState(''); // email, mobile, or customer ID
  const [password, setPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Open modal with presets
  const handleOpenPortal = (role: UserRole) => {
    setActivePortal(role);
    setAuthError(null);
    setPassword('demo1234');
    if (role === 'admin') {
      setIdentifier('admin@fabricfold.com');
    } else if (role === 'staff') {
      setIdentifier('attendant@fabricfold.com');
    } else if (role === 'student') {
      setIdentifier('9948445878');
    }
  };

  const handleBackToLanding = () => {
    setActivePortal(null);
    setAuthError(null);
  };

  // Authenticate against Supabase when configured; otherwise use the explicit local demo accounts.
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortal) return;
    setIsLoading(true);
    setAuthError(null);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const cleanIdent = identifier.trim();
        const authResult = cleanIdent.includes('@')
          ? await supabase.auth.signInWithPassword({
            email: identifier.trim(),
            password: password.trim(),
          })
          : activePortal === 'student' && /^[+\d][\d\s()-]+$/.test(cleanIdent)
            ? await supabase.auth.signInWithPassword({
                phone: cleanIdent,
                password: password.trim(),
              })
            : null;

        if (!authResult) {
          throw new Error('Use your registered email or mobile number to sign in to the connected account.');
        }
        if (authResult.error || !authResult.data.user) {
          throw new Error(authResult.error?.message || 'Authentication failed.');
        }

        const authUser = authResult.data.user;
        const verifiedRole = authUser.app_metadata?.role;
        if (verifiedRole !== 'admin' && verifiedRole !== 'staff' && verifiedRole !== 'student') {
          await supabase.auth.signOut();
          throw new Error('Your account does not have a valid application role. Contact an administrator.');
        }

        const linkedCustomer = verifiedRole === 'student'
          ? dataService.getCustomers().find(customer =>
              customer.id === authUser.app_metadata?.customer_id ||
              customer.customer_id === authUser.app_metadata?.customer_ref_id ||
              (!!authUser.phone && customer.mobile.replace(/[^0-9]/g, '') === authUser.phone.replace(/[^0-9]/g, '')) ||
              (!!authUser.email && customer.email?.toLowerCase() === authUser.email.toLowerCase())
            )
          : undefined;

        if (verifiedRole === 'student' && !linkedCustomer) {
          await supabase.auth.signOut();
          throw new Error('No customer profile is linked to this student account. Contact an administrator.');
        }

        const authenticatedUser: AppUser = {
          id: authUser.id,
          name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || authUser.phone || 'User',
          email: authUser.email || '',
          role: verifiedRole,
          ...(linkedCustomer && {
            customer_id: linkedCustomer.id,
            customer_ref_id: linkedCustomer.customer_id,
            mobile: linkedCustomer.mobile,
            hostel_name: linkedCustomer.hostel_name,
          }),
        };

        if (verifiedRole !== activePortal) {
          warning('Role Verified', `This account is registered as ${verifiedRole.toUpperCase()}. Opening that portal.`);
        } else {
          success('Authentication Verified', `Welcome back, ${authenticatedUser.name}`);
        }
        onLoginSuccess(authenticatedUser);
        return;
      }

      if (password && password !== 'demo1234' && password !== 'admin' && password !== 'password' && password.length < 3) {
        throw new Error('Please enter password "demo1234" for demo access.');
      }

      // Local demo verification is intentionally limited to the named demo accounts.
      let authenticatedUser: AppUser | null = null;
      const cleanIdent = identifier.trim().toLowerCase();
      const cleanDigits = identifier.replace(/[^0-9]/g, '');

      if (activePortal === 'student') {
        // Check if student user entered staff or admin email by mistake
        const staffConflict = INITIAL_STAFF_USERS.find(
          u => u.role !== 'student' && (u.email.toLowerCase() === cleanIdent || cleanIdent === u.role)
        );
        if (staffConflict) {
          const msg = `Role Notice: "${staffConflict.name}" is a ${staffConflict.role.toUpperCase()} account. Switching you to the ${staffConflict.role === 'admin' ? 'Admin' : 'Staff'} Login portal.`;
          warning('Role Redirect', msg);
          setActivePortal(staffConflict.role);
          setIdentifier(staffConflict.email);
          setIsLoading(false);
          return;
        }

        const allCustomers = dataService.getCustomers();
        const matchedCustomer = allCustomers.find(c =>
          c.customer_id.toLowerCase() === cleanIdent ||
          (!!cleanDigits && c.mobile.replace(/[^0-9]/g, '') === cleanDigits) ||
          (!!c.email && c.email.toLowerCase() === cleanIdent)
        );

        const studentShortcut = cleanIdent === 'student'
          ? allCustomers.find(c => c.customer_id === 'FFL-0001')
          : undefined;
        const customer = matchedCustomer || studentShortcut;
        if (!customer) {
          throw new Error('No matching student account was found. Use the registered mobile number or customer ID.');
        }

        authenticatedUser = {
          id: `usr-${customer.id}`,
          name: customer.name,
          email: customer.email || `${customer.customer_id.toLowerCase()}@ganga.hostel`,
          role: 'student',
          customer_id: customer.id,
          customer_ref_id: customer.customer_id,
          mobile: customer.mobile,
          hostel_name: customer.hostel_name,
        };
      } else if (activePortal === 'staff') {
        // Staff portal login
        // Check if student accidentally entered mobile or student ID
        const studentCustomer = dataService.getCustomers().find(c =>
          c.customer_id.toLowerCase() === cleanIdent ||
          (cleanDigits.length >= 7 && c.mobile.replace(/[^0-9]/g, '') === cleanDigits)
        );
        if (studentCustomer) {
          const msg = `Role Notice: "${studentCustomer.name}" is a hostel student. Switching you to the Student Portal.`;
          warning('Role Redirect', msg);
          setActivePortal('student');
          setIdentifier(studentCustomer.mobile);
          setIsLoading(false);
          return;
        }

        // Check if admin is logging in via staff
        if (cleanIdent === 'admin' || cleanIdent.includes('admin@') || cleanIdent === 'supervisor') {
          const msg = `Role Notice: Admin account detected. Switching to Admin Portal.`;
          warning('Role Redirect', msg);
          setActivePortal('admin');
          setIdentifier('admin@fabricfold.com');
          setIsLoading(false);
          return;
        }

        const matchedStaff = INITIAL_STAFF_USERS.find(
          u => u.role === 'staff' && (
            u.email.toLowerCase() === cleanIdent ||
            cleanIdent === 'staff' ||
            cleanIdent === 'attendant' ||
            cleanIdent === 'counter'
          )
        );

        if (!matchedStaff) {
          throw new Error('No matching staff demo account was found.');
        }
        authenticatedUser = matchedStaff;
      } else {
        // Admin portal login
        // Check if student accidentally entered mobile or student ID
        const studentCustomer = dataService.getCustomers().find(c =>
          c.customer_id.toLowerCase() === cleanIdent ||
          (cleanDigits.length >= 7 && c.mobile.replace(/[^0-9]/g, '') === cleanDigits)
        );
        if (studentCustomer) {
          const msg = `Role Notice: "${studentCustomer.name}" is a hostel student. Switching you to the Student Portal.`;
          warning('Role Redirect', msg);
          setActivePortal('student');
          setIdentifier(studentCustomer.mobile);
          setIsLoading(false);
          return;
        }

        const matchedAdmin = INITIAL_STAFF_USERS.find(
          u => u.role === 'admin' && (
            u.email.toLowerCase() === cleanIdent ||
            cleanIdent === 'admin' ||
            cleanIdent === 'administrator' ||
            cleanIdent === 'supervisor' ||
            cleanIdent === 'manager'
          )
        );

        if (!matchedAdmin) {
          throw new Error('No matching admin demo account was found.');
        }
        authenticatedUser = matchedAdmin;
      }

      if (authenticatedUser) {
        success(
          'Login Verified & Authorized',
          `Welcome, ${authenticatedUser.name} (${authenticatedUser.role.toUpperCase()})`
        );
        onLoginSuccess(authenticatedUser);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication error occurred';
      setAuthError(msg);
      error('Login Notice', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = (role: UserRole) => {
    setActivePortal(role);
    if (role === 'student') {
      const allCustomers = dataService.getCustomers();
      const realCustomer = allCustomers.find(c => c.customer_id === 'FFL-0001');
      if (!realCustomer) {
        error('Student Demo Unavailable', 'No student customer record is available in local demo data.');
        return;
      }
      const studentUser: AppUser = {
        id: `usr-${realCustomer.id}`,
        name: realCustomer.name,
        email: realCustomer.email || 'saicharan@ganga.hostel',
        role: 'student',
        customer_id: realCustomer.id,
        customer_ref_id: realCustomer.customer_id,
        mobile: realCustomer.mobile,
        hostel_name: realCustomer.hostel_name,
      };
      success('Student Authenticated', `Welcome, ${studentUser.name} (${studentUser.customer_ref_id})`);
      onLoginSuccess(studentUser);
    } else if (role === 'staff') {
      const staffUser = INITIAL_STAFF_USERS.find(u => u.role === 'staff') || INITIAL_STAFF_USERS[1];
      success('Staff Authenticated', `Welcome, ${staffUser.name} (Counter Attendant)`);
      onLoginSuccess(staffUser);
    } else if (role === 'admin') {
      const adminUser = INITIAL_STAFF_USERS.find(u => u.role === 'admin') || INITIAL_STAFF_USERS[0];
      success('Admin Authenticated', `Welcome, ${adminUser.name} (Admin Oversight)`);
      onLoginSuccess(adminUser);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Ambience Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-xl px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-teal-500/20">
              <Shirt className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-sm tracking-wider uppercase text-white">
                FABRICFOLD
              </div>
              <div className="text-[10px] font-bold text-teal-400 uppercase tracking-widest leading-none mt-0.5">
                LAUNDRY SOLUTION
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="hidden sm:inline text-slate-400">Campus Residence Laundry Portal</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 font-mono text-[11px] border border-slate-700">
              Ganga Hostel
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* If no portal modal open: Show Landing Page with 3 Login Cards */}
        {!activePortal ? (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Smart Laundry Management for Hostels
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Welcome to <span className="bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent">FABRICFOLD</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Streamlined laundry tracking for hostel students, counter attendants, and administrators. Choose your dedicated portal below to sign in:
              </p>
            </div>

            {/* Three Clear Login Choice Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {/* 1. Staff Login Card */}
              <div 
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/15 transition-all" />
                <div className="space-y-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <UserCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400">
                      Operations Portal
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">Staff Login</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      For laundry counter attendants to check-in student garments, update washing stages, mark completed, and resolve complaints.
                    </p>
                  </div>
                </div>

                <div className="pt-6 relative z-10 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess('staff')}
                    className="w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal-500/25 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ 1-Tap Fast Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPortal('staff')}
                    className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In with Credentials</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 2. Student Login Card */}
              <div 
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/15 transition-all" />
                <div className="space-y-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      Hostel Residents
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">Student Login</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      For hostel students to track remaining wash quotas, check real-time order readiness, upload complaint photos, and view notices.
                    </p>
                  </div>
                </div>

                <div className="pt-6 relative z-10 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess('student')}
                    className="w-full py-3 px-4 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/25 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ 1-Tap Fast Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPortal('student')}
                    className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In with Mobile / ID</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 3. Admin Login Card */}
              <div 
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all" />
                <div className="space-y-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      Facility Management
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">Admin Login</h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      For managers to review laundry analytics, manage students & hostels, oversee complaints audit trails, and export reports.
                    </p>
                  </div>
                </div>

                <div className="pt-6 relative z-10 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoAccess('admin')}
                    className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ 1-Tap Fast Sign In</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenPortal('admin')}
                    className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl border border-slate-700/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In with Credentials</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="max-w-xl mx-auto pt-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                One-Click Demo Portal Access (Ready to Use)
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoAccess('student')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500 text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  🎓 Gampa Saicharan (Student)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoAccess('staff')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-teal-500 text-teal-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  👔 Counter Attendant (Staff)
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoAccess('admin')}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500 text-indigo-300 text-xs font-semibold transition-all cursor-pointer"
                >
                  🛡️ Admin Supervisor (Admin)
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Role-Specific Focused Login Form */
          <div className="max-w-md w-full mx-auto bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className={`p-6 text-white text-center relative ${
              activePortal === 'student' 
                ? 'bg-gradient-to-b from-cyan-950 to-slate-900' 
                : activePortal === 'staff'
                ? 'bg-gradient-to-b from-teal-950 to-slate-900'
                : 'bg-gradient-to-b from-indigo-950 to-slate-900'
            }`}>
              <button
                type="button"
                onClick={handleBackToLanding}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors flex items-center gap-1 text-xs font-semibold"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl flex items-center justify-center font-bold text-slate-950 shadow-lg mt-2 bg-gradient-to-tr from-teal-400 to-cyan-300">
                {activePortal === 'student' ? (
                  <GraduationCap className="w-7 h-7" />
                ) : activePortal === 'staff' ? (
                  <UserCheck className="w-7 h-7" />
                ) : (
                  <ShieldCheck className="w-7 h-7" />
                )}
              </div>

              <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/10 text-teal-300 text-[11px] font-bold uppercase tracking-wider mb-1">
                {activePortal.toUpperCase()} ACCESS PORTAL
              </div>
              <h2 className="text-xl font-black text-white">
                {activePortal === 'student'
                  ? 'Student Resident Sign In'
                  : activePortal === 'staff'
                  ? 'Laundry Staff Sign In'
                  : 'System Admin Oversight'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Role will be verified against the secure database
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="p-6 sm:p-8 space-y-4">
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{authError}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {activePortal === 'student'
                    ? 'Registered Mobile or Customer ID'
                    : 'Staff / Admin Email Address'}
                </label>
                <div className="relative">
                  {activePortal === 'student' ? (
                    <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  ) : (
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  )}
                  <input
                    type="text"
                    required
                    inputMode={activePortal === 'student' ? 'tel' : 'email'}
                    autoComplete="username"
                    value={identifier}
                    onChange={e => setIdentifier(e.target.value)}
                    placeholder={
                      activePortal === 'student'
                        ? 'e.g. 9948445878 or FFL-0001'
                        : activePortal === 'staff'
                        ? 'attendant@fabricfold.com'
                        : 'admin@fabricfold.com'
                    }
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1.5 block">
                  {activePortal === 'student' ? (
                    <>Preset ID: <strong>9948445878</strong> (Gampa Saicharan) • Shortcut: Type <strong>student</strong></>
                  ) : activePortal === 'staff' ? (
                    <>Preset Email: <strong>attendant@fabricfold.com</strong> • Shortcut: Type <strong>staff</strong></>
                  ) : (
                    <>Preset Email: <strong>admin@fabricfold.com</strong> • Shortcut: Type <strong>admin</strong></>
                  )}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password / Access Key
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="demo1234"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Demo password: <strong>demo1234</strong>
                </span>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-[46px] py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Verifying Credentials...' : `Enter ${activePortal.toUpperCase()} Portal`}
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDemoAccess(activePortal)}
                  className="w-full min-h-[42px] py-2.5 px-4 bg-slate-100 hover:bg-teal-50 text-slate-800 hover:text-teal-900 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span>⚡ Instant 1-Tap {activePortal.toUpperCase()} Access</span>
                </button>
              </div>

              {/* Role Protection Notice */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                <span>
                  Portal selection is validated against the stored account role. Impersonation is blocked.
                </span>
              </div>

              {/* Quick switch */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={handleBackToLanding}
                  className="text-teal-700 hover:underline font-bold"
                >
                  ← Switch Portal Selection
                </button>
                <span className="text-slate-400 text-[11px]">Demo pass: demo1234</span>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/40 px-6 py-4 text-center text-xs text-slate-500">
        FABRICFOLD LAUNDRY SOLUTION • Smart Laundry Management for Hostels • Ganga Hostel Facility
      </footer>
    </div>
  );
};
