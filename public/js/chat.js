// Chat room functionality for real-time communication
let socket = null;
let currentRoom = null;
let chatMessages = [];

document.addEventListener('DOMContentLoaded', function() {
  // Show loading state
  document.getElementById('loading-container').style.display = 'flex';
  document.getElementById('message-container').style.display = 'none';
  document.getElementById('error-container').style.display = 'none';
  
  // Log for debugging
  console.log('Chat page loaded, initializing...');
  
  // Check if user is logged in and get token
  const token = localStorage.getItem('token');
  console.log('Authentication token found:', !!token);
  
  if (!token) {
    showError('You must be logged in to view this page');
    return;
  }
  
  // Get room ID from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get('id');
  console.log('Room ID from URL:', roomId);
  
  if (!roomId) {
    showError('Room ID not found in the URL');
    return;
  }
  
  try {
    // Initialize socket connection with auth token
    socket = io({
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });
    console.log('Socket initialized with authentication token');
    
    // Log socket connection status
    socket.on('connect', () => {
      console.log('Socket connected successfully, ID:', socket.id);
      updateConnectionStatus(true);
    });
  } catch (error) {
    console.error('Error initializing socket:', error);
    showError('Failed to initialize chat connection: ' + error.message);
    return;
  }

  // Listen for authentication result
  socket.on('authenticated', function(data) {
    console.log('Authentication response:', data);
    
    if (data.success) {
      // Join the room once authenticated
      joinRoom(roomId);
    } else {
      showError('Authentication failed: ' + (data.msg || 'Unknown error'));
    }
  });
  
  socket.on('unauthorized', function(error) {
    console.error('Authentication error:', error);
    showError('Authentication failed: ' + (error.message || 'Unauthorized'));
  });
  
  socket.on('connect_error', function(error) {
    console.error('Socket connection error:', error);
    updateConnectionStatus(false);
    showError('Failed to connect to chat server: ' + error.message);
  });
  
  // Listen for room data
  socket.on('room-data', function(data) {
    console.log('Received room data:', data);
    
    // Update current room with the room ID to ensure we have the string ID
    if (data.roomId) {
      currentRoom = data.roomId.toString();
      console.log('Updated currentRoom to:', currentRoom);
    }
    
    displayRoomInfo(data);
    
    // Hide the loading state once we have room data
    document.getElementById('loading-container').style.display = 'none';
    document.getElementById('message-container').style.display = 'block';
  });
  
  // Listen for room join errors
  socket.on('room-error', function(error) {
    console.error('Room join error:', error);
    showError(error.msg || 'Failed to join room');
  });
  
  // Listen for messages
  socket.on('message', function(message) {
    console.log('Received message:', message);
    appendMessageToDOM(message);
    
    // Scroll to bottom of message container
    const messageList = document.getElementById('message-list');
    messageList.scrollTop = messageList.scrollHeight;
  });
  
  // Debug listener for all socket events
  const originalOnevent = socket.onevent;
  socket.onevent = function(packet) {
    const args = packet.data || [];
    console.log('Socket event received:', args[0], args.slice(1));
    originalOnevent.call(this, packet);
  };
  
  // Listen for errors
  socket.on('error', function(error) {
    console.error('Socket error:', error);
    
    let errorMessage = 'Connection error';
    
    // Try to extract useful information from the error
    if (typeof error === 'object') {
      if (error.msg) {
        errorMessage += ': ' + error.msg;
      } else if (error.message) {
        errorMessage += ': ' + error.message;
      } else if (error.type) {
        errorMessage += ': ' + error.type;
      }
    } else if (typeof error === 'string') {
      errorMessage += ': ' + error;
    }
    
    // Log detailed error for debugging
    console.error('Detailed error information:', {
      errorType: typeof error,
      errorObject: error,
      currentRoom: currentRoom,
      socketConnected: socket && socket.connected,
      socketId: socket ? socket.id : null
    });
    
    // Alert user and show error in UI
    if (document.getElementById('message-container').style.display === 'block') {
      // If we're already showing the chat, just show an alert
      alert(errorMessage);
    } else {
      // Otherwise show the error page
      showError(errorMessage);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', function(reason) {
    console.log('Disconnected from server, reason:', reason);
    updateConnectionStatus(false);
    
    if (reason === 'io server disconnect') {
      // Server intentionally disconnected the client
      showError('Disconnected by the server. Please refresh the page.');
    } else if (reason === 'transport close') {
      // Connection was closed (e.g., server went down)
      showError('Lost connection to the chat server. Attempting to reconnect...');
    } else {
      showError('Disconnected from chat server: ' + reason);
    }
  });
  
  // Send message form handling
  document.getElementById('message-form').addEventListener('submit', function(e) {
    e.preventDefault();
    sendMessage();
  });
});

// Function to join a chat room
function joinRoom(roomId) {
  console.log('Joining room:', roomId);
  
  if (!roomId) {
    console.error('Invalid room ID provided to joinRoom');
    showError('Invalid room ID');
    return;
  }
  
  if (socket && socket.connected) {
    // Save the current room ID
    currentRoom = roomId;
    
    socket.emit('join-room', { roomId });
    console.log('Join room event emitted with ID:', roomId);
  } else {
    console.error('Socket not connected - cannot join room');
    showError('Socket not connected - please refresh the page');
  }
}

// Display room information
function displayRoomInfo(data) {
  document.getElementById('room-name').textContent = data.room || 'Chat Room';
  
  const membersList = document.getElementById('members-list');
  membersList.innerHTML = '';
  
  if (data.members && data.members.length > 0) {
    data.members.forEach(member => {
      const memberItem = document.createElement('li');
      memberItem.className = 'member-item';
      
      const memberLink = document.createElement('a');
      memberLink.href = `user-profile.html?id=${member.user._id}`;
      memberLink.className = 'member-link';
      memberLink.textContent = member.user.name || 'Unknown User';
      
      memberItem.appendChild(memberLink);
      membersList.appendChild(memberItem);
    });
  } else {
    const noMembersItem = document.createElement('li');
    noMembersItem.textContent = 'No members found';
    membersList.appendChild(noMembersItem);
  }
  
  // If we have messages, display them
  if (data.messages && data.messages.length > 0) {
    chatMessages = data.messages;
    displayMessages();
  }
}

// Send message function
function sendMessage() {
  try {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    
    if (!message) {
      return;
    }
    
    if (!currentRoom) {
      console.error('Cannot send message: No active room');
      alert('Cannot send message: No active room');
      return;
    }
    
    console.log('Sending message to room:', currentRoom);
    
    // Check if currentRoom is a string or object
    const roomId = typeof currentRoom === 'object' ? currentRoom._id : currentRoom;
    
    if (!roomId) {
      console.error('Invalid room ID:', currentRoom);
      alert('Cannot send message: Invalid room ID');
      return;
    }
    
    // Emit message with roomId
    socket.emit('chatMessage', {
      roomId: roomId,
      text: message
    });
    
    console.log('Message sent to server:', {
      roomId: roomId,
      text: message.substring(0, 20) + (message.length > 20 ? '...' : '')
    });
    
    // Add optimistic message to UI
    const user = getChatUserData();
    if (user) {
      appendMessageToDOM({
        user: {
          _id: user._id,
          name: user.name
        },
        text: message,
        date: new Date()
      });
      
      // Scroll to bottom
      const messageList = document.getElementById('message-list');
      messageList.scrollTop = messageList.scrollHeight;
    }
    
    messageInput.value = '';
    messageInput.focus();
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message: ' + error.message);
  }
}

// Append message to DOM
function appendMessageToDOM(message) {
  try {
    if (!message || (!message.text && message.text !== '')) {
      console.error('Invalid message format:', message);
      return;
    }

    const messageList = document.getElementById('message-list');
    const messageItem = document.createElement('li');
    messageItem.className = 'message-item';
    
    // Get current user data
    const userData = getChatUserData() || {};
    
    // Special case for admin messages (joined/left notifications)
    if (message.user === 'admin') {
      messageItem.classList.add('admin-message');
      messageItem.innerHTML = `<p class="admin-text">${message.text}</p>`;
      messageList.appendChild(messageItem);
      return;
    }
    
    // Check if message is from current user
    const messageUserId = message.user && message.user._id ? message.user._id : message.user;
    const isCurrentUser = messageUserId && userData._id === messageUserId;
    messageItem.classList.add(isCurrentUser ? 'current-user' : 'other-user');
    
    // Create message elements
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    // Add sender name for other users' messages
    if (!isCurrentUser && message.user) {
      const senderName = document.createElement('span');
      senderName.className = 'sender-name';
      senderName.textContent = message.user.name || (message.name || 'Unknown User');
      messageContent.appendChild(senderName);
    }
    
    // Add message text
    const messageText = document.createElement('p');
    messageText.className = 'message-text';
    messageText.textContent = message.text;
    messageContent.appendChild(messageText);
    
    // Add timestamp
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatDate(message.date || new Date());
    messageContent.appendChild(timestamp);
    
    messageItem.appendChild(messageContent);
    messageList.appendChild(messageItem);
    
    // Scroll to bottom
    messageList.scrollTop = messageList.scrollHeight;
  } catch (error) {
    console.error('Error appending message to DOM:', error, message);
  }
}

// Format date for chat messages
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

// Display all messages
function displayMessages() {
  const messageList = document.getElementById('message-list');
  if (!messageList) return;
  
  messageList.innerHTML = '';
  
  if (!chatMessages || chatMessages.length === 0) {
    const emptyMessage = document.createElement('li');
    emptyMessage.className = 'empty-message';
    emptyMessage.textContent = 'No messages yet. Start the conversation!';
    messageList.appendChild(emptyMessage);
    return;
  }
  
  // Sort messages by date if available
  const sortedMessages = [...chatMessages].sort((a, b) => {
    return new Date(a.date || 0) - new Date(b.date || 0);
  });
  
  // Add messages to DOM
  sortedMessages.forEach(message => {
    appendMessageToDOM(message);
  });
}

// Show error message
function showError(errorMessage) {
  console.error('Error:', errorMessage);
  document.getElementById('loading-container').style.display = 'none';
  document.getElementById('message-container').style.display = 'none';
  document.getElementById('error-container').style.display = 'block';
  document.getElementById('error-message').textContent = errorMessage;
}

// Get user data from local storage
function getChatUserData() {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
}

// Utility function to get auth token
function getToken() {
  return localStorage.getItem('token');
}

// Check if user is logged in - renamed to avoid conflict with auth.js
function isChatUserLoggedIn() {
  return !!getToken();
}

// Load room details
const loadRoomDetails = async (roomId) => {
  try {
    // Get the API URL from window to prevent undefined errors
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.protocol}//${window.location.hostname}:5000/api`
        : `${window.location.protocol}//${window.location.hostname}/api`;
    
    const response = await fetch(`${apiUrl}/rooms/${roomId}`, {
      headers: {
        'x-auth-token': getToken()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load room details');
    }

    const room = await response.json();
    currentRoom = room;

    // Update UI with room details
    updateRoomInfo(room);

    // Join the room
    joinRoom(roomId);

  } catch (error) {
    console.error('Error loading room details:', error);
    document.getElementById('chat-container').innerHTML = `
      <div class="error-message">
        <h3>Error Loading Room</h3>
        <p>${error.message || 'Failed to load room details'}. Please try again later or go back to <a href="rooms.html">Travel Rooms</a>.</p>
      </div>
    `;
  }
};

// Leave the current room
const leaveRoom = () => {
  if (confirm('Are you sure you want to leave this room?')) {
    if (socket && socket.connected && currentRoom) {
      socket.emit('leave-room', { roomId: currentRoom._id });
      window.location.href = 'rooms.html';
    }
  }
};

// Handle image upload
const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Check file type
  if (!file.type.match('image.*')) {
    alert('Please select an image file');
    return;
  }

  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image size should be less than 5MB');
    return;
  }

  try {
    // Show loading message
    addSystemMessage('Uploading image...');

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('roomId', currentRoom._id);

    // Get the API URL dynamically
    const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? `${window.location.protocol}//${window.location.hostname}:5000/api`
        : `${window.location.protocol}//${window.location.hostname}/api`;

    // Upload image
    const response = await fetch(`${apiUrl}/upload/chat`, {
      method: 'POST',
      headers: {
        'x-auth-token': getToken()
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();

    // Send image message via socket
    socket.emit('send-message', {
      roomId: currentRoom._id,
      text: data.fileUrl,
      type: 'image'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    addSystemMessage('Failed to upload image');
  }

  // Clear the input
  e.target.value = '';
};

// Add a message to the chat
const addMessageToChat = (message) => {
  chatMessages.push(message);
  
  // If we have more than 100 messages, remove the oldest
  if (chatMessages.length > 100) {
    chatMessages.shift();
  }
  
  // If this is a new message (not loading history), display it immediately
  const chatMessagesElement = document.getElementById('chat-messages');
  if (chatMessagesElement && chatMessagesElement.lastChild) {
    appendMessageToDOM(message);
    
    // Scroll to bottom
    chatMessagesElement.scrollTop = chatMessagesElement.scrollHeight;
  } else {
    // Full redisplay of messages
    displayMessages();
  }
};

// Add a system message
const addSystemMessage = (text) => {
  addMessageToChat({
    text,
    type: 'system',
    createdAt: new Date().toISOString()
  });
};

// Update room information in UI
const updateRoomInfo = (room) => {
  if (!room) return;

  const roomHeaderElement = document.getElementById('room-header');
  const membersListElement = document.getElementById('members-list');
  
  if (roomHeaderElement) {
    roomHeaderElement.innerHTML = `
      <div class="room-header-content">
        <h2>${room.name}</h2>
        <p>${room.description || `A travel chat room for ${room.destination}`}</p>
        <div class="room-details">
          <span><i class="fas fa-map-marker-alt"></i> ${room.destination}</span>
          <span><i class="fas fa-users"></i> ${room.members ? room.members.length : 0} Members</span>
          <span><i class="fas fa-comment"></i> ${room.messageCount || 0} Messages</span>
          <span><i class="fas fa-user-shield"></i> Created by ${room.creator ? room.creator.name : 'Unknown'}</span>
        </div>
      </div>
    `;
  }

  // Update members list if available
  if (membersListElement && room.members) {
    updateMembersList(room.members);
  }
};

// Update members list
const updateMembersList = (members) => {
  const membersContainer = document.getElementById('room-members');
  if (!membersContainer) return;

  membersContainer.innerHTML = '';

  // Sort members: admins first, then alphabetically
  members.sort((a, b) => {
    if (a.isAdmin && !b.isAdmin) return -1;
    if (!a.isAdmin && b.isAdmin) return 1;
    return a.name.localeCompare(b.name);
  });

  members.forEach(member => {
    const isCurrentUser = member.user === getChatUserData().id;
    
    const memberItem = document.createElement('div');
    memberItem.className = 'member-item';
    if (isCurrentUser) memberItem.classList.add('current-user');
    
    memberItem.innerHTML = `
      <a href="user-profile.html?id=${member.user}" class="member-info">
        <img src="${member.avatar || 'images/default-avatar.png'}" alt="${member.name}" class="member-avatar">
        <span class="member-name">
          ${member.name} ${isCurrentUser ? '(You)' : ''}
          ${member.isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
        </span>
      </a>
      <div class="member-status ${member.isOnline ? 'online' : 'offline'}">
        <span class="status-indicator"></span>
        <span class="status-text">${member.isOnline ? 'Online' : 'Offline'}</span>
      </div>
    `;
    
    membersContainer.appendChild(memberItem);
  });
};

// Update user status in UI
const updateUserStatus = (isConnected) => {
  const statusIndicator = document.getElementById('user-status');
  if (statusIndicator) {
    statusIndicator.className = isConnected ? 'status-online' : 'status-offline';
    statusIndicator.title = isConnected ? 'Connected' : 'Disconnected';
  }
};

// Update connection status indicator
function updateConnectionStatus(isConnected) {
  const statusIndicator = document.getElementById('connection-status');
  if (statusIndicator) {
    statusIndicator.className = isConnected ? 'status-connected' : 'status-disconnected';
    statusIndicator.title = isConnected ? 'Connected to chat server' : 'Disconnected from chat server';
  }
} 