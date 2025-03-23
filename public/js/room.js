// Room chat functionality for real-time communication
let socket = null;
let currentRoom = null;
let currentRoomId = null;
let typingTimeout = null;
let isTyping = false;

document.addEventListener('DOMContentLoaded', function() {
  // Show loading state
  document.getElementById('loading-container').style.display = 'flex';
  document.getElementById('room-container').style.display = 'none';
  document.getElementById('error-container').style.display = 'none';
  
  // Log for debugging
  console.log('Room chat page loaded, initializing...');
  
  // Check if user is logged in
  if (!isLoggedIn()) {
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
  
  // Save room ID
  currentRoomId = roomId;
  
  // Initialize socket connection
  initializeSocket(roomId);
  
  // Set up UI event handlers
  setupEventHandlers();
});

// Initialize socket connection
function initializeSocket(roomId) {
  try {
    // Connect to socket.io server
    socket = io();
    console.log('Socket initialized');
    
    // Get authentication token
    const token = localStorage.getItem('token');
    
    if (!token) {
      showError('Authentication token not found');
      return;
    }
    
    // Set up socket event listeners
    setupSocketListeners(token, roomId);
    
  } catch (error) {
    console.error('Error initializing socket:', error);
    showError('Failed to connect to chat server');
  }
}

// Set up socket event listeners
function setupSocketListeners(token, roomId) {
  // Socket authentication
  socket.auth = { token };
  
  // Handle connection events
  socket.on('connect', function() {
    console.log('Socket connected');
    
    // Authenticate with token
    socket.emit('authenticate', { token });
  });
  
  socket.on('connect_error', function(error) {
    console.error('Socket connection error:', error);
    showError('Failed to connect to chat server. Please check your connection and try again.');
  });
  
  // Authentication result
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
  
  // Room data and messages
  socket.on('room-data', function(data) {
    console.log('Received room data:', data);
    
    // Save current room data
    currentRoom = data;
    
    // Display room info and messages
    displayRoomInfo(data);
    
    // Hide loading state
    document.getElementById('loading-container').style.display = 'none';
    document.getElementById('room-container').style.display = 'block';
  });
  
  socket.on('room-error', function(error) {
    console.error('Room error:', error);
    showError(error.msg || 'Failed to join room');
  });
  
  socket.on('message', function(message) {
    console.log('Received message:', message);
    appendMessage(message);
    
    // Scroll to bottom of message container
    scrollToBottom();
  });
  
  // Typing indicators
  socket.on('userTyping', function(data) {
    console.log('User typing:', data);
    showTypingIndicator(data);
  });
  
  // Handle disconnection
  socket.on('disconnect', function() {
    console.log('Disconnected from server');
    showError('Disconnected from chat server. Please refresh the page.');
  });
}

// Set up UI event handlers
function setupEventHandlers() {
  // Send message form handling
  const messageForm = document.getElementById('message-form');
  if (messageForm) {
    messageForm.addEventListener('submit', function(e) {
      e.preventDefault();
      sendMessage();
    });
  }
  
  // Message input typing events
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    messageInput.addEventListener('input', handleTyping);
  }
  
  // Image upload handling
  const imageUpload = document.getElementById('image-upload');
  if (imageUpload) {
    imageUpload.addEventListener('change', handleImageUpload);
  }
  
  // Admin buttons
  const inviteUserBtn = document.getElementById('invite-user-btn');
  if (inviteUserBtn) {
    inviteUserBtn.addEventListener('click', showInviteModal);
  }
  
  const editRoomBtn = document.getElementById('edit-room-btn');
  if (editRoomBtn) {
    editRoomBtn.addEventListener('click', function() {
      window.location.href = `/edit-room.html?id=${currentRoomId}`;
    });
  }
  
  const deleteRoomBtn = document.getElementById('delete-room-btn');
  if (deleteRoomBtn) {
    deleteRoomBtn.addEventListener('click', confirmDeleteRoom);
  }
  
  // Invite modal
  const closeModal = document.querySelector('.close-modal');
  if (closeModal) {
    closeModal.addEventListener('click', hideInviteModal);
  }
  
  const cancelInvite = document.getElementById('cancel-invite');
  if (cancelInvite) {
    cancelInvite.addEventListener('click', hideInviteModal);
  }
  
  const confirmInvite = document.getElementById('confirm-invite');
  if (confirmInvite) {
    confirmInvite.addEventListener('click', inviteUsers);
  }
  
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', searchUsers);
  }
  
  const userSearch = document.getElementById('user-search');
  if (userSearch) {
    userSearch.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        searchUsers();
      }
    });
  }
  
  // Emoji button
  const emojiBtn = document.getElementById('emoji-btn');
  if (emojiBtn) {
    emojiBtn.addEventListener('click', toggleEmojiPicker);
  }
}

