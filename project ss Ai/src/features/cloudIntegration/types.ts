/**
 * Cloud Integration Types
 */

// Authentication Types
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

export interface GoogleOAuthConfig extends OAuthConfig {
  discoveryUrl?: string;
}

export interface DropboxOAuthConfig extends OAuthConfig {
  // Dropbox specific config
}

export interface AuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType: string;
  scope: string[];
}

export interface AuthProvider {
  name: 'google' | 'dropbox';
  config: OAuthConfig;
  token?: AuthToken;
}

// Upload/Download Types
export interface CloudProvider {
  name: 's3' | 'google-drive' | 'dropbox';
  config: Record<string, any>;
}

export interface UploadConfig {
  provider: CloudProvider;
  filePath: string;
  fileName: string;
  metadata?: Record<string, any>;
  isPublic?: boolean;
}

export interface DownloadConfig {
  provider: CloudProvider;
  fileId: string;
  savePath: string;
}

export interface UploadResult {
  fileId: string;
  fileName: string;
  url: string;
  size: number;
  uploadedAt: Date;
  provider: string;
}

export interface DownloadResult {
  fileName: string;
  savePath: string;
  size: number;
  downloadedAt: Date;
  provider: string;
}

// Sharing & Permissions Types
export interface ShareLink {
  id: string;
  fileId: string;
  url: string;
  expiresAt?: Date;
  password?: string;
  permissions: SharePermission;
  createdAt: Date;
  createdBy: string;
}

export type SharePermission = 'view' | 'comment' | 'edit';

export interface SharedFile {
  fileId: string;
  fileName: string;
  sharedWith: SharedUser[];
  shareLinks: ShareLink[];
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedUser {
  email: string;
  permission: SharePermission;
  sharedAt: Date;
}

// Collaboration Types
export interface CollaborationSession {
  id: string;
  fileId: string;
  participants: Participant[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Participant {
  userId: string;
  email: string;
  name: string;
  joinedAt: Date;
  lastActive: Date;
  cursor?: CursorPosition;
}

export interface CursorPosition {
  x: number;
  y: number;
  color: string;
}

export interface Annotation {
  id: string;
  fileId: string;
  userId: string;
  text: string;
  position: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
  resolved: boolean;
}

export interface CollaborativeChange {
  id: string;
  fileId: string;
  userId: string;
  type: 'annotation' | 'comment' | 'edit';
  data: any;
  timestamp: Date;
}

// Version History Types
export interface FileVersion {
  versionId: string;
  fileId: string;
  fileName: string;
  size: number;
  createdAt: Date;
  createdBy: string;
  changeDescription?: string;
  isCurrentVersion: boolean;
}

export interface VersionHistory {
  fileId: string;
  fileName: string;
  versions: FileVersion[];
  currentVersionId: string;
}

export interface VersionDiff {
  versionId1: string;
  versionId2: string;
  changes: Change[];
}

export interface Change {
  type: 'added' | 'removed' | 'modified';
  field: string;
  oldValue?: any;
  newValue?: any;
}

// Sync Types
export interface SyncConfig {
  enabled: boolean;
  interval: number; // milliseconds
  conflictResolution: 'local' | 'remote' | 'manual';
}

export interface SyncEvent {
  id: string;
  type: 'upload' | 'download' | 'conflict' | 'sync-complete';
  fileId: string;
  timestamp: Date;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  error?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'share' | 'comment' | 'mention' | 'version-update';
  title: string;
  message: string;
  data: any;
  read: boolean;
  createdAt: Date;
}

