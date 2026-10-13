import { LaundryOrder, NotificationLog, NotificationStatus } from '../types';
import { dataService } from './dataService';

export interface SendEmailOptions {
  order: LaundryOrder;
  provider?: string;
  recipientEmail?: string;
  customSubject?: string;
  customBody?: string;
}

export interface EmailResponse {
  success: boolean;
  status: NotificationStatus;
  provider: string;
  messageId: string;
  recipient: string;
  log?: NotificationLog;
  responsePayload: Record<string, any>;
  errorMessage?: string;
}

class EmailService {
  /**
   * Generates email subject for completed laundry
   */
  public generateSubject(orderDisplayId: string, businessName = 'FABRICFOLD LAUNDRY SOLUTION'): string {
    return `Laundry Order ${orderDisplayId} Ready for Collection - ${businessName}`;
  }

  /**
   * Generates structured email content
   */
  public generateCompletionEmailBody(order: LaundryOrder, businessName = 'FABRICFOLD LAUNDRY SOLUTION'): {
    text: string;
    html: string;
  } {
    const completedDate = order.completed_at 
      ? new Date(order.completed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

    const text = `
Dear ${order.student_name},

Your laundry order has been completed and is ready for collection!

Order Details:
---------------------------------------------
Student Name:     ${order.student_name}
Customer ID:      ${order.customer_ref_id}
Order ID:         ${order.order_id}
Clothes Count:    ${order.clothes_count} items
Hostel:           ${order.hostel_name}${order.room_number ? ` (Room ${order.room_number})` : ''}
Completion Time:  ${completedDate}
Status:           Ready for Pickup
---------------------------------------------

Please visit the laundry facility counter to collect your fresh, folded clothes.
Thank you for using ${businessName}!
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #1e293b; }
    .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { background: #0f172a; padding: 24px; color: #ffffff; text-align: center; }
    .badge { display: inline-block; padding: 4px 12px; background: rgba(20, 184, 166, 0.2); color: #2dd4bf; border-radius: 999px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
    .title { margin: 0; font-size: 20px; font-weight: 800; }
    .body { padding: 24px; font-size: 14px; line-height: 1.6; }
    .table { width: 100%; border-collapse: collapse; margin: 16px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; }
    .table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
    .table td:first-child { color: #64748b; font-weight: 600; width: 40%; }
    .table td:last-child { color: #0f172a; font-weight: 700; }
    .footer { padding: 16px; background: #f1f5f9; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="badge">Pickup Ready Notification</div>
      <h1 class="title">${businessName}</h1>
    </div>
    <div class="body">
      <p>Dear <strong>${order.student_name}</strong>,</p>
      <p>Great news! Your laundry washing, drying, and folding cycle has finished.</p>
      <table class="table">
        <tr><td>Order ID</td><td>${order.order_id}</td></tr>
        <tr><td>Customer ID</td><td>${order.customer_ref_id}</td></tr>
        <tr><td>Garments Checked</td><td>${order.clothes_count} pieces</td></tr>
        <tr><td>Hostel Residence</td><td>${order.hostel_name}</td></tr>
        <tr><td>Completion Time</td><td>${completedDate}</td></tr>
      </table>
      <p>Please present your Customer ID (<strong>${order.customer_ref_id}</strong>) or Order Token at the counter to collect your clothes.</p>
    </div>
    <div class="footer">
      ${businessName} • Smart Laundry Management for Hostels
    </div>
  </div>
</body>
</html>
    `.trim();

    return { text, html };
  }

  /**
   * Dispatches completion email via configured provider abstraction
   */
  public async sendCompletionEmail(options: SendEmailOptions): Promise<EmailResponse> {
    const { order } = options;
    const settings = dataService.getSettings();
    const activeProvider = options.provider || settings.email_provider || 'mock';

    const recipient = options.recipientEmail || order.email || '';

    const { text, html } = this.generateCompletionEmailBody(order, settings.business_name);
    const subject = options.customSubject || this.generateSubject(order.order_id, settings.business_name);

    let status: NotificationStatus;
    let providerName: string;
    let messageId = '';
    let errorMessage: string | undefined;
    let responsePayload: Record<string, any>;

    if (!recipient) {
      status = 'Failed';
      providerName = activeProvider === 'mock' ? 'Mock Email Simulator' : `${activeProvider} (Not Integrated)`;
      errorMessage = 'Student record has no registered email address. No email was sent.';
      responsePayload = { error: errorMessage };
    } else if (activeProvider === 'mock') {
      await new Promise(resolve => setTimeout(resolve, 600));
      messageId = `EMAIL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      status = 'Mock_Delivered';
      providerName = 'Mock Email Transporter';
      responsePayload = {
        messageId,
        recipient,
        subject,
        provider: 'Mock Email Simulator',
        sentAt: new Date().toISOString(),
        deliveryStatus: 'SIMULATED',
        previewBody: text.substring(0, 150) + '...',
      };
    } else {
      status = 'Failed';
      providerName = `${activeProvider} (Not Integrated)`;
      errorMessage = `The ${activeProvider} email integration is not implemented. No email was sent.`;
      responsePayload = { error: errorMessage };
    }

    // Record notification log
    const log = dataService.recordNotification({
      order_id: order.id,
      order_display_id: order.order_id,
      customer_id: order.customer_id,
      customer_name: order.student_name,
      channel: 'email',
      recipient,
      subject,
      message: text,
      status,
      provider: providerName,
      response_payload: responsePayload,
    });

    // Update order email status
    dataService.updateOrderEmailStatus(order.id, status, providerName);

    return {
      success: status !== 'Failed',
      status,
      provider: providerName,
      messageId,
      recipient: recipient || 'None',
      log,
      responsePayload,
      errorMessage,
    };
  }
}

export const emailService = new EmailService();
