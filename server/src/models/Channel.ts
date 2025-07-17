import mongoose, { Document, Schema } from 'mongoose';

export interface IChannel extends Document {
  name: string;
  description?: string;
  type: 'text' | 'voice' | 'category' | 'dm' | 'group_dm';
  server?: mongoose.Types.ObjectId;
  position: number;
  parentId?: mongoose.Types.ObjectId;
  permissionOverwrites: {
    id: mongoose.Types.ObjectId;
    type: 'role' | 'member';
    allow: string[];
    deny: string[];
  }[];
  topic?: string;
  nsfw: boolean;
  slowMode: number;
  bitrate?: number;
  userLimit?: number;
  lastMessageId?: mongoose.Types.ObjectId;
  lastPinTimestamp?: Date;
  participants?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const channelSchema = new Schema<IChannel>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1024
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'category', 'dm', 'group_dm'],
    required: true
  },
  server: {
    type: Schema.Types.ObjectId,
    ref: 'Server',
    required: function() {
      return !['dm', 'group_dm'].includes(this.type);
    }
  },
  position: {
    type: Number,
    default: 0
  },
  parentId: {
    type: Schema.Types.ObjectId,
    ref: 'Channel'
  },
  permissionOverwrites: [{
    id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    type: {
      type: String,
      enum: ['role', 'member'],
      required: true
    },
    allow: [{
      type: String
    }],
    deny: [{
      type: String
    }]
  }],
  topic: {
    type: String,
    maxlength: 1024
  },
  nsfw: {
    type: Boolean,
    default: false
  },
  slowMode: {
    type: Number,
    default: 0,
    min: 0,
    max: 21600 // 6 hours in seconds
  },
  bitrate: {
    type: Number,
    default: 64000,
    min: 8000,
    max: 128000
  },
  userLimit: {
    type: Number,
    default: 0,
    min: 0,
    max: 99
  },
  lastMessageId: {
    type: Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastPinTimestamp: {
    type: Date
  },
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Transform _id to id when converting to JSON
channelSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Transform _id to id when converting to Object
channelSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Indexes
channelSchema.index({ server: 1, position: 1 });
channelSchema.index({ type: 1 });
channelSchema.index({ participants: 1 });
channelSchema.index({ lastMessageId: 1 });

export default mongoose.model<IChannel>('Channel', channelSchema);