// Join a room
function joinRoom(roomId) {
  console.log('Joining room:', roomId);
  
  if (socket && socket.connected) {
    socket.emit('join-room', { roomId });
    console.log('Join room event emitted');
  } else {
    console.error('Socket not connected - cannot join room');
    showError('Not connected to chat server');
  }
}

// Display room information
function displayRoomInfo(data) {
  // Set room name and description
  document.getElementById('room-name').textContent = data.room || 'Chat Room';
  document.getElementById('room-description').textContent = data.description || 'No description available';
  
  // Room details
  if (data.destination) {
    document.getElementById('room-destination').innerHTML = `<i class="fas fa-map-marker-alt"></i> ${data.destination}`;
  }
  
  // Privacy status
  const privacyElement = document.getElementById('room-privacy');
  if (privacyElement) {
    if (data.isPrivate) {
      privacyElement.innerHTML = `<i class="fas fa-lock"></i> Private`;
    } else {
      privacyElement.innerHTML = `<i class="fas fa-lock-open"></i> Public`;
    }
  }
  
  // Member count
  const membersCount = data.members ? data.members.length : 0;
  document.getElementById('room-members-count').innerHTML = `<i class="fas fa-users"></i> ${membersCount} members`;
  
  // Display members list
  displayMembersList(data.members || []);
  
  // Display messages
  if (data.messages && data.messages.length > 0) {
    displayMessages(data.messages);
  } else {
    // Show empty state
    document.getElementById('chat-messages').innerHTML = `
      <div class="empty-chat">
        <i class="fas fa-comments"></i>
        <p>No messages yet. Start the conversation!</p>
      </div>
    `;
  }
  
  // Show admin actions if user is admin
  checkAndShowAdminActions(data.members || []);
}

// Display members list
function displayMembersList(members) {
  const membersList = document.getElementById('members-list');
  membersList.innerHTML = '';
  
  if (members.length === 0) {
    membersList.innerHTML = '<li class="empty-members">No members found</li>';
    return;
  }
  
  // Get current user id
  const userData = JSON.parse(localStorage.getItem('user'));
  const currentUserId = userData ? userData._id : null;
  
  members.forEach(member => {
    const memberItem = document.createElement('li');
    memberItem.className = 'member-item';
    
    const isCurrentUser = member.user._id === currentUserId;
    if (isCurrentUser) {
      memberItem.classList.add('current-user');
    }
    
    const isAdmin = member.isAdmin;
    
    memberItem.innerHTML = `
      <div class="member-avatar">
        <img src="${member.user.avatar || 'images/default-avatar.png'}" alt="${member.user.name}">
        ${isCurrentUser ? '<span class="current-user-badge">You</span>' : ''}
        ${isAdmin ? '<span class="admin-badge">Admin</span>' : ''}
      </div>
      <div class="member-info">
        <div class="member-name">${member.user.name}</div>
        <div class="member-joined">Joined ${formatDate(member.joinedAt)}</div>
      </div>
    `;
    
    membersList.appendChild(memberItem);
  });
}

// Check if current user is admin and show admin actions
function checkAndShowAdminActions(members) {
  // Get current user id
  const userData = JSON.parse(localStorage.getItem('user'));
  const currentUserId = userData ? userData._id : null;
  
  if (!currentUserId) return;
  
  // Check if user is admin
  const isAdmin = members.some(member => 
    member.user._id === currentUserId && member.isAdmin
  );
  
  // Show/hide admin actions
  const adminActions = document.getElementById('admin-actions');
  if (adminActions) {
    adminActions.style.display = isAdmin ? 'block' : 'none';
  }
}

// Display messages
function displayMessages(messages) {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = '';
  
  messages.forEach(message => {
    appendMessage(message);
  });
  
  // Scroll to bottom
  scrollToBottom();
}

