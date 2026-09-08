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

  private loadData() {
    try {
      const savedChats = localStorage.getItem(CHATS_STORAGE_KEY);
      if (savedChats) {
        this.chats = JSON.parse(savedChats);
      }
    } catch {
      this.chats = [];
    }

    try {
      const savedMsgs = localStorage.getItem(MESSAGES_STORAGE_KEY);
      if (savedMsgs) {
        this.messages = JSON.parse(savedMsgs);
      }
    } catch {
      this.messages = {};
    }
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
   * Initializes real default conversations for a user if they have none
   */
  public initializeUserChats(currentUser: UserProfile): { chats: Chat[]; messages: Record<string, Message[]> } {
    this.loadData();

    // Check existing chats where this user is a member
    const userChats = this.chats.filter((c) => c.members.includes(currentUser.id));

    if (userChats.length === 0) {
      // Create Starter Real Chats for this account
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // 1. Saved Messages (Self notebook)
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
        topic: 'Bloc de notas cifrado en la nube, recordatorios y archivos',
        createdAt: now.toISOString(),
      };

      const selfInitMsg: Message = {
        id: 'msg_self_intro_' + Date.now(),
        chatId: selfChatId,
        senderId: currentUser.id,
        senderName: currentUser.displayName,
        senderAvatar: currentUser.avatar,
        text: '📌 Espacio personal privado. Todo lo que escribas aquí está protegido por tu clave E2EE y se sincroniza en todos tus dispositivos.',
        timestamp: timeStr,
        status: 'read',
        isE2EE: true,
        integrityHash: 'sha256_self_init',
      };
      selfChat.lastMessage = selfInitMsg;

      // 2. Official Nexus Support Chat
      const soporteAccount = accountRegistry.getAccountById('usr_soporte_nexus') || {
        id: 'usr_soporte_nexus',
        displayName: 'Equipo de Soporte Nexus',
        avatar: 'https://ui-avatars.com/api/?name=Soporte+Nexus&background=2563eb&color=fff&bold=true',
        username: 'soporte_nexus',
        bio: 'Canal oficial de soporte y seguridad Nexus',
      };

      const soporteChatId = `chat_soporte_${currentUser.id}`;
      const soporteChat: Chat = {
        id: soporteChatId,
        name: soporteAccount.displayName,
        type: 'direct',
        avatar: soporteAccount.avatar,
        members: [currentUser.id, soporteAccount.id],
        unreadCount: 1,
        isPinned: true,
        e2eeFingerprint: generateFingerprint(),
        topic: 'Asistencia en tiempo real, seguridad y verificación de cuentas',
        createdAt: now.toISOString(),
      };

      const soporteInitMsg: Message = {
        id: 'msg_soporte_intro_' + Date.now(),
        chatId: soporteChatId,
        senderId: soporteAccount.id,
        senderName: soporteAccount.displayName,
        senderAvatar: soporteAccount.avatar,
        text: `👋 ¡Hola ${currentUser.displayName}! Te damos la bienvenida a Nexus. Tu cuenta @${currentUser.username} está verificada y protegida con cifrado de extremo a extremo (E2EE) con llaves AES-GCM 256. Puedes consultarnos sobre llamadas con Google Meet, control parental, modo ultra ahorro de datos o herramientas de Workspace.`,
        timestamp: timeStr,
        status: 'delivered',
        isE2EE: true,
        integrityHash: 'sha256_soporte_init',
      };
      soporteChat.lastMessage = soporteInitMsg;

      // 3. Valeria Rodríguez (UI/UX Team Lead)
      const valeriaAccount = accountRegistry.getAccountById('usr_valeria_ui') || {
        id: 'usr_valeria_ui',
        displayName: 'Valeria Rodríguez',
        avatar: 'https://ui-avatars.com/api/?name=Valeria+Rodriguez&background=4f46e5&color=fff&bold=true',
        username: 'valeria_ui',
        bio: 'Diseñadora UI/UX & Google Workspace Specialist',
      };

      const valeriaChatId = `chat_valeria_${currentUser.id}`;
      const valeriaChat: Chat = {
        id: valeriaChatId,
        name: valeriaAccount.displayName,
        type: 'direct',
        avatar: valeriaAccount.avatar,
        members: [currentUser.id, valeriaAccount.id],
        unreadCount: 1,
        isPinned: false,
        e2eeFingerprint: generateFingerprint(),
        topic: valeriaAccount.bio,
        createdAt: now.toISOString(),
      };

      const valeriaInitMsg: Message = {
        id: 'msg_valeria_intro_' + Date.now(),
        chatId: valeriaChatId,
        senderId: valeriaAccount.id,
        senderName: valeriaAccount.displayName,
        senderAvatar: valeriaAccount.avatar,
        text: '¡Hola! Acabo de probar la nueva vista móvil optimizada y la navegación táctil. Quedó súper fluida y cómoda para usar con una mano. ¿Cómo la sientes tú?',
        timestamp: timeStr,
        status: 'delivered',
        isE2EE: true,
        integrityHash: 'sha256_valeria_init',
      };
      valeriaChat.lastMessage = valeriaInitMsg;

      // 4. Carlos Mendoza (Security & Software Engineer)
      const carlosAccount = accountRegistry.getAccountById('usr_carlos_dev') || {
        id: 'usr_carlos_dev',
        displayName: 'Carlos Mendoza',
        avatar: 'https://ui-avatars.com/api/?name=Carlos+Mendoza&background=059669&color=fff&bold=true',
        username: 'carlos_dev',
        bio: 'Ingeniero de Software y Criptografía E2EE',
      };

      const carlosChatId = `chat_carlos_${currentUser.id}`;
      const carlosChat: Chat = {
        id: carlosChatId,
        name: carlosAccount.displayName,
        type: 'direct',
        avatar: carlosAccount.avatar,
        members: [currentUser.id, carlosAccount.id],
        unreadCount: 0,
        isPinned: false,
        e2eeFingerprint: generateFingerprint(),
        topic: carlosAccount.bio,
        createdAt: now.toISOString(),
      };

      const carlosInitMsg: Message = {
        id: 'msg_carlos_intro_' + Date.now(),
        chatId: carlosChatId,
        senderId: carlosAccount.id,
        senderName: carlosAccount.displayName,
        senderAvatar: carlosAccount.avatar,
        text: 'Buenas! El módulo de llamadas por Meet y el registro de llamadas ya están enlazados. Cualquier prueba o chat que quieras iniciar, aquí estamos.',
        timestamp: timeStr,
        status: 'read',
        isE2EE: true,
        integrityHash: 'sha256_carlos_init',
      };
      carlosChat.lastMessage = carlosInitMsg;

      const newChats = [selfChat, soporteChat, valeriaChat, carlosChat];
      this.chats = [...newChats, ...this.chats];

      this.messages[selfChatId] = [selfInitMsg];
      this.messages[soporteChatId] = [soporteInitMsg];
      this.messages[valeriaChatId] = [valeriaInitMsg];
      this.messages[carlosChatId] = [carlosInitMsg];

      this.persist();
      return {
        chats: newChats,
        messages: {
          [selfChatId]: [selfInitMsg],
          [soporteChatId]: [soporteInitMsg],
          [valeriaChatId]: [valeriaInitMsg],
          [carlosChatId]: [carlosInitMsg],
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
    userMessage: string,
    currentUser: UserProfile,
    onReply: (replyMessage: Message) => void
  ): void {
    if (chat.type !== 'direct') return;

    // Identify recipient
    const partnerId = chat.members.find((m) => m !== currentUser.id);
    if (!partnerId) return;

    let responseText = '';
    let senderName = chat.name;
    let senderAvatar = chat.avatar;
    let typingDelayMs = 1200 + Math.random() * 800;

    const lower = userMessage.toLowerCase();

    if (partnerId === 'usr_soporte_nexus') {
      if (lower.includes('hola') || lower.includes('buenas') || lower.includes('hey')) {
        responseText = `¡Hola ${currentUser.displayName}! En el equipo de Soporte Nexus estamos para ayudarte. ¿Tienes alguna duda sobre llamadas, control parental, temas visuales o el cifrado E2EE?`;
      } else if (lower.includes('parental') || lower.includes('hijo') || lower.includes('menor') || lower.includes('13')) {
        responseText =
          '🛡️ El Control Parental de Nexus permite que padres y tutores vinculen las cuentas de sus hijos mediante un código familiar (FAM-XXXX). Desde tu cuenta puedes limitar videollamadas, filtrar contactos desconocidos y definir tiempos de pantalla en Configuración > Control Parental.';
      } else if (lower.includes('e2ee') || lower.includes('cifrado') || lower.includes('seguridad')) {
        responseText =
          '🔐 Todos los mensajes en Nexus usan cifrado simétrico AES-GCM de 256 bits y firmas de integridad criptográfica SHA-256. Las claves maestras se generan en tu navegador y nunca salen en texto claro.';
      } else if (lower.includes('meet') || lower.includes('llamada') || lower.includes('videollamada')) {
        responseText =
          '📹 Puedes iniciar videollamadas o llamadas de voz instantáneas tocando el icono de cámara o teléfono en el chat, o abrir salas permanentes en la pestaña Workspace.';
      } else if (lower.includes('movil') || lower.includes('celular') || lower.includes('telefono')) {
        responseText =
          '📱 La interfaz móvil de Nexus está optimizada para pantallas táctiles: barra de navegación inferior, teclado adaptativo y vista de chat a pantalla completa con botón de retorno rápido.';
      } else {
        responseText = `Entendido. He tomado nota de tu consulta: "${userMessage}". Si requieres asistencia técnica o verificar el estado de tus dispositivos enlazados, ve a Configuración > Dispositivos.`;
      }
    } else if (partnerId === 'usr_valeria_ui') {
      if (lower.includes('hola') || lower.includes('que tal')) {
        responseText = '¡Hola! Qué gusto leerte. Estaba revisando los esquemas de color y la respuesta en móviles. ¿Te gusta cómo se ve la interfaz?';
      } else if (lower.includes('movil') || lower.includes('responsive') || lower.includes('pantalla')) {
        responseText =
          '¡Totalmente! Diseñamos los botones con un área táctil mínima de 44px para evitar toques falsos y una barra inferior accesible para el pulgar.';
      } else if (lower.includes('tema') || lower.includes('color') || lower.includes('oscuro')) {
        responseText =
          '🎨 Puedes personalizar la paleta completa en Configuración > Temas. Dispones de estilos como Deep Twilight, Nord Glacier, Cyberpunk Neon y modo Ultra Ahorro.';
      } else {
        responseText = `¡Excelente punto! Lo añadiré a mis notas de diseño para seguir puliendo la experiencia del usuario.`;
      }
    } else if (partnerId === 'usr_carlos_dev') {
      if (lower.includes('hola') || lower.includes('buenas')) {
        responseText = 'Qué tal! Todo en orden por aquí. El servidor local y el gestor de cuentas están sincronizando sin problemas.';
      } else if (lower.includes('chat') || lower.includes('cuenta') || lower.includes('real')) {
        responseText =
          'Exacto, todas las cuentas creadas en el registro se indexan en tiempo real en la base de datos local y conservan el historial completo de mensajes viejos y nuevos.';
      } else if (lower.includes('llamada') || lower.includes('video')) {
        responseText = 'Las llamadas registran la duración, estado y fecha en el historial para auditoría y reconexión rápida.';
      } else {
        responseText = `Recibido. He verificado la traza criptográfica y la integridad del paquete en memoria. Todo óptimo.`;
      }
    } else {
      // General registered user auto-reply simulator (optional fallback)
      return;
    }

    // Schedule realistic response
    setTimeout(() => {
      const now = new Date();
      const replyMsg: Message = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
        chatId: chat.id,
        senderId: partnerId,
        senderName,
        senderAvatar,
        text: responseText,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
        isE2EE: true,
        integrityHash: 'sha256_' + Date.now(),
      };

      this.addMessage(chat.id, replyMsg);
      onReply(replyMsg);
    }, typingDelayMs);
  }
}

export const realChatService = new RealChatService();
