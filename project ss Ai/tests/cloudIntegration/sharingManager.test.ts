/**
 * Sharing Manager Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SharingManager } from '../../src/features/cloudIntegration/sharingManager';

describe('SharingManager', () => {
  let sharing: SharingManager;

  beforeEach(() => {
    sharing = new SharingManager();
  });

  it('should share file with user', async () => {
    const sharedFile = await sharing.shareFileWithUser(
      'file-1',
      'screenshot.png',
      'user@example.com',
      'view',
      'owner@example.com'
    );

    expect(sharedFile.fileId).toBe('file-1');
    expect(sharedFile.sharedWith).toHaveLength(1);
    expect(sharedFile.sharedWith[0].email).toBe('user@example.com');
    expect(sharedFile.sharedWith[0].permission).toBe('view');
  });

  it('should update permission for shared user', async () => {
    await sharing.shareFileWithUser(
      'file-1',
      'screenshot.png',
      'user@example.com',
      'view',
      'owner@example.com'
    );

    await sharing.updatePermission('file-1', 'user@example.com', 'edit');

    const sharedFile = await sharing.getSharedFile('file-1');
    expect(sharedFile?.sharedWith[0].permission).toBe('edit');
  });

  it('should revoke file access', async () => {
    await sharing.shareFileWithUser(
      'file-1',
      'screenshot.png',
      'user@example.com',
      'view',
      'owner@example.com'
    );

    await sharing.revokeFileAccess('file-1', 'user@example.com');

    const sharedFile = await sharing.getSharedFile('file-1');
    expect(sharedFile?.sharedWith).toHaveLength(0);
  });

  it('should create public share link', async () => {
    const shareLink = await sharing.createShareLink(
      'file-1',
      'screenshot.png',
      'view',
      'owner@example.com'
    );

    expect(shareLink.id).toBeDefined();
    expect(shareLink.fileId).toBe('file-1');
    expect(shareLink.url).toContain('https://');
    expect(shareLink.permissions).toBe('view');
  });

  it('should create share link with expiration', async () => {
    const expiresIn = 86400000; // 24 hours
    const shareLink = await sharing.createShareLink(
      'file-1',
      'screenshot.png',
      'view',
      'owner@example.com',
      expiresIn
    );

    expect(shareLink.expiresAt).toBeDefined();
  });

  it('should create share link with password', async () => {
    const shareLink = await sharing.createShareLink(
      'file-1',
      'screenshot.png',
      'view',
      'owner@example.com',
      undefined,
      'password123'
    );

    expect(shareLink.password).toBe('password123');
  });

  it('should revoke share link', async () => {
    const shareLink = await sharing.createShareLink(
      'file-1',
      'screenshot.png',
      'view',
      'owner@example.com'
    );

    await sharing.revokeShareLink(shareLink.id);

    const retrieved = await sharing.getShareLink(shareLink.id);
    expect(retrieved).toBeNull();
  });

  it('should get shared file details', async () => {
    await sharing.shareFileWithUser(
      'file-1',
      'screenshot.png',
      'user@example.com',
      'view',
      'owner@example.com'
    );

    const sharedFile = await sharing.getSharedFile('file-1');
    expect(sharedFile).toBeDefined();
    expect(sharedFile?.fileId).toBe('file-1');
  });

  it('should get share link details', async () => {
    const shareLink = await sharing.createShareLink(
      'file-1',
      'screenshot.png',
      'view',
      'owner@example.com'
    );

    const retrieved = await sharing.getShareLink(shareLink.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(shareLink.id);
  });

  it('should list shared files', async () => {
    await sharing.shareFileWithUser(
      'file-1',
      'screenshot.png',
      'user@example.com',
      'view',
      'owner@example.com'
    );

    await sharing.shareFileWithUser(
      'file-2',
      'screenshot2.png',
      'user2@example.com',
      'view',
      'owner@example.com'
    );

    const files = await sharing.listSharedFiles('owner@example.com');
    expect(files).toHaveLength(2);
  });

  it('should check permission', () => {
    sharing.shareFileWithUser(
      'file-1',
      'screenshot.png',
      'user@example.com',
      'edit',
      'owner@example.com'
    );

    expect(sharing.hasPermission('user@example.com', 'file-1', 'view')).toBe(true);
    expect(sharing.hasPermission('user@example.com', 'file-1', 'edit')).toBe(true);
    expect(sharing.hasPermission('user@example.com', 'file-1', 'comment')).toBe(true);
  });

  it('should deny permission for non-shared user', () => {
    expect(sharing.hasPermission('user@example.com', 'file-1', 'view')).toBe(false);
  });
});

