/**
 * Cloud Integration System Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { CloudIntegrationSystem } from '../../src/features/cloudIntegration';
import { CloudProvider } from '../../src/features/cloudIntegration/types';

describe('Cloud Integration System Integration', () => {
  let system: CloudIntegrationSystem;
  const testDir = './test-cloud-integration';

  const googleConfig = {
    clientId: 'test-google-id',
    clientSecret: 'test-google-secret',
    redirectUri: 'http://localhost:3000/auth/google/callback',
    scope: ['openid', 'profile', 'email'],
  };

  const dropboxConfig = {
    clientId: 'test-dropbox-id',
    clientSecret: 'test-dropbox-secret',
    redirectUri: 'http://localhost:3000/auth/dropbox/callback',
    scope: ['files.metadata.read', 'files.content.read'],
  };

  const s3Provider: CloudProvider = {
    name: 's3',
    config: { bucket: 'test-bucket' },
  };

  beforeEach(async () => {
    system = new CloudIntegrationSystem();
    await system.initialize();
    system.registerCloudProvider(s3Provider);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await system.cleanup();
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should initialize system', async () => {
    expect(system.getAuth()).toBeDefined();
    expect(system.getStorage()).toBeDefined();
    expect(system.getSharing()).toBeDefined();
    expect(system.getCollaboration()).toBeDefined();
    expect(system.getVersioning()).toBeDefined();
  });

  it('should setup Google OAuth', async () => {
    await system.setupGoogleOAuth(googleConfig);
    const auth = system.getAuth();
    expect(auth).toBeDefined();
  });

  it('should setup Dropbox OAuth', async () => {
    await system.setupDropboxOAuth(dropboxConfig);
    const auth = system.getAuth();
    expect(auth).toBeDefined();
  });

  it('should complete full workflow', async () => {
    // Setup auth
    await system.setupGoogleOAuth(googleConfig);

    // Authenticate
    const auth = system.getAuth();
    const token = await auth.exchangeGoogleCode('test-code');
    expect(token.accessToken).toBeDefined();

    // Upload file
    const testFile = `${testDir}/test.png`;
    await fs.writeFile(testFile, Buffer.from('test content'));

    const uploadResult = await system.uploadFile({
      provider: s3Provider,
      filePath: testFile,
      fileName: 'test.png',
    });
    expect(uploadResult.fileId).toBeDefined();

    // Share file
    const sharedFile = await system.shareFile(
      uploadResult.fileId,
      'test.png',
      'user@example.com',
      'view',
      'owner@example.com'
    );
    expect(sharedFile.sharedWith).toHaveLength(1);

    // Create share link
    const shareLink = await system.createShareLink(
      uploadResult.fileId,
      'test.png',
      'view',
      'owner@example.com'
    );
    expect(shareLink.url).toBeDefined();

    // Create collaboration session
    const session = await system.createCollaborationSession(uploadResult.fileId);
    expect(session.id).toBeDefined();

    // Create version
    const version = await system.createFileVersion(
      uploadResult.fileId,
      'test.png',
      uploadResult.size,
      'owner@example.com',
      'Initial version'
    );
    expect(version.versionId).toBeDefined();
  });

  it('should handle collaboration workflow', async () => {
    const collaboration = system.getCollaboration();

    // Create session
    const session = await collaboration.createSession('file-1');

    // Join session
    await collaboration.joinSession(session.id, 'user-1', 'user1@example.com', 'User 1');
    await collaboration.joinSession(session.id, 'user-2', 'user2@example.com', 'User 2');

    // Add annotations
    const annotation = await collaboration.addAnnotation(
      'file-1',
      'user-1',
      'This needs fixing',
      { x: 100, y: 200 }
    );

    // Record changes
    await collaboration.recordChange('file-1', 'user-1', 'annotation', {
      text: 'Added annotation',
    });

    // Get history
    const history = await collaboration.getCollaborationHistory('file-1');
    expect(history).toHaveLength(1);
  });

  it('should handle version control workflow', async () => {
    const versioning = system.getVersioning();

    // Create versions
    const v1 = await versioning.createVersion('file-1', 'test.png', 1024000, 'user@example.com');
    const v2 = await versioning.createVersion('file-1', 'test.png', 2048000, 'user@example.com');
    const v3 = await versioning.createVersion('file-1', 'test.png', 3072000, 'user@example.com');

    // List versions
    const versions = await versioning.listVersions('file-1');
    expect(versions).toHaveLength(3);

    // Compare versions
    const diff = await versioning.compareVersions('file-1', v1.versionId, v2.versionId);
    expect(diff.changes.length).toBeGreaterThan(0);

    // Rollback
    const rolledBack = await versioning.rollbackToVersion('file-1', v1.versionId);
    expect(rolledBack.isCurrentVersion).toBe(true);
  });

  it('should handle sharing workflow', async () => {
    const sharing = system.getSharing();

    // Share with multiple users
    await sharing.shareFileWithUser('file-1', 'test.png', 'user1@example.com', 'view', 'owner@example.com');
    await sharing.shareFileWithUser('file-1', 'test.png', 'user2@example.com', 'edit', 'owner@example.com');

    // Create share links
    const link1 = await sharing.createShareLink('file-1', 'test.png', 'view', 'owner@example.com');
    const link2 = await sharing.createShareLink(
      'file-1',
      'test.png',
      'edit',
      'owner@example.com',
      86400000,
      'password123'
    );

    // List shared files
    const files = await sharing.listSharedFiles('owner@example.com');
    expect(files).toHaveLength(1);

    // Check permissions
    expect(sharing.hasPermission('user1@example.com', 'file-1', 'view')).toBe(true);
    expect(sharing.hasPermission('user2@example.com', 'file-1', 'edit')).toBe(true);
  });

  it('should cleanup resources', async () => {
    await system.cleanup();
    expect(system).toBeDefined();
  });
});

