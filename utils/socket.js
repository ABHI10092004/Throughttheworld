const Room = require('../models/Room');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

module.exports = function(io) {
  // Authentication middleware
  io.use((socket, next) => {
    try {
      const { token } = socket.handshake.auth || socket.handshake.query || {};
      
      // If no token, try to get it from the authenticate event data
      if (!token) {
        socket.on('authenticate', async (data) => {
          try {
            const authToken = data.token;
            if (!authToken) {
              return socket.emit('unauthorized', { message: 'No token provided' });
            }
            
            // Verify token
            const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
            
            // Add user ID to socket object
            socket.userId = decoded.user.id;
            
            // Find user
            const user = await User.findById(decoded.user.id).select('-password');
            if (!user) {
              return socket.emit('unauthorized', { message: 'User not found' });
            }
            
            // Set user data in socket
            socket.user = user;
            
            // Emit authenticated event
            socket.emit('authenticated', { success: true, user });
            
            console.log('User authenticated via event:', user.name);
          } catch (error) {
            console.error('Socket authentication error:', error);
            socket.emit('unauthorized', { message: 'Invalid token' });
          }
        });
        
        return next();
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user ID to socket object
      socket.userId = decoded.user.id;
      
      // Find user and set in socket
      User.findById(decoded.user.id)
        .select('-password')
        .then(user => {
          if (!user) {
            return next(new Error('User not found'));
          }
          
          // Set user data in socket
          socket.user = user;
          next();
        })
        .catch(err => {
          next(new Error('Database error'));
        });
        
    } catch (err) {
      console.error('Socket authentication error:', err);
      next(new Error('Authentication error'));
    }
  });

  // Socket.io connection
  io.on('connection', socket => {
    console.log('New client connected');
    
    // Emit authenticated event if user was authenticated in middleware
    if (socket.user) {
      socket.emit('authenticated', { success: true, user: socket.user });
      console.log('User authenticated via middleware:', socket.user.name);
    }
    
    // Join a room
    socket.on('join-room', async ({ roomId }) => {
      try {
        if (!socket.user) {
          return socket.emit('room-error', { msg: 'Not authenticated' });
        }
        
        if (!roomId) {
          console.error('Missing roomId in join-room event');
          return socket.emit('room-error', { msg: 'Room ID is required' });
        }
        
        console.log(`User ${socket.user.name} attempting to join room ${roomId}`);
        console.log('Room ID type:', typeof roomId, 'Value:', roomId);
        
        // Add user to room and get room info
        let room;
        try {
          room = await Room.findById(roomId)
            .populate('members.user', ['name', 'avatar'])
            .populate('messages.user', ['name', 'avatar']);
        } catch (findError) {
          console.error('Error finding room:', findError.message);
          return socket.emit('room-error', { 
            msg: 'Invalid room ID format',
            details: findError.message
          });
        }
        
        if (!room) {
          console.error('Room not found with ID:', roomId);
          return socket.emit('room-error', { msg: 'Room not found' });
        }
        
        // Check if user is a member
        const isMember = room.members.some(
          member => member.user._id.toString() === socket.userId
        );
        
        if (!isMember && !room.isDirect) {
          console.error(`User ${socket.user.name} is not a member of room ${room.name} (${roomId})`);
          return socket.emit('room-error', { msg: 'Not a member of this room' });
        }
        
        // Join the socket room
        socket.join(roomId);
        console.log(`User ${socket.user.name} joined room ${room.name} (${roomId})`);
        
        // Send room info to the user
        socket.emit('room-data', {
          room: room.name,
          roomId: room._id,
          members: room.members,
          messages: room.messages
        });
        
        // Broadcast to other users that this user has joined
        socket.broadcast.to(roomId).emit('message', {
          user: 'admin',
          text: `${socket.user.name} has joined the room!`
        });
      } catch (err) {
        console.error('Error joining room:', err.message, err.stack);
        socket.emit('room-error', { 
          msg: 'Server error',
          details: err.message,
          stack: process.env.NODE_ENV === 'production' ? null : err.stack
        });
      }
    });
    
    // Listen for chat messages
    socket.on('chatMessage', async ({ roomId, text }) => {
      try {
        if (!socket.user) {
          return socket.emit('error', { msg: 'Not authenticated' });
        }
        
        console.log(`User ${socket.user.name} sending message to room ${roomId}`);
        
        if (!roomId) {
          console.error('Missing roomId in chatMessage event');
          return socket.emit('error', { msg: 'Room ID is required' });
        }
        
        // Log the room ID and try to cast it to ObjectId if needed
        console.log('Room ID type:', typeof roomId, 'Value:', roomId);
        
        // Find the room
        let room;
        try {
          room = await Room.findById(roomId);
        } catch (findError) {
          console.error('Error finding room:', findError.message);
          return socket.emit('error', { 
            msg: 'Invalid room ID format', 
            details: findError.message 
          });
        }
        
        if (!room) {
          console.error('Room not found with ID:', roomId);
          return socket.emit('error', { msg: 'Room not found' });
        }
        
        // Create the message
        const message = {
          user: socket.userId,
          name: socket.user.name,
          text,
          date: Date.now()
        };
        
        // Add message to the room
        room.messages.push(message);
        
        try {
          await room.save();
        } catch (saveError) {
          console.error('Error saving message to room:', saveError.message);
          return socket.emit('error', { 
            msg: 'Failed to save message',
            details: saveError.message
          });
        }
        
        // Emit message to the room
        io.to(roomId).emit('message', {
          ...message,
          user: {
            _id: socket.userId,
            name: socket.user.name,
            avatar: socket.user.avatar
          }
        });
        
        console.log(`Message sent to room ${roomId}`);
      } catch (err) {
        console.error('Error processing message:', err.message, err.stack);
        socket.emit('error', { 
          msg: 'Server error', 
          details: err.message,
          stack: process.env.NODE_ENV === 'production' ? null : err.stack
        });
      }
    });
    
    // Private message
    socket.on('privateMessage', async ({ senderId, receiverId, text }) => {
      try {
        const sender = await User.findById(senderId).select('-password');
        const receiver = await User.findById(receiverId).select('-password');
        
        if (!sender || !receiver) {
          return socket.emit('error', { msg: 'User not found' });
        }
        
        // Create message object
        const message = {
          sender: {
            id: sender._id,
            name: sender.name,
            avatar: sender.avatar
          },
          text,
          date: Date.now()
        };
        
        // Send to both sender and receiver if they are online
        socket.emit('privateMessage', message);
        socket.broadcast.to(receiverId).emit('privateMessage', message);
      } catch (err) {
        console.error(err.message);
        socket.emit('error', { msg: 'Server error' });
      }
    });
    
    // User leaves a room
    socket.on('leave-room', async ({ roomId }) => {
      try {
        if (!socket.user) {
          return socket.emit('error', { msg: 'Not authenticated' });
        }
        
        console.log(`User ${socket.user.name} leaving room ${roomId}`);
        
        // Leave the socket room
        socket.leave(roomId);
        
        // Broadcast to room that a user has left
        socket.broadcast.to(roomId).emit('message', {
          user: 'admin',
          text: `${socket.user.name} has left the room`
        });
        
        console.log(`User ${socket.user.name} left room ${roomId}`);
      } catch (err) {
        console.error('Error leaving room:', err.message);
        socket.emit('error', { msg: 'Server error' });
      }
    });
    
    // Typing indicator
    socket.on('typing', ({ roomId, isTyping }) => {
      if (!socket.user) return;
      
      socket.broadcast.to(roomId).emit('userTyping', {
        userId: socket.userId,
        name: socket.user.name,
        isTyping
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected');
      
      // Broadcast to all rooms this user was in
      if (socket.user) {
        const rooms = Object.keys(socket.rooms).filter(room => room !== socket.id);
        rooms.forEach(roomId => {
          socket.broadcast.to(roomId).emit('message', {
            user: 'admin',
            text: `${socket.user.name} has disconnected`
          });
        });
      }
    });
  });
}; 