/**
 * Version History Manager
 * Tracks file versions and enables rollback
 */

import { v4 as uuid } from "uuid";
import { Logger } from "../../utils/logger";
import {
  FileVersion,
  VersionHistory as IVersionHistory,
  VersionDiff,
  Change,
} from "./types";

export class VersionHistory {
  private histories: Map<string, IVersionHistory> = new Map();

  constructor() {
    Logger.initialize();
  }

  /**
   * Create new version
   */
  async createVersion(
    fileId: string,
    fileName: string,
    size: number,
    createdBy: string,
    changeDescription?: string
  ): Promise<FileVersion> {
    Logger.info(`Creating new version for file ${fileId}`);

    const versionId = uuid();
    const version: FileVersion = {
      versionId,
      fileId,
      fileName,
      size,
      createdAt: new Date(),
      createdBy,
      changeDescription,
      isCurrentVersion: true,
    };

    let history = this.histories.get(fileId);
    if (!history) {
      history = {
        fileId,
        fileName,
        versions: [],
        currentVersionId: versionId,
      };
    }

    // Mark previous version as not current
    history.versions.forEach((v) => (v.isCurrentVersion = false));

    history.versions.push(version);
    history.currentVersionId = versionId;
    this.histories.set(fileId, history);

    Logger.info(`Version created: ${versionId}`);
    return version;
  }

  /**
   * Get version history
   */
  async getVersionHistory(fileId: string): Promise<IVersionHistory | null> {
    return this.histories.get(fileId) || null;
  }

  /**
   * Get specific version
   */
  async getVersion(
    fileId: string,
    versionId: string
  ): Promise<FileVersion | null> {
    const history = this.histories.get(fileId);
    if (!history) return null;

    return history.versions.find((v) => v.versionId === versionId) || null;
  }

  /**
   * List all versions
   */
  async listVersions(fileId: string): Promise<FileVersion[]> {
    const history = this.histories.get(fileId);
    if (!history) return [];

    return history.versions.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Rollback to version
   */
  async rollbackToVersion(
    fileId: string,
    versionId: string
  ): Promise<FileVersion> {
    Logger.info(`Rolling back file ${fileId} to version ${versionId}`);

    const history = this.histories.get(fileId);
    if (!history) {
      throw new Error(`File ${fileId} not found`);
    }

    const version = history.versions.find((v) => v.versionId === versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    // Create new version from rollback
    const newVersion: FileVersion = {
      versionId: uuid(),
      fileId,
      fileName: version.fileName,
      size: version.size,
      createdAt: new Date(),
      createdBy: version.createdBy,
      changeDescription: `Rolled back to version ${versionId}`,
      isCurrentVersion: true,
    };

    history.versions.forEach((v) => (v.isCurrentVersion = false));
    history.versions.push(newVersion);
    history.currentVersionId = newVersion.versionId;

    Logger.info(`Rolled back to version ${versionId}`);
    return newVersion;
  }

  /**
   * Compare two versions
   */
  async compareVersions(
    fileId: string,
    versionId1: string,
    versionId2: string
  ): Promise<VersionDiff> {
    Logger.info(`Comparing versions ${versionId1} and ${versionId2}`);

    const history = this.histories.get(fileId);
    if (!history) {
      throw new Error(`File ${fileId} not found`);
    }

    const version1 = history.versions.find((v) => v.versionId === versionId1);
    const version2 = history.versions.find((v) => v.versionId === versionId2);

    if (!version1 || !version2) {
      throw new Error("One or both versions not found");
    }

    const changes: Change[] = [];

    // Compare size
    if (version1.size !== version2.size) {
      changes.push({
        type: "modified",
        field: "size",
        oldValue: version1.size,
        newValue: version2.size,
      });
    }

    // Compare description
    if (version1.changeDescription !== version2.changeDescription) {
      changes.push({
        type: "modified",
        field: "changeDescription",
        oldValue: version1.changeDescription,
        newValue: version2.changeDescription,
      });
    }

    const diff: VersionDiff = {
      versionId1,
      versionId2,
      changes,
    };

    Logger.info(`Found ${changes.length} differences`);
    return diff;
  }

  /**
   * Delete version
   */
  async deleteVersion(fileId: string, versionId: string): Promise<void> {
    Logger.info(`Deleting version ${versionId}`);

    const history = this.histories.get(fileId);
    if (!history) {
      throw new Error(`File ${fileId} not found`);
    }

    const version = history.versions.find((v) => v.versionId === versionId);
    if (!version) {
      throw new Error(`Version ${versionId} not found`);
    }

    if (version.isCurrentVersion) {
      throw new Error("Cannot delete current version");
    }

    history.versions = history.versions.filter(
      (v) => v.versionId !== versionId
    );

    Logger.info(`Version deleted: ${versionId}`);
  }

  /**
   * Get version count
   */
  async getVersionCount(fileId: string): Promise<number> {
    const history = this.histories.get(fileId);
    return history?.versions.length || 0;
  }

  /**
   * Prune old versions (keep last N versions)
   */
  async pruneVersions(fileId: string, keepCount: number): Promise<void> {
    Logger.info(`Pruning versions for file ${fileId}, keeping ${keepCount}`);

    const history = this.histories.get(fileId);
    if (!history) return;

    if (history.versions.length > keepCount) {
      const sortedVersions = history.versions.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      history.versions = sortedVersions.slice(0, keepCount);
    }

    Logger.info(`Pruned versions for file ${fileId}`);
  }
}
