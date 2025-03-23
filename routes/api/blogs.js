const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const Blog = require('../../models/Blog');
const User = require('../../models/User');

// @route   POST api/blogs
// @desc    Create a blog post
// @access  Private
router.post(
  '/',
  [
    auth,
    upload.single('coverImage'),
    [
      check('title', 'Title is required').not().isEmpty(),
      check('content', 'Content is required').not().isEmpty(),
      check('location', 'Location is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('Blog post request body:', req.body);
      const user = await User.findById(req.user.id).select('-password');

      // Parse tags if they exist and are in JSON format
      let tags = [];
      if (req.body.tags) {
        try {
          tags = JSON.parse(req.body.tags);
        } catch (e) {
          console.error('Error parsing tags:', e);
          // If parsing fails, try treating it as a comma-separated string
          tags = req.body.tags.split(',').map(tag => tag.trim());
        }
      }

      // Create the blog object
      const blogData = {
        title: req.body.title,
        content: req.body.content,
        location: req.body.location,
        user: req.user.id,
        excerpt: req.body.excerpt || '',
        isPublished: req.body.isPublished === 'true'
      };

      // Add tags if they exist
      if (tags.length > 0) {
        blogData.tags = tags;
      }

      // Add cover image if it was uploaded
      if (req.file) {
        blogData.coverImage = `/uploads/${req.file.filename}`;
      }
      
      console.log('Creating blog with data:', blogData);
      const newBlog = new Blog(blogData);

      const blog = await newBlog.save();
      
      // Return the blog with populated user data
      const populatedBlog = await Blog.findById(blog._id).populate('user', ['name', 'avatar']);

      res.json({ 
        success: true,
        blog: populatedBlog
      });
    } catch (err) {
      console.error('Server error creating blog:', err.message);
      res.status(500).json({ 
        success: false, 
        message: 'Server Error', 
        error: err.message 
      });
    }
  }
);

// @route   POST api/blogs/upload
// @desc    Upload blog images
// @access  Private
router.post('/upload', [auth, upload.array('images', 5)], async (req, res) => {
  try {
    const uploadedImages = req.files.map(file => ({
      url: `/uploads/${file.filename}`,
      caption: ''
    }));
    
    res.json(uploadedImages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/blogs
// @desc    Get all blogs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, tag, user } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    // Build filter
    const filter = {
      // By default, show only published blogs
      isPublished: true
    };
    
    // Add search filter if provided
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Filter by tag if provided
    if (tag) {
      filter.tags = { $in: [tag] };
    }
    
    // Filter by user if provided
    if (user) {
      filter.user = user;
    }
    
    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await Blog.countDocuments(filter);
    
    // Get blogs with pagination
    const blogs = await Blog.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('user', ['name', 'avatar']);
      
    // Build pagination metadata
    const pagination = {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum)
    };
    
    res.json({ 
      blogs, 
      pagination 
    });
  } catch (err) {
    console.error('Error fetching blogs:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: err.message
    });
  }
});

// @route   GET api/blogs/user/:id
// @desc    Get blogs by user ID
// @access  Public
router.get('/user/:id', async (req, res) => {
  try {
    const blogs = await Blog.find({ user: req.params.id }).sort({ date: -1 }).populate('user', ['name', 'avatar']);
    
    if (blogs.length === 0) {
      return res.status(404).json({ msg: 'No blogs found for this user' });
    }
    
    res.json(blogs);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/blogs/:id
// @desc    Get blog by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('user', ['name', 'avatar']);
    
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/blogs/:id
// @desc    Delete a blog
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    
    // Check user ownership
    if (blog.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    await blog.remove();
    
    res.json({ msg: 'Blog removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Blog not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/blogs/like/:id
// @desc    Like a blog
// @access  Private
router.put('/like/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    // Check if the blog has already been liked by this user
    if (blog.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Blog already liked' });
    }
    
    blog.likes.unshift({ user: req.user.id });
    
    await blog.save();
    
    res.json(blog.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/blogs/unlike/:id
// @desc    Unlike a blog
// @access  Private
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    // Check if the blog has already been liked by this user
    if (!blog.likes.some(like => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Blog has not yet been liked' });
    }
    
    // Remove the like
    blog.likes = blog.likes.filter(
      like => like.user.toString() !== req.user.id
    );
    
    await blog.save();
    
    res.json(blog.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/blogs/comment/:id
// @desc    Comment on a blog
// @access  Private
router.post(
  '/comment/:id',
  [
    auth,
    [check('text', 'Text is required').not().isEmpty()]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const user = await User.findById(req.user.id).select('-password');
      const blog = await Blog.findById(req.params.id);
      
      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };
      
      blog.comments.unshift(newComment);
      
      await blog.save();
      
      res.json(blog.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/blogs/comment/:id/:comment_id
// @desc    Delete a comment
// @access  Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    // Pull out comment
    const comment = blog.comments.find(
      comment => comment.id === req.params.comment_id
    );
    
    // Make sure comment exists
    if (!comment) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }
    
    // Check user ownership
    if (comment.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    // Remove comment
    blog.comments = blog.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );
    
    await blog.save();
    
    res.json(blog.comments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 