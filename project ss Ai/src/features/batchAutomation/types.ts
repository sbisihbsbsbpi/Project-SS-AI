/**
 * Batch Automation Types and Interfaces
 */

// Workflow Types
export interface WorkflowStep {
  id: string;
  type: "capture" | "transform" | "compare" | "export";
  name: string;
  description?: string;
  config: Record<string, any>;
  enabled: boolean;
  retryCount?: number;
  timeout?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startTime?: Date;
  endTime?: Date;
  progress: number;
  results: ExecutionResult[];
  error?: string;
  logs: string[];
}

export interface ExecutionResult {
  stepId: string;
  stepName: string;
  status: "success" | "failed" | "skipped";
  duration: number;
  output?: any;
  error?: string;
}

// Batch Processing Types
export interface BatchJob {
  id: string;
  workflowId: string;
  items: BatchItem[];
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  results: BatchResult[];
  parallelism: number;
}

export interface BatchItem {
  id: string;
  url: string;
  metadata?: Record<string, any>;
  status: "pending" | "processing" | "completed" | "failed";
  result?: any;
  error?: string;
}

export interface BatchResult {
  itemId: string;
  status: "success" | "failed";
  output?: any;
  error?: string;
  duration: number;
}

// Transformation Types
export interface TransformationConfig {
  type: "crop" | "resize" | "filter" | "rotate" | "compress";
  options: Record<string, any>;
}

export interface CropConfig extends TransformationConfig {
  type: "crop";
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ResizeConfig extends TransformationConfig {
  type: "resize";
  options: {
    width: number;
    height: number;
    fit?: "cover" | "contain" | "fill" | "inside" | "outside";
  };
}

export interface FilterConfig extends TransformationConfig {
  type: "filter";
  options: {
    name:
      | "grayscale"
      | "sepia"
      | "blur"
      | "sharpen"
      | "brightness"
      | "contrast";
    value?: number;
  };
}

// Report Types
export interface BatchReport {
  id: string;
  jobId: string;
  title: string;
  summary: ReportSummary;
  items: ReportItem[];
  generatedAt: Date;
  exportFormats: ("json" | "pdf" | "html" | "csv")[];
}

export interface ReportSummary {
  totalItems: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalDuration: number;
  averageDuration: number;
}

export interface ReportItem {
  itemId: string;
  url: string;
  status: "success" | "failed";
  duration: number;
  output?: any;
  error?: string;
}

// Scheduling Types
export interface ScheduleConfig {
  type: "once" | "recurring";
  cronExpression?: string;
  timezone?: string;
  nextRun?: Date;
  lastRun?: Date;
}

export interface ScheduledJob {
  id: string;
  workflowId: string;
  schedule: ScheduleConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastExecutionId?: string;
  executionHistory: string[];
}

// Queue Types
export interface QueueItem<T = any> {
  id: string;
  data: T;
  priority: number;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export interface QueueStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  totalProcessed: number;
  averageProcessingTime: number;
}

// Interfaces for implementations
export interface IWorkflowBuilder {
  createWorkflow(name: string, description?: string): Workflow;
  addStep(workflow: Workflow, step: WorkflowStep): void;
  removeStep(workflow: Workflow, stepId: string): void;
  saveWorkflow(workflow: Workflow): Promise<void>;
  loadWorkflow(id: string): Promise<Workflow | null>;
  deleteWorkflow(id: string): Promise<void>;
  listWorkflows(): Promise<Workflow[]>;
}

export interface JobStats {
  totalItems: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalDuration: number;
  averageDuration: number;
  progress: number;
}

export interface IBatchProcessor {
  createJob(workflowId: string, items: BatchItem[]): BatchJob;
  processJob(job: BatchJob): Promise<void>;
  getJobStatus(jobId: string): Promise<BatchJob | null>;
  cancelJob(jobId: string): Promise<void>;
  getJobResults(jobId: string): Promise<BatchResult[]>;
  getJobStats(jobId: string): JobStats | null;
  cleanupJob(jobId: string): Promise<void>;
  shutdown(): Promise<void>;
}

export interface ITransformationEngine {
  crop(buffer: Buffer, config: CropConfig): Promise<Buffer>;
  resize(buffer: Buffer, config: ResizeConfig): Promise<Buffer>;
  filter(buffer: Buffer, config: FilterConfig): Promise<Buffer>;
  rotate(buffer: Buffer, angle: number): Promise<Buffer>;
  compress(buffer: Buffer, quality: number): Promise<Buffer>;
}

export interface IReportGenerator {
  generateReport(job: BatchJob): Promise<BatchReport>;
  exportJSON(report: BatchReport): Promise<string>;
  exportPDF(report: BatchReport): Promise<Buffer>;
  exportHTML(report: BatchReport): Promise<string>;
  exportCSV(report: BatchReport): Promise<string>;
}

export interface IScheduler {
  scheduleJob(
    workflowId: string,
    schedule: ScheduleConfig
  ): Promise<ScheduledJob>;
  unscheduleJob(jobId: string): Promise<void>;
  getScheduledJobs(): Promise<ScheduledJob[]>;
  executeScheduledJob(jobId: string): Promise<WorkflowExecution>;
}
