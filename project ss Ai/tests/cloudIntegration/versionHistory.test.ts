/**
 * Version History Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VersionHistory } from '../../src/features/cloudIntegration/versionHistory';

describe('VersionHistory', () => {
  let versioning: VersionHistory;

  beforeEach(() => {
    versioning = new VersionHistory();
  });

  it('should create new version', async () => {
    const version = await versioning.createVersion(
      'file-1',
      'screenshot.png',
      1024000,
      'user@example.com',
      'Initial version'
    );

    expect(version.versionId).toBeDefined();
    expect(version.fileId).toBe('file-1');
    expect(version.isCurrentVersion).toBe(true);
  });

  it('should get version history', async () => {
    await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');

    const history = await versioning.getVersionHistory('file-1');
    expect(history).toBeDefined();
    expect(history?.versions).toHaveLength(1);
  });

  it('should get specific version', async () => {
    const created = await versioning.createVersion(
      'file-1',
      'screenshot.png',
      1024000,
      'user@example.com'
    );

    const version = await versioning.getVersion('file-1', created.versionId);
    expect(version).toBeDefined();
    expect(version?.versionId).toBe(created.versionId);
  });

  it('should list all versions', async () => {
    await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');
    await versioning.createVersion('file-1', 'screenshot.png', 2048000, 'user@example.com');
    await versioning.createVersion('file-1', 'screenshot.png', 3072000, 'user@example.com');

    const versions = await versioning.listVersions('file-1');
    expect(versions).toHaveLength(3);
  });

  it('should mark previous version as not current', async () => {
    const v1 = await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');
    const v2 = await versioning.createVersion('file-1', 'screenshot.png', 2048000, 'user@example.com');

    const history = await versioning.getVersionHistory('file-1');
    const version1 = history?.versions.find(v => v.versionId === v1.versionId);
    expect(version1?.isCurrentVersion).toBe(false);
    expect(history?.versions.find(v => v.versionId === v2.versionId)?.isCurrentVersion).toBe(true);
  });

  it('should rollback to version', async () => {
    const v1 = await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');
    await versioning.createVersion('file-1', 'screenshot.png', 2048000, 'user@example.com');

    const rolledBack = await versioning.rollbackToVersion('file-1', v1.versionId);

    expect(rolledBack.isCurrentVersion).toBe(true);
    expect(rolledBack.changeDescription).toContain('Rolled back');
  });

  it('should compare two versions', async () => {
    const v1 = await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');
    const v2 = await versioning.createVersion('file-1', 'screenshot.png', 2048000, 'user@example.com');

    const diff = await versioning.compareVersions('file-1', v1.versionId, v2.versionId);

    expect(diff.versionId1).toBe(v1.versionId);
    expect(diff.versionId2).toBe(v2.versionId);
    expect(diff.changes.length).toBeGreaterThan(0);
  });

  it('should delete version', async () => {
    const v1 = await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');
    const v2 = await versioning.createVersion('file-1', 'screenshot.png', 2048000, 'user@example.com');

    await versioning.deleteVersion('file-1', v1.versionId);

    const versions = await versioning.listVersions('file-1');
    expect(versions).toHaveLength(1);
  });

  it('should not delete current version', async () => {
    const v1 = await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');

    await expect(versioning.deleteVersion('file-1', v1.versionId)).rejects.toThrow();
  });

  it('should get version count', async () => {
    await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');
    await versioning.createVersion('file-1', 'screenshot.png', 2048000, 'user@example.com');

    const count = await versioning.getVersionCount('file-1');
    expect(count).toBe(2);
  });

  it('should prune old versions', async () => {
    await versioning.createVersion('file-1', 'screenshot.png', 1024000, 'user@example.com');
    await versioning.createVersion('file-1', 'screenshot.png', 2048000, 'user@example.com');
    await versioning.createVersion('file-1', 'screenshot.png', 3072000, 'user@example.com');

    await versioning.pruneVersions('file-1', 2);

    const count = await versioning.getVersionCount('file-1');
    expect(count).toBeLessThanOrEqual(2);
  });
});

