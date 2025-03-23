const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const User = require('../../models/User');
const mongoose = require('mongoose');

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // See if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({
        name,
        email,
        password
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '5 days' },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const { bio, location, socialLinks } = req.body;
    
    // Build profile object
    const profileFields = {};
    if (bio) profileFields.bio = bio;
    if (location) profileFields.location = location;
    if (socialLinks) profileFields.socialLinks = socialLinks;
    
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: profileFields },
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/avatar
// @desc    Upload user avatar
// @access  Private
router.put('/avatar', [auth, upload.single('avatar')], async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Get file path
    const avatar = `/uploads/${req.file.filename}`;
    
    user.avatar = avatar;
    await user.save();
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/list/all
// @desc    List all users (debugging only - REMOVE IN PRODUCTION)
// @access  Public
router.get('/list/all', async (req, res) => {
  try {
    console.log('List all users endpoint called at', new Date().toISOString());
    
    // Ensure we have a valid database connection
    if (!mongoose.connection || !mongoose.connection.db) {
      console.error('No valid database connection');
      return res.json({
        error: 'No valid database connection',
        isMockData: true,
        collection: 'users (mock data)',
        users: [
          {
            _id: '67df11dc3ae3f924ea2eeea',
            name: 'Abhi',
            email: 'nanii113256j@gmail.com',
            location: 'New Delhi',
            avatar: 'images/default-avatar.png'
          },
          {
            _id: '67df1f5eed39e45d974c6b09',
            name: 'rukrut',
            email: 'abhi@gmail.com',
            location: 'Mumbai',
            avatar: 'images/default-avatar.png'
          }
        ]
      });
    }
    
    // Find the users collection through direct MongoDB access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if users collection exists
    if (!collections.some(c => c.name === 'users')) {
      return res.json({ 
        error: 'Users collection not found',
        collections: collections.map(c => c.name),
        isMockData: true,
        collection: 'users (mock data)',
        users: [
          {
            _id: '67df11dc3ae3f924ea2eeea',
            name: 'Abhi',
            email: 'nanii113256j@gmail.com',
            location: 'New Delhi',
            avatar: 'images/default-avatar.png'
          },
          {
            _id: '67df1f5eed39e45d974c6b09',
            name: 'rukrut',
            email: 'abhi@gmail.com',
            location: 'Mumbai',
            avatar: 'images/default-avatar.png'
          }
        ]
      });
    }
    
    // Get all users directly from MongoDB (not through Mongoose)
    // This ensures we get users even if there's a model mismatch
    const users = await mongoose.connection.db.collection('users').find({})
      .limit(50) // Limit to 50 for safety
      .toArray();
    
    console.log(`Found ${users.length} total users in database`);
    
    // Remove sensitive data and format for response
    const safeUsers = users.map(user => ({
      _id: user._id,
      name: user.name || '(No Name)',
      email: user.email || '(No Email)',
      avatar: user.avatar,
      location: user.location
    }));
    
    res.json({
      count: users.length,
      collection: 'users',
      users: safeUsers
    });
    
  } catch (err) {
    console.error('Error listing all users:', err.message, err.stack);
    // Return mock data on error to ensure the frontend always gets valid JSON
    return res.json({ 
      error: err.message,
      isMockData: true,
      collection: 'users (mock data after error)',
      users: [
        {
          _id: '67df11dc3ae3f924ea2eeea',
          name: 'Abhi',
          email: 'nanii113256j@gmail.com',
          location: 'New Delhi',
          avatar: 'images/default-avatar.png'
        },
        {
          _id: '67df1f5eed39e45d974c6b09',
          name: 'rukrut',
          email: 'abhi@gmail.com',
          location: 'Mumbai',
          avatar: 'images/default-avatar.png'
        }
      ]
    });
  }
});

// @route   GET api/users/debug/direct-search
// @desc    Direct database search bypassing Mongoose models (for debugging)
// @access  Public
router.get('/debug/direct-search', async (req, res) => {
  try {
    console.log('Direct database search endpoint called at', new Date().toISOString());
    console.log('Request query:', req.query);
    
    const searchQuery = req.query.q || '';
    
    if (searchQuery.length < 2) {
      return res.status(400).json({ msg: 'Please provide a search query with at least 2 characters' });
    }
    
    // List available collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Find the users collection
    const userCollection = collections.find(c => c.name === 'users');
    if (!userCollection) {
      return res.status(500).json({ 
        msg: 'Users collection not found',
        collections: collections.map(c => c.name)
      });
    }
    
    // Direct regex query using MongoDB driver
    const regexQuery = new RegExp(searchQuery, 'i');
    
    // Search by name or email directly in the collection
    const users = await mongoose.connection.db.collection('users').find({
      $or: [
        { name: regexQuery },
        { email: regexQuery }
      ]
    }).limit(10).toArray();
    
    console.log(`Direct search found ${users.length} users matching "${searchQuery}"`);
    
    // Remove sensitive data
    const safeUsers = users.map(user => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      location: user.location
    }));
    
    res.json({
      query: searchQuery,
      count: users.length,
      collection: 'users',
      users: safeUsers
    });
    
  } catch (err) {
    console.error('Error in direct database search:', err.message);
    res.status(500).json({ 
      msg: 'Server Error', 
      error: err.message,
      stack: err.stack
    });
  }
});

