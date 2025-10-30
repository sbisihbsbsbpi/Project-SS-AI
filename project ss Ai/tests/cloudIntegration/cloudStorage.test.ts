/**
 * Cloud Storage Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import { CloudStorage } from '../../src/features/cloudIntegration/cloudStorage';
import { CloudProvider } from '../../src/features/cloudIntegration/types';

describe('CloudStorage', () => {
  let storage: CloudStorage;
  const testDir = './test-cloud-storage';

  const s3Provider: CloudProvider = {
    name: 's3',
    config: { bucket: 'test-bucket', region: 'us-east-1' },
  };

  const googleDriveProvider: CloudProvider = {
    name: 'google-drive',
    config: { folderId: 'test-folder-id' },
  };

  const dropboxProvider: CloudProvider = {
    name: 'dropbox',
    config: { path: '/screenshots' },
  };

  beforeEach(async () => {
    storage = new CloudStorage();
    storage.registerProvider(s3Provider);
    storage.registerProvider(googleDriveProvider);
    storage.registerProvider(dropboxProvider);

    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  it('should register cloud provider', () => {
    const provider = storage.getProvider('s3');
    expect(provider).toBeDefined();
    expect(provider?.name).toBe('s3');
  });

  it('should upload file to S3', async () => {
    const testFile = `${testDir}/test.png`;
    await fs.writeFile(testFile, Buffer.from('test content'));

    const result = await storage.uploadFile({
      provider: s3Provider,
      filePath: testFile,
      fileName: 'test.png',
    });

    expect(result.fileId).toBeDefined();
    expect(result.fileName).toBe('test.png');
    expect(result.url).toContain('s3');
    expect(result.provider).toBe('s3');
  });

  it('should upload file to Google Drive', async () => {
    const testFile = `${testDir}/test.png`;
    await fs.writeFile(testFile, Buffer.from('test content'));

    const result = await storage.uploadFile({
      provider: googleDriveProvider,
      filePath: testFile,
      fileName: 'test.png',
    });

    expect(result.fileId).toBeDefined();
    expect(result.provider).toBe('google-drive');
  });

  it('should upload file to Dropbox', async () => {
    const testFile = `${testDir}/test.png`;
    await fs.writeFile(testFile, Buffer.from('test content'));

    const result = await storage.uploadFile({
      provider: dropboxProvider,
      filePath: testFile,
      fileName: 'test.png',
    });

    expect(result.fileId).toBeDefined();
    expect(result.provider).toBe('dropbox');
  });

  it('should download file from cloud', async () => {
    const savePath = `${testDir}/downloaded.png`;

    const result = await storage.downloadFile({
      provider: s3Provider,
      fileId: 'test-file-id',
      savePath,
    });

    expect(result.fileName).toBeDefined();
    expect(result.savePath).toBe(savePath);
    expect(result.provider).toBe('s3');

    const fileExists = await fs.stat(savePath).catch(() => null);
    expect(fileExists).toBeDefined();
  });

  it('should delete file from cloud', async () => {
    await expect(storage.deleteFile('s3', 'test-file-id')).resolves.toBeUndefined();
  });

  it('should list files in cloud storage', async () => {
    const files = await storage.listFiles('s3');

    expect(Array.isArray(files)).toBe(true);
    expect(files.length).toBeGreaterThan(0);
    expect(files[0].id).toBeDefined();
    expect(files[0].name).toBeDefined();
  });

  it('should get file metadata', async () => {
    const metadata = await storage.getFileMetadata('s3', 'test-file-id');

    expect(metadata.fileId).toBe('test-file-id');
    expect(metadata.fileName).toBeDefined();
    expect(metadata.size).toBeGreaterThan(0);
    expect(metadata.mimeType).toBe('image/png');
  });

  it('should create public share link', async () => {
    const shareLink = await storage.createShareLink('s3', 'test-file-id');

    expect(shareLink).toContain('https://');
    expect(shareLink).toContain('s3');
  });

  it('should handle unregistered provider', async () => {
    const testFile = `${testDir}/test.png`;
    await fs.writeFile(testFile, Buffer.from('test content'));

    const unregisteredProvider: CloudProvider = {
      name: 'unknown',
      config: {},
    };

    await expect(
      storage.uploadFile({
        provider: unregisteredProvider,
        filePath: testFile,
        fileName: 'test.png',
      })
    ).rejects.toThrow();
  });
});

