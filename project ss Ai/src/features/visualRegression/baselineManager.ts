/**
 * Baseline Manager
 * Manages baseline images with versioning and metadata tracking
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';
import { Logger } from '../../utils/logger';
import { Baseline, BaselineMetadata, IBaselineManager } from './types';

export class BaselineManager implements IBaselineManager {
  private baselineDir: string;
  private metadataFile: string;
  private metadata: Map<string, BaselineMetadata[]> = new Map();

  constructor(baselineDir: string = './baselines') {
    this.baselineDir = baselineDir;
    this.metadataFile = path.join(baselineDir, 'metadata.json');
  }

  /**
   * Initialize the baseline manager
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.baselineDir, { recursive: true });
      await this.loadMetadata();
      Logger.info('BaselineManager initialized', { baselineDir: this.baselineDir });
    } catch (error) {
      Logger.error('Failed to initialize BaselineManager', error);
      throw error;
    }
  }

  /**
   * Save a baseline image with metadata
   */
  async saveBaseline(baseline: Baseline): Promise<void> {
    try {
      const { metadata, imagePath, buffer } = baseline;

      // Create baseline directory
      const baselineIdDir = path.join(this.baselineDir, metadata.id);
      await fs.mkdir(baselineIdDir, { recursive: true });

      // Save image file
      const imageFileName = `v${metadata.version}.png`;
      const imageFilePath = path.join(baselineIdDir, imageFileName);

      if (buffer) {
        await fs.writeFile(imageFilePath, buffer);
      } else if (imagePath) {
        const imageData = await fs.readFile(imagePath);
        await fs.writeFile(imageFilePath, imageData);
      }

      // Update metadata
      if (!this.metadata.has(metadata.id)) {
        this.metadata.set(metadata.id, []);
      }
      const versions = this.metadata.get(metadata.id)!;
      versions.push(metadata);
      versions.sort((a, b) => b.version - a.version);

      // Save metadata
      await this.saveMetadata();

      Logger.info('Baseline saved', {
        id: metadata.id,
        version: metadata.version,
        path: imageFilePath,
      });
    } catch (error) {
      Logger.error('Failed to save baseline', error);
      throw error;
    }
  }

  /**
   * Load a baseline image
   */
  async loadBaseline(id: string): Promise<Baseline | null> {
    try {
      const versions = this.metadata.get(id);
      if (!versions || versions.length === 0) {
        return null;
      }

      const latestMetadata = versions[0];
      const imageFileName = `v${latestMetadata.version}.png`;
      const imagePath = path.join(this.baselineDir, id, imageFileName);

      const buffer = await fs.readFile(imagePath);

      return {
        metadata: latestMetadata,
        imagePath,
        buffer,
      };
    } catch (error) {
      Logger.error('Failed to load baseline', error);
      return null;
    }
  }

  /**
   * Get all baselines
   */
  async getBaselines(): Promise<Baseline[]> {
    try {
      const baselines: Baseline[] = [];

      for (const [id] of this.metadata) {
        const baseline = await this.loadBaseline(id);
        if (baseline) {
          baselines.push(baseline);
        }
      }

      return baselines;
    } catch (error) {
      Logger.error('Failed to get baselines', error);
      return [];
    }
  }

  /**
   * Delete a baseline
   */
  async deleteBaseline(id: string): Promise<void> {
    try {
      const baselineIdDir = path.join(this.baselineDir, id);
      await fs.rm(baselineIdDir, { recursive: true, force: true });
      this.metadata.delete(id);
      await this.saveMetadata();

      Logger.info('Baseline deleted', { id });
    } catch (error) {
      Logger.error('Failed to delete baseline', error);
      throw error;
    }
  }

  /**
   * Update a baseline
   */
  async updateBaseline(baseline: Baseline): Promise<void> {
    baseline.metadata.updatedAt = new Date();
    await this.saveBaseline(baseline);
  }

  /**
   * Get baseline version history
   */
  async getBaselineHistory(id: string): Promise<BaselineMetadata[]> {
    return this.metadata.get(id) || [];
  }

  /**
   * Load metadata from file
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await fs.readFile(this.metadataFile, 'utf-8');
      const parsed = JSON.parse(data);

      for (const [id, versions] of Object.entries(parsed)) {
        this.metadata.set(
          id,
          (versions as any[]).map((v) => ({
            ...v,
            createdAt: new Date(v.createdAt),
            updatedAt: new Date(v.updatedAt),
          }))
        );
      }
    } catch (error) {
      // Metadata file doesn't exist yet, which is fine
      Logger.debug('Metadata file not found, starting fresh');
    }
  }

  /**
   * Save metadata to file
   */
  private async saveMetadata(): Promise<void> {
    try {
      const data: Record<string, BaselineMetadata[]> = {};

      for (const [id, versions] of this.metadata) {
        data[id] = versions;
      }

      await fs.writeFile(this.metadataFile, JSON.stringify(data, null, 2));
    } catch (error) {
      Logger.error('Failed to save metadata', error);
      throw error;
    }
  }
}

