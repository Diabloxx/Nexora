// Shared types between client and server

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  isOnline: boolean;
  lastSeen: Date;
  globalRole: 'user' | 'moderator' | 'staff' | 'admin' | 'owner';
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Server {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  owner: string;
  members: ServerMember[];
  channels: Channel[];
  roles: Role[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServerMember {
  user: string | User;
  roles: string[];
  joinedAt: Date;
  nickname?: string;
}

export interface Role {
  id: string;
  name: string;
  color: string;
  permissions: string[];
  position: number;
  mentionable: boolean;
  hoisted: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'category' | 'dm' | 'group_dm';
  server?: string;
  position: number;
  parentId?: string;
  topic?: string;
  nsfw: boolean;
  slowMode: number;
  bitrate?: number;
  userLimit?: number;
  lastMessageId?: string;
  participants?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  content: string;
  author: string | User;
  channel: string;
  server?: string;
  type: 'default' | 'system' | 'reply' | 'thread_starter_message';
  editedAt?: Date;
  pinned: boolean;
  attachments: Attachment[];
  embeds: Embed[];
  reactions: Reaction[];
  mentions: MessageMentions;
  reference?: MessageReference;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  filename: string;
  size: number;
  url: string;
  proxyUrl: string;
  width?: number;
  height?: number;
  contentType: string;
}

export interface Embed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: Date;
  color?: number;
  footer?: {
    text: string;
    iconUrl?: string;
  };
  image?: {
    url: string;
    width?: number;
    height?: number;
  };
  thumbnail?: {
    url: string;
    width?: number;
    height?: number;
  };
  author?: {
    name: string;
    url?: string;
    iconUrl?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface MessageMentions {
  users: string[];
  roles: string[];
  everyone: boolean;
  here: boolean;
}

export interface MessageReference {
  messageId: string;
  channelId: string;
  serverId?: string;
}

// Socket.IO event types
export interface SocketEvents {
  // Authentication
  'auth:success': (user: User) => void;
  'auth:error': (error: string) => void;

  // Presence
  'presence:update': (data: { userId: string; status: string; customStatus?: string }) => void;
  'user:status': (data: { userId: string; status: string; lastSeen?: Date }) => void;

  // Messages
  'message:new': (message: Message) => void;
  'message:edited': (data: { id: string; content: string; editedAt: Date }) => void;
  'message:deleted': (data: { messageId: string; channelId: string }) => void;
  'message:reaction': (data: { messageId: string; reactions: Reaction[] }) => void;

  // Typing
  'typing:start': (data: { userId: string; username: string; channelId: string }) => void;
  'typing:stop': (data: { userId: string; channelId: string }) => void;

  // Voice
  'voice:user_joined': (data: { userId: string; username: string; channelId: string }) => void;
  'voice:user_left': (data: { userId: string; username: string; channelId: string }) => void;
  'voice:user_muted': (data: { userId: string; muted: boolean }) => void;
  'voice:user_deafened': (data: { userId: string; deafened: boolean }) => void;

  // WebRTC
  'voice:offer': (data: { fromUserId: string; offer: any }) => void;
  'voice:answer': (data: { fromUserId: string; answer: any }) => void;
  'voice:ice-candidate': (data: { fromUserId: string; candidate: any }) => void;

  // Errors
  'error': (data: { message: string }) => void;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: any[];
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
}

export interface ServerResponse {
  success: boolean;
  server: Server;
}

export interface ServersResponse {
  success: boolean;
  servers: Server[];
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
  hasMore: boolean;
}

// Permission constants
export const PERMISSIONS = {
  // General
  CREATE_INSTANT_INVITE: 'CREATE_INSTANT_INVITE',
  KICK_MEMBERS: 'KICK_MEMBERS',
  BAN_MEMBERS: 'BAN_MEMBERS',
  ADMINISTRATOR: 'ADMINISTRATOR',
  MANAGE_CHANNELS: 'MANAGE_CHANNELS',
  MANAGE_GUILD: 'MANAGE_GUILD',
  ADD_REACTIONS: 'ADD_REACTIONS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
  PRIORITY_SPEAKER: 'PRIORITY_SPEAKER',
  STREAM: 'STREAM',
  VIEW_CHANNEL: 'VIEW_CHANNEL',
  
  // Text
  SEND_MESSAGES: 'SEND_MESSAGES',
  SEND_TTS_MESSAGES: 'SEND_TTS_MESSAGES',
  MANAGE_MESSAGES: 'MANAGE_MESSAGES',
  EMBED_LINKS: 'EMBED_LINKS',
  ATTACH_FILES: 'ATTACH_FILES',
  READ_MESSAGE_HISTORY: 'READ_MESSAGE_HISTORY',
  MENTION_EVERYONE: 'MENTION_EVERYONE',
  USE_EXTERNAL_EMOJIS: 'USE_EXTERNAL_EMOJIS',
  
  // Voice
  CONNECT: 'CONNECT',
  SPEAK: 'SPEAK',
  MUTE_MEMBERS: 'MUTE_MEMBERS',
  DEAFEN_MEMBERS: 'DEAFEN_MEMBERS',
  MOVE_MEMBERS: 'MOVE_MEMBERS',
  USE_VAD: 'USE_VAD',
  
  // Advanced
  CHANGE_NICKNAME: 'CHANGE_NICKNAME',
  MANAGE_NICKNAMES: 'MANAGE_NICKNAMES',
  MANAGE_ROLES: 'MANAGE_ROLES',
  MANAGE_WEBHOOKS: 'MANAGE_WEBHOOKS',
  MANAGE_EMOJIS: 'MANAGE_EMOJIS'
} as const;

export type Permission = keyof typeof PERMISSIONS;
