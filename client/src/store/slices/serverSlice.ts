import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('API_URL:', API_URL); // Debug log

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
  invites: Invite[];
  isPublic: boolean;
  vanityUrl?: string;
  memberCount: number;
  verificationLevel?: string;
  defaultMessageNotifications?: string;
  explicitContentFilter?: string;
  features?: string[];
}

export interface ServerMember {
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
    status: string;
    isOnline: boolean;
  };
  roles: string[];
  joinedAt: string;
  nickname?: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'category';
  server: string;
  position: number;
  parent?: string;
  topic?: string;
  nsfw: boolean;
  rateLimitPerUser: number;
  userLimit?: number;
  bitrate?: number;
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

export interface Invite {
  id: string;
  code: string;
  createdBy: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  uses: number;
  server: string;
}

interface ServerState {
  servers: Server[];
  currentServer: Server | null;
  currentChannel: Channel | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ServerState = {
  servers: [],
  currentServer: null,
  currentChannel: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchUserServers = createAsyncThunk(
  'servers/fetchUserServers',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      console.log('Fetching user servers with token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.get(`${API_URL}/servers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Fetch servers response:', response.data);
      return response.data.servers || response.data.data || [];
    } catch (error: any) {
      console.error('Fetch servers error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch servers');
    }
  }
);

export const createServer = createAsyncThunk(
  'servers/createServer',
  async (serverData: { name: string; description?: string; icon?: string }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      console.log('Creating server with data:', serverData);
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const response = await axios.post(`${API_URL}/servers`, serverData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Server creation response:', response.data);
      return response.data.server || response.data.data || response.data;
    } catch (error: any) {
      console.error('Server creation error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to create server');
    }
  }
);

export const fetchServerDetails = createAsyncThunk(
  'servers/fetchServerDetails',
  async (serverId: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.get(`${API_URL}/servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch server details');
    }
  }
);

export const createChannel = createAsyncThunk(
  'servers/createChannel',
  async (channelData: { 
    serverId: string; 
    name: string; 
    type: 'text' | 'voice' | 'category';
    description?: string;
    parent?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.post(`${API_URL}/servers/${channelData.serverId}/channels`, {
        name: channelData.name,
        type: channelData.type,
        description: channelData.description,
        parent: channelData.parent,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create channel');
    }
  }
);

export const fetchServerMembers = createAsyncThunk(
  'servers/fetchServerMembers',
  async (serverId: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.get(`${API_URL}/servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return { serverId, members: response.data.server.members };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch server members');
    }
  }
);

export const joinServer = createAsyncThunk(
  'servers/joinServer',
  async (inviteCode: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.post(`${API_URL}/servers/join/${inviteCode}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to join server');
    }
  }
);

export const updateServerSettings = createAsyncThunk(
  'servers/updateServerSettings',
  async (data: { 
    serverId: string; 
    name?: string; 
    description?: string; 
    icon?: string;
    banner?: string;
    isPublic?: boolean;
    verificationLevel?: string;
    defaultMessageNotifications?: string;
    explicitContentFilter?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.patch(`${API_URL}/servers/${data.serverId}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update server settings');
    }
  }
);

