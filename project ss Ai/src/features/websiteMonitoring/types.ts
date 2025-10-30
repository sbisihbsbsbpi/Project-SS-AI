/**
 * Type definitions for Website Monitoring & Performance module
 */

// ============================================================================
// Monitoring Types
// ============================================================================

export interface MonitoringConfig {
  url: string;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retries: number;
  enabled: boolean;
  tags?: string[];
}

export interface MonitoringSession {
  id: string;
  url: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'stopped';
  captureCount: number;
  changeCount: number;
}

export interface ScreenshotCapture {
  id: string;
  sessionId: string;
  timestamp: Date;
  imageUrl: string;
  imageData: string | ArrayBuffer;
  width: number;
  height: number;
  fileSize: number;
}

// ============================================================================
// Change Detection Types
// ============================================================================

export interface ChangeDetectionResult {
  id: string;
  previousCaptureId: string;
  currentCaptureId: string;
  timestamp: Date;
  changePercentage: number;
  hasChanges: boolean;
  changedRegions: ChangedRegion[];
  changeType: 'layout' | 'content' | 'style' | 'mixed' | 'none';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
}

export interface ChangedRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  changePercentage: number;
  type: 'added' | 'removed' | 'modified';
}

// ============================================================================
// Performance Types
// ============================================================================

export interface PerformanceMetrics {
  id: string;
  captureId: string;
  timestamp: Date;
  // Lighthouse metrics
  firstContentfulPaint: number; // ms
  largestContentfulPaint: number; // ms
  cumulativeLayoutShift: number;
  timeToInteractive: number; // ms
  totalBlockingTime: number; // ms
  // Custom metrics
  renderTime: number; // ms
  loadTime: number; // ms
  resourceCount: number;
  totalResourceSize: number; // bytes
  performanceScore: number; // 0-100
}

export interface PerformanceReport {
  id: string;
  sessionId: string;
  startTime: Date;
  endTime: Date;
  metrics: PerformanceMetrics[];
  averageScore: number;
  trend: 'improving' | 'degrading' | 'stable';
  recommendations: string[];
}

// ============================================================================
// Notification Types
// ============================================================================

export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  SMS = 'sms',
}

export interface NotificationConfig {
  channel: NotificationChannel;
  enabled: boolean;
  recipients?: string[];
  webhookUrl?: string;
  threshold?: number; // change percentage threshold
}

export interface Notification {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  message: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

// ============================================================================
// History & Reports Types
// ============================================================================

export interface MonitoringHistory {
  id: string;
  sessionId: string;
  captures: ScreenshotCapture[];
  changes: ChangeDetectionResult[];
  metrics: PerformanceMetrics[];
  startTime: Date;
  endTime?: Date;
  totalCaptures: number;
  totalChanges: number;
  averageChangePercentage: number;
}

export interface MonitoringReport {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  generatedAt: Date;
  period: {
    startTime: Date;
    endTime: Date;
  };
  summary: {
    totalCaptures: number;
    totalChanges: number;
    averageChangePercentage: number;
    criticalChanges: number;
    performanceScore: number;
  };
  changes: ChangeDetectionResult[];
  performance: PerformanceMetrics[];
  recommendations: string[];
}

export interface ReportExportOptions {
  format: 'json' | 'html' | 'pdf' | 'csv';
  includeImages?: boolean;
  includeMetrics?: boolean;
  includeRecommendations?: boolean;
}

// ============================================================================
// Alert Types
// ============================================================================

export interface Alert {
  id: string;
  sessionId: string;
  type: 'change' | 'performance' | 'error';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  data?: Record<string, any>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface WebsiteMonitoringOptions {
  enableChangeDetection?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableNotifications?: boolean;
  changeThreshold?: number; // percentage
  performanceThreshold?: number; // score
  captureInterval?: number; // milliseconds
  maxHistorySize?: number; // number of captures to keep
}

