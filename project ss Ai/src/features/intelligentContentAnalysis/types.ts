/**
 * Type definitions for Intelligent Content Analysis module
 * Includes OCR, element detection, accessibility checks, and issue detection
 */

// ============================================================================
// OCR Types
// ============================================================================

export interface OCRResult {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  language: string;
  timestamp: Date;
}

export interface OCROptions {
  languages?: string[];
  timeout?: number;
  preprocessImage?: boolean;
}

// ============================================================================
// Element Detection Types
// ============================================================================

export enum ElementType {
  BUTTON = 'button',
  INPUT = 'input',
  LINK = 'link',
  IMAGE = 'image',
  TEXT = 'text',
  FORM = 'form',
  HEADING = 'heading',
  PARAGRAPH = 'paragraph',
  LIST = 'list',
  TABLE = 'table',
  NAVIGATION = 'navigation',
  UNKNOWN = 'unknown',
}

export interface DetectedElement {
  id: string;
  type: ElementType;
  text?: string;
  boundingBox: BoundingBox;
  confidence: number;
  attributes?: Record<string, string>;
  children?: DetectedElement[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// Accessibility Check Types
// ============================================================================

export enum AccessibilityIssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export interface AccessibilityIssue {
  id: string;
  type: string;
  severity: AccessibilityIssueSeverity;
  message: string;
  element?: DetectedElement;
  recommendation: string;
  wcagLevel?: 'A' | 'AA' | 'AAA';
}

export interface ColorContrast {
  foreground: string;
  background: string;
  ratio: number;
  isCompliant: boolean;
  wcagLevel?: 'AA' | 'AAA';
}

export interface AccessibilityCheckResult {
  id: string;
  issues: AccessibilityIssue[];
  colorContrasts: ColorContrast[];
  score: number; // 0-100
  timestamp: Date;
}

// ============================================================================
// Issue Detection Types
// ============================================================================

export enum IssueType {
  BROKEN_LAYOUT = 'broken_layout',
  MISSING_ELEMENT = 'missing_element',
  OVERLAPPING_ELEMENTS = 'overlapping_elements',
  UNREADABLE_TEXT = 'unreadable_text',
  BROKEN_IMAGE = 'broken_image',
  PERFORMANCE_ISSUE = 'performance_issue',
  SECURITY_ISSUE = 'security_issue',
  USABILITY_ISSUE = 'usability_issue',
}

export interface DetectedIssue {
  id: string;
  type: IssueType;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedElements: DetectedElement[];
  recommendation: string;
  impact: string;
}

export interface IssueDetectionResult {
  id: string;
  issues: DetectedIssue[];
  score: number; // 0-100
  timestamp: Date;
}

// ============================================================================
// Analysis Report Types
// ============================================================================

export interface AnalysisReport {
  id: string;
  imageUrl: string;
  timestamp: Date;
  ocrResults: OCRResult[];
  detectedElements: DetectedElement[];
  accessibilityCheck: AccessibilityCheckResult;
  issueDetection: IssueDetectionResult;
  overallScore: number; // 0-100
  summary: string;
  recommendations: string[];
}

export interface ReportExportOptions {
  format: 'json' | 'html' | 'pdf' | 'csv';
  includeImages?: boolean;
  includeDetails?: boolean;
}

// ============================================================================
// Analysis Options
// ============================================================================

export interface ContentAnalysisOptions {
  enableOCR?: boolean;
  enableElementDetection?: boolean;
  enableAccessibilityCheck?: boolean;
  enableIssueDetection?: boolean;
  ocrOptions?: OCROptions;
  timeout?: number;
}

