import mongoose, { Document, Schema } from 'mongoose';

export interface IServer extends Document {
  name: string;
  description?: string;
  icon?: string;
  banner?: string;
  owner: mongoose.Types.ObjectId;
  members: {
    user: mongoose.Types.ObjectId;
    roles: mongoose.Types.ObjectId[];
    joinedAt: Date;
    nickname?: string;
  }[];
  channels: mongoose.Types.ObjectId[];
  roles: {
    _id: mongoose.Types.ObjectId;
    name: string;
    color: string;
    permissions: string[];
    position: number;
    mentionable: boolean;
    hoisted: boolean;
  }[];
  invites: {
    code: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    expiresAt?: Date;
    maxUses?: number;
    uses: number;
  }[];
  isPublic: boolean;
  vanityUrl?: string;
  verificationLevel: 'none' | 'low' | 'medium' | 'high';
  defaultMessageNotifications: 'all' | 'mentions';
  explicitContentFilter: 'disabled' | 'members_without_roles' | 'all_members';
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const serverSchema = new Schema<IServer>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 120,
    default: ''
  },
  icon: {
    type: String,
    default: null
  },
  banner: {
    type: String,
    default: null
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    roles: [{
      type: Schema.Types.ObjectId
    }],
    joinedAt: {
      type: Date,
      default: Date.now
    },
    nickname: {
      type: String,
      maxlength: 32
    }
  }],
  channels: [{
    type: Schema.Types.ObjectId,
    ref: 'Channel'
  }],
  roles: [{
    _id: {
      type: Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    color: {
      type: String,
      default: '#99AAB5'
    },
    permissions: [{
      type: String
    }],
    position: {
      type: Number,
      default: 0
    },
    mentionable: {
      type: Boolean,
      default: false
    },
    hoisted: {
      type: Boolean,
      default: false
    }
  }],
  invites: [{
    code: {
      type: String,
      required: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: null
    },
    maxUses: {
      type: Number,
      default: null
    },
    uses: {
      type: Number,
      default: 0
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  vanityUrl: {
    type: String,
    unique: true,
    sparse: true
  },
  verificationLevel: {
    type: String,
    enum: ['none', 'low', 'medium', 'high'],
    default: 'none'
  },
  defaultMessageNotifications: {
    type: String,
    enum: ['all', 'mentions'],
    default: 'all'
  },
  explicitContentFilter: {
    type: String,
    enum: ['disabled', 'members_without_roles', 'all_members'],
    default: 'disabled'
  },
  features: [{
    type: String
  }]
}, {
  timestamps: true
});

// Transform _id to id when converting to JSON
serverSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Transform _id to id when converting to Object
serverSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Create default @everyone role
serverSchema.pre('save', function(next) {
  if (this.isNew && this.roles.length === 0) {
    this.roles.push({
      _id: new mongoose.Types.ObjectId(),
      name: '@everyone',
      color: '#99AAB5',
      permissions: ['READ_MESSAGES', 'SEND_MESSAGES'],
      position: 0,
      mentionable: false,
      hoisted: false
    });
  }
  next();
});

// Indexes
serverSchema.index({ owner: 1 });
serverSchema.index({ 'members.user': 1 });
serverSchema.index({ isPublic: 1 });
serverSchema.index({ vanityUrl: 1 }, { sparse: true });
serverSchema.index({ 'invites.code': 1 }, { sparse: true });

export default mongoose.model<IServer>('Server', serverSchema);
