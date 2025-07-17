import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface Message {
  id: string;
  content: string;
  type: 'default' | 'system' | 'reply' | 'thread_starter_message';
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  channel: string;
  createdAt: string;
  editedAt?: string;
  attachments?: any[];
  reactions?: any[];
}

interface ChatState {
  messages: { [channelId: string]: Message[] };
  isLoading: boolean;
  isLoadingMore: boolean;
  typingUsers: { [channelId: string]: string[] };
  error: string | null;
}

const initialState: ChatState = {
  messages: {},
  isLoading: false,
  isLoadingMore: false,
  typingUsers: {},
  error: null,
};

// Async thunks
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (params: { channelId: string; limit?: number; before?: string }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const { channelId, limit = 50, before } = params;
      
      let url = `${API_URL}/messages/${channelId}?limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return { channelId, messages: response.data.data, isLoadingMore: !!before };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData: { 
    channelId: string; 
    content: string; 
    type?: 'default' | 'system' | 'reply' | 'thread_starter_message';
    replyTo?: string;
    attachments?: any[];
  }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      console.log('Sending message:', messageData);
      console.log('Using token:', token ? 'Token exists' : 'No token');
      
      const payload: any = {
        content: messageData.content,
        type: messageData.type || 'default'
      };

      if (messageData.replyTo) {
        payload.replyTo = messageData.replyTo;
      }

      if (messageData.attachments && messageData.attachments.length > 0) {
        payload.attachments = messageData.attachments;
      }
      
      const response = await axios.post(`${API_URL}/messages/${messageData.channelId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Message send response:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('Message send error:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.error || 'Failed to send message');
    }
  }
);

export const editMessage = createAsyncThunk(
  'chat/editMessage',
  async (params: { messageId: string; content: string }, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      const response = await axios.put(`${API_URL}/messages/${params.messageId}`, {
        content: params.content
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to edit message');
    }
  }
);

export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async (messageId: string, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      await axios.delete(`${API_URL}/messages/${messageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return messageId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const channelId = message.channel;
      
      if (!state.messages[channelId]) {
        state.messages[channelId] = [];
      }
      
      // Check if message already exists (to prevent duplicates from socket events)
      const existingMessage = state.messages[channelId].find(m => m.id === message.id);
      if (!existingMessage) {
        state.messages[channelId].push(message);
        // Sort messages by creation date
        state.messages[channelId].sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    },
    updateMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const channelId = message.channel;
      
      if (state.messages[channelId]) {
        const index = state.messages[channelId].findIndex(m => m.id === message.id);
        if (index !== -1) {
          state.messages[channelId][index] = message;
        }
      }
    },
    updateMessageReactions: (state, action: PayloadAction<{ messageId: string; reactions: any[] }>) => {
      const { messageId, reactions } = action.payload;
      
      // Find and update the message in any channel
      Object.keys(state.messages).forEach(channelId => {
        const messageIndex = state.messages[channelId].findIndex(m => m.id === messageId);
        if (messageIndex !== -1) {
          state.messages[channelId][messageIndex].reactions = reactions;
        }
      });
    },
    removeMessage: (state, action: PayloadAction<{ messageId: string; channelId: string }>) => {
      const { messageId, channelId } = action.payload;
      
      if (state.messages[channelId]) {
        state.messages[channelId] = state.messages[channelId].filter(m => m.id !== messageId);
      }
    },
    setTypingUsers: (state, action: PayloadAction<{ channelId: string; users: string[] }>) => {
      const { channelId, users } = action.payload;
      state.typingUsers[channelId] = users;
    },
    addTypingUser: (state, action: PayloadAction<{ channelId: string; userId: string }>) => {
      const { channelId, userId } = action.payload;
      
      if (!state.typingUsers[channelId]) {
        state.typingUsers[channelId] = [];
      }
      
      if (!state.typingUsers[channelId].includes(userId)) {
        state.typingUsers[channelId].push(userId);
      }
    },
    removeTypingUser: (state, action: PayloadAction<{ channelId: string; userId: string }>) => {
      const { channelId, userId } = action.payload;
      
      if (state.typingUsers[channelId]) {
        state.typingUsers[channelId] = state.typingUsers[channelId].filter(id => id !== userId);
      }
    },
    clearMessages: (state, action: PayloadAction<string>) => {
      const channelId = action.payload;
      delete state.messages[channelId];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state, action) => {
        if (action.meta.arg.before) {
          state.isLoadingMore = true;
        } else {
          state.isLoading = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { channelId, messages, isLoadingMore } = action.payload;
        
        if (isLoadingMore) {
          // Prepend older messages
          if (state.messages[channelId]) {
            state.messages[channelId] = [...messages, ...state.messages[channelId]];
          } else {
            state.messages[channelId] = messages;
          }
          state.isLoadingMore = false;
        } else {
          // Replace with fresh messages
          state.messages[channelId] = messages;
          state.isLoading = false;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message will be added via socket event, so we don't need to add it here
        // This prevents duplicates
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Edit message
      .addCase(editMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const channelId = message.channel;
        
        if (state.messages[channelId]) {
          const index = state.messages[channelId].findIndex(m => m.id === message.id);
          if (index !== -1) {
            state.messages[channelId][index] = message;
          }
        }
      })
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const messageId = action.payload;
        
        // Find and remove message from all channels
        Object.keys(state.messages).forEach(channelId => {
          state.messages[channelId] = state.messages[channelId].filter(m => m.id !== messageId);
        });
      });
  },
});

export const {
  addMessage,
  updateMessage,
  updateMessageReactions,
  removeMessage,
  setTypingUsers,
  addTypingUser,
  removeTypingUser,
  clearMessages,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
