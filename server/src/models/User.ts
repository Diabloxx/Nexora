import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  username: string;
  displayName: string;
  password?: string;
  avatar?: string;
  bio?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  isOnline: boolean;
  lastSeen: Date;
  emailVerified: boolean;
  globalRole: 'user' | 'moderator' | 'staff' | 'admin' | 'owner';
  permissions: string[];
  staffInfo?: {
    appointedBy: mongoose.Types.ObjectId;
    appointedAt: Date;
    department: string;
    notes: string;
  };
  oauth: {
    google?: {
      id: string;
      email: string;
    };
    github?: {
      id: string;
      username: string;
    };
  };
  servers: mongoose.Types.ObjectId[];
  friends: mongoose.Types.ObjectId[];
  friendRequests: {
    sent: mongoose.Types.ObjectId[];
    received: mongoose.Types.ObjectId[];
  };
  blocked: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 32
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 32
  },
  password: {
    type: String,
    minlength: 6
  },
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 190,
    default: ''
  },
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
    default: 'offline'
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  globalRole: {
    type: String,
    enum: ['user', 'moderator', 'staff', 'admin', 'owner'],
    default: 'user'
  },
  permissions: [{
    type: String,
    enum: [
      'manage_users',
      'manage_servers', 
      'manage_announcements',
      'view_analytics',
      'moderate_content',
      'manage_staff',
      'access_admin_panel'
    ]
  }],
  staffInfo: {
    appointedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    appointedAt: Date,
    department: String,
    notes: String
  },
  oauth: {
    google: {
      id: String,
      email: String
    },
    github: {
      id: String,
      username: String
    }
  },
  servers: [{
    type: Schema.Types.ObjectId,
    ref: 'Server'
  }],
  friends: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: {
    sent: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    received: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  blocked: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Transform _id to id when converting to JSON
userSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.password; // Never send password in response
    return ret;
  }
});

// Transform _id to id when converting to Object
userSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });

export default mongoose.model<IUser>('User', userSchema);
