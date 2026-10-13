import React, { useState } from 'react';
import { ActiveTab, Customer, AppUser } from './types';
import { ToastProvider } from './components/common/Toast';
import { Sidebar } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { LandingView } from './components/auth/LandingView';
import { DashboardView } from './components/dashboard/DashboardView';
import { CustomerList } from './components/customers/CustomerList';
import { NewLaundry } from './components/laundry/NewLaundry';
import { OrdersList } from './components/laundry/OrdersList';
import { ComplaintsView } from './components/complaints/ComplaintsView';
import { StudentPortalView } from './components/student/StudentPortalView';
import { NotificationLogsView } from './components/notifications/NotificationLogsView';
import { HostelList } from './components/hostels/HostelList';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { CustomerProfileModal } from './components/customers/CustomerProfileModal';
import { RenewPackageModal } from './components/customers/RenewPackageModal';
import { DataImportView } from './components/import/DataImportView';

const readSavedUser = (): AppUser | null => {
  if (!import.meta.env.DEV) return null;

  try {
    const saved = localStorage.getItem('ffl_current_user_v3');
    if (!saved) return null;

    const user: unknown = JSON.parse(saved);
    if (
      typeof user === 'object' &&
      user !== null &&
      'id' in user &&
      typeof user.id === 'string' &&
      'name' in user &&
      typeof user.name === 'string' &&
      'role' in user &&
      (user.role === 'admin' || user.role === 'staff' || user.role === 'student')
    ) {
      return user as AppUser;
    }

    console.error('Saved session is invalid; returning to the login page.');
  } catch (err) {
    console.error('Unable to restore saved session; returning to the login page.', err);
  }

  return null;
};

