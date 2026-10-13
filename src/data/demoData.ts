import { Customer, Hostel, LaundryOrder, Package, NotificationLog, SystemSettings, AppUser, Complaint } from '../types';

export const INITIAL_STAFF_USERS: AppUser[] = [
  {
    id: 'user-admin',
    name: 'Admin Supervisor',
    email: 'admin@fabricfold.com',
    role: 'admin',
    avatar: '',
  },
  {
    id: 'user-staff',
    name: 'Counter Attendant',
    email: 'attendant@fabricfold.com',
    role: 'staff',
    avatar: '',
  },
  {
    id: 'user-student-saicharan',
    name: 'Gampa Saicharan',
    email: 'saicharan@ganga.hostel',
    role: 'student',
    customer_id: 'cust-gampa-saicharan',
    customer_ref_id: 'FFL-0001',
    mobile: '9948445878',
    hostel_name: 'Ganga Hostel',
    avatar: '',
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  business_name: 'FABRICFOLD LAUNDRY SOLUTION',
  tagline: 'Smart Laundry Management for Hostels',
  business_mobile: '+91 9948445878',
  business_email: 'laundry@fabricfold.com',
  business_address: 'Ganga Hostel Laundry Facility, Campus Central',
  currency: '₹',
  default_wash_limit: 34,
  low_balance_threshold: 5,
  notification_channels: 'both', // Both SMS and Email supported
  sms_provider: 'mock',
  sms_sender_id: 'FABRIC',
  email_provider: 'mock',
  email_from_address: 'notifications@fabricfold.com',
  is_supabase_connected: false,
};

// Initial Real Hostel (Ganga Hostel for Gampa Saicharan) - No fake hostels
export const INITIAL_HOSTELS: Hostel[] = [
  {
    id: 'hostel-ganga',
    name: 'Ganga Hostel',
    code: 'GH',
    description: 'Campus Hostel Residence',
    room_count: undefined,
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

// Preserved package definitions for customer reference (read-only in UI)
export const INITIAL_PACKAGES: Package[] = [
  {
    id: 'pkg-basic',
    name: 'BASIC',
    price: 4500,
    annual_wash_limit: 34,
    description: 'Essential laundry care for individual hostel students.',
    features: [
      '34 Washes per academic year',
      'Standard wash & precision tumble fold',
      'SMS & Email notifications on completion',
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pkg-split',
    name: 'SPLIT PLAN',
    price: 5500,
    annual_wash_limit: 34,
    description: 'Bi-weekly routine plan with express ironing included.',
    features: [
      '34 Washes per academic year',
      'Wash, Dry & Light Steam Pressing',
      'Priority washing slot & alerts',
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'pkg-premium',
    name: 'PREMIUM',
    price: 6500,
    annual_wash_limit: 34,
    description: 'Comprehensive fabric sanitization, steam press & express delivery.',
    features: [
      '34 Washes per academic year',
      'Delicate fabric care + disinfectant wash',
      'Crisp steam pressing & express delivery',
      'Multi-channel completion notifications',
    ],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  },
];

// Single real customer record without any invented/fabricated information
export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-gampa-saicharan',
    customer_id: 'FFL-0001',
    name: 'Gampa Saicharan',
    hostel_id: 'hostel-ganga',
    hostel_name: 'Ganga Hostel',
    room_number: '', // Left blank as not supplied (do not invent)
    mobile: '9948445878',
    email: '', // Left blank as not supplied
    package_id: 'pkg-premium',
    package_name: 'PREMIUM',
    package_price: 6500,
    package_start_date: '', // Left blank as not supplied (do not invent)
    package_end_date: '', // Left blank as not supplied (do not invent)
    total_washes: 34,
    used_washes: 0,
    remaining_washes: 34,
    status: 'Active',
    created_at: new Date().toISOString(),
  },
];

// Strictly zero fake complaints - empty state
export const INITIAL_COMPLAINTS: Complaint[] = [];

// Strictly zero fake orders - empty state
export const INITIAL_ORDERS: LaundryOrder[] = [];

// Strictly zero fake notification logs - empty state
export const INITIAL_NOTIFICATION_LOGS: NotificationLog[] = [];