export const createInvite = createAsyncThunk(
  'servers/createInvite',
  async (data: {
    serverId: string;
    maxUses?: number;
    expiresAt?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.post(`${API_URL}/servers/${data.serverId}/invites`, {
        maxUses: data.maxUses,
        expiresAt: data.expiresAt,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create invite');
    }
  }
);

export const fetchServerInvites = createAsyncThunk(
  'servers/fetchServerInvites',
  async (serverId: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.get(`${API_URL}/servers/${serverId}/invites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch invites');
    }
  }
);

export const deleteInvite = createAsyncThunk(
  'servers/deleteInvite',
  async (data: { serverId: string; inviteCode: string }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      await axios.delete(`${API_URL}/servers/${data.serverId}/invites/${data.inviteCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.inviteCode;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete invite');
    }
  }
);

export const kickMember = createAsyncThunk(
  'servers/kickMember',
  async (data: { serverId: string; userId: string }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      await axios.delete(`${API_URL}/servers/${data.serverId}/members/${data.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to kick member');
    }
  }
);

export const banMember = createAsyncThunk(
  'servers/banMember',
  async (data: { serverId: string; userId: string; reason?: string }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      await axios.post(`${API_URL}/servers/${data.serverId}/bans`, {
        userId: data.userId,
        reason: data.reason,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return data.userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to ban member');
    }
  }
);

export const updateMemberRoles = createAsyncThunk(
  'servers/updateMemberRoles',
  async (data: { serverId: string; userId: string; roles: string[] }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.patch(`${API_URL}/servers/${data.serverId}/members/${data.userId}`, {
        roles: data.roles,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update member roles');
    }
  }
);

export const deleteServer = createAsyncThunk(
  'servers/deleteServer',
  async (serverId: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      await axios.delete(`${API_URL}/servers/${serverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return serverId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete server');
    }
  }
);

export const leaveServer = createAsyncThunk(
  'servers/leaveServer',
  async (serverId: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      await axios.post(`${API_URL}/servers/${serverId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return serverId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to leave server');
    }
  }
);

const serverSlice = createSlice({
  name: 'servers',
  initialState,
  reducers: {
    setCurrentServer: (state, action: PayloadAction<Server | null>) => {
      state.currentServer = action.payload;
      state.currentChannel = null; // Reset channel when switching servers
    },
    setCurrentChannel: (state, action: PayloadAction<Channel | null>) => {
      state.currentChannel = action.payload;
    },
    addServer: (state, action: PayloadAction<Server>) => {
      state.servers.push(action.payload);
    },
    updateServer: (state, action: PayloadAction<Server>) => {
      const index = state.servers.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.servers[index] = action.payload;
      }
      if (state.currentServer?.id === action.payload.id) {
        state.currentServer = action.payload;
      }
    },
    addChannel: (state, action: PayloadAction<Channel>) => {
      if (state.currentServer) {
        state.currentServer.channels.push(action.payload);
      }
      const serverIndex = state.servers.findIndex(s => s.id === action.payload.server);
      if (serverIndex !== -1) {
        state.servers[serverIndex].channels.push(action.payload);
      }
    },
    updateMemberStatus: (state, action: PayloadAction<{ userId: string; status: string; isOnline: boolean }>) => {
      const { userId, status, isOnline } = action.payload;
      
      // Update in all servers
      state.servers.forEach(server => {
        const member = server.members.find(m => m.user.id === userId);
        if (member) {
          member.user.status = status;
          member.user.isOnline = isOnline;
        }
      });
      
      // Update in current server
      if (state.currentServer) {
        const member = state.currentServer.members.find(m => m.user.id === userId);
        if (member) {
          member.user.status = status;
          member.user.isOnline = isOnline;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user servers
      .addCase(fetchUserServers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserServers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.servers = action.payload;
      })
      .addCase(fetchUserServers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create server
      .addCase(createServer.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createServer.fulfilled, (state, action) => {
        state.isLoading = false;
        state.servers.push(action.payload);
      })
      .addCase(createServer.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch server details
      .addCase(fetchServerDetails.fulfilled, (state, action) => {
        const serverIndex = state.servers.findIndex(s => s.id === action.payload.id);
        if (serverIndex !== -1) {
          state.servers[serverIndex] = action.payload;
        }
        if (state.currentServer?.id === action.payload.id) {
          state.currentServer = action.payload;
        }
      })
      // Create channel
      .addCase(createChannel.fulfilled, (state, action) => {
        if (state.currentServer) {
          state.currentServer.channels.push(action.payload);
        }
        const serverIndex = state.servers.findIndex(s => s.id === action.payload.server);
        if (serverIndex !== -1) {
          state.servers[serverIndex].channels.push(action.payload);
        }
      })
      // Fetch server members
      .addCase(fetchServerMembers.fulfilled, (state, action) => {
        const { serverId, members } = action.payload;
        const serverIndex = state.servers.findIndex(s => s.id === serverId);
        if (serverIndex !== -1) {
          state.servers[serverIndex].members = members;
        }
        if (state.currentServer?.id === serverId) {
          state.currentServer.members = members;
        }
      })
      // Join server
      .addCase(joinServer.fulfilled, (state, action) => {
        state.servers.push(action.payload);
      })
      // Update server settings
      .addCase(updateServerSettings.fulfilled, (state, action) => {
        const serverIndex = state.servers.findIndex(s => s.id === action.payload.id);
        if (serverIndex !== -1) {
          state.servers[serverIndex] = action.payload;
        }
        if (state.currentServer?.id === action.payload.id) {
          state.currentServer = action.payload;
        }
      })
      // Create invite
      .addCase(createInvite.fulfilled, (state, action) => {
        if (state.currentServer) {
          state.currentServer.invites.push(action.payload);
        }
        const serverIndex = state.servers.findIndex(s => s.id === action.payload.server);
        if (serverIndex !== -1) {
          state.servers[serverIndex].invites.push(action.payload);
        }
      })
      // Fetch server invites
      .addCase(fetchServerInvites.fulfilled, (state, action) => {
        const invites = action.payload;
        // Find server by checking if it has any of these invites
        const serverIndex = state.servers.findIndex(s => 
          invites.length > 0 && invites[0].server === s.id
        );
        if (serverIndex !== -1) {
          state.servers[serverIndex].invites = invites;
        }
        if (state.currentServer && invites.length > 0 && invites[0].server === state.currentServer.id) {
          state.currentServer.invites = invites;
        }
      })
      // Delete invite
      .addCase(deleteInvite.fulfilled, (state, action) => {
        state.servers.forEach(server => {
          server.invites = server.invites.filter(i => i.code !== action.payload);
        });
        if (state.currentServer) {
          state.currentServer.invites = state.currentServer.invites.filter(i => i.code !== action.payload);
        }
      })
      // Kick member
      .addCase(kickMember.fulfilled, (state, action) => {
        state.servers.forEach(server => {
          server.members = server.members.filter(m => m.user.id !== action.payload);
        });
        if (state.currentServer) {
          state.currentServer.members = state.currentServer.members.filter(m => m.user.id !== action.payload);
        }
      })
      // Ban member
      .addCase(banMember.fulfilled, (state, action) => {
        state.servers.forEach(server => {
          server.members = server.members.filter(m => m.user.id !== action.payload);
        });
        if (state.currentServer) {
          state.currentServer.members = state.currentServer.members.filter(m => m.user.id !== action.payload);
        }
      })
      // Update member roles
      .addCase(updateMemberRoles.fulfilled, (state, action) => {
        const { serverId, userId, roles } = action.payload;
        const serverIndex = state.servers.findIndex(s => s.id === serverId);
        if (serverIndex !== -1) {
          const memberIndex = state.servers[serverIndex].members.findIndex(m => m.user.id === userId);
          if (memberIndex !== -1) {
            state.servers[serverIndex].members[memberIndex].roles = roles;
          }
        }
        if (state.currentServer && state.currentServer.id === serverId) {
          const memberIndex = state.currentServer.members.findIndex(m => m.user.id === userId);
          if (memberIndex !== -1) {
            state.currentServer.members[memberIndex].roles = roles;
          }
        }
      })
      // Delete server
      .addCase(deleteServer.fulfilled, (state, action) => {
        state.servers = state.servers.filter(s => s.id !== action.payload);
        if (state.currentServer?.id === action.payload) {
          state.currentServer = null;
          state.currentChannel = null;
        }
      })
      // Leave server
      .addCase(leaveServer.fulfilled, (state, action) => {
        state.servers = state.servers.filter(s => s.id !== action.payload);
        if (state.currentServer?.id === action.payload) {
          state.currentServer = null;
          state.currentChannel = null;
        }
      });
  },
});

export const {
  setCurrentServer,
  setCurrentChannel,
  addServer,
  updateServer,
  addChannel,
  updateMemberStatus,
  clearError,
} = serverSlice.actions;

export default serverSlice.reducer;
