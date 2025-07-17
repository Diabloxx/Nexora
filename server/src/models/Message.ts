import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  channel: mongoose.Types.ObjectId;
  server?: mongoose.Types.ObjectId;
  type: 'default' | 'system' | 'reply' | 'thread_starter_message';
  editedAt?: Date;
  pinned: boolean;
  pinnedBy?: mongoose.Types.ObjectId;
  pinnedAt?: Date;
  attachments: {
    id: string;
    filename: string;
    size: number;
    url: string;
    proxyUrl: string;
    width?: number;
    height?: number;
    contentType: string;
  }[];
  embeds: {
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
  }[];
  reactions: {
    emoji: string;
    count: number;
    users: mongoose.Types.ObjectId[];
  }[];
  mentions: {
    users: mongoose.Types.ObjectId[];
    roles: mongoose.Types.ObjectId[];
    everyone: boolean;
    here: boolean;
  };
  reference?: {
    messageId: mongoose.Types.ObjectId;
    channelId: mongoose.Types.ObjectId;
    serverId?: mongoose.Types.ObjectId;
  };
  thread?: {
    id: mongoose.Types.ObjectId;
    messageCount: number;
    memberCount: number;
    lastMessageId?: mongoose.Types.ObjectId;
  };
  flags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  content: {
    type: String,
    required: true,
    maxlength: 2000
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  server: {
    type: Schema.Types.ObjectId,
    ref: 'Server'
  },
  type: {
    type: String,
    enum: ['default', 'system', 'reply', 'thread_starter_message'],
    default: 'default'
  },
  editedAt: {
    type: Date
  },
  pinned: {
    type: Boolean,
    default: false
  },
  pinnedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  pinnedAt: {
    type: Date
  },
  attachments: [{
    id: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    proxyUrl: {
      type: String,
      required: true
    },
    width: Number,
    height: Number,
    contentType: {
      type: String,
      required: true
    }
  }],
  embeds: [{
    title: String,
    description: String,
    url: String,
    timestamp: Date,
    color: Number,
    footer: {
      text: String,
      iconUrl: String
    },
    image: {
      url: String,
      width: Number,
      height: Number
    },
    thumbnail: {
      url: String,
      width: Number,
      height: Number
    },
    author: {
      name: String,
      url: String,
      iconUrl: String
    },
    fields: [{
      name: String,
      value: String,
      inline: Boolean
    }]
  }],
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  mentions: {
    users: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    roles: [{
      type: Schema.Types.ObjectId
    }],
    everyone: {
      type: Boolean,
      default: false
    },
    here: {
      type: Boolean,
      default: false
    }
  },
  reference: {
    messageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    channelId: {
      type: Schema.Types.ObjectId,
      ref: 'Channel'
    },
    serverId: {
      type: Schema.Types.ObjectId,
      ref: 'Server'
    }
  },
  thread: {
    id: {
      type: Schema.Types.ObjectId,
      ref: 'Channel'
    },
    messageCount: {
      type: Number,
      default: 0
    },
    memberCount: {
      type: Number,
      default: 0
    },
    lastMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  flags: [{
    type: String
  }]
}, {
  timestamps: true
});

// Transform _id to id when converting to JSON
messageSchema.set('toJSON', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Transform _id to id when converting to Object
messageSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Indexes for performance
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ author: 1 });
messageSchema.index({ server: 1 });
messageSchema.index({ pinned: 1 });
messageSchema.index({ 'mentions.users': 1 });

export default mongoose.model<IMessage>('Message', messageSchema);
