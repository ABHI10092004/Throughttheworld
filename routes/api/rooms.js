const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const Room = require('../../models/Room');
const User = require('../../models/User');
const mongoose = require('mongoose');

// @route   POST api/rooms
// @desc    Create a travel room
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('destination', 'Destination is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    console.log('Room creation endpoint called');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('User ID:', req.user.id);
      
      const user = await User.findById(req.user.id).select('-password');
      if (!user) {
        console.log('User not found');
        return res.status(404).json({ msg: 'User not found' });
      }
      
      console.log('Found user:', user.name);
      
      // Extract room details from request
      const { name, description, destination, isPrivate, invitedMembers } = req.body;
      
      console.log('Room details:', { name, description, destination, isPrivate });
      console.log('Invited members:', invitedMembers);

      // Create base room object with creator as admin member
      const newRoom = new Room({
        name,
        description,
        destination,
        creator: req.user.id,
        isPrivate: isPrivate === 'true' || isPrivate === true,
        members: [{ user: req.user.id, isAdmin: true }]
      });
      
      console.log('Initial room object created');

      // If invited members array is provided, add them to the room
      if (invitedMembers && Array.isArray(invitedMembers) && invitedMembers.length > 0) {
        console.log('Processing invited members:', invitedMembers);
        
        // Verify all user IDs exist
        const userIds = invitedMembers.map(member => member.userId);
        console.log('User IDs to verify:', userIds);
        
        const existingUsers = await User.find({ _id: { $in: userIds } });
        console.log(`Found ${existingUsers.length} valid users out of ${userIds.length} invited`);
        
        // Map of existing user IDs for quick lookup
        const existingUserMap = {};
        existingUsers.forEach(user => {
          existingUserMap[user._id.toString()] = true;
        });
        
        // Add valid members to the room
        let addedCount = 0;
        invitedMembers.forEach(member => {
          const userId = member.userId;
          
          // Skip if user doesn't exist or is the creator (already added)
          if (!existingUserMap[userId]) {
            console.log(`User ${userId} not found, skipping`);
            return;
          }
          
          if (userId === req.user.id) {
            console.log(`User ${userId} is the creator, skipping`);
            return;
          }
          
          // Add member to the room
          newRoom.members.push({
            user: userId,
            isAdmin: false
          });
          addedCount++;
        });
        
        console.log(`Added ${addedCount} members to the room`);
      } else {
        console.log('No invited members to add');
      }

      console.log('Saving room to database');
      const room = await newRoom.save();
      console.log('Room saved with ID:', room._id);
      
      // Populate creator and member information for response
      const populatedRoom = await Room.findById(room._id)
        .populate('creator', ['name', 'avatar'])
        .populate('members.user', ['name', 'avatar']);

      console.log('Returning populated room');
      res.json(populatedRoom);
    } catch (err) {
      console.error('Error creating room:', err);
      res.status(500).json({ msg: 'Server Error', error: err.message });
    }
  }
);

// @route   GET api/rooms
// @desc    Get all public rooms
// @access  Public
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .sort({ createdAt: -1 })
      .populate('creator', ['name', 'avatar']);
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/rooms/user
// @desc    Get all rooms a user is a member of
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const rooms = await Room.find({
      'members.user': req.user.id
    })
      .sort({ createdAt: -1 })
      .populate('creator', ['name', 'avatar']);
    
    res.json(rooms);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/rooms/:id
// @desc    Get room by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', ['name', 'avatar'])
      .populate('members.user', ['name', 'avatar'])
      .populate('joinRequests.user', ['name', 'avatar']);
    
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    
    // Check if user is a member or if room is public
    const isMember = room.members.some(member => member.user._id.toString() === req.user.id);
    
    if (room.isPrivate && !isMember) {
      return res.status(401).json({ msg: 'Not authorized to view this room' });
    }
    
    res.json(room);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Room not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/rooms/:id