// Append a message to the chat
function appendMessage(message) {
  const chatMessages = document.getElementById('chat-messages');
  
  // Remove empty state if present
  const emptyChat = chatMessages.querySelector('.empty-chat');
  if (emptyChat) {
    emptyChat.remove();
  }
  
  // Get current user id
  const userData = JSON.parse(localStorage.getItem('user'));
  const currentUserId = userData ? userData._id : null;
  
  // Create message element
  const messageElement = document.createElement('div');
  messageElement.className = 'message';
  
  // Check if message is from current user or system
  const isCurrentUser = message.user && message.user._id === currentUserId;
  const isSystem = message.user === 'admin' || message.user === 'system';
  
  if (isCurrentUser) {
    messageElement.classList.add('user-message');
  } else if (isSystem) {
    messageElement.classList.add('system-message');
  } else {
    messageElement.classList.add('other-message');
  }
  
  // Format date
  const formattedTime = message.date ? formatTime(message.date) : 'now';
  
  // Create message HTML
  if (isSystem) {
    // System message
    messageElement.innerHTML = `
      <div class="message-content">
        <p class="message-text">${message.text}</p>
        <span class="message-time">${formattedTime}</span>
      </div>
    `;
  } else {
    // User message
    const userName = isCurrentUser ? 'You' : (message.user && message.user.name ? message.user.name : (message.name || 'Unknown'));
    const userAvatar = message.user && message.user.avatar ? message.user.avatar : 'images/default-avatar.png';
    
    messageElement.innerHTML = `
      <div class="message-avatar">
        <img src="${userAvatar}" alt="${userName}">
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender">${userName}</span>
          <span class="message-time">${formattedTime}</span>
        </div>
        ${message.image ? `<div class="message-image"><img src="${message.image}" alt="Uploaded image"></div>` : ''}
        <p class="message-text">${message.text}</p>
      </div>
    `;
  }
  
  // Add message to chat
  chatMessages.appendChild(messageElement);
}

// Send a message
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const text = messageInput.value.trim();
  
  if (!text || !currentRoomId || !socket) {
    return;
  }
  
  console.log('Sending message to room:', currentRoomId);
  
  socket.emit('chatMessage', {
    roomId: currentRoomId,
    text: text
  });
  
  // Clear input and reset typing status
  messageInput.value = '';
  resetTypingStatus();
  
  // Focus input after sending
  messageInput.focus();
}

// Handle typing events
function handleTyping() {
  if (!isTyping) {
    isTyping = true;
    
    // Emit typing event
    if (socket && currentRoomId) {
      socket.emit('typing', {
        roomId: currentRoomId,
        isTyping: true
      });
    }
  }
  
  // Clear previous timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
  }
  
  // Set timeout to stop typing indicator
  typingTimeout = setTimeout(resetTypingStatus, 3000);
}

// Reset typing status
function resetTypingStatus() {
  // Only emit if previously typing
  if (isTyping) {
    isTyping = false;
    
    // Emit stop typing event
    if (socket && currentRoomId) {
      socket.emit('typing', {
        roomId: currentRoomId,
        isTyping: false
      });
    }
  }
  
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
}

// Show typing indicator
function showTypingIndicator(data) {
  const typingIndicator = document.getElementById('typing-indicator');
  const typingText = document.getElementById('typing-text');
  
  if (data.isTyping) {
    typingText.textContent = `${data.name} is typing...`;
    typingIndicator.style.display = 'flex';
  } else {
    typingIndicator.style.display = 'none';
  }
}

// Handle image upload
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  // Check file type
  if (!file.type.match('image.*')) {
    alert('Please select an image file');
    return;
  }
  
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    alert('Image file is too large. Maximum size is 5MB.');
    return;
  }
  
  // Create file reader
  const reader = new FileReader();
  
  reader.onload = function(e) {
    // TODO: Implement image upload to server and send message with image
    console.log('Image loaded, ready to upload');
    
    // For now, send message with text indicating image upload
    const messageInput = document.getElementById('message-input');
    messageInput.value = 'I shared an image (image upload not fully implemented yet)';
    
    // Send the message
    sendMessage();
  };
  
  reader.readAsDataURL(file);
}

// Invite users modal functions
function showInviteModal() {
  const inviteModal = document.getElementById('invite-modal');
  if (inviteModal) {
    inviteModal.style.display = 'block';
  }
}

