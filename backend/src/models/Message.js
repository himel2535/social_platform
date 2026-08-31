const mongoose = require('mongoose');

const MESSAGE_TYPES = ['text', 'shared_post'];

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver is required'],
    },
    type: {
      type: String,
      enum: MESSAGE_TYPES,
      default: 'text',
    },
    text: {
      type: String,
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
      default: '',
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

messageSchema.pre('validate', function validateMessage(next) {
  if (this.type === 'shared_post') {
    if (!this.postId) {
      return next(new Error('Shared post messages require a postId'));
    }

    if (!this.text || !this.text.trim()) {
      this.text = 'Shared a post';
    }

    return next();
  }

  const trimmed = (this.text || '').trim();
  if (!trimmed) {
    return next(new Error('Message text cannot be empty'));
  }

  if (trimmed.length > 2000) {
    return next(new Error('Message cannot exceed 2000 characters'));
  }

  this.text = trimmed;
  return next();
});

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, _id: -1 });

messageSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Message', messageSchema);
