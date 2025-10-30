/**
 * Notification Manager - Send notifications via email, Slack, webhooks
 */

import { v4 as uuidv4 } from "uuid";
import { AppError, ErrorSeverity } from "../../utils/errorHandler";
import { validateString } from "../../utils/validation";
import {
  Notification,
  NotificationChannel,
  NotificationConfig,
  ChangeDetectionResult,
  PerformanceMetrics,
} from "./types";

export class NotificationManager {
  private notifications: Map<string, Notification> = new Map();
  private configs: Map<NotificationChannel, NotificationConfig> = new Map();

  /**
   * Configure notification channel
   */
  configureChannel(config: NotificationConfig): void {
    try {
      this.configs.set(config.channel, config);
    } catch (error) {
      throw new AppError(
        "CONFIG_FAILED",
        `Failed to configure notification channel: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Send change notification
   */
  sendChangeNotification(
    change: ChangeDetectionResult,
    recipient: string
  ): Notification {
    try {
      validateString(recipient, "recipient");

      const notification: Notification = {
        id: uuidv4(),
        channel: NotificationChannel.EMAIL,
        recipient,
        subject: `Website Change Detected - ${change.severity.toUpperCase()}`,
        message: `A ${
          change.severity
        } change has been detected (${change.changePercentage.toFixed(
          2
        )}% changed)`,
        timestamp: new Date(),
        status: "pending",
      };

      this.notifications.set(notification.id, notification);
      this.sendNotification(notification);

      return notification;
    } catch (error) {
      throw new AppError(
        "NOTIFICATION_FAILED",
        `Failed to send change notification: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Send performance notification
   */
  sendPerformanceNotification(
    metrics: PerformanceMetrics,
    recipient: string
  ): Notification {
    try {
      validateString(recipient, "recipient");

      const notification: Notification = {
        id: uuidv4(),
        channel: NotificationChannel.EMAIL,
        recipient,
        subject: `Performance Alert - Score: ${metrics.performanceScore}`,
        message: `Performance score is ${metrics.performanceScore}/100. FCP: ${metrics.firstContentfulPaint}ms, LCP: ${metrics.largestContentfulPaint}ms`,
        timestamp: new Date(),
        status: "pending",
      };

      this.notifications.set(notification.id, notification);
      this.sendNotification(notification);

      return notification;
    } catch (error) {
      throw new AppError(
        "NOTIFICATION_FAILED",
        `Failed to send performance notification: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Send notification via channel
   */
  private sendNotification(notification: Notification): void {
    try {
      const config = this.configs.get(notification.channel);

      if (!config || !config.enabled) {
        notification.status = "failed";
        notification.error = "Channel not configured or disabled";
        return;
      }

      // Simulate sending notification
      const success = Math.random() > 0.1; // 90% success rate

      if (success) {
        notification.status = "sent";
      } else {
        notification.status = "failed";
        notification.error = "Failed to send notification";
      }
    } catch (error) {
      notification.status = "failed";
      notification.error = (error as Error).message;
    }
  }

  /**
   * Send email notification
   */
  async sendEmail(
    recipient: string,
    subject: string,
    message: string
  ): Promise<Notification> {
    try {
      validateString(recipient, "recipient");
      validateString(subject, "subject");
      validateString(message, "message");

      const notification: Notification = {
        id: uuidv4(),
        channel: NotificationChannel.EMAIL,
        recipient,
        subject,
        message,
        timestamp: new Date(),
        status: "pending",
      };

      this.notifications.set(notification.id, notification);
      this.sendNotification(notification);

      return notification;
    } catch (error) {
      throw new AppError(
        "EMAIL_FAILED",
        `Failed to send email: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Send Slack notification
   */
  async sendSlack(webhookUrl: string, message: string): Promise<Notification> {
    try {
      validateString(webhookUrl, "webhookUrl");
      validateString(message, "message");

      const notification: Notification = {
        id: uuidv4(),
        channel: NotificationChannel.SLACK,
        recipient: webhookUrl,
        subject: "Slack Notification",
        message,
        timestamp: new Date(),
        status: "pending",
      };

      this.notifications.set(notification.id, notification);
      this.sendNotification(notification);

      return notification;
    } catch (error) {
      throw new AppError(
        "SLACK_FAILED",
        `Failed to send Slack notification: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhook(
    webhookUrl: string,
    data: Record<string, any>
  ): Promise<Notification> {
    try {
      validateString(webhookUrl, "webhookUrl");

      const notification: Notification = {
        id: uuidv4(),
        channel: NotificationChannel.WEBHOOK,
        recipient: webhookUrl,
        subject: "Webhook Notification",
        message: JSON.stringify(data),
        timestamp: new Date(),
        status: "pending",
      };

      this.notifications.set(notification.id, notification);
      this.sendNotification(notification);

      return notification;
    } catch (error) {
      throw new AppError(
        "WEBHOOK_FAILED",
        `Failed to send webhook notification: ${(error as Error).message}`,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Get notification
   */
  getNotification(notificationId: string): Notification | undefined {
    return this.notifications.get(notificationId);
  }

  /**
   * Get all notifications
   */
  getAllNotifications(): Notification[] {
    return Array.from(this.notifications.values());
  }

  /**
   * Get notifications by status
   */
  getNotificationsByStatus(
    status: "pending" | "sent" | "failed"
  ): Notification[] {
    return Array.from(this.notifications.values()).filter(
      (n) => n.status === status
    );
  }

  /**
   * Clear notifications
   */
  clearNotifications(): void {
    this.notifications.clear();
  }
}
