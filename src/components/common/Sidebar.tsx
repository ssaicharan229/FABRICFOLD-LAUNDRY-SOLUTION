import React from 'react';
import { ActiveTab, AppUser } from '../../types';
import { 
  LayoutDashboard, 
  Users, 
  Shirt, 
  FileText, 
  AlertCircle,
  Building2, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sparkles, 
  X,
  Database,
  ShieldCheck,
  Upload,
  Bell,
  GraduationCap
} from 'lucide-react';
import { isSupabaseConfigured } from '../../supabase/client';

interface SidebarProps {
  currentTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onLogout,
  isMobileOpen,
  onCloseMobile,
}) => {
  const isSupabase = isSupabaseConfigured();

  // Role-appropriate navigation items
  let navItems: { id: ActiveTab; label: string; icon: any; isSpecial?: boolean }[] = [];

  if (currentUser?.role === 'student') {
    navItems = [
      { id: 'student-portal', label: 'Student Portal', icon: GraduationCap, isSpecial: true },
    ];
  } else if (currentUser?.role === 'staff') {
    navItems = [
      { id: 'new-laundry', label: 'New Laundry', icon: Shirt, isSpecial: true },
      { id: 'orders', label: 'Laundry Orders', icon: FileText },
      { id: 'customers', label: 'Student Lookup', icon: Users },
      { id: 'complaints', label: 'Complaints', icon: AlertCircle },
      { id: 'notifications', label: 'Notification Logs', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  } else {
    // Admin role (full access)
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'customers', label: 'Customers', icon: Users },
      { id: 'new-laundry', label: 'New Laundry', icon: Shirt, isSpecial: true },
      { id: 'orders', label: 'Laundry Orders', icon: FileText },
      { id: 'complaints', label: 'Complaints', icon: AlertCircle },
      { id: 'hostels', label: 'Hostels', icon: Building2 },
      { id: 'reports', label: 'Reports', icon: BarChart3 },
      { id: 'import', label: 'Import Data', icon: Upload },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  }

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-md shadow-teal-500/20 shrink-0">
                <Shirt className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <div className="font-black text-sm text-white tracking-wider uppercase leading-none">
                  FABRICFOLD
                </div>
                <div className="text-[11px] font-bold text-teal-400 tracking-wider uppercase mt-0.5">
                  LAUNDRY SOLUTION
                </div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5">
                  Smart Hostel Laundry Care
                </div>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Database Mode Badge */}
          <div className="px-6 pt-4 pb-2">
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <span className={`w-2 h-2 rounded-full ${isSupabase ? 'bg-emerald-400 animate-pulse' : 'bg-teal-400'}`} />
                {isSupabase ? 'Supabase Live' : 'Local Verified'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">
                {currentUser?.role || 'Guest'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all group ${
                    isActive
                      ? item.isSpecial
                        ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-slate-950 shadow-lg shadow-teal-500/20'
                        : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                      : item.isSpecial
                      ? 'bg-teal-950/40 border border-teal-500/30 text-teal-300 hover:bg-teal-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive
                          ? item.isSpecial
                            ? 'text-slate-950'
                            : 'text-teal-400'
                          : item.isSpecial
                          ? 'text-teal-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.isSpecial && (
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      isActive ? 'bg-slate-950 text-teal-300' : 'bg-teal-400/20 text-teal-300'
                    }`}>
                      {currentUser?.role === 'student' ? 'PORTAL' : 'FAST'}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Pill & Signout in Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          {currentUser && (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-bold text-slate-200 truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-teal-400 uppercase font-semibold">
                    {currentUser.role}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors shrink-0 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