function hideInviteModal() {
  const inviteModal = document.getElementById('invite-modal');
  if (inviteModal) {
    inviteModal.style.display = 'none';
  }
}

// Search for users to invite
function searchUsers() {
  // TODO: Implement user search API
  const userSearch = document.getElementById('user-search');
  const searchQuery = userSearch.value.trim();
  
  if (!searchQuery) return;
  
  // For demo, show loading
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
  
  // Make API request to search users
  fetch(`${API_URL}/users/search-test?q=${encodeURIComponent(searchQuery)}`, {
    headers: {
      'x-auth-token': localStorage.getItem('token')
    }
  })
  .then(response => response.json())
  .then(data => {
    // Check if response contains users array property
    const users = data.users || [];
    displaySearchResults(users);
  })
  .catch(error => {
    console.error('Error searching users:', error);
    searchResults.innerHTML = '<div class="search-error">Error searching users</div>';
  });
}

// Display search results
function displaySearchResults(users) {
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '';
  
  if (!users || users.length === 0) {
    searchResults.innerHTML = '<div class="search-no-results">No users found</div>';
    return;
  }
  
  // Get current room members to filter out
  const currentMembers = currentRoom && currentRoom.members ? 
    currentRoom.members.map(member => member.user._id) : [];
  
  // Filter out users who are already members
  const filteredUsers = users.filter(user => !currentMembers.includes(user._id));
  
  if (filteredUsers.length === 0) {
    searchResults.innerHTML = '<div class="search-no-results">All found users are already members</div>';
    return;
  }
  
  // Create list of users
  filteredUsers.forEach(user => {
    const userElement = document.createElement('div');
    userElement.className = 'search-result-item';
    userElement.innerHTML = `
      <div class="user-avatar">
        <img src="${user.avatar || 'images/default-avatar.png'}" alt="${user.name}">
      </div>
      <div class="user-info">
        <div class="user-name">${user.name}</div>
        <div class="user-email">${user.email}</div>
      </div>
      <button class="select-user-btn" data-id="${user._id}" data-name="${user.name}">
        <i class="fas fa-plus"></i>
      </button>
    `;
    
    // Add event listener for select button
    const selectBtn = userElement.querySelector('.select-user-btn');
    selectBtn.addEventListener('click', function() {
      selectUserForInvite(user._id, user.name, user.avatar);
    });
    
    searchResults.appendChild(userElement);
  });
}

// Select a user for invitation
function selectUserForInvite(userId, userName, userAvatar) {
  const selectedUsers = document.getElementById('selected-users-list');
  const emptySelection = selectedUsers.querySelector('.empty-selection');
  
  // Remove empty message if present
  if (emptySelection) {
    emptySelection.remove();
  }
  
  // Check if user is already selected
  if (selectedUsers.querySelector(`[data-id="${userId}"]`)) {
    return;
  }
  
  // Create selected user element
  const userElement = document.createElement('div');
  userElement.className = 'selected-user';
  userElement.dataset.id = userId;
  userElement.innerHTML = `
    <div class="user-avatar">
      <img src="${userAvatar || 'images/default-avatar.png'}" alt="${userName}">
    </div>
    <div class="user-name">${userName}</div>
    <button class="remove-user-btn">
      <i class="fas fa-times"></i>
    </button>
  `;
  
  // Add event listener for remove button
  const removeBtn = userElement.querySelector('.remove-user-btn');
  removeBtn.addEventListener('click', function() {
    userElement.remove();
    
    // If no selected users, show empty message
    if (selectedUsers.children.length === 0) {
      selectedUsers.innerHTML = '<p class="empty-selection">No users selected</p>';
    }
  });
  
  selectedUsers.appendChild(userElement);
}

