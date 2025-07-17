import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  // Sidebar states
  isServerSidebarCollapsed: boolean;
  isChannelSidebarCollapsed: boolean;
  isMemberListVisible: boolean;
  
  // Modal states
  isCreateServerModalOpen: boolean;
  isJoinServerModalOpen: boolean;
  isCreateChannelModalOpen: boolean;
  isUserSettingsModalOpen: boolean;
  isServerSettingsModalOpen: boolean;
  
  // Theme and appearance
  theme: 'dark' | 'light';
  fontSize: 'small' | 'medium' | 'large';
  
  // Mobile responsiveness
  isMobile: boolean;
  activeMobileView: 'servers' | 'channels' | 'chat' | 'members';
  
  // Notifications
  notifications: Notification[];
  
  // Voice/Video call states
  isInVoiceChannel: boolean;
  currentVoiceChannelId: string | null;
  isDeafened: boolean;
  isMuted: boolean;
  
  // Loading states
  isConnecting: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  autoHide?: boolean;
}

const initialState: UIState = {
  // Sidebar states
  isServerSidebarCollapsed: false,
  isChannelSidebarCollapsed: false,
  isMemberListVisible: true,
  
  // Modal states
  isCreateServerModalOpen: false,
  isJoinServerModalOpen: false,
  isCreateChannelModalOpen: false,
  isUserSettingsModalOpen: false,
  isServerSettingsModalOpen: false,
  
  // Theme and appearance
  theme: (localStorage.getItem('theme') as 'dark' | 'light') || 'dark',
  fontSize: (localStorage.getItem('fontSize') as 'small' | 'medium' | 'large') || 'medium',
  
  // Mobile responsiveness
  isMobile: window.innerWidth < 768,
  activeMobileView: 'chat',
  
  // Notifications
  notifications: [],
  
  // Voice/Video call states
  isInVoiceChannel: false,
  currentVoiceChannelId: null,
  isDeafened: false,
  isMuted: false,
  
  // Loading states
  isConnecting: false,
  connectionStatus: 'disconnected',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleServerSidebar: (state) => {
      state.isServerSidebarCollapsed = !state.isServerSidebarCollapsed;
    },
    toggleChannelSidebar: (state) => {
      state.isChannelSidebarCollapsed = !state.isChannelSidebarCollapsed;
    },
    toggleMemberList: (state) => {
      state.isMemberListVisible = !state.isMemberListVisible;
    },
    
    // Modal actions
    openCreateServerModal: (state) => {
      state.isCreateServerModalOpen = true;
    },
    closeCreateServerModal: (state) => {
      state.isCreateServerModalOpen = false;
    },
    openJoinServerModal: (state) => {
      state.isJoinServerModalOpen = true;
    },
    closeJoinServerModal: (state) => {
      state.isJoinServerModalOpen = false;
    },
    openCreateChannelModal: (state) => {
      state.isCreateChannelModalOpen = true;
    },
    closeCreateChannelModal: (state) => {
      state.isCreateChannelModalOpen = false;
    },
    openUserSettingsModal: (state) => {
      state.isUserSettingsModalOpen = true;
    },
    closeUserSettingsModal: (state) => {
      state.isUserSettingsModalOpen = false;
    },
    openServerSettingsModal: (state) => {
      state.isServerSettingsModalOpen = true;
    },
    closeServerSettingsModal: (state) => {
      state.isServerSettingsModalOpen = false;
    },
    
    // Theme and appearance
    setTheme: (state, action: PayloadAction<'dark' | 'light'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
      localStorage.setItem('fontSize', action.payload);
    },
    
    // Mobile responsiveness
    setIsMobile: (state, action: PayloadAction<boolean>) => {
      state.isMobile = action.payload;
    },
    setActiveMobileView: (state, action: PayloadAction<'servers' | 'channels' | 'chat' | 'members'>) => {
      state.activeMobileView = action.payload;
    },
    
    // Notifications
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'timestamp'>>) => {
      const notification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
      };
      state.notifications.push(notification);
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    
    // Voice/Video call actions
    joinVoiceChannel: (state, action: PayloadAction<string>) => {
      state.isInVoiceChannel = true;
      state.currentVoiceChannelId = action.payload;
    },
    leaveVoiceChannel: (state) => {
      state.isInVoiceChannel = false;
      state.currentVoiceChannelId = null;
      state.isDeafened = false;
      state.isMuted = false;
    },
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    toggleDeafen: (state) => {
      state.isDeafened = !state.isDeafened;
      if (state.isDeafened) {
        state.isMuted = true; // Deafening also mutes
      }
    },
    
    // Connection status
    setConnectionStatus: (state, action: PayloadAction<'connected' | 'connecting' | 'disconnected' | 'reconnecting'>) => {
      state.connectionStatus = action.payload;
      state.isConnecting = action.payload === 'connecting' || action.payload === 'reconnecting';
    },
  },
});

export const {
  // Sidebar actions
  toggleServerSidebar,
  toggleChannelSidebar,
  toggleMemberList,
  
  // Modal actions
  openCreateServerModal,
  closeCreateServerModal,
  openJoinServerModal,
  closeJoinServerModal,
  openCreateChannelModal,
  closeCreateChannelModal,
  openUserSettingsModal,
  closeUserSettingsModal,
  openServerSettingsModal,
  closeServerSettingsModal,
  
  // Theme and appearance
  setTheme,
  setFontSize,
  
  // Mobile responsiveness
  setIsMobile,
  setActiveMobileView,
  
  // Notifications
  addNotification,
  removeNotification,
  clearAllNotifications,
  
  // Voice/Video call actions
  joinVoiceChannel,
  leaveVoiceChannel,
  toggleMute,
  toggleDeafen,
  
  // Connection status
  setConnectionStatus,
} = uiSlice.actions;

export default uiSlice.reducer;
