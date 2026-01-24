import type { WebSocket } from 'ws';

export class ConnectionRegistry {
  private connections = new Map<string, WebSocket>();
  private userSubscriptions = new Map<string, Set<string>>(); // userId -> Set<connectionId>
  private jobSubscriptions = new Map<string, Set<string>>(); // jobId -> Set<connectionId>
  private connectionToUsers = new Map<string, Set<string>>(); // connectionId -> Set<userId>
  private connectionToJobs = new Map<string, Set<string>>(); // connectionId -> Set<jobId>

  addConnection(connectionId: string, socket: WebSocket): void {
    this.connections.set(connectionId, socket);
    this.connectionToUsers.set(connectionId, new Set());
    this.connectionToJobs.set(connectionId, new Set());
  }

  removeConnection(connectionId: string): void {
    // Clean up user subscriptions
    const userIds = this.connectionToUsers.get(connectionId);
    if (userIds) {
      for (const userId of userIds) {
        const subs = this.userSubscriptions.get(userId);
        if (subs) {
          subs.delete(connectionId);
          if (subs.size === 0) {
            this.userSubscriptions.delete(userId);
          }
        }
      }
    }

    // Clean up job subscriptions
    const jobIds = this.connectionToJobs.get(connectionId);
    if (jobIds) {
      for (const jobId of jobIds) {
        const subs = this.jobSubscriptions.get(jobId);
        if (subs) {
          subs.delete(connectionId);
          if (subs.size === 0) {
            this.jobSubscriptions.delete(jobId);
          }
        }
      }
    }

    this.connections.delete(connectionId);
    this.connectionToUsers.delete(connectionId);
    this.connectionToJobs.delete(connectionId);
  }

  getConnection(connectionId: string): WebSocket | undefined {
    return this.connections.get(connectionId);
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  subscribeToUser(connectionId: string, userId: string): void {
    // Add to user subscriptions
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set());
    }
    this.userSubscriptions.get(userId)!.add(connectionId);

    // Track on connection side
    this.connectionToUsers.get(connectionId)?.add(userId);
  }

  unsubscribeFromUser(connectionId: string, userId: string): void {
    const subs = this.userSubscriptions.get(userId);
    if (subs) {
      subs.delete(connectionId);
      if (subs.size === 0) {
        this.userSubscriptions.delete(userId);
      }
    }
    this.connectionToUsers.get(connectionId)?.delete(userId);
  }

  subscribeToJob(connectionId: string, jobId: string): void {
    // Add to job subscriptions
    if (!this.jobSubscriptions.has(jobId)) {
      this.jobSubscriptions.set(jobId, new Set());
    }
    this.jobSubscriptions.get(jobId)!.add(connectionId);

    // Track on connection side
    this.connectionToJobs.get(connectionId)?.add(jobId);
  }

  unsubscribeFromJob(connectionId: string, jobId: string): void {
    const subs = this.jobSubscriptions.get(jobId);
    if (subs) {
      subs.delete(connectionId);
      if (subs.size === 0) {
        this.jobSubscriptions.delete(jobId);
      }
    }
    this.connectionToJobs.get(connectionId)?.delete(jobId);
  }

  broadcastToUserSubscribers(userId: string, message: Record<string, unknown>): void {
    const subs = this.userSubscriptions.get(userId);
    if (!subs) return;

    const payload = JSON.stringify(message);
    for (const connectionId of subs) {
      const socket = this.connections.get(connectionId);
      if (socket && socket.readyState === 1) {
        // OPEN state
        socket.send(payload);
      }
    }
  }

  broadcastToJobSubscribers(jobId: string, message: Record<string, unknown>): void {
    const subs = this.jobSubscriptions.get(jobId);
    if (!subs) return;

    const payload = JSON.stringify(message);
    for (const connectionId of subs) {
      const socket = this.connections.get(connectionId);
      if (socket && socket.readyState === 1) {
        // OPEN state
        socket.send(payload);
      }
    }
  }

  broadcastToAll(message: Record<string, unknown>): void {
    const payload = JSON.stringify(message);
    for (const socket of this.connections.values()) {
      if (socket.readyState === 1) {
        // OPEN state
        socket.send(payload);
      }
    }
  }
}
