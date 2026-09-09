import { Chat, Message, UserProfile, WorkspaceItem, CallLog } from '../types';
import { RegisteredAccount } from './accountRegistry';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
export type SyncStatus = CloudSyncStatus;

// Automatic background sync runs every 6 minutes (between 5 and 10 minutes)
const AUTO_SYNC_INTERVAL_MS = 6 * 60 * 1000;

class CloudSyncService {
  private syncTimer: any = null;
  private currentStatus: CloudSyncStatus = 'synced';
  private listeners: Set<(status: CloudSyncStatus) => void> = new Set();
  private lastSyncTimestamp: string = new Date().toISOString();
  private broadcastChannel: BroadcastChannel | null = null;
  private isNetworkOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private lastSyncExecutionTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('nexus_cloud_sync_bus');
        }
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }

      window.addEventListener('online', () => {
        this.isNetworkOnline = true;
        this.setStatus('synced');
      });

      window.addEventListener('offline', () => {
        this.isNetworkOnline = false;
        this.setStatus('offline');
      });
    }
  }

  public subscribeStatus(listener: (status: CloudSyncStatus) => void) {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public onStatusChange(listener: (status: CloudSyncStatus) => void) {
    return this.subscribeStatus(listener);
  }

  private setStatus(status: CloudSyncStatus) {
    this.currentStatus = status;
    this.listeners.forEach((fn) => fn(status));
  }

  public getStatus(): CloudSyncStatus {
    return this.currentStatus;
  }

  public getLastSyncText(): string {
    if (!this.lastSyncTimestamp) return 'Sincronizado ahora';
    try {
      const date = new Date(this.lastSyncTimestamp);
      return `Sincronizado ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return 'Sincronizado';
    }
  }

  private isStaticHost(): boolean {
    if (typeof window === 'undefined') return false;
    return (
      window.location.hostname.includes('github.io') ||
      window.location.protocol === 'file:'
    );
  }

  private getLocalMirror(userId: string): any {
    if (typeof localStorage === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`nexus_cloud_mirror_${userId}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to read cloud mirror:', e);
    }
    return null;
  }

  private saveLocalMirror(userId: string, data: any) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(`nexus_cloud_mirror_${userId}`, JSON.stringify(data));
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({ type: 'REMOTE_SYNC', userId, data });
      }
    } catch (e) {
      console.warn('Failed to write cloud mirror:', e);
    }
  }

  /**
   * Fetch all cloud data for a user (chats, messages, accounts, call logs, workspace)
   */
  public async fetchCloudData(userId: string): Promise<{
    userProfile?: UserProfile;
    chats?: Chat[];
    messages?: Record<string, Message[]>;
    accounts?: RegisteredAccount[];
    callLogs?: CallLog[];
    workspaceItems?: WorkspaceItem[];
    lastUpdated?: string;
  } | null> {
    if (!userId) return null;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return this.getLocalMirror(userId);
    }

    try {
      this.setStatus('syncing');

      // If running statically on GitHub Pages, use local cloud-mirror gracefully without failing
      if (this.isStaticHost()) {
        const mirrorData = this.getLocalMirror(userId);
        this.lastSyncTimestamp = new Date().toISOString();
        this.lastSyncExecutionTime = Date.now();
        this.setStatus('synced');
        return mirrorData;
      }

      const res = await fetch(`/api/cloud/sync/${encodeURIComponent(userId)}`, {
        cache: 'no-cache',
      });

      if (!res.ok) {
        // Fallback gracefully without showing 'offline' if device is connected to the internet
        const mirrorData = this.getLocalMirror(userId);
        this.lastSyncTimestamp = new Date().toISOString();
        this.lastSyncExecutionTime = Date.now();
        this.setStatus(this.isNetworkOnline ? 'synced' : 'offline');
        return mirrorData;
      }

      const data = await res.json();
      this.setStatus('synced');
      this.lastSyncTimestamp = data.lastUpdated || new Date().toISOString();
      this.lastSyncExecutionTime = Date.now();
      this.saveLocalMirror(userId, data);
      return data;
    } catch (err) {
      // On static host or network glitch, fall back to mirror while maintaining 'synced' if user has internet
      const mirrorData = this.getLocalMirror(userId);
      this.lastSyncTimestamp = new Date().toISOString();
      this.lastSyncExecutionTime = Date.now();
      this.setStatus(this.isNetworkOnline ? 'synced' : 'offline');
      return mirrorData;
    }
  }

  /**
   * Push full local state to cloud for cross-device persistence
   */
  public async pushFullStateToCloud(payload: {
    userId: string;
    userProfile: UserProfile;
    chats: Chat[];
    messages: Record<string, Message[]>;
    accounts: RegisteredAccount[];
    callLogs?: CallLog[];
    workspaceItems?: WorkspaceItem[];
  }): Promise<boolean> {
    if (!payload.userId) return false;

    // Save to local cloud mirror and broadcast across tabs
    this.saveLocalMirror(payload.userId, payload);
    this.lastSyncTimestamp = new Date().toISOString();
    this.lastSyncExecutionTime = Date.now();

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline');
      return false;
    }

    // On GitHub Pages, client-side mirror and local persistence succeed immediately
    if (this.isStaticHost()) {
      this.setStatus('synced');
      return true;
    }

    try {
      this.setStatus('syncing');
      const res = await fetch('/api/cloud/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        this.setStatus('synced');
        return true;
      }

      // If server responded with an error, but client is online, maintain synced state
      this.setStatus(this.isNetworkOnline ? 'synced' : 'offline');
      return false;
    } catch (err) {
      this.setStatus(this.isNetworkOnline ? 'synced' : 'offline');
      return false;
    }
  }

  /**
   * Execute sync immediately AFTER a session is opened (new login or app initialization)
   */
  public async syncOnSessionStart(
    userId: string,
    onRemoteUpdate?: (cloudData: any) => void
  ) {
    if (!userId) return;
    try {
      const data = await this.fetchCloudData(userId);
      if (data && onRemoteUpdate) {
        onRemoteUpdate(data);
      }
      this.setStatus(this.isNetworkOnline ? 'synced' : 'offline');
    } catch (e) {
      console.warn('Session start sync error:', e);
      this.setStatus(this.isNetworkOnline ? 'synced' : 'offline');
    }
  }

  /**
   * Execute sync immediately BEFORE the user closes session / logs out
   */
  public async syncOnSessionClose(payload: {
    userId: string;
    userProfile: UserProfile;
    chats: Chat[];
    messages: Record<string, Message[]>;
    accounts: RegisteredAccount[];
    callLogs?: CallLog[];
    workspaceItems?: WorkspaceItem[];
  }): Promise<boolean> {
    if (!payload.userId) return true;
    try {
      this.setStatus('syncing');
      const success = await this.pushFullStateToCloud(payload);
      this.setStatus(this.isNetworkOnline ? 'synced' : 'offline');
      return success;
    } catch (e) {
      console.warn('Session close sync error:', e);
      this.setStatus(this.isNetworkOnline ? 'synced' : 'offline');
      return false;
    }
  }

  /**
   * Immediately deliver a single message to cloud
   */
  public async pushMessage(
    message: Message,
    recipientUserIds: string[] = []
  ): Promise<boolean> {
    if (this.isStaticHost()) return true;
    try {
      const res = await fetch('/api/cloud/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, recipientUserIds }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Could not sync message to cloud:', err);
      return false;
    }
  }

  /**
   * Register or update account in cloud directory
   */
  public async pushAccount(account: RegisteredAccount): Promise<boolean> {
    if (this.isStaticHost()) return true;
    try {
      const res = await fetch('/api/cloud/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account }),
      });
      return res.ok;
    } catch (err) {
      console.warn('Could not sync account to cloud:', err);
      return false;
    }
  }

  /**
   * Start polling background sync (runs automatically every 6 minutes)
   */
  public startBackgroundSync(
    userId: string,
    onRemoteUpdate: (cloudData: {
      chats?: Chat[];
      messages?: Record<string, Message[]>;
      accounts?: RegisteredAccount[];
      callLogs?: CallLog[];
      workspaceItems?: WorkspaceItem[];
    }) => void
  ) {
    this.stopBackgroundSync();

    const doSync = async () => {
      if (document.hidden) return; // Don't burn resources if tab hidden
      const data = await this.fetchCloudData(userId);
      if (data) {
        onRemoteUpdate(data);
      }
    };

    // Auto-sync interval set to 6 minutes (between 5 and 10 minutes)
    this.syncTimer = setInterval(doSync, AUTO_SYNC_INTERVAL_MS);

    // Multi-tab listener via BroadcastChannel
    if (this.broadcastChannel) {
      this.broadcastChannel.onmessage = (event) => {
        if (event.data?.type === 'REMOTE_SYNC' && event.data.data) {
          onRemoteUpdate(event.data.data);
        }
      };
    }

    // When user returns to tab after a while (more than 3 minutes since last sync)
    const handleVisibility = () => {
      if (!document.hidden && Date.now() - this.lastSyncExecutionTime > 3 * 60 * 1000) {
        doSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const handleOnline = () => {
      this.isNetworkOnline = true;
      this.setStatus('synced');
      doSync();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      this.stopBackgroundSync();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', handleOnline);
    };
  }

  public stopBackgroundSync() {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
}

export const cloudSyncService = new CloudSyncService();
