/**
 * Cloud Authentication Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CloudAuth } from '../../src/features/cloudIntegration/cloudAuth';
import { GoogleOAuthConfig, DropboxOAuthConfig } from '../../src/features/cloudIntegration/types';

describe('CloudAuth', () => {
  let auth: CloudAuth;

  const googleConfig: GoogleOAuthConfig = {
    clientId: 'test-google-client-id',
    clientSecret: 'test-google-secret',
    redirectUri: 'http://localhost:3000/auth/google/callback',
    scope: ['openid', 'profile', 'email'],
  };

  const dropboxConfig: DropboxOAuthConfig = {
    clientId: 'test-dropbox-client-id',
    clientSecret: 'test-dropbox-secret',
    redirectUri: 'http://localhost:3000/auth/dropbox/callback',
    scope: ['files.metadata.read', 'files.content.read', 'files.content.write'],
  };

  beforeEach(() => {
    auth = new CloudAuth();
  });

  it('should initialize Google OAuth', async () => {
    await auth.initializeGoogleOAuth(googleConfig);
    expect(auth.isAuthenticated('google')).toBe(false);
  });

  it('should initialize Dropbox OAuth', async () => {
    await auth.initializeDropboxOAuth(dropboxConfig);
    expect(auth.isAuthenticated('dropbox')).toBe(false);
  });

  it('should generate Google auth URL', async () => {
    await auth.initializeGoogleOAuth(googleConfig);
    const url = auth.getGoogleAuthUrl();

    expect(url).toContain('accounts.google.com');
    expect(url).toContain('client_id=test-google-client-id');
    expect(url).toContain('redirect_uri=');
  });

  it('should generate Dropbox auth URL', async () => {
    await auth.initializeDropboxOAuth(dropboxConfig);
    const url = auth.getDropboxAuthUrl();

    expect(url).toContain('dropbox.com');
    expect(url).toContain('client_id=test-dropbox-client-id');
  });

  it('should exchange Google authorization code', async () => {
    await auth.initializeGoogleOAuth(googleConfig);
    const token = await auth.exchangeGoogleCode('test-code');

    expect(token.accessToken).toBeDefined();
    expect(token.refreshToken).toBeDefined();
    expect(token.tokenType).toBe('Bearer');
    expect(token.scope).toEqual(googleConfig.scope);
  });

  it('should exchange Dropbox authorization code', async () => {
    await auth.initializeDropboxOAuth(dropboxConfig);
    const token = await auth.exchangeDropboxCode('test-code');

    expect(token.accessToken).toBeDefined();
    expect(token.refreshToken).toBeDefined();
    expect(token.tokenType).toBe('Bearer');
  });

  it('should refresh Google token', async () => {
    await auth.initializeGoogleOAuth(googleConfig);
    await auth.exchangeGoogleCode('test-code');

    const newToken = await auth.refreshToken('google');
    expect(newToken.accessToken).toBeDefined();
    expect(newToken.refreshToken).toBeDefined();
  });

  it('should refresh Dropbox token', async () => {
    await auth.initializeDropboxOAuth(dropboxConfig);
    await auth.exchangeDropboxCode('test-code');

    const newToken = await auth.refreshToken('dropbox');
    expect(newToken.accessToken).toBeDefined();
  });

  it('should get current token', async () => {
    await auth.initializeGoogleOAuth(googleConfig);
    await auth.exchangeGoogleCode('test-code');

    const token = auth.getToken('google');
    expect(token).toBeDefined();
    expect(token?.accessToken).toBeDefined();
  });

  it('should check if token is expired', async () => {
    await auth.initializeGoogleOAuth(googleConfig);
    const token = await auth.exchangeGoogleCode('test-code');

    expect(auth.isTokenExpired(token)).toBe(false);
  });

  it('should revoke token', async () => {
    await auth.initializeGoogleOAuth(googleConfig);
    await auth.exchangeGoogleCode('test-code');

    expect(auth.isAuthenticated('google')).toBe(true);
    await auth.revokeToken('google');
    expect(auth.isAuthenticated('google')).toBe(false);
  });

  it('should check authentication status', async () => {
    await auth.initializeGoogleOAuth(googleConfig);
    expect(auth.isAuthenticated('google')).toBe(false);

    await auth.exchangeGoogleCode('test-code');
    expect(auth.isAuthenticated('google')).toBe(true);
  });
});

