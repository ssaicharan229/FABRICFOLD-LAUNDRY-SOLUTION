import { Customer, LaundryOrder, SMSLog, Complaint } from '../types';

export const exportToCSV = (filename: string, rows: Record<string, any>[]) => {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const separator = ',';
  const keys = Object.keys(rows[0]);

  const csvContent =
    keys.map(k => `"${k.replace(/"/g, '""')}"`).join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            const value = row[k];
            let cell = value === null || value === undefined
              ? ''
              : value instanceof Date
                ? value.toLocaleString()
                : String(value);

            if (typeof value === 'string' && /^[\s]*[=+\-@]/.test(cell)) {
              cell = `'${cell}`;
            }

            return `"${cell.replace(/"/g, '""')}"`;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const formatCustomerExport = (customers: Customer[]) => {
  return customers.map(c => ({
    'Customer ID': c.customer_id,
    'Student Name': c.name,
    'Hostel': c.hostel_name,
    'Room': c.room_number,
    'Mobile': c.mobile,
    'Package': c.package_name,
    'Package Price': c.package_price ? `₹${c.package_price}` : '₹4500',
    'Total Washes': c.total_washes,
    'Used Washes': c.used_washes,
    'Remaining Washes': c.remaining_washes,
    'Start Date': c.package_start_date,
    'End Date': c.package_end_date,
    'Status': c.status,
  }));
};

export const formatOrderExport = (orders: LaundryOrder[]) => {
  return orders.map(o => ({
    'Order ID': o.order_id,
    'Customer ID': o.customer_ref_id,
    'Student Name': o.student_name,
    'Hostel': o.hostel_name,
    'Room': o.room_number,
    'Mobile': o.mobile,
    'Clothes Count': o.clothes_count,
    'Status': o.status,
    'Wash Counted': o.wash_counted ? 'YES' : 'NO',
    'Submitted At': new Date(o.submitted_at).toLocaleString(),
    'Completed At': o.completed_at ? new Date(o.completed_at).toLocaleString() : 'N/A',
    'SMS Status': o.sms_status,
    'Staff': o.created_by,
    'Notes': o.notes || '',
  }));
};

export const formatSMSLogExport = (logs: SMSLog[]) => {
  return logs.map(l => ({
    'Log ID': l.id,
    'Order ID': l.order_display_id || 'N/A',
    'Student Name': l.customer_name,
    'Recipient': l.mobile || l.recipient,
    'Channel': l.channel || 'SMS',
    'Message': l.message,
    'Status': l.status,
    'Provider': l.provider,
    'Sent At': new Date(l.sent_at).toLocaleString(),
  }));
};

export const formatComplaintExport = (complaints: Complaint[]) => {
  return complaints.map(c => ({
    'Complaint Number': c.complaint_number,
    'Student Name': c.student_name,
    'Customer ID': c.customer_ref_id,
    'Hostel': c.hostel_name,
    'Room': c.room_number || '',
    'Mobile': c.mobile,
    'Category': c.category,
    'Priority': c.priority,
    'Status': c.status,
    'Subject': c.subject,
    'Description': c.description,
    'Attachments Count': c.attachments.length,
    'Responses Count': c.responses.length,
    'Created At': new Date(c.created_at).toLocaleString(),
    'Updated At': new Date(c.updated_at).toLocaleString(),
  }));
};