// @desc    Delete a room
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    
    // Check if user is admin
    const isAdmin = room.members.some(
      member => member.user.toString() === req.user.id && member.role === 'admin'
    );
    
    if (!isAdmin) {
      return res.status(401).json({ msg: 'User not authorized' });
    }
    
    await room.remove();
    
    res.json({ msg: 'Room removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Room not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/rooms/join/:id
// @desc    Request to join a room
// @access  Private
router.post('/join/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    
    // Check if already a member
    if (room.members.some(member => member.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Already a member of this room' });
    }
    
    // Check if join request already exists
    if (room.joinRequests.some(request => request.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: 'Join request already sent' });
    }
    
    // If room is public, add user directly as member
    if (!room.isPrivate) {
      const user = await User.findById(req.user.id).select('-password');
      
      room.members.push({
        user: req.user.id,
        role: 'member',
        name: user.name,
      });
    } else {
      // If room is private, add join request
      room.joinRequests.push({
        user: req.user.id
      });
    }
    
    await room.save();
    
    res.json({ success: true, msg: 'Join request sent' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Room not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/rooms/:id/invite
// @desc    Invite users to a room
// @access  Private
router.post('/:id/invite', auth, async (req, res) => {
  try {
    console.log('Invite users endpoint called for room:', req.params.id);
    console.log('Request body:', req.body);

    // Validate request
    if (!req.body.users || !Array.isArray(req.body.users) || req.body.users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        msg: 'User IDs are required' 
      });
    }

    // Find the room
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ 
        success: false, 
        msg: 'Room not found' 
      });
    }

    // Check if user is a member with admin rights
    const memberIndex = room.members.findIndex(
      member => member.user.toString() === req.user.id && member.isAdmin
    );

    if (memberIndex === -1) {
      return res.status(401).json({ 
        success: false, 
        msg: 'Not authorized to invite users to this room' 
      });
    }

    // Get user IDs to invite
    const userIds = req.body.users;
    console.log('Users to invite:', userIds);

    // Verify all user IDs exist
    const existingUsers = await User.find({ _id: { $in: userIds } });
    console.log(`Found ${existingUsers.length} valid users out of ${userIds.length} invited`);

    // Track invited users for response
    const invited = [];
    const errors = [];

    // Process each user ID
    for (const userId of userIds) {
      try {
        // Skip if user is already a member
        if (room.members.some(member => member.user.toString() === userId)) {
          errors.push({ userId, error: 'Already a member' });
          continue;
        }

        // Add member to the room
        room.members.push({
          user: userId,
          isAdmin: false
        });

        invited.push(userId);
      } catch (err) {
        console.error(`Error processing user ${userId}:`, err);
        errors.push({ userId, error: err.message });
      }
    }

    // Save the room if any users were invited
    if (invited.length > 0) {
      await room.save();
    }

    // Return success response
    res.json({
      success: true,
      msg: `Successfully invited ${invited.length} users`,
      invited,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err) {
    console.error('Error inviting users to room:', err);
    res.status(500).json({ 
      success: false, 
      msg: 'Server Error', 
      error: err.message 
    });
  }
});

// @route   PUT api/rooms/request/:id/:user_id
// @desc    Accept or reject a join request
// @access  Private
router.put(
  '/request/:id/:user_id',
  [
    auth,
    [check('status', 'Status is required').isIn(['accepted', 'rejected'])]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      const room = await Room.findById(req.params.id);
      
      if (!room) {
        return res.status(404).json({ msg: 'Room not found' });
      }
      
      // Check if user is admin
      const isAdmin = room.members.some(
        member => member.user.toString() === req.user.id && member.role === 'admin'
      );
      
      if (!isAdmin) {
        return res.status(401).json({ msg: 'User not authorized' });
      }
      
      // Find the request
      const requestIndex = room.joinRequests.findIndex(
        request => request.user.toString() === req.params.user_id
      );
      
      if (requestIndex === -1) {
        return res.status(404).json({ msg: 'Join request not found' });
      }
      
      // If accepted, add user to members
      if (req.body.status === 'accepted') {
        const user = await User.findById(req.params.user_id).select('-password');
        
        room.members.push({
          user: req.params.user_id,
          role: 'member'
        });
        
        // Remove from join requests
        room.joinRequests.splice(requestIndex, 1);
      } else {
        // If rejected, just remove from join requests
        room.joinRequests.splice(requestIndex, 1);
      }
      
      await room.save();
      
      res.json(room);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/rooms/message/:id
// @desc    Send a message in a room
// @access  Private
router.post(
  '/message/:id',
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
      const room = await Room.findById(req.params.id);
      
      if (!room) {
        return res.status(404).json({ msg: 'Room not found' });
      }
      
      // Check if user is a member
      const isMember = room.members.some(
        member => member.user.toString() === req.user.id
      );
      
      if (!isMember) {
        return res.status(401).json({ msg: 'Not a member of this room' });
      }
      
      const newMessage = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      };
      
      room.messages.push(newMessage);
      
      await room.save();
      
      // This should trigger a socket.io event in a real app
      res.json(room.messages);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/rooms/messages/:id
// @desc    Get all messages in a room
// @access  Private
router.get('/messages/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    
    // Check if user is a member
    const isMember = room.members.some(
      member => member.user.toString() === req.user.id
    );
    
    if (!isMember) {
      return res.status(401).json({ msg: 'Not a member of this room' });
    }
    
    res.json(room.messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/rooms/leave/:id
// @desc    Leave a room
// @access  Private
router.delete('/leave/:id', auth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ msg: 'Room not found' });
    }
    
    // Check if user is a member
    const memberIndex = room.members.findIndex(
      member => member.user.toString() === req.user.id
    );
    
    if (memberIndex === -1) {
      return res.status(400).json({ msg: 'Not a member of this room' });
    }
    
    // Check if user is the only admin
    const isLastAdmin = 
      room.members[memberIndex].role === 'admin' &&
      room.members.filter(member => member.role === 'admin').length === 1;
    
    if (isLastAdmin) {
      return res.status(400).json({ msg: 'Cannot leave room as the only admin. Transfer admin role or delete the room.' });
    }
    
    // Remove user from members
    room.members.splice(memberIndex, 1);
    
    await room.save();
    
    res.json({ msg: 'Left room successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/rooms/direct/:userId
// @desc    Create or join direct message room with another user
// @access  Private
router.post('/direct/:userId', auth, async (req, res) => {
  try {
    // Get the current user ID and target user ID
    const currentUserId = req.user.id;
    const targetUserId = req.params.userId;
    
    console.log('Creating direct message room between', currentUserId, 'and', targetUserId);
    
    // First check if both users exist
    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);
    
    if (!currentUser) {
      console.log('Current user not found:', currentUserId);
      return res.status(404).json({ msg: 'Current user not found' });
    }
    
    if (!targetUser) {
      console.log('Target user not found:', targetUserId);
      return res.status(404).json({ msg: 'Target user not found' });
    }
    
    console.log('Found both users:', currentUser.name, 'and', targetUser.name);
    
    // Check if a direct message room already exists between these users
    // Use $and to correctly combine the conditions
    const existingRoom = await Room.findOne({
      isDirect: true,
      $and: [
        { members: { $elemMatch: { user: currentUserId } } },
        { members: { $elemMatch: { user: targetUserId } } }
      ]
    });
    
    if (existingRoom) {
      console.log('Found existing room:', existingRoom._id);
      return res.json(existingRoom);
    }
    
    console.log('No existing room found, creating new one');
    
    // Create a new direct message room
    const newRoom = new Room({
      name: `Chat between ${currentUser.name} and ${targetUser.name}`,
      description: 'Private conversation',
      creator: currentUserId,
      destination: 'Direct Message',
      isDirect: true,
      isPrivate: true,
      members: [
        { user: currentUserId, isAdmin: true },
        { user: targetUserId, isAdmin: false }
      ]
    });
    
    const room = await newRoom.save();
    console.log('New room created:', room._id);
    
    // Return the populated room for consistency with other endpoints
    const populatedRoom = await Room.findById(room._id)
      .populate('creator', ['name', 'avatar'])
      .populate('members.user', ['name', 'avatar']);
    
    res.json(populatedRoom);
  } catch (err) {
    console.error('Error in direct message room creation:', err);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Invalid user ID format' });
    }
    res.status(500).json({ msg: 'Server Error', error: err.message });
  }
});

module.exports = router;