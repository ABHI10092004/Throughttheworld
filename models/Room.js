const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  destination: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  isDirect: {
    type: Boolean,
    default: false
  },
  password: {
    type: String
  },
  members: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      },
      isAdmin: {
        type: Boolean,
        default: false
      },
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  messages: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      },
      text: {
        type: String,
        required: true
      },
      name: {
        type: String
      },
      avatar: {
        type: String
      },
      image: {
        type: String
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Room = mongoose.model('room', RoomSchema);