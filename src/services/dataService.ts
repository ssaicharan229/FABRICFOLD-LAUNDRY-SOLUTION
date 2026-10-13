import { 
  Customer, 
  Hostel, 
  LaundryOrder, 
  Package, 
  NotificationLog, 
  SystemSettings, 
  OrderStatus, 
  ImportSummary,
  Complaint,
  ComplaintStatus,
  ComplaintCategory,
  ComplaintPriority,
  ComplaintAttachment,
  ComplaintResponse,
  UserRole,
  EmailStatus,
  SMSStatus
} from '../types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_HOSTELS, 
  INITIAL_ORDERS, 
  INITIAL_PACKAGES, 
  INITIAL_SETTINGS, 
  INITIAL_COMPLAINTS,
  INITIAL_NOTIFICATION_LOGS 
} from '../data/demoData';
import { getSupabaseClient, isSupabaseConfigured } from '../supabase/client';

const STORAGE_KEYS = {
  CUSTOMERS: 'ffl_customers_v2',
  ORDERS: 'ffl_orders_v2',
  PACKAGES: 'ffl_packages_v2',
  HOSTELS: 'ffl_hostels_v2',
  NOTIFICATIONS: 'ffl_notifications_v2',
  COMPLAINTS: 'ffl_complaints_v2',
  SETTINGS: 'ffl_settings_v2',
};

// --- Local Storage Helper Functions ---
function getLocalItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    throw new Error(`Could not read saved data (${key}). The stored data was left unchanged.`);
  }
}

function setLocalItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error writing ${key} to localStorage`, e);
    throw new Error(`Could not save data (${key}). Check browser storage availability and try again.`);
  }
}

// --- Data Service Class ---
class DataService {
  // Initialization: ensure clean initial real data exists without fake records
  public initialize() {
    if (!localStorage.getItem(STORAGE_KEYS.CUSTOMERS)) {
      setLocalItem(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      setLocalItem(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PACKAGES)) {
      setLocalItem(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.HOSTELS)) {
      setLocalItem(STORAGE_KEYS.HOSTELS, INITIAL_HOSTELS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      setLocalItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATION_LOGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.COMPLAINTS)) {
      setLocalItem(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      setLocalItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
  }

  public resetToInitialRealData() {
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.ORDERS);
    localStorage.removeItem(STORAGE_KEYS.PACKAGES);
    localStorage.removeItem(STORAGE_KEYS.HOSTELS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.COMPLAINTS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    this.initialize();
  }

  // ==========================================
  // SETTINGS
  // ==========================================
  public getSettings(): SystemSettings {
    const settings = getLocalItem<SystemSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    settings.is_supabase_connected = isSupabaseConfigured();
    return settings;
  }

  public updateSettings(partial: Partial<SystemSettings>): SystemSettings {
    const current = this.getSettings();
    const updated = { ...current, ...partial };
    setLocalItem(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // ==========================================
  // HOSTELS
  // ==========================================
  public getHostels(): Hostel[] {
    return getLocalItem<Hostel[]>(STORAGE_KEYS.HOSTELS, INITIAL_HOSTELS);
  }

  public getHostelById(id: string): Hostel | undefined {
    return this.getHostels().find(h => h.id === id);
  }

  public getHostelByName(name: string): Hostel | undefined {
    const clean = name.trim().toLowerCase();
    return this.getHostels().find(h => h.name.toLowerCase() === clean);
  }

  public addHostel(hostel: Omit<Hostel, 'id' | 'created_at'>): Hostel {
    const hostels = this.getHostels();
    const newHostel: Hostel = {
      ...hostel,
      id: `hostel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };
    hostels.push(newHostel);
    setLocalItem(STORAGE_KEYS.HOSTELS, hostels);
    return newHostel;
  }

  public updateHostel(id: string, partial: Partial<Hostel>): Hostel {
    const hostels = this.getHostels();
    const idx = hostels.findIndex(h => h.id === id);
    if (idx === -1) throw new Error('Hostel not found');
    hostels[idx] = { ...hostels[idx], ...partial };
    setLocalItem(STORAGE_KEYS.HOSTELS, hostels);
    return hostels[idx];
  }

  // ==========================================
  // PACKAGES (Preserved read-only in UI)
  // ==========================================
  public getPackages(): Package[] {
    return getLocalItem<Package[]>(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES);
  }

  public getPackageById(id: string): Package | undefined {
    return this.getPackages().find(p => p.id === id);
  }

  public getPackageByName(name: string): Package | undefined {
    const clean = name.trim().toLowerCase();
    return this.getPackages().find(p => p.name.toLowerCase() === clean);
  }

  public updatePackage(id: string, partial: Partial<Package>): Package {
    const pkgs = this.getPackages();
    const idx = pkgs.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Package not found');
    pkgs[idx] = { ...pkgs[idx], ...partial };
    setLocalItem(STORAGE_KEYS.PACKAGES, pkgs);
    return pkgs[idx];
  }

  public addPackage(pkg: Omit<Package, 'id' | 'created_at'>): Package {
    const pkgs = this.getPackages();
    const newPkg: Package = {
      ...pkg,
      id: `pkg-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    pkgs.push(newPkg);
    setLocalItem(STORAGE_KEYS.PACKAGES, pkgs);
    return newPkg;
  }

  // ==========================================
  // CUSTOMERS
  // ==========================================
  public getCustomers(): Customer[] {
    const list = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    if (!Array.isArray(list)) {
      throw new Error('Saved customer data is invalid. The stored data was left unchanged.');
    }
    return list.filter(c => !c.is_deleted);
  }

  public getCustomerById(id: string): Customer | undefined {
    return this.getCustomers().find(c => c.id === id);
  }

  public getCustomerByRefId(refId: string): Customer | undefined {
    const term = refId.trim().toUpperCase();
    return this.getCustomers().find(c => c.customer_id.toUpperCase() === term);
  }

  public getCustomerByMobile(mobile: string): Customer | undefined {
    const clean = mobile.replace(/[^0-9]/g, '');
    return this.getCustomers().find(c => c.mobile.replace(/[^0-9]/g, '') === clean);
  }

  public searchCustomers(query: string, hostelId?: string): Customer[] {
    const q = query.trim().toLowerCase();
    let results = this.getCustomers();

    if (hostelId && hostelId !== 'all') {
      results = results.filter(c => c.hostel_id === hostelId);
    }

    if (!q) return results;

    return results.filter(c => 
      c.customer_id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.mobile.replace(/\s+/g, '').includes(q.replace(/\s+/g, '')) ||
      (c.hostel_name && c.hostel_name.toLowerCase().includes(q)) ||
      (c.room_number && c.room_number.toLowerCase().includes(q))
    );
  }

  public getNextCustomerId(): string {
    const customers = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    let highest = 0;
    for (const c of customers) {
      const match = c.customer_id.match(/FFL-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > highest) highest = num;
      }
    }
    const nextNum = highest + 1;
    return `FFL-${nextNum.toString().padStart(4, '0')}`;
  }

  public addCustomer(data: {
    name: string;
    customer_id?: string;
    hostel_id: string;
    room_number?: string;
    mobile: string;
    email?: string;
    package_id: string;
    package_start_date?: string;
    package_end_date?: string;
    total_washes?: number;
    used_washes?: number;
    notes?: string;
  }): Customer {
    const customers = this.getCustomers();

    // Generate or clean ID
    const customerId = (data.customer_id && data.customer_id.trim()) 
      ? data.customer_id.trim().toUpperCase() 
      : this.getNextCustomerId();

    // Validate uniqueness
    if (customers.some(c => c.customer_id.toUpperCase() === customerId)) {
      throw new Error(`Customer ID '${customerId}' already exists. Please choose a unique ID.`);
    }

    // Lookup hostel & package info
    const hostel = this.getHostelById(data.hostel_id);
    const pkg = this.getPackageById(data.package_id);
    const totalWashes = data.total_washes ?? (pkg ? pkg.annual_wash_limit : 34);
    const usedWashes = data.used_washes ?? 0;

    if (usedWashes > totalWashes) {
      throw new Error(`Used washes (${usedWashes}) cannot exceed total washes (${totalWashes}).`);
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      customer_id: customerId,
      name: data.name.trim(),
      hostel_id: data.hostel_id,
      hostel_name: hostel ? hostel.name : 'Ganga Hostel',
      room_number: data.room_number ? data.room_number.trim() : '',
      mobile: data.mobile.trim(),
      email: data.email ? data.email.trim() : '',
      package_id: data.package_id,
      package_name: pkg ? pkg.name : 'PREMIUM',
      package_price: pkg ? pkg.price : 6500,
      package_start_date: data.package_start_date ? data.package_start_date.trim() : '',
      package_end_date: data.package_end_date ? data.package_end_date.trim() : '',
      total_washes: totalWashes,
      used_washes: usedWashes,
      remaining_washes: totalWashes - usedWashes,
      status: 'Active',
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    const allCustomers = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    allCustomers.push(newCustomer);
    setLocalItem(STORAGE_KEYS.CUSTOMERS, allCustomers);
    return newCustomer;
  }

  public updateCustomer(id: string, partial: Partial<Customer>): Customer {
    const allCustomers = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const idx = allCustomers.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Customer not found');

    if (partial.customer_id && partial.customer_id !== allCustomers[idx].customer_id) {
      const exists = allCustomers.some(c => c.id !== id && c.customer_id.toUpperCase() === partial.customer_id?.toUpperCase());
      if (exists) {
        throw new Error(`Customer ID '${partial.customer_id}' is already in use.`);
      }
    }

    const current = allCustomers[idx];
    const totalWashes = partial.total_washes ?? current.total_washes;
    const usedWashes = partial.used_washes ?? current.used_washes;

    if (usedWashes > totalWashes) {
      throw new Error(`Used washes (${usedWashes}) cannot exceed total washes (${totalWashes}).`);
    }

    const remaining = totalWashes - usedWashes;

    let hostelName = current.hostel_name;
    if (partial.hostel_id && partial.hostel_id !== current.hostel_id) {
      const h = this.getHostelById(partial.hostel_id);
      if (h) hostelName = h.name;
    }

    let packageName = current.package_name;
    let packagePrice = current.package_price;
    if (partial.package_id && partial.package_id !== current.package_id) {
      const p = this.getPackageById(partial.package_id);
      if (p) {
        packageName = p.name;
        packagePrice = p.price;
      }
    }

    const updated: Customer = {
      ...current,
      ...partial,
      hostel_name: hostelName,
      package_name: packageName,
      package_price: packagePrice,
      total_washes: totalWashes,
      used_washes: usedWashes,
      remaining_washes: remaining,
      updated_at: new Date().toISOString(),
    };

    allCustomers[idx] = updated;
    setLocalItem(STORAGE_KEYS.CUSTOMERS, allCustomers);
    return updated;
  }

  public renewCustomerPackage(customerId: string, packageId: string, customWashes?: number): Customer {
    const customer = this.getCustomerById(customerId);
    if (!customer) throw new Error('Customer not found');

    const pkg = this.getPackageById(packageId);
    if (!pkg) throw new Error('Package not found');

    const totalWashes = customWashes ?? pkg.annual_wash_limit;
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextYearDate = nextYear.toISOString().split('T')[0];

    return this.updateCustomer(customerId, {
      package_id: pkg.id,
      package_name: pkg.name,
      package_price: pkg.price,
      package_start_date: today,
      package_end_date: nextYearDate,
      total_washes: totalWashes,
      used_washes: 0,
      status: 'Active',
    });
  }

  public deleteCustomer(id: string): void {
    const allCustomers = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    const idx = allCustomers.findIndex(c => c.id === id);
    if (idx !== -1) {
      allCustomers[idx].is_deleted = true;
      allCustomers[idx].updated_at = new Date().toISOString();
      setLocalItem(STORAGE_KEYS.CUSTOMERS, allCustomers);
    }
  }

  // ==========================================
  // ORIGINAL DATA IMPORT / BULK PROCESSING
  // ==========================================
  public bulkImportCustomers(
    records: Partial<Customer>[],
    options: { duplicateStrategy: 'skip' | 'update' }
  ): ImportSummary {
    const pkgs = this.getPackages();
    const hostels = this.getHostels();

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors: { row: number; reason: string }[] = [];

    const defaultPkg = pkgs.find(p => p.name === 'PREMIUM') || pkgs[0];
    const defaultHostel = hostels[0];

    records.forEach((raw, idx) => {
      const rowNum = idx + 1;
      try {
        if (!raw.name || !raw.name.trim()) {
          errors.push({ row: rowNum, reason: 'Student Name is required.' });
          errorCount++;
          return;
        }

        const cleanMobile = (raw.mobile || '').replace(/[^0-9]/g, '');
        if (!cleanMobile || cleanMobile.length < 10) {
          errors.push({ row: rowNum, reason: `Invalid mobile number: "${raw.mobile || ''}". Must have at least 10 digits.` });
          errorCount++;
          return;
        }

        // Duplicate detection by Mobile or Customer ID
        const matchedExisting = this.getCustomers().find(c => 
          (raw.customer_id && c.customer_id.toUpperCase() === raw.customer_id.toUpperCase()) ||
          c.mobile.replace(/[^0-9]/g, '') === cleanMobile
        );

        if (matchedExisting) {
          if (options.duplicateStrategy === 'skip') {
            skippedCount++;
            return;
          } else {
            // Update existing
            this.updateCustomer(matchedExisting.id, {
              name: raw.name.trim(),
              room_number: raw.room_number !== undefined ? raw.room_number : matchedExisting.room_number,
              email: raw.email !== undefined ? raw.email : matchedExisting.email,
              package_start_date: raw.package_start_date !== undefined ? raw.package_start_date : matchedExisting.package_start_date,
              package_end_date: raw.package_end_date !== undefined ? raw.package_end_date : matchedExisting.package_end_date,
              total_washes: raw.total_washes || matchedExisting.total_washes,
              used_washes: raw.used_washes !== undefined ? raw.used_washes : matchedExisting.used_washes,
            });
            importedCount++;
            return;
          }
        }

        // Resolve hostel (find or auto-create)
        let hostelId = defaultHostel ? defaultHostel.id : 'hostel-ganga';
        let hostelName = defaultHostel ? defaultHostel.name : 'Ganga Hostel';

        if (raw.hostel_name && raw.hostel_name.trim()) {
          const found = this.getHostelByName(raw.hostel_name.trim());
          if (found) {
            hostelId = found.id;
            hostelName = found.name;
          } else {
            const createdHostel = this.addHostel({
              name: raw.hostel_name.trim(),
              code: raw.hostel_name.trim().substring(0, 3).toUpperCase(),
              is_active: true,
            });
            hostelId = createdHostel.id;
            hostelName = createdHostel.name;
          }
        }

        // Resolve package
        let pkgId = defaultPkg ? defaultPkg.id : 'pkg-premium';
        let pkgName = defaultPkg ? defaultPkg.name : 'PREMIUM';
        let pkgPrice = defaultPkg ? defaultPkg.price : 6500;
        let totalWashes = raw.total_washes || (defaultPkg ? defaultPkg.annual_wash_limit : 34);

        if (raw.package_name && raw.package_name.trim()) {
          const foundPkg = this.getPackageByName(raw.package_name.trim());
          if (foundPkg) {
            pkgId = foundPkg.id;
            pkgName = foundPkg.name;
            pkgPrice = foundPkg.price;
            totalWashes = raw.total_washes || foundPkg.annual_wash_limit;
          }
        }

        const customerId = (raw.customer_id && raw.customer_id.trim()) 
          ? raw.customer_id.trim().toUpperCase() 
          : this.getNextCustomerId();

        const usedWashes = raw.used_washes || 0;

        const newCust: Customer = {
          id: `cust-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          customer_id: customerId,
          name: raw.name.trim(),
          hostel_id: hostelId,
          hostel_name: hostelName,
          room_number: raw.room_number ? raw.room_number.trim() : '',
          mobile: raw.mobile ? raw.mobile.trim() : cleanMobile,
          email: raw.email ? raw.email.trim() : '',
          package_id: pkgId,
          package_name: pkgName,
          package_price: pkgPrice,
          package_start_date: raw.package_start_date ? raw.package_start_date.trim() : '',
          package_end_date: raw.package_end_date ? raw.package_end_date.trim() : '',
          total_washes: totalWashes,
          used_washes: usedWashes,
          remaining_washes: totalWashes - usedWashes,
          status: 'Active',
          created_at: new Date().toISOString(),
        };

        const currentAll = getLocalItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
        currentAll.push(newCust);
        setLocalItem(STORAGE_KEYS.CUSTOMERS, currentAll);
        importedCount++;
      } catch (err: any) {
        errors.push({ row: rowNum, reason: err.message || 'Row import failed.' });
        errorCount++;
      }
    });

    return {
      totalRows: records.length,
      importedCount,
      skippedCount,
      errorCount,
      errors,
    };
  }

  // ==========================================
  // LAUNDRY ORDERS
  // ==========================================
  public getOrders(): LaundryOrder[] {
    return getLocalItem<LaundryOrder[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  public getOrderById(id: string): LaundryOrder | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  public getOrdersByCustomerId(customerId: string): LaundryOrder[] {
    return this.getOrders()
      .filter(o => o.customer_id === customerId)
      .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
  }

  public getNextOrderId(): string {
    const orders = this.getOrders();
    let highest = 0;
    for (const o of orders) {
      const match = o.order_id.match(/LD-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > highest) highest = num;
      }
    }
    const nextNum = highest + 1;
    return `LD-${nextNum.toString().padStart(6, '0')}`;
  }

  public createOrder(data: {
    customer_id: string;
    clothes_count: number;
    notes?: string;
    created_by?: string;
  }): LaundryOrder {
    const customer = this.getCustomerById(data.customer_id);
    if (!customer) throw new Error('Customer not found');

    if (customer.remaining_washes <= 0) {
      throw new Error(`This customer's yearly wash limit of ${customer.total_washes} washes has been reached.`);
    }

    if (!Number.isInteger(data.clothes_count) || data.clothes_count < 1 || data.clothes_count > 100) {
      throw new Error('Clothes count must be a whole number between 1 and 100.');
    }

    const orderId = this.getNextOrderId();
    const nowIso = new Date().toISOString();

    const newOrder: LaundryOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order_id: orderId,
      customer_id: customer.id,
      customer_ref_id: customer.customer_id,
      student_name: customer.name,
      hostel_name: customer.hostel_name || 'Ganga Hostel',
      room_number: customer.room_number || '',
      mobile: customer.mobile,
      email: customer.email || '',
      clothes_count: data.clothes_count,
      status: 'Submitted',
      wash_counted: false,
      submitted_at: nowIso,
      created_by: data.created_by || 'Staff Attendant',
      notes: data.notes,
      sms_status: 'Not Sent',
      email_status: 'Not Sent',
      created_at: nowIso,
    };

    const orders = this.getOrders();
    orders.unshift(newOrder);
    setLocalItem(STORAGE_KEYS.ORDERS, orders);
    return newOrder;
  }

  public updateOrderStatus(orderId: string, nextStatus: OrderStatus): LaundryOrder {
    if (nextStatus === 'Completed') {
      return this.completeOrder(orderId);
    }

    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');

    const order = orders[idx];
    const updateData: Partial<LaundryOrder> = { status: nextStatus };

    if (nextStatus === 'Washing' && !order.washing_started_at) {
      updateData.washing_started_at = new Date().toISOString();
    }

    const updated = { ...order, ...updateData };
    orders[idx] = updated;
    setLocalItem(STORAGE_KEYS.ORDERS, orders);
    return updated;
  }

  public completeOrder(orderId: string): LaundryOrder {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx === -1) throw new Error('Order not found');

    const order = orders[idx];

    if (order.status === 'Completed' && order.wash_counted) {
      return order;
    }

    const customer = this.getCustomerById(order.customer_id);
    if (!customer) throw new Error('Customer for this order was not found');

    if (!order.wash_counted) {
      if (customer.used_washes >= customer.total_washes) {
        throw new Error(`Customer has reached the maximum annual wash limit of ${customer.total_washes}.`);
      }

      this.updateCustomer(customer.id, {
        used_washes: customer.used_washes + 1,
      });
    }

    const nowIso = new Date().toISOString();
    const updatedOrder: LaundryOrder = {
      ...order,
      status: 'Completed',
      wash_counted: true,
      completed_at: order.completed_at || nowIso,
      sms_status: order.sms_status === 'Mock_Delivered' ? 'Mock_Delivered' : 'Ready',
      email_status: order.email_status === 'Mock_Delivered' ? 'Mock_Delivered' : 'Ready',
    };

    orders[idx] = updatedOrder;
    setLocalItem(STORAGE_KEYS.ORDERS, orders);

    const supabase = getSupabaseClient();
    if (supabase && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(order.id)) {
      Promise.resolve(supabase.rpc('complete_laundry_order', { p_order_id: order.id }))
        .then(({ error }) => {
          if (error) {
            console.error('Supabase complete_laundry_order failed:', error);
          }
        })
        .catch(err => {
          console.error('Supabase complete_laundry_order failed:', err);
        });
    }

    return updatedOrder;
  }

  public updateOrderEmailStatus(orderId: string, status: EmailStatus, providerName: string): void {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      orders[idx].email_status = status;
      orders[idx].email_sent_at = new Date().toISOString();
      orders[idx].email_provider = providerName;
      setLocalItem(STORAGE_KEYS.ORDERS, orders);
    }
  }

  // ==========================================
  // NOTIFICATION LOGS (SMS + EMAIL)
  // ==========================================
  public getNotificationLogs(filters?: { customerId?: string; orderId?: string; channel?: string }): NotificationLog[] {
    let logs = getLocalItem<NotificationLog[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATION_LOGS);

    if (filters?.customerId) {
      logs = logs.filter(l => l.customer_id === filters.customerId);
    }
    if (filters?.orderId) {
      logs = logs.filter(l => l.order_id === filters.orderId);
    }
    if (filters?.channel) {
      logs = logs.filter(l => l.channel === filters.channel);
    }

    return logs;
  }

  // Backward compatibility alias for SMS logs
  public getSMSLogs(): NotificationLog[] {
    return this.getNotificationLogs({ channel: 'sms' });
  }

  public recordNotification(log: Omit<NotificationLog, 'id' | 'sent_at'>): NotificationLog {
    const logs = this.getNotificationLogs();
    const newLog: NotificationLog = {
      ...log,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sent_at: new Date().toISOString(),
    };
    logs.unshift(newLog);
    setLocalItem(STORAGE_KEYS.NOTIFICATIONS, logs);

    // Sync to order status
    if (log.order_id) {
      const orders = this.getOrders();
      const oIdx = orders.findIndex(o => o.id === log.order_id);
      if (oIdx !== -1) {
        if (log.channel === 'sms') {
          orders[oIdx].sms_status = log.status as SMSStatus;
          orders[oIdx].sms_sent_at = newLog.sent_at;
          orders[oIdx].sms_provider = log.provider;
        } else if (log.channel === 'email') {
          orders[oIdx].email_status = log.status as EmailStatus;
          orders[oIdx].email_sent_at = newLog.sent_at;
          orders[oIdx].email_provider = log.provider;
        }
        setLocalItem(STORAGE_KEYS.ORDERS, orders);
      }
    }

    return newLog;
  }

  // Backward compatibility alias
  public recordSMS(log: any): NotificationLog {
    return this.recordNotification({
      ...log,
      channel: 'sms',
    });
  }

  // ==========================================
  // COMPLAINTS
  // ==========================================
  public getComplaints(filters?: { customerId?: string; status?: string; search?: string }): Complaint[] {
    let complaints = getLocalItem<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);

    if (filters?.customerId) {
      complaints = complaints.filter(c => c.customer_id === filters.customerId);
    }
    if (filters?.status && filters.status !== 'All') {
      complaints = complaints.filter(c => c.status === filters.status);
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      complaints = complaints.filter(c => 
        c.complaint_number.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.student_name.toLowerCase().includes(q) ||
        c.customer_ref_id.toLowerCase().includes(q) ||
        c.mobile.includes(q)
      );
    }

    return complaints.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getComplaintById(id: string): Complaint | undefined {
    return this.getComplaints().find(c => c.id === id);
  }

  public getNextComplaintNumber(): string {
    const list = getLocalItem<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    let highest = 0;
    for (const c of list) {
      const match = c.complaint_number.match(/CMP-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > highest) highest = num;
      }
    }
    return `CMP-${(highest + 1).toString().padStart(4, '0')}`;
  }

  public createComplaint(data: {
    customer_id: string;
    order_id?: string;
    subject: string;
    category: ComplaintCategory;
    description: string;
    attachments?: ComplaintAttachment[];
    priority?: ComplaintPriority;
  }): Complaint {
    const customer = this.getCustomerById(data.customer_id);
    if (!customer) throw new Error('Customer account not found');

    if (!data.subject || !data.subject.trim()) {
      throw new Error('Complaint subject is required.');
    }
    if (!data.description || !data.description.trim()) {
      throw new Error('Complaint description is required.');
    }

    let orderDisplayId: string | undefined = undefined;
    if (data.order_id) {
      const ord = this.getOrderById(data.order_id);
      if (ord) orderDisplayId = ord.order_id;
    }

    const complaintNumber = this.getNextComplaintNumber();
    const nowIso = new Date().toISOString();

    const newComplaint: Complaint = {
      id: `cmp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      complaint_number: complaintNumber,
      customer_id: customer.id,
      customer_ref_id: customer.customer_id,
      student_name: customer.name,
      hostel_name: customer.hostel_name || 'Ganga Hostel',
      room_number: customer.room_number || '',
      mobile: customer.mobile,
      order_id: data.order_id,
      order_display_id: orderDisplayId,
      subject: data.subject.trim(),
      category: data.category,
      description: data.description.trim(),
      status: 'Submitted',
      priority: data.priority || 'Normal',
      attachments: data.attachments || [],
      responses: [],
      audit_log: [
        {
          id: `aud-${Date.now()}`,
          complaint_id: '',
          actor_name: customer.name,
          actor_role: 'student',
          action: 'Complaint submitted by student with initial status: Submitted',
          new_status: 'Submitted',
          created_at: nowIso,
        }
      ],
      created_at: nowIso,
      updated_at: nowIso,
    };

    newComplaint.audit_log[0].complaint_id = newComplaint.id;

    const list = getLocalItem<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    list.unshift(newComplaint);
    setLocalItem(STORAGE_KEYS.COMPLAINTS, list);
    return newComplaint;
  }

  public updateComplaintStatus(
    complaintId: string, 
    nextStatus: ComplaintStatus, 
    actor: { name: string; role: string; notes?: string }
  ): Complaint {
    const list = getLocalItem<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    const idx = list.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = list[idx];
    const prevStatus = complaint.status;
    const nowIso = new Date().toISOString();

    complaint.status = nextStatus;
    complaint.updated_at = nowIso;

    complaint.audit_log.unshift({
      id: `aud-${Date.now()}`,
      complaint_id: complaint.id,
      actor_name: actor.name,
      actor_role: actor.role,
      action: `Status transitioned from ${prevStatus} to ${nextStatus}`,
      previous_status: prevStatus,
      new_status: nextStatus,
      created_at: nowIso,
    });

    list[idx] = complaint;
    setLocalItem(STORAGE_KEYS.COMPLAINTS, list);
    return complaint;
  }

  public addComplaintResponse(
    complaintId: string, 
    response: { 
      author_name: string; 
      author_role: UserRole; 
      message: string; 
      is_internal: boolean; 
    }
  ): Complaint {
    const list = getLocalItem<Complaint[]>(STORAGE_KEYS.COMPLAINTS, INITIAL_COMPLAINTS);
    const idx = list.findIndex(c => c.id === complaintId);
    if (idx === -1) throw new Error('Complaint not found');

    const complaint = list[idx];
    const nowIso = new Date().toISOString();

    const newResponse: ComplaintResponse = {
      id: `resp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      complaint_id: complaint.id,
      author_id: `user-${Date.now()}`,
      author_name: response.author_name,
      author_role: response.author_role,
      message: response.message.trim(),
      is_internal: response.is_internal,
      created_at: nowIso,
    };

    complaint.responses.push(newResponse);
    complaint.updated_at = nowIso;

    complaint.audit_log.unshift({
      id: `aud-${Date.now()}`,
      complaint_id: complaint.id,
      actor_name: response.author_name,
      actor_role: response.author_role,
      action: response.is_internal 
        ? 'Added internal staff note (hidden from student)' 
        : 'Added public resolution response (visible to student)',
      created_at: nowIso,
    });

    list[idx] = complaint;
    setLocalItem(STORAGE_KEYS.COMPLAINTS, list);
    return complaint;
  }

  // ==========================================
  // DASHBOARD & ANALYTICS METRICS
  // ==========================================
  public getDashboardStats() {
    const customers = this.getCustomers();
    const orders = this.getOrders();
    const packages = this.getPackages();
    const complaints = this.getComplaints();

    const todayDate = new Date().toISOString().split('T')[0];

    const todayOrders = orders.filter(o => o.submitted_at.startsWith(todayDate));
    const pendingOrders = orders.filter(o => o.status === 'Submitted' || o.status === 'Washing');
    const completedToday = orders.filter(o => o.status === 'Completed' && o.completed_at?.startsWith(todayDate));
    const totalClothesToday = todayOrders.reduce((acc, curr) => acc + (curr.clothes_count || 0), 0);
    const lowBalanceCustomers = customers.filter(c => c.remaining_washes <= 5 && c.remaining_washes > 0);
    const exhaustedBalanceCustomers = customers.filter(c => c.remaining_washes === 0);

    const openComplaints = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review');

    return {
      totalCustomers: customers.length,
      todaySubmissions: todayOrders.length,
      pendingOrders: pendingOrders.length,
      completedToday: completedToday.length,
      totalClothesToday,
      activePackages: packages.filter(p => p.is_active).length,
      lowBalanceCount: lowBalanceCustomers.length,
      exhaustedBalanceCount: exhaustedBalanceCustomers.length,
      lowBalanceCustomers,
      exhaustedBalanceCustomers,
      recentOrders: orders.slice(0, 8),
      totalComplaintsCount: complaints.length,
      openComplaintsCount: openComplaints.length,
      resolvedComplaintsCount: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    };
  }
}

export const dataService = new DataService();
dataService.initialize();
