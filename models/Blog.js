const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user'
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    default: ''
  },
  coverImage: {
    type: String,
    default: ''
  },
  isPublished: {
    type: Boolean,
    default: true
  },
  images: [
    {
      url: {
        type: String,
        required: true
      },
      caption: {
        type: String
      }
    }
  ],
  tags: [
    {
      type: String
    }
  ],
  likes: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
      }
    }
  ],
  comments: [
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

module.exports = Blog = mongoose.model('blog', BlogSchema); 