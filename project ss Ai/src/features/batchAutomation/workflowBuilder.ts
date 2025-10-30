/**
 * Workflow Builder
 * Manages workflow creation, modification, and persistence
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger';
import {
  Workflow,
  WorkflowStep,
  IWorkflowBuilder,
} from './types';

export class WorkflowBuilder implements IWorkflowBuilder {
  private workflowDir: string;
  private workflows: Map<string, Workflow> = new Map();

  constructor(workflowDir: string = './workflows') {
    this.workflowDir = workflowDir;
  }

  /**
   * Initialize workflow builder
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.workflowDir, { recursive: true });
      await this.loadAllWorkflows();
      Logger.info(`WorkflowBuilder initialized with ${this.workflows.size} workflows`);
    } catch (error) {
      Logger.error('Failed to initialize WorkflowBuilder', error);
      throw error;
    }
  }

  /**
   * Create a new workflow
   */
  createWorkflow(name: string, description?: string): Workflow {
    const workflow: Workflow = {
      id: uuidv4(),
      name,
      description,
      steps: [],
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      metadata: {},
    };

    Logger.debug(`Created workflow: ${workflow.id} - ${name}`);
    return workflow;
  }

  /**
   * Add step to workflow
   */
  addStep(workflow: Workflow, step: WorkflowStep): void {
    if (!step.id) {
      step.id = uuidv4();
    }

    // Validate step
    this.validateStep(step);

    workflow.steps.push(step);
    workflow.updatedAt = new Date();

    Logger.debug(`Added step ${step.id} to workflow ${workflow.id}`);
  }

  /**
   * Remove step from workflow
   */
  removeStep(workflow: Workflow, stepId: string): void {
    const index = workflow.steps.findIndex(s => s.id === stepId);
    if (index === -1) {
      throw new Error(`Step ${stepId} not found in workflow`);
    }

    workflow.steps.splice(index, 1);
    workflow.updatedAt = new Date();

    Logger.debug(`Removed step ${stepId} from workflow ${workflow.id}`);
  }

  /**
   * Save workflow to disk
   */
  async saveWorkflow(workflow: Workflow): Promise<void> {
    try {
      const filePath = path.join(this.workflowDir, `${workflow.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
      this.workflows.set(workflow.id, workflow);

      Logger.info(`Saved workflow: ${workflow.id}`);
    } catch (error) {
      Logger.error(`Failed to save workflow ${workflow.id}`, error);
      throw error;
    }
  }

  /**
   * Load workflow from disk
   */
  async loadWorkflow(id: string): Promise<Workflow | null> {
    try {
      if (this.workflows.has(id)) {
        return this.workflows.get(id)!;
      }

      const filePath = path.join(this.workflowDir, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      const workflow = JSON.parse(data) as Workflow;

      // Convert date strings to Date objects
      workflow.createdAt = new Date(workflow.createdAt);
      workflow.updatedAt = new Date(workflow.updatedAt);

      this.workflows.set(id, workflow);
      return workflow;
    } catch (error) {
      Logger.warn(`Workflow ${id} not found`);
      return null;
    }
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string): Promise<void> {
    try {
      const filePath = path.join(this.workflowDir, `${id}.json`);
      await fs.unlink(filePath);
      this.workflows.delete(id);

      Logger.info(`Deleted workflow: ${id}`);
    } catch (error) {
      Logger.error(`Failed to delete workflow ${id}`, error);
      throw error;
    }
  }

  /**
   * List all workflows
   */
  async listWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  /**
   * Load all workflows from disk
   */
  private async loadAllWorkflows(): Promise<void> {
    try {
      const files = await fs.readdir(this.workflowDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      for (const file of jsonFiles) {
        const filePath = path.join(this.workflowDir, file);
        const data = await fs.readFile(filePath, 'utf-8');
        const workflow = JSON.parse(data) as Workflow;

        workflow.createdAt = new Date(workflow.createdAt);
        workflow.updatedAt = new Date(workflow.updatedAt);

        this.workflows.set(workflow.id, workflow);
      }

      Logger.debug(`Loaded ${this.workflows.size} workflows`);
    } catch (error) {
      Logger.warn('No workflows found or error loading workflows');
    }
  }

  /**
   * Validate workflow step
   */
  private validateStep(step: WorkflowStep): void {
    const validTypes = ['capture', 'transform', 'compare', 'export'];
    if (!validTypes.includes(step.type)) {
      throw new Error(`Invalid step type: ${step.type}`);
    }

    if (!step.name || step.name.trim() === '') {
      throw new Error('Step name is required');
    }

    if (!step.config || typeof step.config !== 'object') {
      throw new Error('Step config must be an object');
    }
  }

  /**
   * Validate workflow
   */
  validateWorkflow(workflow: Workflow): string[] {
    const errors: string[] = [];

    if (!workflow.name || workflow.name.trim() === '') {
      errors.push('Workflow name is required');
    }

    if (workflow.steps.length === 0) {
      errors.push('Workflow must have at least one step');
    }

    workflow.steps.forEach((step, index) => {
      try {
        this.validateStep(step);
      } catch (error) {
        errors.push(`Step ${index}: ${(error as Error).message}`);
      }
    });

    return errors;
  }
}

