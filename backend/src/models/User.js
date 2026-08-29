const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [30, 'Username cannot exceed 30 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userSchema.virtual('avatarFallback').get(function () {
  if (this.avatar) return this.avatar;
  return this.name ? this.name.charAt(0).toUpperCase() : '?';
});

userSchema.set('toJSON', {
  virtuals: true,
  transform(_doc, ret) {
    delete ret.password;
    delete ret.fcmTokens;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
