/**
 * Baseline Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaselineManager } from '../../src/features/visualRegression/baselineManager';
import { Baseline, BaselineMetadata } from '../../src/features/visualRegression/types';

describe('BaselineManager', () => {
  let manager: BaselineManager;
  const testDir = './test-baselines';

  beforeEach(async () => {
    manager = new BaselineManager(testDir);
    await manager.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should initialize baseline manager', async () => {
    expect(manager).toBeDefined();
  });

  it('should save a baseline', async () => {
    const metadata: BaselineMetadata = {
      id: 'test-baseline-1',
      name: 'Test Baseline',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      width: 1920,
      height: 1080,
      hash: 'abc123',
    };

    const baseline: Baseline = {
      metadata,
      imagePath: '',
      buffer: Buffer.from('test-image-data'),
    };

    await manager.saveBaseline(baseline);

    const loaded = await manager.loadBaseline('test-baseline-1');
    expect(loaded).toBeDefined();
    expect(loaded?.metadata.id).toBe('test-baseline-1');
  });

  it('should load a baseline', async () => {
    const metadata: BaselineMetadata = {
      id: 'test-baseline-2',
      name: 'Test Baseline 2',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      width: 1920,
      height: 1080,
      hash: 'def456',
    };

    const baseline: Baseline = {
      metadata,
      imagePath: '',
      buffer: Buffer.from('test-image-data-2'),
    };

    await manager.saveBaseline(baseline);
    const loaded = await manager.loadBaseline('test-baseline-2');

    expect(loaded).toBeDefined();
    expect(loaded?.buffer?.toString()).toBe('test-image-data-2');
  });

  it('should return null for non-existent baseline', async () => {
    const loaded = await manager.loadBaseline('non-existent');
    expect(loaded).toBeNull();
  });

  it('should get all baselines', async () => {
    const baseline1: Baseline = {
      metadata: {
        id: 'baseline-1',
        name: 'Baseline 1',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        width: 1920,
        height: 1080,
        hash: 'hash1',
      },
      imagePath: '',
      buffer: Buffer.from('data1'),
    };

    const baseline2: Baseline = {
      metadata: {
        id: 'baseline-2',
        name: 'Baseline 2',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        width: 1920,
        height: 1080,
        hash: 'hash2',
      },
      imagePath: '',
      buffer: Buffer.from('data2'),
    };

    await manager.saveBaseline(baseline1);
    await manager.saveBaseline(baseline2);

    const baselines = await manager.getBaselines();
    expect(baselines.length).toBe(2);
  });

  it('should delete a baseline', async () => {
    const metadata: BaselineMetadata = {
      id: 'test-baseline-delete',
      name: 'Test Delete',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      width: 1920,
      height: 1080,
      hash: 'delete-hash',
    };

    const baseline: Baseline = {
      metadata,
      imagePath: '',
      buffer: Buffer.from('delete-data'),
    };

    await manager.saveBaseline(baseline);
    await manager.deleteBaseline('test-baseline-delete');

    const loaded = await manager.loadBaseline('test-baseline-delete');
    expect(loaded).toBeNull();
  });

  it('should update a baseline', async () => {
    const metadata: BaselineMetadata = {
      id: 'test-baseline-update',
      name: 'Test Update',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      width: 1920,
      height: 1080,
      hash: 'update-hash',
    };

    const baseline: Baseline = {
      metadata,
      imagePath: '',
      buffer: Buffer.from('update-data'),
    };

    await manager.saveBaseline(baseline);

    const updated: Baseline = {
      metadata: {
        ...metadata,
        version: 2,
        updatedAt: new Date(),
      },
      imagePath: '',
      buffer: Buffer.from('updated-data'),
    };

    await manager.updateBaseline(updated);

    const loaded = await manager.loadBaseline('test-baseline-update');
    expect(loaded?.metadata.version).toBe(2);
  });

  it('should get baseline history', async () => {
    const metadata: BaselineMetadata = {
      id: 'test-baseline-history',
      name: 'Test History',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      width: 1920,
      height: 1080,
      hash: 'history-hash-1',
    };

    const baseline: Baseline = {
      metadata,
      imagePath: '',
      buffer: Buffer.from('history-data-1'),
    };

    await manager.saveBaseline(baseline);

    const history = await manager.getBaselineHistory('test-baseline-history');
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].id).toBe('test-baseline-history');
  });
});