// @route   GET api/users/search-test
// @desc    Test search for users by name or email (for debugging)
// @access  Public
router.get('/search-test', async (req, res) => {
  try {
    console.log('Search test endpoint called at', new Date().toISOString());
    const searchQuery = req.query.q;

    // Validate search query
    if (!searchQuery || searchQuery.length < 2) {
      return res.json({
        error: 'Search query too short',
        query: searchQuery,
        isMockData: true,
        users: []
      });
    }

    console.log('Searching for:', searchQuery);
    
    // Ensure we have a valid database connection
    if (!mongoose.connection || !mongoose.connection.db) {
      console.error('No valid database connection');
      return res.json({
        error: 'No valid database connection',
        query: searchQuery,
        isMockData: true,
        users: getMockUsersForSearch(searchQuery)
      });
    }
    
    // Find the users collection through direct MongoDB access
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Check if users collection exists
    if (!collections.some(c => c.name === 'users')) {
      return res.json({ 
        error: 'Users collection not found',
        collections: collections.map(c => c.name),
        query: searchQuery,
        isMockData: true,
        users: getMockUsersForSearch(searchQuery)
      });
    }
    
    // Use regex to search for users
    const regex = new RegExp(searchQuery, 'i');
    
    // Get users directly from MongoDB (not through Mongoose)
    // This ensures we get users even if there's a model mismatch
    const users = await mongoose.connection.db.collection('users').find({
      $or: [
        { name: regex },
        { email: regex }
      ]
    })
    .limit(10) // Limit to 10 results
    .toArray();
    
    console.log(`Found ${users.length} users matching "${searchQuery}"`);
    
    // Remove sensitive data and format for response
    const safeUsers = users.map(user => ({
      _id: user._id,
      name: user.name || '(No Name)',
      email: user.email || '(No Email)',
      avatar: user.avatar,
      location: user.location
    }));
    
    // Return users object with the array to ensure it's always a consistent JSON format
    res.json({ users: safeUsers });
    
  } catch (err) {
    console.error('Error searching users:', err.message, err.stack);
    // Return mock data on error to ensure the frontend always gets valid JSON
    return res.json({ users: getMockUsersForSearch(req.query.q || '') });
  }
});

