/**
 * Collaboration Engine Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CollaborationEngine } from '../../src/features/cloudIntegration/collaborationEngine';

describe('CollaborationEngine', () => {
  let collaboration: CollaborationEngine;

  beforeEach(() => {
    collaboration = new CollaborationEngine();
  });

  it('should create collaboration session', async () => {
    const session = await collaboration.createSession('file-1');

    expect(session.id).toBeDefined();
    expect(session.fileId).toBe('file-1');
    expect(session.participants).toHaveLength(0);
    expect(session.isActive).toBe(true);
  });

  it('should join collaboration session', async () => {
    const session = await collaboration.createSession('file-1');

    const updated = await collaboration.joinSession(
      session.id,
      'user-1',
      'user1@example.com',
      'User 1'
    );

    expect(updated.participants).toHaveLength(1);
    expect(updated.participants[0].email).toBe('user1@example.com');
  });

  it('should handle multiple participants', async () => {
    const session = await collaboration.createSession('file-1');

    await collaboration.joinSession(session.id, 'user-1', 'user1@example.com', 'User 1');
    await collaboration.joinSession(session.id, 'user-2', 'user2@example.com', 'User 2');

    const updated = await collaboration.getSession(session.id);
    expect(updated?.participants).toHaveLength(2);
  });

  it('should leave collaboration session', async () => {
    const session = await collaboration.createSession('file-1');

    await collaboration.joinSession(session.id, 'user-1', 'user1@example.com', 'User 1');
    await collaboration.leaveSession(session.id, 'user-1');

    const updated = await collaboration.getSession(session.id);
    expect(updated?.participants).toHaveLength(0);
    expect(updated?.isActive).toBe(false);
  });

  it('should update cursor position', async () => {
    const session = await collaboration.createSession('file-1');

    await collaboration.joinSession(session.id, 'user-1', 'user1@example.com', 'User 1');
    await collaboration.updateCursorPosition(session.id, 'user-1', {
      x: 100,
      y: 200,
      color: '#FF0000',
    });

    const updated = await collaboration.getSession(session.id);
    expect(updated?.participants[0].cursor).toBeDefined();
    expect(updated?.participants[0].cursor?.x).toBe(100);
  });

  it('should add annotation', async () => {
    const annotation = await collaboration.addAnnotation(
      'file-1',
      'user-1',
      'This needs fixing',
      { x: 100, y: 200 }
    );

    expect(annotation.id).toBeDefined();
    expect(annotation.text).toBe('This needs fixing');
    expect(annotation.resolved).toBe(false);
  });

  it('should resolve annotation', async () => {
    const annotation = await collaboration.addAnnotation(
      'file-1',
      'user-1',
      'This needs fixing',
      { x: 100, y: 200 }
    );

    await collaboration.resolveAnnotation(annotation.id);

    const annotations = await collaboration.getAnnotations('file-1');
    expect(annotations[0].resolved).toBe(true);
  });

  it('should get annotations for file', async () => {
    await collaboration.addAnnotation('file-1', 'user-1', 'Comment 1', { x: 100, y: 200 });
    await collaboration.addAnnotation('file-1', 'user-2', 'Comment 2', { x: 150, y: 250 });

    const annotations = await collaboration.getAnnotations('file-1');
    expect(annotations).toHaveLength(2);
  });

  it('should record collaborative change', async () => {
    const change = await collaboration.recordChange(
      'file-1',
      'user-1',
      'annotation',
      { text: 'New annotation' }
    );

    expect(change.id).toBeDefined();
    expect(change.type).toBe('annotation');
    expect(change.timestamp).toBeDefined();
  });

  it('should get collaboration history', async () => {
    await collaboration.recordChange('file-1', 'user-1', 'annotation', { text: 'Comment 1' });
    await collaboration.recordChange('file-1', 'user-2', 'comment', { text: 'Comment 2' });

    const history = await collaboration.getCollaborationHistory('file-1');
    expect(history).toHaveLength(2);
  });

  it('should get active participants', async () => {
    const session = await collaboration.createSession('file-1');

    await collaboration.joinSession(session.id, 'user-1', 'user1@example.com', 'User 1');
    await collaboration.joinSession(session.id, 'user-2', 'user2@example.com', 'User 2');

    const active = await collaboration.getActiveParticipants(session.id);
    expect(active.length).toBeGreaterThan(0);
  });

  it('should get session details', async () => {
    const session = await collaboration.createSession('file-1');

    const retrieved = await collaboration.getSession(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.fileId).toBe('file-1');
  });
});

