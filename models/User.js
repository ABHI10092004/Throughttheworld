const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String
  },
  coverPhoto: {
    type: String
  },
  bio: {
    type: String
  },
  location: {
    type: String
  },
  socialLinks: {
    facebook: { type: String },
    twitter: { type: String },
    instagram: { type: String }
  },
  following: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  followers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = User = mongoose.model('user', UserSchema); 