// Invite selected users
function inviteUsers() {
  const selectedUsersList = document.getElementById('selected-users-list');
  const selectedUserElements = selectedUsersList.querySelectorAll('.selected-user');
  
  if (selectedUserElements.length === 0) {
    alert('Please select users to invite');
    return;
  }
  
  // Get selected user IDs
  const userIds = Array.from(selectedUserElements).map(el => el.dataset.id);
  
  // Show loading state
  const confirmInviteBtn = document.getElementById('confirm-invite');
  const originalBtnText = confirmInviteBtn.innerHTML;
  confirmInviteBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inviting...';
  confirmInviteBtn.disabled = true;
  
  // Log for debugging
  console.log(`Inviting ${userIds.length} users to room ${currentRoomId}`, userIds);
  console.log('Using API URL:', `${API_URL}/rooms/${currentRoomId}/invite`);
  
  // Make API request to invite users
  fetch(`${API_URL}/rooms/${currentRoomId}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': localStorage.getItem('token'),
      'Accept': 'application/json'
    },
    body: JSON.stringify({ users: userIds })
  })
  .then(response => {
    console.log('Server response status:', response.status, response.statusText);
    console.log('Response headers:', 
      Array.from(response.headers.entries()).reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {})
    );
    
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json().then(data => ({ ok: response.ok, data }));
    } else {
      // If not JSON, capture the text and treat as error
      return response.text().then(text => {
        console.error('Non-JSON response:', text.substring(0, 200));
        return { 
          ok: false, 
          data: { 
            success: false, 
            msg: 'Server returned an invalid response. Please try again later or contact support.'
          } 
        };
      });
    }
  })
  .then(result => {
    // Reset button
    confirmInviteBtn.innerHTML = originalBtnText;
    confirmInviteBtn.disabled = false;
    
    if (result.ok && result.data.success) {
      // Success, close modal and show message
      hideInviteModal();
      alert(`Successfully invited ${userIds.length} users to the room.`);
      
      // Refresh room data
      if (socket && currentRoomId) {
        socket.emit('join-room', { roomId: currentRoomId });
      }
    } else {
      const errorMsg = result.data.msg || 'Unknown error';
      console.error('Error inviting users:', result.data);
      alert('Failed to invite users: ' + errorMsg);
    }
  })
  .catch(error => {
    console.error('Network or parsing error inviting users:', error);
    
    // Reset button
    confirmInviteBtn.innerHTML = originalBtnText;
    confirmInviteBtn.disabled = false;
    
    alert('Failed to invite users due to a network error. Please check your connection and try again.');
  });
}

// Delete room confirmation
function confirmDeleteRoom() {
  if (confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
    deleteRoom();
  }
}

// Delete room
function deleteRoom() {
  // Show loading state
  const deleteRoomBtn = document.getElementById('delete-room-btn');
  const originalBtnText = deleteRoomBtn.innerHTML;
  deleteRoomBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
  deleteRoomBtn.disabled = true;
  
  // Make API request to delete room
  fetch(`${API_URL}/rooms/${currentRoomId}`, {
    method: 'DELETE',
    headers: {
      'x-auth-token': localStorage.getItem('token')
    }
  })
  .then(response => {
    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json().then(data => ({ ok: response.ok, data }));
    } else {
      // If not JSON, return text with error status
      return response.text().then(text => ({ 
        ok: false, 
        data: { 
          success: false, 
          msg: `Server returned non-JSON response: ${text.substring(0, 100)}...` 
        } 
      }));
    }
  })
  .then(result => {
    // Reset button
    deleteRoomBtn.innerHTML = originalBtnText;
    deleteRoomBtn.disabled = false;
    
    if (result.ok && result.data.success) {
      // Redirect to rooms page
      window.location.href = '/rooms.html';
    } else {
      const errorMsg = result.data.msg || 'Unknown error';
      alert('Failed to delete room: ' + errorMsg);
    }
  })
  .catch(error => {
    console.error('Error deleting room:', error);
    
    // Reset button
    deleteRoomBtn.innerHTML = originalBtnText;
    deleteRoomBtn.disabled = false;
    
    alert('Failed to delete room. Please try again.');
  });
}

// Toggle emoji picker
function toggleEmojiPicker() {
  // Emoji picker functionality will be implemented later
  alert('Emoji picker not implemented yet');
}

// Show error message
function showError(message) {
  document.getElementById('loading-container').style.display = 'none';
  document.getElementById('room-container').style.display = 'none';
  
  const errorContainer = document.getElementById('error-container');
  const errorMessage = document.getElementById('error-message');
  
  errorMessage.textContent = message;
  errorContainer.style.display = 'flex';
}

// Scroll chat to bottom
function scrollToBottom() {
  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Format date to relative time
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) {
    return 'today';
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Format time
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit'
  });
} 