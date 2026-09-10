export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  lastActive: string;
  isCurrent: boolean;
  ipAddress: string;
  e2eeKeySynced: boolean;
}

export type AccountType = 'personal' | 'business';

export interface BusinessProfile {
  companyName: string;
  category: string;
  website?: string;
  verified: boolean;
  businessHours?: string;
  autoReply?: string;
  address?: string;
}

export interface MessageTranslation {
  targetLang: string;
  langName: string;
  text: string;
  translatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  status: UserStatus;
  statusMessage?: string;
  bio: string;
  phone?: string;
  qrCodeUrl?: string;
  e2eeFingerprint: string;
  joinedDate: string;
  devices: ConnectedDevice[];
  isGoogleConnected?: boolean;
  securityPin?: string;
  twoFactorEnabled?: boolean;
  requireDeviceApproval?: boolean;
  loginAlertsEnabled?: boolean;
  preventDuplicateAccounts?: boolean;
  isMinor?: boolean;
  parentalControl?: ParentalControlSettings;
  linkedChildren?: LinkedChildProfile[];
  accountType?: AccountType;
  businessProfile?: BusinessProfile;
}

export interface ParentalControlSettings {
  isMinor: boolean;
  isSupervised: boolean;
  parentUserId?: string;
  parentName?: string;
  parentEmail?: string;
  linkCode: string;
  allowUnknownContacts: boolean;
  approvedContacts: string[];
  allowVideoCalls: boolean;
  allowAiAssistant: boolean;
  dailyScreenTimeMinutes: number; // 0 = unlimited, 30, 60, 120
  bedtimeQuietHoursEnabled: boolean; // quiet hours between 21:00 and 07:00
  filterSensitiveContent: boolean;
  lastUpdated?: string;
}

export interface LinkedChildProfile {
  id: string;
  displayName: string;
  username: string;
  email: string;
  avatar: string;
  linkCode: string;
  linkedAt: string;
  settings: ParentalControlSettings;
}

export type AttachmentType = 'image' | 'video' | 'audio' | 'doc';

export interface MessageAttachment {
  id: string;
  name: string;
  type: AttachmentType;
  url: string;
  sizeBytes: number;
  quality: 'original_hd' | 'compressed_lite';
  mimeType: string;
  driveFileId?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[]; // usernames or userIds
}

export interface ChatPollOption {
  id: string;
  text: string;
  votes: string[]; // user IDs
}

export interface ChatPoll {
  question: string;
  options: ChatPollOption[];
  multipleAnswers?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  isE2EE: boolean;
  integrityHash: string; // SHA-256 integrity checksum
  attachments?: MessageAttachment[];
  isSystem?: boolean;
  replyToId?: string;
  translation?: MessageTranslation;
  reactions?: Record<string, string[]>; // emoji -> list of user IDs
  priority?: 'normal' | 'important' | 'urgent'; // Teams-style priority banner
  isPinned?: boolean;
  poll?: ChatPoll;
}

export type AppTab = 'chats' | 'channels_status' | 'communities' | 'arcade' | 'workspace' | 'calls';

export interface StatusStory {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'text' | 'image';
  content: string; // text body or image data/url
  backgroundGradient?: string;
  timestamp: string;
  expiresAt: string;
  viewsCount: number;
  caption?: string;
  isSelf?: boolean;
}

export interface BroadcastChannelPost {
  id: string;
  channelId: string;
  title?: string;
  text: string;
  imageUrl?: string;
  timestamp: string;
  reactions: Record<string, number>; // emoji -> count
  userReacted?: Record<string, boolean>; // emoji -> boolean
  views: number;
  isPinned?: boolean;
}

export interface BroadcastChannel {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bannerUrl?: string;
  description: string;
  subscribersCount: number;
  isVerified: boolean;
  creatorId: string;
  creatorName: string;
  category: 'noticias' | 'tecnologia' | 'gaming' | 'comunidad' | 'empresa';
  isFollowing?: boolean;
  posts: BroadcastChannelPost[];
}

export interface CommunityChannel {
  id: string;
  name: string;
  type: 'text' | 'voice' | 'announcement';
  topic?: string;
  unreadCount?: number;
}

export interface CommunityVoiceParticipant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export interface CommunityMember {
  id: string;
  name: string;
  avatar: string;
  role: 'owner' | 'admin' | 'moderator' | 'vip' | 'member';
  status: 'online' | 'idle' | 'dnd' | 'offline';
  activity?: string; // e.g. "🎮 Jugando a Cyberpunk", "🎧 Escuchando Lo-Fi"
}

export interface CommunityServer {
  id: string;
  name: string;
  icon: string;
  bannerUrl?: string;
  description: string;
  categories: {
    id: string;
    name: string;
    channels: CommunityChannel[];
  }[];
  activeVoiceMembers?: Record<string, CommunityVoiceParticipant[]>; // channelId -> participants
  members: CommunityMember[];
  ownerId: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string;
  avatar: string;
  members: string[]; // user IDs
  lastMessage?: Message;
  unreadCount: number;
  isPinned?: boolean;
  e2eeFingerprint: string;
  meetActiveRoom?: string;
  topic?: string;
  createdAt: string;
  creatorId?: string; // Group creator user ID
  adminIds?: string[]; // Group admin user IDs
  description?: string;
}

export interface CallLog {
  id: string;
  chatId?: string;
  contactName: string;
  contactAvatar: string;
  contactUsername?: string;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  timestamp: string;
  durationSeconds?: number;
  status?: 'completed' | 'missed' | 'rejected';
}

export type WorkspaceTool =
  | 'gmail'
  | 'calendar'
  | 'drive'
  | 'docs'
  | 'sheets'
  | 'slides'
  | 'tasks'
  | 'chat'
  | 'forms'
  | 'keep'
  | 'meet'
  | 'maps';

export interface WorkspaceItem {
  id: string;
  tool: WorkspaceTool;
  title: string;
  subtitle: string;
  date: string;
  status?: string;
  linkUrl?: string;
  contentSnippet?: string;
  content?: string;
  fileExtension?: string;
  fileSizeBytes?: number;
  dataUrl?: string;
  badge?: string;
  color?: string;
}

export type ChatWallpaperType =
  | 'whatsapp_doodle'
  | 'telegram_stars'
  | 'discord_dark'
  | 'geometric'
  | 'gradient'
  | 'solid'
  | 'custom';

export type BubbleColorType =
  | 'whatsapp_green'
  | 'telegram_cyan'
  | 'discord_blurple'
  | 'blue'
  | 'emerald'
  | 'violet'
  | 'amber'
  | 'rose'
  | 'slate';

export type BubbleStyleType = 'whatsapp' | 'telegram' | 'discord' | 'nexus';

export type AppPresetType = 'whatsapp' | 'telegram' | 'discord' | 'nexus';

export interface ThemeSettings {
  mode: 'dark' | 'light' | 'oled';
  colorScheme: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate';
  fontSize: 'compact' | 'normal' | 'large';
  wallpaper: ChatWallpaperType;
  customWallpaperUrl?: string;
  wallpaperOpacity?: number;
  chatBubbleColor: BubbleColorType;
  chatBubbleStyle: BubbleStyleType;
  sendWithEnter: boolean;
  appPreset?: AppPresetType;
  dataSaverEnabled: boolean;
  autoDownloadMedia: boolean;
  notificationSounds: boolean;
  pushNotificationsEnabled: boolean;
  e2eeAlways: boolean;
}

export interface DataUsageStats {
  bytesReceived: number;
  bytesSent: number;
  bytesSaved: number;
  mode: 'ultra-lite' | 'standard';
}
