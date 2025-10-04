/**
 * Real-time Collaboration System
 * Shared workspaces, real-time updates, collaborative AI sessions, team notifications, and conflict resolution
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export class RealTimeCollaboration extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.collaborationDir = options.collaborationDir || './collaboration';
        this.maxWorkspaces = options.maxWorkspaces || 100;
        this.maxUsersPerWorkspace = options.maxUsersPerWorkspace || 20;
        this.sessionTimeout = options.sessionTimeout || 30 * 60 * 1000; // 30 minutes
        this.conflictResolutionStrategy = options.conflictResolutionStrategy || 'last-write-wins';
        
        this.workspaces = new Map();
        this.userSessions = new Map();
        this.activeConnections = new Map();
        this.operationQueue = new Map();
        this.conflictLog = [];
        
        // Real-time update intervals
        this.heartbeatInterval = 5000; // 5 seconds
        this.syncInterval = 1000; // 1 second
        
        console.log('👥 Real-time Collaboration System initialized');
        this.initializeCollaboration();
        this.startHeartbeat();
    }

    async initializeCollaboration() {
        try {
            await fs.mkdir(this.collaborationDir, { recursive: true });
            await this.loadWorkspacesFromDisk();
            console.log(`📁 Collaboration directory initialized: ${this.collaborationDir}`);
        } catch (error) {
            console.warn('⚠️ Failed to initialize collaboration directory:', error.message);
        }
    }

    async loadWorkspacesFromDisk() {
        try {
            const workspacesFile = path.join(this.collaborationDir, 'workspaces.json');
            const data = await fs.readFile(workspacesFile, 'utf8');
            const parsed = JSON.parse(data);
            
            // Restore workspaces
            for (const [id, workspace] of Object.entries(parsed)) {
                workspace.users = new Map(Object.entries(workspace.users || {}));
                workspace.operations = workspace.operations || [];
                workspace.lastActivity = workspace.lastActivity || Date.now();
                this.workspaces.set(id, workspace);
            }
            
            console.log(`📥 Loaded ${this.workspaces.size} workspaces from disk`);
        } catch (error) {
            console.log('📝 No existing workspaces found, starting fresh');
        }
    }

    async saveWorkspacesToDisk() {
        try {
            const workspacesFile = path.join(this.collaborationDir, 'workspaces.json');
            
            // Convert Maps to Objects for JSON serialization
            const workspacesData = {};
            for (const [id, workspace] of this.workspaces) {
                workspacesData[id] = {
                    ...workspace,
                    users: Object.fromEntries(workspace.users)
                };
            }
            
            await fs.writeFile(workspacesFile, JSON.stringify(workspacesData, null, 2));
            console.log('💾 Workspaces saved to disk');
        } catch (error) {
            console.warn('⚠️ Failed to save workspaces to disk:', error.message);
        }
    }

    // Workspace Management
    async createWorkspace(name, creatorId, options = {}) {
        const workspaceId = crypto.randomBytes(8).toString('hex');
        
        const workspace = {
            id: workspaceId,
            name: name,
            creatorId: creatorId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            settings: {
                isPublic: options.isPublic || false,
                allowGuests: options.allowGuests || false,
                maxUsers: options.maxUsers || this.maxUsersPerWorkspace,
                conflictResolution: options.conflictResolution || this.conflictResolutionStrategy,
                autoSave: options.autoSave !== false,
                ...options.settings
            },
            users: new Map(),
            sharedState: {
                projects: new Map(),
                activeAISessions: new Map(),
                sharedDocuments: new Map(),
                chatHistory: [],
                annotations: new Map()
            },
            operations: [],
            permissions: {
                [creatorId]: 'admin'
            },
            inviteTokens: new Map()
        };

        // Add workspace to Map first
        this.workspaces.set(workspaceId, workspace);

        // Add creator as first user
        await this.addUserToWorkspace(workspaceId, creatorId, {
            role: 'admin',
            joinedAt: Date.now(),
            isCreator: true
        });
        await this.saveWorkspacesToDisk();
        
        console.log(`👥 Created workspace: ${name} (${workspaceId}) by ${creatorId}`);
        
        // Emit workspace created event
        this.emit('workspace:created', {
            workspaceId,
            workspace,
            creatorId
        });
        
        return workspaceId;
    }

    async joinWorkspace(workspaceId, userId, userInfo = {}) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }
        
        // Check if workspace is full
        if (workspace.users.size >= workspace.settings.maxUsers) {
            throw new Error('Workspace is full');
        }
        
        // Check permissions
        if (!workspace.settings.isPublic && !workspace.permissions[userId] && !workspace.settings.allowGuests) {
            throw new Error('Access denied to workspace');
        }
        
        await this.addUserToWorkspace(workspaceId, userId, {
            role: workspace.permissions[userId] || 'member',
            joinedAt: Date.now(),
            ...userInfo
        });
        
        // Create user session
        const sessionId = this.createUserSession(userId, workspaceId);
        
        // Notify other users
        this.broadcastToWorkspace(workspaceId, 'user:joined', {
            userId,
            userInfo: workspace.users.get(userId),
            timestamp: Date.now()
        }, userId);
        
        console.log(`👤 User ${userId} joined workspace ${workspaceId}`);
        
        return {
            sessionId,
            workspace: this.getWorkspaceForUser(workspaceId, userId)
        };
    }

    async addUserToWorkspace(workspaceId, userId, userInfo) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }
        
        workspace.users.set(userId, {
            id: userId,
            status: 'online',
            lastSeen: Date.now(),
            cursor: null,
            activeDocument: null,
            ...userInfo
        });
        
        workspace.lastActivity = Date.now();
        await this.saveWorkspacesToDisk();
    }

    createUserSession(userId, workspaceId) {
        const sessionId = crypto.randomBytes(16).toString('hex');
        
        const session = {
            id: sessionId,
            userId,
            workspaceId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            isActive: true
        };
        
        this.userSessions.set(sessionId, session);
        
        // Set session timeout
        setTimeout(() => {
            this.expireSession(sessionId);
        }, this.sessionTimeout);
        
        return sessionId;
    }

    // Real-time Operations
    async executeOperation(sessionId, operation) {
        const session = this.userSessions.get(sessionId);
        if (!session || !session.isActive) {
            throw new Error('Invalid or expired session');
        }
        
        const workspace = this.workspaces.get(session.workspaceId);
        if (!workspace) {
            throw new Error('Workspace not found');
        }
        
        // Add operation metadata
        const enhancedOperation = {
            id: crypto.randomBytes(8).toString('hex'),
            type: operation.type,
            data: operation.data,
            userId: session.userId,
            workspaceId: session.workspaceId,
            timestamp: Date.now(),
            sessionId: sessionId
        };
        
        // Check for conflicts
        const conflict = await this.detectConflict(enhancedOperation);
        if (conflict) {
            return await this.resolveConflict(enhancedOperation, conflict);
        }
        
        // Apply operation
        const result = await this.applyOperation(enhancedOperation);
        
        // Add to operation history
        workspace.operations.push(enhancedOperation);
        
        // Keep only recent operations (last 1000)
        if (workspace.operations.length > 1000) {
            workspace.operations = workspace.operations.slice(-1000);
        }
        
        // Broadcast to other users
        this.broadcastToWorkspace(session.workspaceId, 'operation:applied', {
            operation: enhancedOperation,
            result: result
        }, session.userId);
        
        // Update workspace activity
        workspace.lastActivity = Date.now();
        
        // Auto-save if enabled
        if (workspace.settings.autoSave) {
            await this.saveWorkspacesToDisk();
        }
        
        console.log(`⚡ Operation ${enhancedOperation.type} executed by ${session.userId} in workspace ${session.workspaceId}`);
        
        return {
            operationId: enhancedOperation.id,
            result: result,
            timestamp: enhancedOperation.timestamp
        };
    }

    async applyOperation(operation) {
        const workspace = this.workspaces.get(operation.workspaceId);
        
        switch (operation.type) {
            case 'project:create':
                return await this.applyProjectCreate(workspace, operation);
            case 'project:update':
                return await this.applyProjectUpdate(workspace, operation);
            case 'document:create':
                return await this.applyDocumentCreate(workspace, operation);
            case 'document:edit':
                return await this.applyDocumentEdit(workspace, operation);
            case 'ai_session:start':
                return await this.applyAISessionStart(workspace, operation);
            case 'ai_session:update':
                return await this.applyAISessionUpdate(workspace, operation);
            case 'chat:message':
                return await this.applyChatMessage(workspace, operation);
            case 'annotation:add':
                return await this.applyAnnotationAdd(workspace, operation);
            case 'cursor:update':
                return await this.applyCursorUpdate(workspace, operation);
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }

    async applyProjectCreate(workspace, operation) {
        const { projectData } = operation.data;
        const projectId = crypto.randomBytes(8).toString('hex');
        
        const project = {
            id: projectId,
            ...projectData,
            createdBy: operation.userId,
            createdAt: operation.timestamp,
            lastModified: operation.timestamp,
            collaborators: [operation.userId]
        };
        
        workspace.sharedState.projects.set(projectId, project);
        
        return { projectId, project };
    }

    async applyProjectUpdate(workspace, operation) {
        const { projectId, updates } = operation.data;
        const project = workspace.sharedState.projects.get(projectId);
        
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        // Apply updates
        Object.assign(project, updates);
        project.lastModified = operation.timestamp;
        project.lastModifiedBy = operation.userId;
        
        // Add user to collaborators if not already present
        if (!project.collaborators.includes(operation.userId)) {
            project.collaborators.push(operation.userId);
        }
        
        return { projectId, project };
    }

    async applyDocumentCreate(workspace, operation) {
        const { documentData } = operation.data;
        const documentId = crypto.randomBytes(8).toString('hex');
        
        const document = {
            id: documentId,
            ...documentData,
            createdBy: operation.userId,
            createdAt: operation.timestamp,
            lastModified: operation.timestamp,
            version: 1,
            collaborators: [operation.userId]
        };
        
        workspace.sharedState.sharedDocuments.set(documentId, document);
        
        return { documentId, document };
    }

    async applyDocumentEdit(workspace, operation) {
        const { documentId, edits } = operation.data;
        const document = workspace.sharedState.sharedDocuments.get(documentId);
        
        if (!document) {
            throw new Error(`Document ${documentId} not found`);
        }
        
        // Apply edits (simplified - in real implementation would use operational transforms)
        if (edits.content !== undefined) {
            document.content = edits.content;
        }
        
        document.lastModified = operation.timestamp;
        document.lastModifiedBy = operation.userId;
        document.version++;
        
        // Add user to collaborators if not already present
        if (!document.collaborators.includes(operation.userId)) {
            document.collaborators.push(operation.userId);
        }
        
        return { documentId, document };
    }

    async applyAISessionStart(workspace, operation) {
        const { sessionData } = operation.data;
        const aiSessionId = crypto.randomBytes(8).toString('hex');
        
        const aiSession = {
            id: aiSessionId,
            ...sessionData,
            createdBy: operation.userId,
            createdAt: operation.timestamp,
            status: 'active',
            participants: [operation.userId],
            messages: []
        };
        
        workspace.sharedState.activeAISessions.set(aiSessionId, aiSession);
        
        return { aiSessionId, aiSession };
    }

    async applyAISessionUpdate(workspace, operation) {
        const { aiSessionId, updates } = operation.data;
        const aiSession = workspace.sharedState.activeAISessions.get(aiSessionId);
        
        if (!aiSession) {
            throw new Error(`AI Session ${aiSessionId} not found`);
        }
        
        // Apply updates
        Object.assign(aiSession, updates);
        
        // Add user to participants if not already present
        if (!aiSession.participants.includes(operation.userId)) {
            aiSession.participants.push(operation.userId);
        }
        
        return { aiSessionId, aiSession };
    }

    async applyChatMessage(workspace, operation) {
        const { message } = operation.data;
        
        const chatMessage = {
            id: crypto.randomBytes(8).toString('hex'),
            userId: operation.userId,
            message: message,
            timestamp: operation.timestamp,
            type: 'text'
        };
        
        workspace.sharedState.chatHistory.push(chatMessage);
        
        // Keep only recent messages (last 500)
        if (workspace.sharedState.chatHistory.length > 500) {
            workspace.sharedState.chatHistory = workspace.sharedState.chatHistory.slice(-500);
        }
        
        return { messageId: chatMessage.id, message: chatMessage };
    }

    async applyAnnotationAdd(workspace, operation) {
        const { annotationData } = operation.data;
        const annotationId = crypto.randomBytes(8).toString('hex');
        
        const annotation = {
            id: annotationId,
            ...annotationData,
            createdBy: operation.userId,
            createdAt: operation.timestamp
        };
        
        workspace.sharedState.annotations.set(annotationId, annotation);
        
        return { annotationId, annotation };
    }

    async applyCursorUpdate(workspace, operation) {
        const { position, documentId } = operation.data;
        const user = workspace.users.get(operation.userId);
        
        if (user) {
            user.cursor = {
                position,
                documentId,
                timestamp: operation.timestamp
            };
            user.lastSeen = operation.timestamp;
        }
        
        return { userId: operation.userId, cursor: user.cursor };
    }

    // Conflict Detection and Resolution
    async detectConflict(operation) {
        const workspace = this.workspaces.get(operation.workspaceId);
        
        // Check for concurrent operations on the same resource
        const recentOperations = workspace.operations.filter(op => 
            op.timestamp > operation.timestamp - 5000 && // Within last 5 seconds
            op.userId !== operation.userId &&
            this.operationsConflict(op, operation)
        );
        
        if (recentOperations.length > 0) {
            return {
                type: 'concurrent_modification',
                conflictingOperations: recentOperations,
                resource: this.getOperationResource(operation)
            };
        }
        
        return null;
    }

    operationsConflict(op1, op2) {
        // Check if operations affect the same resource
        const resource1 = this.getOperationResource(op1);
        const resource2 = this.getOperationResource(op2);
        
        return resource1.type === resource2.type && resource1.id === resource2.id;
    }

    getOperationResource(operation) {
        switch (operation.type) {
            case 'project:update':
                return { type: 'project', id: operation.data.projectId };
            case 'document:edit':
                return { type: 'document', id: operation.data.documentId };
            case 'ai_session:update':
                return { type: 'ai_session', id: operation.data.aiSessionId };
            default:
                return { type: 'unknown', id: null };
        }
    }

    async resolveConflict(operation, conflict) {
        const workspace = this.workspaces.get(operation.workspaceId);
        
        // Log conflict
        const conflictRecord = {
            id: crypto.randomBytes(8).toString('hex'),
            workspaceId: operation.workspaceId,
            operation: operation,
            conflict: conflict,
            resolution: workspace.settings.conflictResolution,
            timestamp: Date.now()
        };
        
        this.conflictLog.push(conflictRecord);
        
        // Apply resolution strategy
        switch (workspace.settings.conflictResolution) {
            case 'last-write-wins':
                return await this.applyOperation(operation);
            
            case 'first-write-wins':
                throw new Error('Conflict detected: Another user modified this resource');
            
            case 'merge':
                return await this.attemptMerge(operation, conflict);
            
            case 'manual':
                return await this.requestManualResolution(operation, conflict);
            
            default:
                throw new Error(`Unknown conflict resolution strategy: ${workspace.settings.conflictResolution}`);
        }
    }

    async attemptMerge(operation, conflict) {
        // Simplified merge logic - in real implementation would use sophisticated merge algorithms
        const result = await this.applyOperation(operation);
        
        // Notify users about the merge
        this.broadcastToWorkspace(operation.workspaceId, 'conflict:merged', {
            operation: operation,
            conflict: conflict,
            result: result
        });
        
        return result;
    }

    async requestManualResolution(operation, conflict) {
        // Queue operation for manual resolution
        const queueId = crypto.randomBytes(8).toString('hex');
        
        if (!this.operationQueue.has(operation.workspaceId)) {
            this.operationQueue.set(operation.workspaceId, []);
        }
        
        this.operationQueue.get(operation.workspaceId).push({
            id: queueId,
            operation: operation,
            conflict: conflict,
            status: 'pending_resolution'
        });
        
        // Notify workspace users about conflict
        this.broadcastToWorkspace(operation.workspaceId, 'conflict:manual_resolution_required', {
            queueId: queueId,
            operation: operation,
            conflict: conflict
        });
        
        throw new Error('Conflict requires manual resolution');
    }

    // Real-time Communication
    broadcastToWorkspace(workspaceId, eventType, data, excludeUserId = null) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) return;
        
        for (const [userId, userInfo] of workspace.users) {
            if (userId !== excludeUserId && userInfo.status === 'online') {
                this.sendToUser(userId, eventType, data);
            }
        }
    }

    sendToUser(userId, eventType, data) {
        // In a real implementation, this would send via WebSocket or similar
        this.emit('user:message', {
            userId,
            eventType,
            data,
            timestamp: Date.now()
        });
        
        console.log(`📤 Sent ${eventType} to user ${userId}`);
    }

    // Heartbeat and Session Management
    startHeartbeat() {
        setInterval(() => {
            this.processHeartbeat();
        }, this.heartbeatInterval);
        
        console.log(`💓 Heartbeat started (${this.heartbeatInterval}ms interval)`);
    }

    processHeartbeat() {
        const now = Date.now();
        
        // Check for inactive sessions
        for (const [sessionId, session] of this.userSessions) {
            if (now - session.lastActivity > this.sessionTimeout) {
                this.expireSession(sessionId);
            }
        }
        
        // Update user statuses
        for (const [workspaceId, workspace] of this.workspaces) {
            for (const [userId, user] of workspace.users) {
                if (now - user.lastSeen > this.sessionTimeout) {
                    user.status = 'offline';
                    this.broadcastToWorkspace(workspaceId, 'user:status_changed', {
                        userId,
                        status: 'offline',
                        timestamp: now
                    });
                }
            }
        }
    }

    expireSession(sessionId) {
        const session = this.userSessions.get(sessionId);
        if (!session) return;
        
        session.isActive = false;
        
        // Update user status in workspace
        const workspace = this.workspaces.get(session.workspaceId);
        if (workspace && workspace.users.has(session.userId)) {
            const user = workspace.users.get(session.userId);
            user.status = 'offline';
            user.lastSeen = Date.now();
            
            // Notify other users
            this.broadcastToWorkspace(session.workspaceId, 'user:disconnected', {
                userId: session.userId,
                timestamp: Date.now()
            });
        }
        
        this.userSessions.delete(sessionId);
        console.log(`⏰ Session ${sessionId} expired for user ${session.userId}`);
    }

    // Utility Methods
    getWorkspaceForUser(workspaceId, userId) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) return null;
        
        // Return workspace data filtered for user permissions
        return {
            id: workspace.id,
            name: workspace.name,
            settings: workspace.settings,
            users: Array.from(workspace.users.values()),
            sharedState: {
                projects: Array.from(workspace.sharedState.projects.values()),
                activeAISessions: Array.from(workspace.sharedState.activeAISessions.values()),
                sharedDocuments: Array.from(workspace.sharedState.sharedDocuments.values()),
                chatHistory: workspace.sharedState.chatHistory.slice(-50), // Last 50 messages
                annotations: Array.from(workspace.sharedState.annotations.values())
            },
            userRole: workspace.permissions[userId] || 'member',
            lastActivity: workspace.lastActivity
        };
    }

    getCollaborationAnalytics() {
        const totalWorkspaces = this.workspaces.size;
        const activeSessions = this.userSessions.size;
        const totalUsers = new Set();
        const activeWorkspaces = [];
        
        for (const [workspaceId, workspace] of this.workspaces) {
            const onlineUsers = Array.from(workspace.users.values()).filter(u => u.status === 'online');
            
            if (onlineUsers.length > 0) {
                activeWorkspaces.push({
                    id: workspaceId,
                    name: workspace.name,
                    onlineUsers: onlineUsers.length,
                    totalUsers: workspace.users.size,
                    lastActivity: workspace.lastActivity
                });
            }
            
            workspace.users.forEach((user, userId) => totalUsers.add(userId));
        }
        
        return {
            totalWorkspaces,
            activeWorkspaces: activeWorkspaces.length,
            activeSessions,
            totalUsers: totalUsers.size,
            conflictsResolved: this.conflictLog.length,
            workspaceDetails: activeWorkspaces.slice(0, 10) // Top 10 active workspaces
        };
    }

    async leaveWorkspace(sessionId) {
        const session = this.userSessions.get(sessionId);
        if (!session) return;
        
        const workspace = this.workspaces.get(session.workspaceId);
        if (workspace && workspace.users.has(session.userId)) {
            const user = workspace.users.get(session.userId);
            user.status = 'offline';
            user.lastSeen = Date.now();
            
            // Notify other users
            this.broadcastToWorkspace(session.workspaceId, 'user:left', {
                userId: session.userId,
                timestamp: Date.now()
            });
        }
        
        this.expireSession(sessionId);
        console.log(`👋 User ${session.userId} left workspace ${session.workspaceId}`);
    }

    async deleteWorkspace(workspaceId, userId) {
        const workspace = this.workspaces.get(workspaceId);
        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }
        
        // Check if user has permission to delete
        if (workspace.permissions[userId] !== 'admin' && workspace.creatorId !== userId) {
            throw new Error('Insufficient permissions to delete workspace');
        }
        
        // Notify all users
        this.broadcastToWorkspace(workspaceId, 'workspace:deleted', {
            workspaceId,
            deletedBy: userId,
            timestamp: Date.now()
        });
        
        // Remove workspace
        this.workspaces.delete(workspaceId);
        
        // Expire all sessions for this workspace
        for (const [sessionId, session] of this.userSessions) {
            if (session.workspaceId === workspaceId) {
                this.expireSession(sessionId);
            }
        }
        
        await this.saveWorkspacesToDisk();
        console.log(`🗑️ Workspace ${workspaceId} deleted by ${userId}`);
    }
}