export const AppContent: React.FC = () => {
  // Auth state - defaults to null so landing page with three login choices is always shown first
  const [currentUser, setCurrentUser] = useState<AppUser | null>(readSavedUser);

  // Helper to parse route from URL hash
  const getTabFromHash = (role?: string): ActiveTab => {
    const raw = window.location.hash.replace('#/', '').replace('#', '').toLowerCase();
    const validTabs: ActiveTab[] = [
      'dashboard', 'customers', 'new-laundry', 'orders', 
      'complaints', 'student-portal', 'notifications', 
      'hostels', 'reports', 'settings', 'import'
    ];
    if (validTabs.includes(raw as ActiveTab)) {
      return raw as ActiveTab;
    }
    if (role === 'student') return 'student-portal';
    if (role === 'staff') return 'orders';
    return 'dashboard';
  };

  // Navigation tab initialized from URL hash if valid
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const u = readSavedUser();
    return getTabFromHash(u?.role);
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Selected customer for New Laundry prefill
  const [prefilledCustomerId, setPrefilledCustomerId] = useState<string | undefined>(undefined);

  // Selected customer for Profile modal
  const [profileCustomerId, setProfileCustomerId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Customer for Renew modal
  const [renewingCustomer, setRenewingCustomer] = useState<Customer | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);

  // Refresh key to re-render dependent components upon updates
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  // Listen to browser hash changes (support back/forward buttons & direct links)
  React.useEffect(() => {
    const handleHashChange = () => {
      if (currentUser) {
        const nextTab = getTabFromHash(currentUser.role);
        setActiveTab(nextTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentUser]);

  const handleLogin = (user: AppUser) => {
    setCurrentUser(user);
    if (import.meta.env.DEV) {
      localStorage.setItem('ffl_current_user_v3', JSON.stringify(user));
    }

    // Route user directly to their requested tab or role-specific landing interface
    const requested = getTabFromHash(user.role);
    if (user.role === 'student') {
      setActiveTab('student-portal');
    } else if (user.role === 'staff') {
      const adminOnlyTabs: ActiveTab[] = ['dashboard', 'hostels', 'reports', 'import', 'student-portal'];
      setActiveTab(adminOnlyTabs.includes(requested) ? 'orders' : requested);
    } else {
      setActiveTab(requested);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ffl_current_user_v3');
    setActiveTab('dashboard');
    window.history.replaceState(null, '', window.location.pathname);
  };

  const effectiveTab = React.useMemo<ActiveTab>(() => {
    if (!currentUser) {
      return getTabFromHash();
    }

    if (currentUser.role === 'student') {
      return 'student-portal';
    }

    if (currentUser.role === 'staff') {
      const adminOnlyTabs: ActiveTab[] = ['dashboard', 'hostels', 'reports', 'import', 'student-portal'];
      return adminOnlyTabs.includes(activeTab) ? 'orders' : activeTab;
    }

    return activeTab;
  }, [activeTab, currentUser]);

  // Keep URL hash synchronized with active view
  React.useEffect(() => {
    if (!currentUser) {
      return;
    }

    const targetHash = `#/${effectiveTab}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, [effectiveTab, currentUser]);

  // 1. If not authenticated, render the Landing View with 3 Login choices
  if (!currentUser) {
    return <LandingView onLoginSuccess={handleLogin} />;
  }

  // Cross-view navigation handlers
  const handleStartNewLaundryForCustomer = (cust: Customer) => {
    setPrefilledCustomerId(cust.id);
    setActiveTab('new-laundry');
  };

  const handleOpenCustomerProfile = (customerId: string) => {
    setProfileCustomerId(customerId);
    setShowProfileModal(true);
  };

  const handleOpenRenewForCustomer = (cust: Customer) => {
    setRenewingCustomer(cust);
    setShowRenewModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Left Sidebar */}
      <Sidebar
        currentTab={effectiveTab}
        onSelectTab={tab => {
          if (currentUser.role === 'student') {
            setActiveTab('student-portal');
            return;
          }
          if (tab !== 'new-laundry') {
            setPrefilledCustomerId(undefined);
          }
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Sticky Top Navbar */}
        <Navbar
          currentTab={effectiveTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateTab={tab => {
            if (currentUser.role === 'student') {
              setActiveTab('student-portal');
              return;
            }
            if (tab !== 'new-laundry') setPrefilledCustomerId(undefined);
            setActiveTab(tab);
          }}
          onSelectCustomer={cust => {
            if (currentUser.role !== 'student') {
              handleOpenCustomerProfile(cust.id);
            }
          }}
          currentUser={currentUser}
          onLogout={handleLogout}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto" key={refreshKey}>
          {/* Student Dedicated Portal */}
          {effectiveTab === 'student-portal' && (
            <StudentPortalView currentUser={currentUser} />
          )}

          {/* Admin Dashboard */}
          {effectiveTab === 'dashboard' && currentUser.role === 'admin' && (
            <DashboardView
              onNavigateTab={tab => {
                if (tab !== 'new-laundry') setPrefilledCustomerId(undefined);
                setActiveTab(tab);
              }}
              onNewLaundryWithCustomer={handleStartNewLaundryForCustomer}
              onViewCustomerProfile={handleOpenCustomerProfile}
            />
          )}

          {/* Customer Management */}
          {effectiveTab === 'customers' && (
            <CustomerList
              onNewLaundryForCustomer={handleStartNewLaundryForCustomer}
              onNavigateImport={() => setActiveTab('import')}
            />
          )}

          {/* New Laundry Order Submission */}
          {effectiveTab === 'new-laundry' && (
            <NewLaundry
              initialCustomerId={prefilledCustomerId}
              onOrderCreated={() => {
                triggerRefresh();
              }}
              onRenewCustomer={handleOpenRenewForCustomer}
              onNavigateOrders={() => setActiveTab('orders')}
            />
          )}

          {/* Laundry Orders Management & Tracking */}
          {effectiveTab === 'orders' && (
            <OrdersList
              onViewCustomer={handleOpenCustomerProfile}
              onNewSubmission={() => {
                setPrefilledCustomerId(undefined);
                setActiveTab('new-laundry');
              }}
            />
          )}

          {/* Complaints Section (Staff & Admin) */}
          {effectiveTab === 'complaints' && (
            <ComplaintsView currentUser={currentUser} />
          )}

          {/* Notification Logs (Staff & Admin) */}
          {effectiveTab === 'notifications' && (
            <NotificationLogsView />
          )}

          {/* Hostel Residences (Admin) */}
          {effectiveTab === 'hostels' && currentUser.role === 'admin' && (
            <HostelList />
          )}

          {/* Reports & Analytics (Admin) */}
          {effectiveTab === 'reports' && currentUser.role === 'admin' && (
            <ReportsView />
          )}

          {/* Data Import Flow (Admin) */}
          {effectiveTab === 'import' && currentUser.role === 'admin' && (
            <DataImportView
              onImportComplete={triggerRefresh}
              onNavigateCustomers={() => setActiveTab('customers')}
            />
          )}

          {/* System Settings & Configuration */}
          {effectiveTab === 'settings' && (
            <SettingsView
              onDataReset={() => {
                triggerRefresh();
              }}
            />
          )}
        </main>
      </div>

      {/* Global Customer Profile Modal */}
      <CustomerProfileModal
        isOpen={showProfileModal}
        customerId={profileCustomerId}
        onClose={() => {
          setShowProfileModal(false);
          setProfileCustomerId(null);
        }}
        onEdit={() => {
          setShowProfileModal(false);
          setActiveTab('customers');
        }}
        onNewLaundry={cust => {
          setShowProfileModal(false);
          handleStartNewLaundryForCustomer(cust);
        }}
      />

      {/* Global Renew Modal */}
      <RenewPackageModal
        isOpen={showRenewModal}
        customer={renewingCustomer}
        onClose={() => {
          setShowRenewModal(false);
          setRenewingCustomer(null);
        }}
        onRenewed={() => {
          triggerRefresh();
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
