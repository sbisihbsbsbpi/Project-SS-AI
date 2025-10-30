/**
 * Type definitions for Responsive Design Testing module
 */

// ============================================================================
// Viewport Types
// ============================================================================

export interface Viewport {
  name: string;
  width: number;
  height: number;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'custom';
  pixelRatio?: number;
}

export const COMMON_VIEWPORTS: Record<string, Viewport> = {
  MOBILE_SMALL: { name: 'Mobile Small', width: 320, height: 568, deviceType: 'mobile' },
  MOBILE_MEDIUM: { name: 'Mobile Medium', width: 375, height: 667, deviceType: 'mobile' },
  MOBILE_LARGE: { name: 'Mobile Large', width: 414, height: 896, deviceType: 'mobile' },
  TABLET_PORTRAIT: { name: 'Tablet Portrait', width: 768, height: 1024, deviceType: 'tablet' },
  TABLET_LANDSCAPE: { name: 'Tablet Landscape', width: 1024, height: 768, deviceType: 'tablet' },
  DESKTOP_SMALL: { name: 'Desktop Small', width: 1280, height: 720, deviceType: 'desktop' },
  DESKTOP_MEDIUM: { name: 'Desktop Medium', width: 1366, height: 768, deviceType: 'desktop' },
  DESKTOP_LARGE: { name: 'Desktop Large', width: 1920, height: 1080, deviceType: 'desktop' },
};

// ============================================================================
// Multi-Viewport Capture Types
// ============================================================================

export interface ViewportCapture {
  id: string;
  url: string;
  viewport: Viewport;
  timestamp: Date;
  imageUrl: string;
  imageData: string | ArrayBuffer;
  fileSize: number;
  renderTime: number; // milliseconds
}

export interface MultiViewportCapture {
  id: string;
  url: string;
  timestamp: Date;
  captures: ViewportCapture[];
  totalTime: number; // milliseconds
}

// ============================================================================
// Comparison Types
// ============================================================================

export interface ResponsiveIssue {
  id: string;
  type: 'layout' | 'overflow' | 'text' | 'image' | 'spacing' | 'alignment';
  severity: 'critical' | 'high' | 'medium' | 'low';
  viewport: Viewport;
  description: string;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  recommendation: string;
}

export interface ViewportComparison {
  id: string;
  viewport1: Viewport;
  viewport2: Viewport;
  capture1: ViewportCapture;
  capture2: ViewportCapture;
  timestamp: Date;
  differences: number; // percentage
  issues: ResponsiveIssue[];
  isResponsive: boolean;
}

export interface ResponsiveDesignReport {
  id: string;
  url: string;
  generatedAt: Date;
  captures: MultiViewportCapture;
  comparisons: ViewportComparison[];
  issues: ResponsiveIssue[];
  responsiveScore: number; // 0-100
  summary: string;
  recommendations: string[];
  breakpoints: Viewport[];
}

// ============================================================================
// Visualization Types
// ============================================================================

export interface ComparisonVisualization {
  id: string;
  comparisonId: string;
  format: 'side-by-side' | 'overlay' | 'diff' | 'slider';
  imageUrl: string;
  imageData: string | ArrayBuffer;
  generatedAt: Date;
}

export interface ResponsiveVisualization {
  id: string;
  reportId: string;
  format: 'grid' | 'carousel' | 'timeline';
  imageUrl: string;
  imageData: string | ArrayBuffer;
  generatedAt: Date;
}

// ============================================================================
// Report Export Types
// ============================================================================

export interface ResponsiveReportExportOptions {
  format: 'json' | 'html' | 'pdf' | 'csv';
  includeImages?: boolean;
  includeComparisons?: boolean;
  includeRecommendations?: boolean;
  includeVisualizations?: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ResponsiveDesignTestingOptions {
  viewports?: Viewport[];
  enableComparison?: boolean;
  enableVisualization?: boolean;
  issueThreshold?: number; // percentage
  breakpointDetection?: boolean;
  maxCaptureTime?: number; // milliseconds
}

export interface ResponsiveTestingConfig {
  url: string;
  viewports: Viewport[];
  timeout: number;
  retries: number;
  options?: ResponsiveDesignTestingOptions;
}

