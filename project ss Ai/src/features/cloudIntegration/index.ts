/**
 * Cloud Integration System
 * Unified interface for cloud authentication, storage, sharing, collaboration, and versioning
 */

import { Logger } from '../../utils/logger';
import { CloudAuth } from './cloudAuth';
import { CloudStorage } from './cloudStorage';
import { SharingManager } from './sharingManager';
import { CollaborationEngine } from './collaborationEngine';
import { VersionHistory } from './versionHistory';
import {
  GoogleOAuthConfig,
  DropboxOAuthConfig,
  CloudProvider,
  UploadConfig,
  DownloadConfig,
} from './types';

export class CloudIntegrationSystem {
  
  private auth: CloudAuth;
  private storage: CloudStorage;
  private sharing: SharingManager;
  private collaboration: CollaborationEngine;
  private versioning: VersionHistory;

  constructor() {
    Logger.initialize();
    
    this.auth = new CloudAuth();
    this.storage = new CloudStorage();
    this.sharing = new SharingManager();
    this.collaboration = new CollaborationEngine();
    this.versioning = new VersionHistory();
  }

  /**
   * Initialize system
   */
  async initialize(): Promise<void> {
    Logger.info('Initializing Cloud Integration System');
    Logger.info('CloudIntegrationSystem initialized');
  }

  /**
   * Setup Google OAuth
   */
  async setupGoogleOAuth(config: GoogleOAuthConfig): Promise<void> {
    await this.auth.initializeGoogleOAuth(config);
  }

  /**
   * Setup Dropbox OAuth
   */
  async setupDropboxOAuth(config: DropboxOAuthConfig): Promise<void> {
    await this.auth.initializeDropboxOAuth(config);
  }

  /**
   * Register cloud provider
   */
  registerCloudProvider(provider: CloudProvider): void {
    this.storage.registerProvider(provider);
  }

  /**
   * Get authentication module
   */
  getAuth(): CloudAuth {
    return this.auth;
  }

  /**
   * Get storage module
   */
  getStorage(): CloudStorage {
    return this.storage;
  }

  /**
   * Get sharing module
   */
  getSharing(): SharingManager {
    return this.sharing;
  }

  /**
   * Get collaboration module
   */
  getCollaboration(): CollaborationEngine {
    return this.collaboration;
  }

  /**
   * Get versioning module
   */
  getVersioning(): VersionHistory {
    return this.versioning;
  }

  /**
   * Upload file
   */
  async uploadFile(config: UploadConfig) {
    return this.storage.uploadFile(config);
  }

  /**
   * Download file
   */
  async downloadFile(config: DownloadConfig) {
    return this.storage.downloadFile(config);
  }

  /**
   * Share file with user
   */
  async shareFile(
    fileId: string,
    fileName: string,
    email: string,
    permission: 'view' | 'comment' | 'edit',
    owner: string
  ) {
    return this.sharing.shareFileWithUser(fileId, fileName, email, permission, owner);
  }

  /**
   * Create share link
   */
  async createShareLink(
    fileId: string,
    fileName: string,
    permission: 'view' | 'comment' | 'edit',
    owner: string,
    expiresIn?: number,
    password?: string
  ) {
    return this.sharing.createShareLink(
      fileId,
      fileName,
      permission,
      owner,
      expiresIn,
      password
    );
  }

  /**
   * Create collaboration session
   */
  async createCollaborationSession(fileId: string) {
    return this.collaboration.createSession(fileId);
  }

  /**
   * Create file version
   */
  async createFileVersion(
    fileId: string,
    fileName: string,
    size: number,
    createdBy: string,
    changeDescription?: string
  ) {
    return this.versioning.createVersion(
      fileId,
      fileName,
      size,
      createdBy,
      changeDescription
    );
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    Logger.info('CloudIntegrationSystem cleanup completed');
  }
}

// Export all types
export * from './types';
export { CloudAuth } from './cloudAuth';
export { CloudStorage } from './cloudStorage';
export { SharingManager } from './sharingManager';
export { CollaborationEngine } from './collaborationEngine';
export { VersionHistory } from './versionHistory';

