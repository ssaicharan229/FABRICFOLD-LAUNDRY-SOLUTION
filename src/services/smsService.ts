import { LaundryOrder, SMSLog, SMSStatus } from '../types';
import { dataService } from './dataService';

export interface SendSMSOptions {
  order: LaundryOrder;
  provider?: string;
  customMessage?: string;
  isMock?: boolean;
}

export interface SMSResponse {
  success: boolean;
  status: SMSStatus;
  provider: string;
  messageId: string;
  log: SMSLog;
  responsePayload: Record<string, any>;
  errorMessage?: string;
}

class SMSService {
  /**
   * Generates standard message according to prompt specification
   */
  public generateCompletionMessage(studentName: string, customerId: string, businessName = 'FABRICFOLD LAUNDRY SOLUTION'): string {
    return `Dear ${studentName}, your laundry washing has been completed. Please collect your clothes from ${businessName}. Customer ID: ${customerId}. Thank you.`;
  }

  /**
   * Sends or simulates SMS delivery
   */
  public async sendCompletionSMS(options: SendSMSOptions): Promise<SMSResponse> {
    const { order, customMessage } = options;
    const settings = dataService.getSettings();
    const activeProvider = options.provider || settings.sms_provider || 'mock';

    const message = customMessage || this.generateCompletionMessage(
      order.student_name,
      order.customer_ref_id,
      settings.business_name
    );

    let status: SMSStatus;
    let providerName: string;
    let messageId = '';
    let errorMessage: string | undefined;
    let responsePayload: Record<string, any>;

    if (activeProvider === 'mock') {
      await new Promise(resolve => setTimeout(resolve, 800));
      messageId = `SMS-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      status = 'Mock_Delivered';
      providerName = 'Mock Service (Sandbox)';
      responsePayload = {
        messageId,
        recipient: order.mobile,
        provider: 'Mock Simulator',
        sentAt: new Date().toISOString(),
        deliveryStatus: 'SIMULATED',
        simulatedLatencyMs: 800,
      };
    } else {
      status = 'Failed';
      providerName = `${activeProvider} (Not Integrated)`;
      errorMessage = `The ${activeProvider} SMS integration is not implemented. No SMS was sent.`;
      responsePayload = { error: errorMessage };
    }

    // Record to persistent SMS logs and update order
    const log = dataService.recordSMS({
      order_id: order.id,
      order_display_id: order.order_id,
      customer_id: order.customer_id,
      customer_name: order.student_name,
      mobile: order.mobile,
      message,
      status,
      provider: providerName,
      response_payload: responsePayload,
    });

    return {
      success: status !== 'Failed',
      status,
      provider: providerName,
      messageId,
      log,
      responsePayload,
      errorMessage,
    };
  }

  /**
   * Helper to format mobile number for WhatsApp or direct tel
   */
  public getWhatsAppUrl(mobile: string, message: string): string {
    const cleanNumber = mobile.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(message);
    return `https://wa.me/${cleanNumber}?text=${encoded}`;
  }
}

export const smsService = new SMSService();
