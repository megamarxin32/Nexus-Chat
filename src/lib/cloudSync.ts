import { Chat, Message, UserProfile, WorkspaceItem, CallLog } from '../types';
import { RegisteredAccount } from './accountRegistry';

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
export type SyncStatus = CloudSyncStatus;

class CloudSyncService {
  private syncTimer: any = null;
  private currentStatus: CloudSyncStatus = 'synced';
  private listeners: Set<(status: CloudSyncStatus) => void> = new Set();
  private lastSyncTimestamp: string = '';

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
    try {
      this.setStatus('syncing');
      const res = await fetch(`/api/cloud/sync/${encodeURIComponent(userId)}`, {
        cache: 'no-cache',
      });
      if (!res.ok) {
        this.setStatus('offline');
        return null;
      }
      const data = await res.json();
      this.setStatus('synced');
      this.lastSyncTimestamp = data.lastUpdated || new Date().toISOString();
      return data;
    } catch (err) {
      console.warn('Cloud sync fetch warning (running offline / local cache active):', err);
      this.setStatus('offline');
      return null;
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
      this.setStatus('offline');
      return false;
    } catch (err) {
      console.warn('Cloud sync push error:', err);
      this.setStatus('offline');
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
   * Start polling background sync (e.g., every 5s and on tab focus)
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

    // Initial immediate sync
    doSync();

    // Interval sync (5s)
    this.syncTimer = setInterval(doSync, 5000);

    // Event triggers: tab focus, visibility change, online
    const handleFocus = () => doSync();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);

    return () => {
      this.stopBackgroundSync();
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
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
