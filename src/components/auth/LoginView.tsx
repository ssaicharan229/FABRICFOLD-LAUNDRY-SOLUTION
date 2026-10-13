import React, { useState } from 'react';
import { StaffUser } from '../../types';
import { INITIAL_STAFF_USERS } from '../../data/demoData';
import { useToast } from '../common/Toast';
import { getSupabaseClient } from '../../supabase/client';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  UserCheck, 
  ArrowRight, 
  ShieldCheck, 
  Shirt, 
  CheckCircle2,
  Building2
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: StaffUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { success, error, info } = useToast();

  const [email, setEmail] = useState('admin@fabricfold.com');
  const [password, setPassword] = useState('demo1234');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error: supaError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (supaError || !data.user) {
          throw new Error(supaError?.message || 'Authentication failed.');
        }

        const role = data.user.app_metadata?.role;
        if (role !== 'admin' && role !== 'staff') {
          await supabase.auth.signOut();
          throw new Error('This account is not authorized for the staff or admin portal.');
        }

        const user: StaffUser = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: data.user.email || email,
          role,
        };
        success('Supabase Login Successful', `Welcome back, ${user.name}`);
        onLoginSuccess(user);
        return;
      }

      if (!import.meta.env.DEV) {
        throw new Error('Authentication is unavailable. Connect this deployment to Supabase Auth.');
      }

      if (password !== 'demo1234') {
        throw new Error('Incorrect demo password. Use demo1234 for local demo sign-in.');
      }

      const matched = INITIAL_STAFF_USERS.find(
        u => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (matched) {
        success('Staff Authenticated', `Welcome back, ${matched.name} (${matched.role.toUpperCase()})`);
        onLoginSuccess(matched);
      } else {
        throw new Error('No matching staff or admin demo account was found.');
      }
    } catch (err: any) {
      error('Login failed', err?.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = (user: StaffUser) => {
    setEmail(user.email);
    setPassword('demo1234');
    success('Demo Staff Selected', `Logging in as ${user.name} (${user.role})`);
    onLoginSuccess(user);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Header */}
        <div className="p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-white text-center relative border-b border-slate-800">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-teal-500 to-cyan-400 rounded-2xl flex items-center justify-center text-slate-950 shadow-lg shadow-teal-500/30">
            <Shirt className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black tracking-tight uppercase">
            FABRICFOLD LAUNDRY SOLUTION
          </h1>
          <p className="text-xs text-teal-400 font-medium mt-1 tracking-wide">
            Smart Laundry Management for Hostels
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-slate-300 text-[11px] font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Staff & Admin Portal
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-8 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@fabricfold.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-teal-500 text-slate-900 font-medium transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-teal-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Quick Demo Login Credentials Buttons */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
              One-Click Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin(INITIAL_STAFF_USERS[0])}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                  {INITIAL_STAFF_USERS[0].name}
                </div>
                <div className="text-[10px] text-teal-700 font-semibold uppercase mt-0.5">
                  Admin Role
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin(INITIAL_STAFF_USERS[1])}
                className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/50 text-left transition-all group"
              >
                <div className="text-xs font-bold text-slate-800 group-hover:text-teal-900">
                  {INITIAL_STAFF_USERS[1].name}
                </div>
                <div className="text-[10px] text-indigo-700 font-semibold uppercase mt-0.5">
                  Counter Attendant
                </div>
              </button>
            </div>
          </div>
        </form>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Ready for Supabase Auth or Instant Offline Demo
        </div>
      </div>
    </div>
  );
};
