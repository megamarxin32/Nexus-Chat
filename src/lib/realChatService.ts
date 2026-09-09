import { Chat, Message, UserProfile, MessageAttachment } from '../types';
import { accountRegistry, RegisteredAccount } from './accountRegistry';
import { generateFingerprint } from '../data/mockData';

const CHATS_STORAGE_KEY = 'nexus_global_chats_v2';
const MESSAGES_STORAGE_KEY = 'nexus_global_messages_v2';

export class RealChatService {
  private chats: Chat[] = [];
  private messages: Record<string, Message[]> = {};

  constructor() {
    this.loadData();
  }

  private isFakeChat(chat: { id: string; name: string }): boolean {
    const id = (chat.id || '').toLowerCase();
    const name = (chat.name || '').toLowerCase();
    return (
      id.includes('soporte') ||
      id.includes('valeria') ||
      id.includes('carlos') ||
      name.includes('soporte') ||
      name.includes('valeria') ||
      name.includes('carlos')
    );
  }

  private loadData() {
    try {
      const savedChats = localStorage.getItem(CHATS_STORAGE_KEY) || localStorage.getItem('nexus_chats');
      if (savedChats) {
        const parsed: Chat[] = JSON.parse(savedChats);
        // Exclude all fictitious devs and support chats
        this.chats = parsed.filter((c) => !this.isFakeChat(c));
      }
    } catch {
      this.chats = [];
    }

    try {
      const savedMsgs = localStorage.getItem(MESSAGES_STORAGE_KEY) || localStorage.getItem('nexus_messages');
      if (savedMsgs) {
        const parsed: Record<string, Message[]> = JSON.parse(savedMsgs);
        // Clean out messages belonging to fake chats
        for (const [k, v] of Object.entries(parsed)) {
          if (!this.isFakeChat({ id: k, name: '' })) {
            this.messages[k] = v;
          }
        }
      }
    } catch {
      this.messages = {};
    }
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(this.chats));
      localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(this.messages));
      // Also maintain legacy keys for backwards compatibility
      localStorage.setItem('nexus_chats', JSON.stringify(this.chats));
      localStorage.setItem('nexus_messages', JSON.stringify(this.messages));
    } catch (e) {
      console.error('Error persisting real chats:', e);
    }
  }

  /**
   * Merge chats and messages fetched from the cloud
   */
  public syncWithCloud(cloudChats?: Chat[], cloudMessages?: Record<string, Message[]>): {
    chats: Chat[];
    messages: Record<string, Message[]>;
  } {
    this.loadData();
    let changed = false;

    if (Array.isArray(cloudChats)) {
      for (const cc of cloudChats) {
        if (this.isFakeChat(cc)) continue;
        const idx = this.chats.findIndex((c) => c.id === cc.id);
        if (idx >= 0) {
          // Merge metadata
          this.chats[idx] = {
            ...this.chats[idx],
            ...cc,
            lastMessage: cc.lastMessage || this.chats[idx].lastMessage,
          };
          changed = true;
        } else {
          this.chats.push(cc);
          changed = true;
        }
      }
    }

    if (cloudMessages && typeof cloudMessages === 'object') {
      for (const [chatId, msgs] of Object.entries(cloudMessages)) {
        if (this.isFakeChat({ id: chatId, name: '' })) continue;
        if (!Array.isArray(msgs)) continue;

        if (!this.messages[chatId]) {
          this.messages[chatId] = [];
        }

        const existingIds = new Set(this.messages[chatId].map((m) => m.id));
        for (const m of msgs) {
          if (!existingIds.has(m.id)) {
            this.messages[chatId].push(m);
            existingIds.add(m.id);
            changed = true;
          }
        }

        // Sort messages chronologically
        this.messages[chatId].sort((a, b) => {
          const tA = new Date(a.timestamp).getTime() || 0;
          const tB = new Date(b.timestamp).getTime() || 0;
          return tA - tB;
        });
      }
    }

    if (changed) {
      this.persist();
    }

    return {
      chats: [...this.chats],
      messages: { ...this.messages },
    };
  }

  /**
   * Initializes real default conversations for a user if they have none
   * (Personal self-notes notebook only - no fictitious support or dev bots)
   */
  public initializeUserChats(currentUser: UserProfile): { chats: Chat[]; messages: Record<string, Message[]> } {
    this.loadData();

    // Check existing chats where this user is a member
    const userChats = this.chats.filter((c) => c.members.includes(currentUser.id) && !this.isFakeChat(c));

    if (userChats.length === 0) {
      // Create Saved Messages (Self notebook)
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const selfChatId = `chat_saved_${currentUser.id}`;
      const selfChat: Chat = {
        id: selfChatId,
        name: 'Mensajes Guardados (Tú)',
        type: 'direct',
        avatar: currentUser.avatar,
        members: [currentUser.id],
        unreadCount: 0,
        isPinned: true,
        e2eeFingerprint: currentUser.e2eeFingerprint || generateFingerprint(),
        topic: 'Bloc de notas privado cifrado en la nube, recordatorios y archivos personales',
        createdAt: now.toISOString(),
      };

      const selfInitMsg: Message = {
        id: 'msg_self_intro_' + Date.now(),
        chatId: selfChatId,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderAvatar: currentUser.avatar,
        text: '📌 Espacio personal privado. Todo lo que guardes aquí está protegido por tu clave E2EE y se sincroniza en la nube en todos tus dispositivos.',
        timestamp: timeStr,
        status: 'read',
        isE2EE: true,
        integrityHash: 'sha256_self_init',
      };
      selfChat.lastMessage = selfInitMsg;

      const newChats = [selfChat];
      this.chats = [...newChats, ...this.chats];
      this.messages[selfChatId] = [selfInitMsg];

      this.persist();
      return {
        chats: newChats,
        messages: {
          [selfChatId]: [selfInitMsg],
        },
      };
    }

    // Return chats and their messages
    const existingMsgs: Record<string, Message[]> = {};
    for (const chat of userChats) {
      existingMsgs[chat.id] = this.messages[chat.id] || [];
    }

    return {
      chats: userChats,
      messages: existingMsgs,
    };
  }

  /**
   * Save or update chat metadata
   */
  public saveChat(chat: Chat): void {
    this.loadData();
    const idx = this.chats.findIndex((c) => c.id === chat.id);
    if (idx >= 0) {
      this.chats[idx] = chat;
    } else {
      this.chats.unshift(chat);
    }
    this.persist();
  }

  /**
   * Delete a chat and its messages
   */
  public deleteChat(chatId: string): void {
    this.loadData();
    this.chats = this.chats.filter((c) => c.id !== chatId);
    delete this.messages[chatId];
    this.persist();
  }

  /**
   * Get or create self chat (Saved Messages / Mensajes Guardados)
   */
  public getOrCreateSelfChat(currentUser: UserProfile): Chat {
    this.loadData();
    const selfId = `chat_saved_${currentUser.id}`;
    const existing = this.chats.find(
      (c) =>
        c.id === selfId ||
        (c.type === 'direct' &&
          (c.name.toLowerCase().includes('(tú)') ||
            (c.members.length === 1 && c.members[0] === currentUser.id)))
    );
    if (existing) return existing;

    const selfChat: Chat = {
      id: selfId,
      name: 'Mensajes Guardados (Tú)',
      type: 'direct',
      avatar: currentUser.avatar,
      members: [currentUser.id],
      unreadCount: 0,
      isPinned: true,
      e2eeFingerprint: currentUser.e2eeFingerprint || generateFingerprint(),
      topic: 'Tu bloc personal de notas, mensajes y archivos cifrados',
      createdAt: new Date().toISOString(),
    };
    this.chats.unshift(selfChat);
    this.persist();
    return selfChat;
  }

  /**
   * Get all registered accounts except self
   */
  public getAvailableAccounts(currentUserId: string): RegisteredAccount[] {
    const all = accountRegistry.getAllAccounts();
    return all.filter((a) => a.id !== currentUserId);
  }

  /**
   * Search real accounts
   */
  public searchRealAccounts(query: string, currentUserId: string): RegisteredAccount[] {
    const clean = query.trim().toLowerCase().replace(/^@/, '');
    const all = this.getAvailableAccounts(currentUserId);
    if (!clean) return all;

    return all.filter(
      (a) =>
        a.displayName.toLowerCase().includes(clean) ||
        a.username.toLowerCase().includes(clean) ||
        a.email.toLowerCase().includes(clean) ||
        (a.bio && a.bio.toLowerCase().includes(clean))
    );
  }

  /**
   * Get or create a direct conversation with an account
   */
  public getOrCreateDirectChat(
    currentUser: UserProfile,
    targetAccount: { id: string; displayName: string; username: string; email: string; avatar: string; bio?: string }
  ): { chat: Chat; isNew: boolean } {
    this.loadData();

    // Check if direct chat already exists with this user
    const existing = this.chats.find(
      (c) => c.type === 'direct' && c.members.includes(currentUser.id) && c.members.includes(targetAccount.id)
    );

    if (existing) {
      return { chat: existing, isNew: false };
    }

    // Create persistent new direct chat
    const newChatId = `chat_${[currentUser.id, targetAccount.id].sort().join('_')}`;
    const newChat: Chat = {
      id: newChatId,
      name: targetAccount.displayName,
      type: 'direct',
      avatar: targetAccount.avatar,
      members: [currentUser.id, targetAccount.id],
      unreadCount: 0,
      isPinned: false,
      e2eeFingerprint: generateFingerprint(),
      topic: targetAccount.bio || `Conversación segura con @${targetAccount.username}`,
      createdAt: new Date().toISOString(),
    };

    this.chats.unshift(newChat);
    if (!this.messages[newChatId]) {
      this.messages[newChatId] = [];
    }
    this.persist();

    return { chat: newChat, isNew: true };
  }

  /**
   * Save a new message
   */
  public addMessage(chatId: string, message: Message): void {
    this.loadData();
    if (!this.messages[chatId]) {
      this.messages[chatId] = [];
    }
    this.messages[chatId].push(message);

    // Update chat last message and move to top
    const chatIndex = this.chats.findIndex((c) => c.id === chatId);
    if (chatIndex >= 0) {
      const updatedChat = {
        ...this.chats[chatIndex],
        lastMessage: message,
      };
      this.chats.splice(chatIndex, 1);
      this.chats.unshift(updatedChat);
    }

    this.persist();
  }

  /**
   * Generate realistic, intelligent automated reply from verified teammate/bot accounts
   */
  public handleAutomatedReply(
    chat: Chat,
    _userMessage: string,
    _currentUser: UserProfile,
    _onReply: (replyMessage: Message) => void
  ): void {
    // Only real human messaging and real cloud synchronization
    // No deceptive fake support or dev bot responses
    return;
  }
}

export const realChatService = new RealChatService();
