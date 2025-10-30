/**
 * Workflow Builder Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { WorkflowBuilder } from '../../src/features/batchAutomation/workflowBuilder';
import { WorkflowStep } from '../../src/features/batchAutomation/types';

describe('WorkflowBuilder', () => {
  let builder: WorkflowBuilder;
  const testDir = './test-workflows';

  beforeEach(async () => {
    builder = new WorkflowBuilder(testDir);
    await builder.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should create a new workflow', () => {
    const workflow = builder.createWorkflow('Test Workflow', 'Test Description');

    expect(workflow.id).toBeDefined();
    expect(workflow.name).toBe('Test Workflow');
    expect(workflow.description).toBe('Test Description');
    expect(workflow.steps).toEqual([]);
    expect(workflow.enabled).toBe(true);
  });

  it('should add a step to workflow', () => {
    const workflow = builder.createWorkflow('Test Workflow');
    const step: WorkflowStep = {
      id: 'step-1',
      type: 'capture',
      name: 'Capture Screenshot',
      config: { url: 'https://example.com' },
      enabled: true,
    };

    builder.addStep(workflow, step);

    expect(workflow.steps).toHaveLength(1);
    expect(workflow.steps[0].name).toBe('Capture Screenshot');
  });

  it('should remove a step from workflow', () => {
    const workflow = builder.createWorkflow('Test Workflow');
    const step: WorkflowStep = {
      id: 'step-1',
      type: 'capture',
      name: 'Capture Screenshot',
      config: { url: 'https://example.com' },
      enabled: true,
    };

    builder.addStep(workflow, step);
    expect(workflow.steps).toHaveLength(1);

    builder.removeStep(workflow, 'step-1');
    expect(workflow.steps).toHaveLength(0);
  });

  it('should save and load workflow', async () => {
    const workflow = builder.createWorkflow('Test Workflow');
    const step: WorkflowStep = {
      id: 'step-1',
      type: 'transform',
      name: 'Resize Image',
      config: { width: 800, height: 600 },
      enabled: true,
    };

    builder.addStep(workflow, step);
    await builder.saveWorkflow(workflow);

    const loaded = await builder.loadWorkflow(workflow.id);
    expect(loaded).toBeDefined();
    expect(loaded?.name).toBe('Test Workflow');
    expect(loaded?.steps).toHaveLength(1);
  });

  it('should delete workflow', async () => {
    const workflow = builder.createWorkflow('Test Workflow');
    await builder.saveWorkflow(workflow);

    let loaded = await builder.loadWorkflow(workflow.id);
    expect(loaded).toBeDefined();

    await builder.deleteWorkflow(workflow.id);
    loaded = await builder.loadWorkflow(workflow.id);
    expect(loaded).toBeNull();
  });

  it('should list all workflows', async () => {
    const workflow1 = builder.createWorkflow('Workflow 1');
    const workflow2 = builder.createWorkflow('Workflow 2');

    await builder.saveWorkflow(workflow1);
    await builder.saveWorkflow(workflow2);

    const workflows = await builder.listWorkflows();
    expect(workflows).toHaveLength(2);
  });

  it('should validate workflow', () => {
    const workflow = builder.createWorkflow('Test Workflow');

    const errors = builder.validateWorkflow(workflow);
    expect(errors).toContain('Workflow must have at least one step');

    const step: WorkflowStep = {
      id: 'step-1',
      type: 'capture',
      name: 'Capture',
      config: {},
      enabled: true,
    };

    builder.addStep(workflow, step);
    const validationErrors = builder.validateWorkflow(workflow);
    expect(validationErrors).toHaveLength(0);
  });

  it('should reject invalid step type', () => {
    const workflow = builder.createWorkflow('Test Workflow');
    const step: any = {
      id: 'step-1',
      type: 'invalid',
      name: 'Invalid Step',
      config: {},
      enabled: true,
    };

    expect(() => builder.addStep(workflow, step)).toThrow();
  });

  it('should reject step without name', () => {
    const workflow = builder.createWorkflow('Test Workflow');
    const step: any = {
      id: 'step-1',
      type: 'capture',
      name: '',
      config: {},
      enabled: true,
    };

    expect(() => builder.addStep(workflow, step)).toThrow();
  });

  it('should generate unique IDs for steps', () => {
    const workflow = builder.createWorkflow('Test Workflow');
    const step1: WorkflowStep = {
      type: 'capture',
      name: 'Step 1',
      config: {},
      enabled: true,
    } as any;

    const step2: WorkflowStep = {
      type: 'transform',
      name: 'Step 2',
      config: {},
      enabled: true,
    } as any;

    builder.addStep(workflow, step1);
    builder.addStep(workflow, step2);

    expect(workflow.steps[0].id).not.toBe(workflow.steps[1].id);
  });

  it('should update workflow timestamp on modification', async () => {
    const workflow = builder.createWorkflow('Test Workflow');
    const originalTime = workflow.updatedAt.getTime();

    // Wait a bit to ensure time difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const step: WorkflowStep = {
      id: 'step-1',
      type: 'capture',
      name: 'Capture',
      config: {},
      enabled: true,
    };

    builder.addStep(workflow, step);
    expect(workflow.updatedAt.getTime()).toBeGreaterThanOrEqual(originalTime);
  });
});
