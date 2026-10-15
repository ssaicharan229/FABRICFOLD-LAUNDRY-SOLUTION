import React, { useState } from 'react';
import { AppUser, UserRole } from '../../types';
import { INITIAL_STAFF_USERS } from '../../data/demoData';
import { dataService } from '../../services/dataService';
import { useToast } from '../common/Toast';
import { 
  getSupabaseClient, 
  isSupabaseConfigured, 
  resetSupabaseClient, 
  testSupabaseConnection 
} from '../../supabase/client';
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
  AlertCircle, 
  ShieldAlert,
  ArrowLeft,
  Database,
  X,
  UserPlus,
  LogIn,
  KeyRound,
  RefreshCw,
  User
} from 'lucide-react';

interface LandingViewProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLoginSuccess }) => {
  const { success, error, warning, info } = useToast();

  // Active portal selection: null (Landing view) | 'staff' | 'student' | 'admin'
  const [activePortal, setActivePortal] = useState<UserRole | null>(null);

  // Authentication mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign In inputs
  const [identifier, setIdentifier] = useState(''); // email, mobile, or customer ID
  const [password, setPassword] = useState('demo1234');

  // Sign Up inputs
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpMobile, setSignUpMobile] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [signUpHostelId, setSignUpHostelId] = useState('hostel-ganga');
  const [signUpRoomNumber, setSignUpRoomNumber] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Supabase quick connection modal state
  const [showSupabaseModal, setShowSupabaseModal] = useState(false);
  const [supaModalUrl, setSupaModalUrl] = useState(() => localStorage.getItem('ffl_supabase_url') || '');
  const [supaModalKey, setSupaModalKey] = useState(() => localStorage.getItem('ffl_supabase_anon_key') || '');
  const [isTestingSupa, setIsTestingSupa] = useState(false);
  const [supaTestStatus, setSupaTestStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const isSupabaseLive = isSupabaseConfigured();

  // Open modal with presets
  const handleOpenPortal = (role: UserRole) => {
    setActivePortal(role);
    setAuthMode('signin');
    setAuthError(null);
    setAuthNotice(null);
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
    setAuthNotice(null);
  };

  // Authenticate (Sign In)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortal) return;
    setIsLoading(true);
    setAuthError(null);
    setAuthNotice(null);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const cleanIdent = identifier.trim();
        const authResult = cleanIdent.includes('@')
          ? await supabase.auth.signInWithPassword({
              email: cleanIdent,
              password: password.trim(),
            })
          : activePortal === 'student' && /^[+\d][\d\s()-]+$/.test(cleanIdent)
          ? await supabase.auth.signInWithPassword({
              phone: cleanIdent,
              password: password.trim(),
            })
          : null;

        if (!authResult) {
          throw new Error('Please enter a valid email address or registered mobile number.');
        }

        if (authResult.error || !authResult.data.user) {
          throw new Error(authResult.error?.message || 'Authentication failed. Please verify credentials.');
        }

        const authUser = authResult.data.user;
        const verifiedRole = (
          authUser.app_metadata?.role || 
          authUser.user_metadata?.role || 
          activePortal
        ) as UserRole;

        let linkedCustomer = verifiedRole === 'student'
          ? dataService.getCustomers().find(customer =>
              customer.id === authUser.app_metadata?.customer_id ||
              customer.id === authUser.id ||
              customer.customer_id === authUser.app_metadata?.customer_ref_id ||
              (!!authUser.phone && customer.mobile.replace(/[^0-9]/g, '') === authUser.phone.replace(/[^0-9]/g, '')) ||
              (!!authUser.email && customer.email?.toLowerCase() === authUser.email.toLowerCase())
            )
          : undefined;

        // Auto-provision student customer profile if missing in Supabase-authenticated user
        if (verifiedRole === 'student' && !linkedCustomer) {
          try {
            linkedCustomer = dataService.addCustomer({
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Student Resident',
              mobile: authUser.phone || authUser.user_metadata?.mobile || '9948445878',
              email: authUser.email,
              hostel_id: 'hostel-ganga',
              package_id: 'pkg-basic',
              total_washes: 34,
              used_washes: 0
            });
          } catch (createErr) {
            console.warn('Customer profile provision notice:', createErr);
          }
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
          warning('Role Verified', `Account is configured as ${verifiedRole.toUpperCase()}. Opening ${verifiedRole} portal.`);
        } else {
          success('Supabase Authenticated', `Welcome back, ${authenticatedUser.name}`);
        }
        onLoginSuccess(authenticatedUser);
        return;
      }

      // Local demo fallback
      if (password && password !== 'demo1234' && password !== 'admin' && password !== 'password' && password.length < 3) {
        throw new Error('Please enter password "demo1234" for demo accounts.');
      }

      let authenticatedUser: AppUser | null = null;
      const cleanIdent = identifier.trim().toLowerCase();
      const cleanDigits = identifier.replace(/[^0-9]/g, '');

      if (activePortal === 'student') {
        const staffConflict = INITIAL_STAFF_USERS.find(
          u => u.role !== 'student' && (u.email.toLowerCase() === cleanIdent || cleanIdent === u.role)
        );
        if (staffConflict) {
          const msg = `Role Notice: "${staffConflict.name}" is a ${staffConflict.role.toUpperCase()} account. Switching to ${staffConflict.role === 'admin' ? 'Admin' : 'Staff'} Portal.`;
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
          throw new Error('No matching student account was found. Use the registered mobile number (9948445878) or create a new student account.');
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
        const studentCustomer = dataService.getCustomers().find(c =>
          c.customer_id.toLowerCase() === cleanIdent ||
          (cleanDigits.length >= 7 && c.mobile.replace(/[^0-9]/g, '') === cleanDigits)
        );
        if (studentCustomer) {
          const msg = `Role Notice: "${studentCustomer.name}" is a student. Switching you to the Student Portal.`;
          warning('Role Redirect', msg);
          setActivePortal('student');
          setIdentifier(studentCustomer.mobile);
          setIsLoading(false);
          return;
        }

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
          throw new Error('No matching staff demo account was found. Use attendant@fabricfold.com');
        }
        authenticatedUser = matchedStaff;
      } else {
        const studentCustomer = dataService.getCustomers().find(c =>
          c.customer_id.toLowerCase() === cleanIdent ||
          (cleanDigits.length >= 7 && c.mobile.replace(/[^0-9]/g, '') === cleanDigits)
        );
        if (studentCustomer) {
          const msg = `Role Notice: "${studentCustomer.name}" is a student. Switching you to the Student Portal.`;
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
          throw new Error('No matching admin demo account was found. Use admin@fabricfold.com');
        }
        authenticatedUser = matchedAdmin;
      }

      if (authenticatedUser) {
        success(
          'Login Verified',
          `Welcome, ${authenticatedUser.name} (${authenticatedUser.role.toUpperCase()})`
        );
        onLoginSuccess(authenticatedUser);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Authentication error occurred';
      setAuthError(msg);
      error('Login Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Register (Sign Up)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePortal) return;
    setIsLoading(true);
    setAuthError(null);
    setAuthNotice(null);

    try {
      const fullName = signUpFullName.trim();
      const email = signUpEmail.trim().toLowerCase();
      const pwd = signUpPassword.trim();
      const confirmPwd = signUpConfirmPassword.trim();
      const mobile = signUpMobile.trim();

      if (!fullName) {
        throw new Error('Please enter your full name.');
      }
      if (!email.includes('@') || !email.includes('.')) {
        throw new Error('Please enter a valid email address.');
      }
      if (pwd.length < 6) {
        throw new Error('Password must be at least 6 characters long.');
      }
      if (pwd !== confirmPwd) {
        throw new Error('Passwords do not match. Please re-enter.');
      }
      if (activePortal === 'student' && mobile.replace(/\D/g, '').length < 10) {
        throw new Error('Please provide a valid 10-digit mobile number for laundry SMS alerts.');
      }

      const supabase = getSupabaseClient();
      if (supabase) {
        // Supabase Cloud Sign-Up
        const { data: supaData, error: supaErr } = await supabase.auth.signUp({
          email,
          password: pwd,
          options: {
            data: {
              full_name: fullName,
              role: activePortal,
              mobile: mobile || undefined,
              hostel_id: signUpHostelId,
            },
          },
        });

        if (supaErr) {
          throw new Error(supaErr.message);
        }

        // Provision student customer record locally in dataService so student views work immediately
        let newCustomer;
        if (activePortal === 'student') {
          try {
            newCustomer = dataService.addCustomer({
              name: fullName,
              mobile: mobile || '9948445878',
              email: email,
              hostel_id: signUpHostelId || 'hostel-ganga',
              room_number: signUpRoomNumber.trim(),
              package_id: 'pkg-basic',
              total_washes: 34,
              used_washes: 0,
            });
          } catch (custErr: any) {
            console.warn('Customer provision notice:', custErr?.message);
          }
        }

        // Check if Supabase returned a session immediately (email confirmation disabled in Supabase)
        if (supaData.session && supaData.user) {
          const newUser: AppUser = {
            id: supaData.user.id,
            name: fullName,
            email: email,
            role: activePortal,
            ...(newCustomer && {
              customer_id: newCustomer.id,
              customer_ref_id: newCustomer.customer_id,
              mobile: newCustomer.mobile,
              hostel_name: newCustomer.hostel_name,
            }),
          };
          success('Supabase Account Created', `Welcome to FabricFold, ${newUser.name}!`);
          onLoginSuccess(newUser);
          return;
        }

        // Email confirmation is enabled in Supabase project
        setAuthNotice(
          'Supabase Account Created! A confirmation email has been sent. If email confirmation is enabled in your Supabase project, please verify your email before logging in. If email confirmation is disabled, you can sign in right now.'
        );
        success('Registration Successful', 'Account registered with Supabase.');
        setIdentifier(email);
        setPassword(pwd);
        setAuthMode('signin');
        return;
      }

      // Local / Offline demo signup
      let newCustomer;
      if (activePortal === 'student') {
        newCustomer = dataService.addCustomer({
          name: fullName,
          mobile: mobile || '9948445878',
          email: email,
          hostel_id: signUpHostelId || 'hostel-ganga',
          room_number: signUpRoomNumber.trim(),
          package_id: 'pkg-basic',
          total_washes: 34,
          used_washes: 0,
        });

        const newUser: AppUser = {
          id: `usr-${newCustomer.id}`,
          name: newCustomer.name,
          email: email,
          role: 'student',
          customer_id: newCustomer.id,
          customer_ref_id: newCustomer.customer_id,
          mobile: newCustomer.mobile,
          hostel_name: newCustomer.hostel_name,
        };
        success('Student Registered', `Welcome ${newUser.name}! Your Student ID is ${newCustomer.customer_id}.`);
        onLoginSuccess(newUser);
      } else {
        const newUser: AppUser = {
          id: `usr-${Date.now()}`,
          name: fullName,
          email: email,
          role: activePortal,
        };
        success('Account Created', `Created ${activePortal.toUpperCase()} account for ${newUser.name}.`);
        onLoginSuccess(newUser);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration error occurred';
      setAuthError(msg);
      error('Sign-Up Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoAccess = (role: UserRole) => {
    setActivePortal(role);
    if (role === 'student') {
      const allCustomers = dataService.getCustomers();
      const realCustomer = allCustomers.find(c => c.customer_id === 'FFL-0001') || allCustomers[0];
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

  // Test Supabase credentials modal action
  const handleTestSupabaseModal = async () => {
    if (!supaModalUrl.trim() || !supaModalKey.trim()) {
      error('Missing Information', 'Enter both Project URL and Anon API Key.');
      return;
    }
    setIsTestingSupa(true);
    setSupaTestStatus(null);
    try {
      const res = await testSupabaseConnection(supaModalUrl.trim(), supaModalKey.trim());
      setSupaTestStatus({
        connected: res.connected,
        message: res.connected
          ? `Verified! Supabase responded successfully (${res.latencyMs}ms).`
          : res.error || 'Connection failed.',
      });
      if (res.connected) {
        success('Supabase Live', `Connection ping succeeded in ${res.latencyMs}ms.`);
      } else {
        error('Supabase Test Failed', res.error || 'Connection check failed.');
      }
    } finally {
      setIsTestingSupa(false);
    }
  };

  const handleSaveSupabaseModal = () => {
    if (supaModalUrl && !supaModalUrl.startsWith('http')) {
      error('Invalid URL', 'Project URL must begin with https://');
      return;
    }
    resetSupabaseClient(supaModalUrl.trim(), supaModalKey.trim());
    const configured = Boolean(supaModalUrl.trim() && supaModalKey.trim());
    success(
      'Settings Updated',
      configured ? 'Supabase client connected for live authentication.' : 'Reverted to local demo storage.'
    );
    setShowSupabaseModal(false);
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
            {/* Supabase Status Pill / Setup Button */}
            <button
              type="button"
              onClick={() => setShowSupabaseModal(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
                isSupabaseLive
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-teal-500/50'
              }`}
              title="Click to configure or test Supabase connection"
            >
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>{isSupabaseLive ? '🟢 Supabase Live' : '⚙️ Connect Supabase'}</span>
            </button>

            <span className="hidden sm:inline text-slate-400">Campus Residence</span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 font-mono text-[11px] border border-slate-700">
              Ganga Hostel
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-4 sm:px-6 py-12">
        {/* If no portal selected: Show 3 Role Cards */}
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
                Streamlined laundry tracking for hostel students, counter attendants, and facility administrators. Select your portal below:
              </p>
            </div>

            {/* Three Portal Choice Cards */}
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
                    <h3 className="text-xl font-black text-white mt-0.5">Staff Portal</h3>
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
                    <span>Sign In or Register</span>
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
                    <h3 className="text-xl font-black text-white mt-0.5">Student Portal</h3>
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
                    <span>Sign In or Register</span>
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
                      Facility Oversight
                    </span>
                    <h3 className="text-xl font-black text-white mt-0.5">Admin Portal</h3>
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
                    <span>Sign In or Register</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Demo Access Bar */}
            <div className="max-w-xl mx-auto pt-4 text-center">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                Instant Demo Access (Ready-to-Use Sandboxes)
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
          /* Role-Specific Portal Authentication Modal */
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
                  ? 'Student Hostel Portal'
                  : activePortal === 'staff'
                  ? 'Laundry Staff Portal'
                  : 'System Admin Oversight'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {isSupabaseLive ? 'Connected to live Supabase Authentication' : 'Local Sandbox Mode (Supabase optional)'}
              </p>
            </div>

            {/* Tab Selector: Sign In vs Sign Up */}
            <div className="px-6 pt-5">
              <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setAuthMode('signin'); setAuthError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'signin'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMode === 'signup'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </div>
            </div>

            {/* Error or Notice Banners */}
            <div className="px-6 pt-3 space-y-2">
              {authError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>{authError}</div>
                </div>
              )}
              {authNotice && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>{authNotice}</div>
                </div>
              )}
            </div>

            {/* Form Container */}
            {authMode === 'signin' ? (
              /* --- SIGN IN FORM --- */
              <form onSubmit={handleSignIn} className="p-6 sm:p-8 space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {activePortal === 'student'
                      ? 'Registered Mobile, Student ID, or Email'
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
                      inputMode={activePortal === 'student' ? 'text' : 'email'}
                      autoComplete="username"
                      value={identifier}
                      onChange={e => setIdentifier(e.target.value)}
                      placeholder={
                        activePortal === 'student'
                          ? 'e.g. 9948445878, FFL-0001, or email'
                          : activePortal === 'staff'
                          ? 'attendant@fabricfold.com'
                          : 'admin@fabricfold.com'
                      }
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1.5 block">
                    {activePortal === 'student' ? (
                      <>Preset Student: <strong>9948445878</strong> (Gampa Saicharan) • Shortcut: <strong>student</strong></>
                    ) : activePortal === 'staff' ? (
                      <>Preset Staff: <strong>attendant@fabricfold.com</strong> • Shortcut: <strong>staff</strong></>
                    ) : (
                      <>Preset Admin: <strong>admin@fabricfold.com</strong> • Shortcut: <strong>admin</strong></>
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
                    className="w-full min-h-[46px] py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Verifying Credentials...' : `Sign In to ${activePortal.toUpperCase()} Portal`}
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

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>
                    New user? Click <strong>Create Account</strong> above to register a new account.
                  </span>
                </div>
              </form>
            ) : (
              /* --- SIGN UP FORM --- */
              <form onSubmit={handleSignUp} className="p-6 sm:p-8 space-y-3 pt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={signUpFullName}
                      onChange={e => setSignUpFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={e => setSignUpEmail(e.target.value)}
                      placeholder="e.g. rahul@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                    />
                  </div>
                </div>

                {activePortal === 'student' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <Smartphone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="tel"
                            required
                            value={signUpMobile}
                            onChange={e => setSignUpMobile(e.target.value)}
                            placeholder="10-digit mobile"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                          Room Number
                        </label>
                        <input
                          type="text"
                          value={signUpRoomNumber}
                          onChange={e => setSignUpRoomNumber(e.target.value)}
                          placeholder="e.g. B-204"
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Hostel Residence
                      </label>
                      <select
                        value={signUpHostelId}
                        onChange={e => setSignUpHostelId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                      >
                        {dataService.getHostels().map(h => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password (min 6)
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={signUpPassword}
                        onChange={e => setSignUpPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={signUpConfirmPassword}
                        onChange={e => setSignUpConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full min-h-[46px] py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? 'Creating Account...' : `Register & Create ${activePortal.toUpperCase()} Account`}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Modal Switcher */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleBackToLanding}
                className="text-teal-700 hover:underline font-bold"
              >
                ← Switch Portal
              </button>
              <button
                type="button"
                onClick={() => setShowSupabaseModal(true)}
                className="text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <Database className="w-3 h-3 text-teal-600" />
                <span>Supabase Config</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Supabase Quick Connection Dialog Modal */}
      {showSupabaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Supabase Authentication Setup</h3>
                  <p className="text-[11px] text-slate-400">Connect your Supabase project for live user registration & logins</p>
                </div>
              </div>
              <button
                onClick={() => setShowSupabaseModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Connection Feedback */}
            {supaTestStatus && (
              <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                supaTestStatus.connected
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {supaTestStatus.connected ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{supaTestStatus.message}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supaModalUrl}
                  onChange={e => setSupaModalUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Anon / Public API Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supaModalKey}
                  onChange={e => setSupaModalKey(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
              <div className="font-semibold text-slate-700">Where to find these in Supabase:</div>
              <div>1. Open your Supabase Dashboard: <strong>Project Settings → API</strong></div>
              <div>2. Copy <strong>Project URL</strong> and <strong>Project API Keys → anon / public</strong></div>
              <div>3. <em>Tip:</em> To allow instant sign-ups without email links, go to <strong>Authentication → Providers → Email</strong> and uncheck "Confirm email".</div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setSupaModalUrl('');
                  setSupaModalKey('');
                  resetSupabaseClient('', '');
                  setSupaTestStatus(null);
                  info('Local Mode Active', 'Supabase credentials cleared. Using local demo accounts.');
                  setShowSupabaseModal(false);
                }}
                className="text-xs text-rose-600 hover:underline font-semibold"
              >
                Clear / Use Local Mode
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestSupabaseModal}
                  disabled={isTestingSupa}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isTestingSupa ? 'animate-spin' : ''}`} />
                  <span>{isTestingSupa ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSupabaseModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/40 px-6 py-4 text-center text-xs text-slate-500">
        FABRICFOLD LAUNDRY SOLUTION • Smart Laundry Management for Hostels • Ganga Hostel Facility
      </footer>
    </div>
  );
};
