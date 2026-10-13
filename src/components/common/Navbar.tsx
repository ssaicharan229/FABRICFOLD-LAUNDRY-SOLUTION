import React, { useState } from 'react';
import { ActiveTab, Customer, StaffUser } from '../../types';
import { dataService } from '../../services/dataService';
import { 
  Menu, 
  Search, 
  Shirt, 
  Bell, 
  Sparkles, 
  AlertTriangle, 
  ChevronRight,
  User,
  GraduationCap,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  currentTab: ActiveTab;
  onOpenMobileSidebar: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectCustomer: (customer: Customer) => void;
  currentUser: StaffUser | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onOpenMobileSidebar,
  onNavigateTab,
  onSelectCustomer,
  currentUser,
  onLogout,
}) => {
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const stats = dataService.getDashboardStats();
  const alertCount = stats.lowBalanceCount + stats.exhaustedBalanceCount;

  const handleSearchChange = (val: string) => {
    setGlobalSearch(val);
    if (!val.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    const matched = dataService.searchCustomers(val);
    setSearchResults(matched.slice(0, 5));
    setShowResults(true);
  };

  const getTabTitle = (tab: ActiveTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'customers':
        return 'Student Customers';
      case 'new-laundry':
        return 'New Laundry Submission';
      case 'orders':
        return 'Laundry Orders Tracking';
      case 'complaints':
        return 'Complaints & Issues';
      case 'notifications':
        return 'Notification Logs';
      case 'student-portal':
        return 'Student Resident Portal';
      case 'hostels':
        return 'Hostel Residences';
      case 'reports':
        return 'Reports & Data Export';
      case 'import':
        return 'Original Data Import';
      case 'settings':
        return 'System Configuration';
      default:
        return 'FabricFold';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
            <span>FABRICFOLD</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-teal-700 capitalize">{currentTab.replace('-', ' ')}</span>
          </div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
            {getTabTitle(currentTab)}
          </h2>
        </div>
      </div>

      {/* Middle: Fast Global Customer Lookup (Staff & Admin only) */}
      {currentUser?.role !== 'student' ? (
        <div className="flex-1 max-w-md hidden md:block relative">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Quick search by ID (FFL-0001), Student, or Mobile..."
              value={globalSearch}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (globalSearch.trim()) setShowResults(true);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-100 hover:bg-slate-50 focus:bg-white text-xs border border-transparent focus:border-teal-500 rounded-xl transition-all focus:ring-2 focus:ring-teal-500/20 text-slate-800"
            />
          </div>

          {/* Floating Autocomplete Dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 divide-y divide-slate-100 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Matching Students</span>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-slate-400 hover:text-slate-600 font-normal"
                >
                  Close
                </button>
              </div>
              {searchResults.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectCustomer(c);
                    setShowResults(false);
                    setGlobalSearch('');
                  }}
                  className="w-full text-left p-3 hover:bg-teal-50/50 flex items-center justify-between transition-colors group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 group-hover:bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                        {c.customer_id}
                      </span>
                      <span className="font-bold text-xs text-slate-900">{c.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {c.hostel_name} {c.room_number ? `(Rm ${c.room_number}) ` : ''}• {c.mobile}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      c.remaining_washes === 0 
                        ? 'bg-rose-100 text-rose-700' 
                        : c.remaining_washes <= 5 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {c.remaining_washes} Left
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs font-semibold">
          <GraduationCap className="w-4 h-4 text-teal-700" />
          <span>Resident Account: {currentUser.customer_ref_id || 'FFL-0001'} ({currentUser.name})</span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Fast New Laundry Button (Staff & Admin only) */}
        {currentUser?.role !== 'student' && (
          <button
            onClick={() => onNavigateTab('new-laundry')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all cursor-pointer"
          >
            <Shirt className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Laundry</span>
          </button>
        )}

        {/* Low balance alert badge (Staff & Admin only) */}
        {alertCount > 0 && currentUser?.role !== 'student' && (
          <button
            onClick={() => onNavigateTab('customers')}
            title={`${alertCount} students with low/zero balance`}
            className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl relative transition-colors"
          >
            <AlertTriangle className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {alertCount}
            </span>
          </button>
        )}

        {/* Mobile Search Toggle (Staff & Admin only) */}
        {currentUser?.role !== 'student' && (
          <button
            type="button"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            title="Search Students"
          >
            <Search className="w-5 h-5" />
          </button>
        )}

        {/* Staff / Student / Admin User Pill & Signout */}
        {currentUser && (
          <div className="flex items-center gap-2 pl-1 sm:pl-2 sm:border-l sm:border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-teal-400 font-bold text-xs flex items-center justify-center shrink-0 shadow-sm" title={`${currentUser.name} (${currentUser.role})`}>
              {currentUser.name.charAt(0)}
            </div>
            <div className="hidden sm:block text-left text-xs">
              <span className="font-bold text-slate-800 block leading-tight">{currentUser.name}</span>
              <span className="text-[10px] text-teal-700 font-bold uppercase">{currentUser.role}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="ml-1 sm:ml-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors text-xs font-semibold cursor-pointer"
                title="Sign out or switch portal"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expandable Mobile Search Bar (under header) */}
      {isMobileSearchOpen && currentUser?.role !== 'student' && (
        <div className="absolute top-full left-0 right-0 p-3 bg-white border-b border-slate-200 shadow-lg md:hidden z-50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search by ID, Name, or Mobile..."
              value={globalSearch}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-100 text-xs border border-transparent focus:border-teal-500 rounded-xl text-slate-900 focus:bg-white"
            />
            {globalSearch && (
              <button
                onClick={() => {
                  setGlobalSearch('');
                  setSearchResults([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {searchResults.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectCustomer(c);
                    setIsMobileSearchOpen(false);
                    setGlobalSearch('');
                  }}
                  className="w-full text-left p-3 hover:bg-teal-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-mono font-bold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded text-[11px] mr-1.5">
                      {c.customer_id}
                    </span>
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <div className="text-[10px] text-slate-500 mt-0.5">{c.hostel_name} • {c.mobile}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    c.remaining_washes === 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {c.remaining_washes} Left
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
