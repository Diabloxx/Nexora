import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  isOnline: boolean;
  globalRole: 'user' | 'moderator' | 'staff' | 'admin' | 'owner';
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isLoading: false,
  isAuthenticated: !!localStorage.getItem('token'),
  error: null,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      const { token, refreshToken, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      return { token, refreshToken, user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, credentials);
      const { token, refreshToken, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      return { token, refreshToken, user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      if (token) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      return null;
    } catch (error: any) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      return null;
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const token = (getState() as any).auth.token;
      if (!token) {
        return rejectWithValue('No token found');
      }
      
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get user');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserStatus: (state, action: PayloadAction<{ status: User['status']; isOnline: boolean }>) => {
      if (state.user) {
        state.user.status = action.payload.status;
        state.user.isOnline = action.payload.isOnline;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        state.error = null;
      })
      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.refreshToken = null;
        state.user = null;
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      });
  },
});

export const { clearError, updateUserStatus } = authSlice.actions;
export default authSlice.reducer;
