/**
 * Collaboration Engine
 * Handles real-time collaboration, annotations, and comments
 */

import { v4 as uuid } from 'uuid';
import { Logger } from '../../utils/logger';
import {
  CollaborationSession,
  Participant,
  Annotation,
  CollaborativeChange,
  CursorPosition,
} from './types';

export class CollaborationEngine {
  
  private sessions: Map<string, CollaborationSession> = new Map();
  private annotations: Map<string, Annotation[]> = new Map();
  private changes: Map<string, CollaborativeChange[]> = new Map();

  constructor() {
    Logger.initialize();
    
  }

  /**
   * Create collaboration session
   */
  async createSession(fileId: string): Promise<CollaborationSession> {
    Logger.info(`Creating collaboration session for file ${fileId}`);

    const session: CollaborationSession = {
      id: uuid(),
      fileId,
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    };

    this.sessions.set(session.id, session);
    this.annotations.set(fileId, []);
    this.changes.set(fileId, []);

    Logger.info(`Collaboration session created: ${session.id}`);
    return session;
  }

  /**
   * Join collaboration session
   */
  async joinSession(
    sessionId: string,
    userId: string,
    email: string,
    name: string
  ): Promise<CollaborationSession> {
    Logger.info(`User ${email} joining session ${sessionId}`);

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Check if already joined
    const existing = session.participants.find(p => p.userId === userId);
    if (existing) {
      existing.lastActive = new Date();
      return session;
    }

    const participant: Participant = {
      userId,
      email,
      name,
      joinedAt: new Date(),
      lastActive: new Date(),
    };

    session.participants.push(participant);
    session.updatedAt = new Date();

    Logger.info(`User ${email} joined session`);
    return session;
  }

  /**
   * Leave collaboration session
   */
  async leaveSession(sessionId: string, userId: string): Promise<void> {
    Logger.info(`User ${userId} leaving session ${sessionId}`);

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.participants = session.participants.filter(p => p.userId !== userId);
    session.updatedAt = new Date();

    if (session.participants.length === 0) {
      session.isActive = false;
    }

    Logger.info(`User ${userId} left session`);
  }

  /**
   * Update cursor position
   */
  async updateCursorPosition(
    sessionId: string,
    userId: string,
    position: CursorPosition
  ): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const participant = session.participants.find(p => p.userId === userId);
    if (participant) {
      participant.cursor = position;
      participant.lastActive = new Date();
    }
  }

  /**
   * Add annotation
   */
  async addAnnotation(
    fileId: string,
    userId: string,
    text: string,
    position: { x: number; y: number }
  ): Promise<Annotation> {
    Logger.info(`Adding annotation to file ${fileId}`);

    const annotation: Annotation = {
      id: uuid(),
      fileId,
      userId,
      text,
      position,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolved: false,
    };

    const fileAnnotations = this.annotations.get(fileId) || [];
    fileAnnotations.push(annotation);
    this.annotations.set(fileId, fileAnnotations);

    Logger.info(`Annotation added: ${annotation.id}`);
    return annotation;
  }

  /**
   * Resolve annotation
   */
  async resolveAnnotation(annotationId: string): Promise<void> {
    Logger.info(`Resolving annotation: ${annotationId}`);

    for (const annotations of this.annotations.values()) {
      const annotation = annotations.find(a => a.id === annotationId);
      if (annotation) {
        annotation.resolved = true;
        annotation.updatedAt = new Date();
        Logger.info(`Annotation resolved: ${annotationId}`);
        return;
      }
    }

    throw new Error(`Annotation ${annotationId} not found`);
  }

  /**
   * Get annotations for file
   */
  async getAnnotations(fileId: string): Promise<Annotation[]> {
    return this.annotations.get(fileId) || [];
  }

  /**
   * Record collaborative change
   */
  async recordChange(
    fileId: string,
    userId: string,
    type: 'annotation' | 'comment' | 'edit',
    data: any
  ): Promise<CollaborativeChange> {
    Logger.info(`Recording ${type} change for file ${fileId}`);

    const change: CollaborativeChange = {
      id: uuid(),
      fileId,
      userId,
      type,
      data,
      timestamp: new Date(),
    };

    const fileChanges = this.changes.get(fileId) || [];
    fileChanges.push(change);
    this.changes.set(fileId, fileChanges);

    Logger.info(`Change recorded: ${change.id}`);
    return change;
  }

  /**
   * Get collaboration history
   */
  async getCollaborationHistory(fileId: string): Promise<CollaborativeChange[]> {
    return this.changes.get(fileId) || [];
  }

  /**
   * Get active session
   */
  async getSession(sessionId: string): Promise<CollaborationSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get active participants
   */
  async getActiveParticipants(sessionId: string): Promise<Participant[]> {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    return session.participants.filter(p => {
      const lastActive = p.lastActive.getTime();
      const now = Date.now();
      return now - lastActive < 300000; // 5 minutes
    });
  }
}

