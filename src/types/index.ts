export type OrderStatus = 'Submitted' | 'Washing' | 'Completed';

export type SMSStatus = 'Not Sent' | 'Ready' | 'Sent' | 'Failed' | 'Mock_Delivered';
export type EmailStatus = 'Not Sent' | 'Ready' | 'Sent' | 'Failed' | 'Mock_Delivered';

export type UserRole = 'admin' | 'staff' | 'student';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  customer_id?: string; // If student, links to customer record e.g. cust-gampa-saicharan
  customer_ref_id?: string; // e.g. FFL-0001
  mobile?: string;
  hostel_name?: string;
}

// Backward compatibility alias
export type StaffUser = AppUser;

export interface Hostel {
  id: string;
  name: string;
  code: string;
  description?: string;
  room_count?: number;
  is_active: boolean;
  created_at: string;
}

export interface Package {
  id: string;
  name: string; // BASIC, SPLIT PLAN, PREMIUM
  price: number;
  annual_wash_limit: number; // default 34
  description: string;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  customer_id: string; // e.g. FFL-0001
  name: string;
  hostel_id: string;
  hostel_name?: string;
  room_number?: string; // Optional if not provided
  mobile: string; // e.g. 9948445878
  email?: string; // Optional email address
  package_id: string;
  package_name?: string;
  package_price?: number;
  package_start_date?: string; // Optional if not provided
  package_end_date?: string; // Optional if not provided
  total_washes: number; // default 34
  used_washes: number; // default 0
  remaining_washes: number; // total_washes - used_washes
  status: 'Active' | 'Suspended' | 'Expired';
  is_deleted?: boolean;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface LaundryOrder {
  id: string;
  order_id: string; // e.g. LD-000001
  customer_id: string; // reference to customer.id
  customer_ref_id: string; // e.g. FFL-0001
  student_name: string;
  hostel_name: string;
  room_number?: string;
  mobile: string;
  email?: string;
  clothes_count: number;
  status: OrderStatus;
  wash_counted: boolean;
  submitted_at: string;
  washing_started_at?: string;
  completed_at?: string;
  created_by: string;
  notes?: string;
  sms_status: SMSStatus;
  sms_sent_at?: string;
  sms_provider?: string;
  email_status?: EmailStatus;
  email_sent_at?: string;
  email_provider?: string;
  created_at: string;
}

export type NotificationChannel = 'sms' | 'email';
export type NotificationStatus = 'Not Sent' | 'Ready' | 'Sent' | 'Failed' | 'Mock_Delivered';

export interface NotificationLog {
  id: string;
  order_id?: string;
  order_display_id?: string;
  customer_id?: string;
  customer_name: string;
  channel: NotificationChannel;
  recipient: string; // Phone number or email
  mobile?: string; // Compatibility alias
  subject?: string;
  message: string;
  status: NotificationStatus;
  provider: string; // 'Mock Service' | 'Twilio' | 'MSG91' | 'Resend' | 'SendGrid' | 'Textlocal'
  response_payload?: Record<string, any>;
  sent_at: string;
}

// Backward compatibility alias
export type SMSLog = NotificationLog;

// -------------------------------------------------------------
// COMPLAINTS TYPES
// -------------------------------------------------------------
export type ComplaintStatus = 'Submitted' | 'Under Review' | 'Resolved' | 'Closed';

export type ComplaintCategory = 
  | 'Stained / Discolored'
  | 'Damaged Garment'
  | 'Missing Cloth'
  | 'Delivery Delay'
  | 'Fold & Iron Quality'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Normal' | 'High' | 'Urgent';

export interface ComplaintAttachment {
  id: string;
  file_name: string;
  file_url: string; // Data URL, blob URL, or Supabase Storage URL
  file_size: number;
  file_type: string;
  uploaded_at: string;
}

export interface ComplaintResponse {
  id: string;
  complaint_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  message: string;
  is_internal: boolean; // TRUE = internal staff note, FALSE = visible to student
  created_at: string;
}

export interface ComplaintAuditItem {
  id: string;
  complaint_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  previous_status?: ComplaintStatus;
  new_status?: ComplaintStatus;
  created_at: string;
}

export interface Complaint {
  id: string;
  complaint_number: string; // e.g. CMP-0001
  customer_id: string; // Links to customer.id
  customer_ref_id: string; // e.g. FFL-0001
  student_name: string;
  hostel_name: string;
  room_number?: string;
  mobile: string;
  order_id?: string; // Optional link to specific laundry order
  order_display_id?: string;
  subject: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  attachments: ComplaintAttachment[];
  responses: ComplaintResponse[];
  audit_log: ComplaintAuditItem[];
  created_at: string;
  updated_at: string;
}

// -------------------------------------------------------------
// SYSTEM SETTINGS
// -------------------------------------------------------------
export interface SystemSettings {
  business_name: string;
  tagline: string;
  business_mobile: string;
  business_email?: string;
  business_address: string;
  currency: string;
  default_wash_limit: number;
  low_balance_threshold: number; // 5
  notification_channels: 'both' | 'sms' | 'email' | 'none';
  sms_provider: 'mock' | 'twilio' | 'msg91' | 'textlocal' | 'none';
  sms_api_key?: string;
  sms_sender_id?: string;
  email_provider: 'mock' | 'resend' | 'sendgrid' | 'smtp' | 'none';
  email_api_key?: string;
  email_from_address?: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  is_supabase_connected?: boolean;
}

export interface ImportRow {
  rowNumber: number;
  data: Record<string, any>;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
  isValid: boolean;
}

export interface ImportSummary {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: { row: number; reason: string }[];
}

export type ActiveTab = 
  | 'dashboard'
  | 'customers'
  | 'new-laundry'
  | 'orders'
  | 'complaints'
  | 'hostels'
  | 'reports'
  | 'import'
  | 'notifications'
  | 'settings'
  // Student Portal Tabs
  | 'student-portal';