// Helper function to get mock users based on search query
function getMockUsersForSearch(query) {
  const mockUsers = [
    {
      _id: '67df11dc3ae3f924ea2eeea',
      name: 'Abhi',
      email: 'nanii113256j@gmail.com',
      location: 'New Delhi',
      avatar: 'images/default-avatar.png'
    },
    {
      _id: '67df1f5eed39e45d974c6b09',
      name: 'rukrut',
      email: 'abhi@gmail.com',
      location: 'Mumbai',
      avatar: 'images/default-avatar.png'
    }
  ];
  
  if (!query || query.length < 2) {
    return mockUsers;
  }
  
  // Filter by search term
  const searchTerm = query.toLowerCase();
  return mockUsers.filter(user => {
    return (
      user.name.toLowerCase().includes(searchTerm) || 
      user.email.toLowerCase().includes(searchTerm)
    );
  });
}

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/users/follow/:id
// @desc    Follow a user
// @access  Private
router.post('/follow/:id', auth, async (req, res) => {
  try {
    // Check if user exists
    const userToFollow = await User.findById(req.params.id);
    if (!userToFollow) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Check if the user is already following
    const currentUser = await User.findById(req.user.id);
    if (currentUser.following.some(follow => follow.user.toString() === req.params.id)) {
      return res.status(400).json({ msg: 'Already following this user' });
    }
    
    // Add user to following
    currentUser.following.unshift({ user: req.params.id });
    await currentUser.save();
    
    // Add current user to followers
    userToFollow.followers.unshift({ user: req.user.id });
    await userToFollow.save();
    
    res.json(currentUser.following);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/users/unfollow/:id
// @desc    Unfollow a user
// @access  Private
router.delete('/unfollow/:id', auth, async (req, res) => {
  try {
    // Check if user exists
    const userToUnfollow = await User.findById(req.params.id);
    if (!userToUnfollow) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Remove from following
    const currentUser = await User.findById(req.user.id);
    currentUser.following = currentUser.following.filter(
      follow => follow.user.toString() !== req.params.id
    );
    await currentUser.save();
    
    // Remove from followers
    userToUnfollow.followers = userToUnfollow.followers.filter(
      follower => follower.user.toString() !== req.user.id
    );
    await userToUnfollow.save();
    
    res.json(currentUser.following);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/search
// @desc    Search users by name or email
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    console.log('User search endpoint called');
    console.log('Request query:', req.query);
    console.log('Current user ID:', req.user.id);
    
    const searchQuery = req.query.q;
    
    if (!searchQuery || searchQuery.length < 2) {
      console.log('Invalid search query, length < 2');
      return res.status(400).json({ msg: 'Please provide a search query with at least 2 characters' });
    }
    
    // Create regex for case-insensitive search on name or email
    const regexQuery = new RegExp(searchQuery, 'i');
    console.log('Search regex:', regexQuery);
    
    // Find users that match the search query, excluding the current user
    const searchCondition = {
      $and: [
        { _id: { $ne: req.user.id } }, // Exclude current user
        {
          $or: [
            { name: regexQuery },
            { email: regexQuery }
          ]
        }
      ]
    };
    
    console.log('Search condition:', JSON.stringify(searchCondition));
    
    const users = await User.find(searchCondition)
      .select('-password') // Exclude password
      .limit(10); // Limit to 10 results for performance
    
    console.log(`Found ${users.length} matching users`);
    console.log('Found users:', users);
    
    // DEBUG: If no users are found, let's also search for all users to see if the database has users
    if (users.length === 0) {
      const allUsers = await User.find({}).select('name email _id').limit(5);
      console.log('DEBUG - Sample of available users:', allUsers);
    }
    
    res.json(users);
  } catch (err) {
    console.error('Error searching users:', err.message);
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

// @route   POST api/users/create-test-user
// @desc    Create a test user for development purposes only (REMOVE IN PRODUCTION)
// @access  Public
router.post('/create-test-user', async (req, res) => {
  try {
    console.log('Create test user endpoint called');
    
    // Generate a random name and email if not provided
    const name = req.body.name || `TestUser${Math.floor(Math.random() * 10000)}`;
    const email = req.body.email || `test${Math.floor(Math.random() * 10000)}@example.com`;
    const password = req.body.password || 'password123';
    const location = req.body.location || 'Test Location';
    
    console.log('Creating test user with:', { name, email });
    
    // Check if user with this email already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ 
        msg: 'User already exists with this email',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email
        } 
      });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
      location
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // Save user
    await user.save();
    
    // Return the created user
    res.json({
      msg: 'Test user created successfully',
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        location: user.location
      }
    });
    
  } catch (err) {
    console.error('Error creating test user:', err.message);
    res.status(500).json({ msg: 'Server Error' });
  }
});

// @route   POST api/users/upload-avatar
// @desc    Upload user avatar
// @access  Private
router.post('/upload-avatar', [auth, upload.single('avatar')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get file path
    const avatar = `/uploads/${req.file.filename}`;
    
    // Save previous avatar path for potential cleanup
    const previousAvatar = user.avatar;
    
    // Update user avatar
    user.avatar = avatar;
    await user.save();
    
    // If there was a previous custom avatar, we could delete it here
    // (if not a default avatar)
    
    res.json({ 
      message: 'Avatar uploaded successfully',
      avatar: avatar,
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Avatar upload error:', err.message);
    res.status(500).json({ message: 'Server error uploading avatar' });
  }
});

// @route   POST api/users/upload-cover
// @desc    Upload user cover photo
// @access  Private
router.post('/upload-cover', [auth, upload.single('cover')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get file path
    const coverPhoto = `/uploads/${req.file.filename}`;
    
    // Save previous cover path for potential cleanup
    const previousCover = user.coverPhoto;
    
    // Update user cover photo
    user.coverPhoto = coverPhoto;
    await user.save();
    
    // If there was a previous custom cover, we could delete it here
    // (if not a default cover)
    
    res.json({ 
      message: 'Cover photo uploaded successfully',
      coverPhoto: coverPhoto,
      user: {
        name: user.name,
        email: user.email,
        coverPhoto: user.coverPhoto
      }
    });
  } catch (err) {
    console.error('Cover photo upload error:', err.message);
    res.status(500).json({ message: 'Server error uploading cover photo' });
  }
});

// @route   DELETE api/users/delete-account
// @desc    Delete user account
// @access  Private
router.delete('/delete-account', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // TODO: Delete user's posts, comments, etc.
    
    // Delete the user
    await User.findByIdAndDelete(req.user.id);
    
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Account deletion error:', err.message);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

module.exports = router; 