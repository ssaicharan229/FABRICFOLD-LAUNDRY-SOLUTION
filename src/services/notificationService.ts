import { LaundryOrder, NotificationChannel, NotificationLog, NotificationStatus } from '../types';
import { smsService } from './smsService';
import { emailService } from './emailService';
import { dataService } from './dataService';

export interface DispatchResult {
  channel: NotificationChannel;
  success: boolean;
  status: NotificationStatus;
  provider: string;
  recipient: string;
  error?: string;
}

export interface MultiChannelNotificationResult {
  orderId: string;
  dispatchedChannels: DispatchResult[];
  overallSummary: string;
}

class NotificationService {
  /**
   * Automatically dispatches wash completion notification to student
   * via SMS, Email, or Both depending on configuration and availability.
   */
  public async notifyWashCompletion(order: LaundryOrder): Promise<MultiChannelNotificationResult> {
    const settings = dataService.getSettings();
    const channelsMode = settings.notification_channels || 'both';
    const results: DispatchResult[] = [];

    const shouldSendSMS = (channelsMode === 'both' || channelsMode === 'sms') && settings.sms_provider !== 'none';
    const shouldSendEmail = (channelsMode === 'both' || channelsMode === 'email') && settings.email_provider !== 'none';

    // 1. Dispatch SMS if configured
    if (shouldSendSMS) {
      try {
        const smsRes = await smsService.sendCompletionSMS({
          order,
          provider: settings.sms_provider,
        });
        results.push({
          channel: 'sms',
          success: smsRes.success,
          status: smsRes.status as NotificationStatus,
          provider: smsRes.provider,
          recipient: order.mobile,
          error: smsRes.errorMessage,
        });
      } catch (err: any) {
        results.push({
          channel: 'sms',
          success: false,
          status: 'Failed',
          provider: settings.sms_provider || 'SMS Gateway',
          recipient: order.mobile,
          error: err?.message || 'SMS dispatch failed',
        });
      }
    }

    // 2. Dispatch Email if configured
    if (shouldSendEmail) {
      try {
        const emailRes = await emailService.sendCompletionEmail({
          order,
          provider: settings.email_provider,
        });
        results.push({
          channel: 'email',
          success: emailRes.success,
          status: emailRes.status,
          provider: emailRes.provider,
          recipient: emailRes.recipient,
          error: emailRes.errorMessage,
        });
      } catch (err: any) {
        results.push({
          channel: 'email',
          success: false,
          status: 'Failed',
          provider: settings.email_provider || 'Email Gateway',
          recipient: order.email || 'None',
          error: err?.message || 'Email dispatch failed',
        });
      }
    }

    // If neither channel was configured
    if (results.length === 0) {
      results.push({
        channel: 'sms',
        success: false,
        status: 'Failed',
        provider: 'None Configured',
        recipient: order.mobile,
        error: 'Neither SMS nor Email provider is configured. Notifications were not sent.',
      });
    }

    const successfulChannels = results.filter(r => r.success).map(r => r.channel.toUpperCase());
    const overallSummary = successfulChannels.length > 0
      ? `Test notification recorded for ${order.student_name} via ${successfulChannels.join(' & ')}. No real message was sent.`
      : `Unable to dispatch automatic notification: ${results[0]?.error || 'Check configuration'}`;

    return {
      orderId: order.order_id,
      dispatchedChannels: results,
      overallSummary,
    };
  }
}

export const notificationService = new NotificationService();
