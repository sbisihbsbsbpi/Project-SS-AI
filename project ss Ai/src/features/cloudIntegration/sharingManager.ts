/**
 * Sharing & Permissions Manager
 * Handles file sharing, permissions, and access control
 */

import { v4 as uuid } from 'uuid';
import { Logger } from '../../utils/logger';
import {
  ShareLink,
  SharedFile,
  SharedUser,
  SharePermission,
} from './types';

export class SharingManager {
  
  private sharedFiles: Map<string, SharedFile> = new Map();
  private shareLinks: Map<string, ShareLink> = new Map();

  constructor() {
    Logger.initialize();
    
  }

  /**
   * Share file with user
   */
  async shareFileWithUser(
    fileId: string,
    fileName: string,
    email: string,
    permission: SharePermission,
    owner: string
  ): Promise<SharedFile> {
    Logger.info(`Sharing file ${fileId} with ${email}`);

    let sharedFile = this.sharedFiles.get(fileId);
    if (!sharedFile) {
      sharedFile = {
        fileId,
        fileName,
        sharedWith: [],
        shareLinks: [],
        owner,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Check if already shared
    const existingShare = sharedFile.sharedWith.find(u => u.email === email);
    if (existingShare) {
      existingShare.permission = permission;
      existingShare.sharedAt = new Date();
    } else {
      sharedFile.sharedWith.push({
        email,
        permission,
        sharedAt: new Date(),
      });
    }

    sharedFile.updatedAt = new Date();
    this.sharedFiles.set(fileId, sharedFile);

    Logger.info(`File shared with ${email} (${permission})`);
    return sharedFile;
  }

  /**
   * Revoke file access from user
   */
  async revokeFileAccess(fileId: string, email: string): Promise<void> {
    Logger.info(`Revoking access to file ${fileId} from ${email}`);

    const sharedFile = this.sharedFiles.get(fileId);
    if (!sharedFile) {
      throw new Error(`File ${fileId} not found`);
    }

    sharedFile.sharedWith = sharedFile.sharedWith.filter(u => u.email !== email);
    sharedFile.updatedAt = new Date();

    Logger.info(`Access revoked for ${email}`);
  }

  /**
   * Create public share link
   */
  async createShareLink(
    fileId: string,
    fileName: string,
    permission: SharePermission,
    owner: string,
    expiresIn?: number,
    password?: string
  ): Promise<ShareLink> {
    Logger.info(`Creating share link for file ${fileId}`);

    let sharedFile = this.sharedFiles.get(fileId);
    if (!sharedFile) {
      sharedFile = {
        fileId,
        fileName,
        sharedWith: [],
        shareLinks: [],
        owner,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const shareLink: ShareLink = {
      id: uuid(),
      fileId,
      url: `https://share.example.com/${uuid()}`,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn) : undefined,
      password,
      permissions: permission,
      createdAt: new Date(),
      createdBy: owner,
    };

    sharedFile.shareLinks.push(shareLink);
    sharedFile.updatedAt = new Date();
    this.sharedFiles.set(fileId, sharedFile);
    this.shareLinks.set(shareLink.id, shareLink);

    Logger.info(`Share link created: ${shareLink.url}`);
    return shareLink;
  }

  /**
   * Revoke share link
   */
  async revokeShareLink(linkId: string): Promise<void> {
    Logger.info(`Revoking share link: ${linkId}`);

    const shareLink = this.shareLinks.get(linkId);
    if (!shareLink) {
      throw new Error(`Share link ${linkId} not found`);
    }

    const sharedFile = this.sharedFiles.get(shareLink.fileId);
    if (sharedFile) {
      sharedFile.shareLinks = sharedFile.shareLinks.filter(l => l.id !== linkId);
      sharedFile.updatedAt = new Date();
    }

    this.shareLinks.delete(linkId);
    Logger.info(`Share link revoked: ${linkId}`);
  }

  /**
   * Get shared file details
   */
  async getSharedFile(fileId: string): Promise<SharedFile | null> {
    return this.sharedFiles.get(fileId) || null;
  }

  /**
   * Get share link details
   */
  async getShareLink(linkId: string): Promise<ShareLink | null> {
    const shareLink = this.shareLinks.get(linkId);
    if (!shareLink) return null;

    // Check if expired
    if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
      this.shareLinks.delete(linkId);
      return null;
    }

    return shareLink;
  }

  /**
   * List all shared files
   */
  async listSharedFiles(owner: string): Promise<SharedFile[]> {
    Logger.info(`Listing shared files for owner: ${owner}`);

    const files = Array.from(this.sharedFiles.values()).filter(
      f => f.owner === owner
    );

    return files;
  }

  /**
   * Check permission
   */
  hasPermission(
    email: string,
    fileId: string,
    requiredPermission: SharePermission
  ): boolean {
    const sharedFile = this.sharedFiles.get(fileId);
    if (!sharedFile) return false;

    const user = sharedFile.sharedWith.find(u => u.email === email);
    if (!user) return false;

    const permissionLevels: Record<SharePermission, number> = {
      view: 1,
      comment: 2,
      edit: 3,
    };

    return permissionLevels[user.permission] >= permissionLevels[requiredPermission];
  }

  /**
   * Update permission
   */
  async updatePermission(
    fileId: string,
    email: string,
    newPermission: SharePermission
  ): Promise<void> {
    Logger.info(`Updating permission for ${email} on file ${fileId}`);

    const sharedFile = this.sharedFiles.get(fileId);
    if (!sharedFile) {
      throw new Error(`File ${fileId} not found`);
    }

    const user = sharedFile.sharedWith.find(u => u.email === email);
    if (!user) {
      throw new Error(`User ${email} not found`);
    }

    user.permission = newPermission;
    sharedFile.updatedAt = new Date();

    Logger.info(`Permission updated to ${newPermission}`);
  }
}

