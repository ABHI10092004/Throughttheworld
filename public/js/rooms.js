// Rooms page functionality
document.addEventListener('DOMContentLoaded', () => {
  // Initialize rooms page
  const roomsContainer = document.getElementById('rooms-container');
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  const dropdownButton = document.getElementById('rooms-dropdown-btn');
  const dropdownContent = document.getElementById('rooms-dropdown-content');
  const currentRoomType = document.getElementById('current-room-type');
  
  if (roomsContainer && dropdownItems.length > 0) {
    // Setup dropdown toggle
    if (dropdownButton && dropdownContent) {
      dropdownButton.addEventListener('click', () => {
        dropdownContent.classList.toggle('show');
        // Toggle active class for arrow animation
        dropdownButton.classList.toggle('active');
      });
      
      // Close dropdown when clicking outside
      window.addEventListener('click', (event) => {
        if (!event.target.closest('.rooms-filter')) {
          dropdownContent.classList.remove('show');
          dropdownButton.classList.remove('active');
        }
      });
    }
    
    // Set up dropdown navigation
    dropdownItems.forEach(item => {
      item.addEventListener('click', () => {
        if (item.classList.contains('user-only') && !isLoggedIn()) {
          // Redirect to login if trying to access user-only tabs while not logged in
          window.location.href = '/login.html?redirect=/rooms.html';
          return;
        }
        
        // Update active item
        dropdownItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Update dropdown button text
        if (currentRoomType) {
          currentRoomType.textContent = item.textContent;
        }
        
        // Close the dropdown
        dropdownContent.classList.remove('show');
        dropdownButton.classList.remove('active');
        
        // Load rooms based on selected tab
        const tabType = item.dataset.tab;
        loadRooms(tabType);
      });
    });
    
    // Load initial rooms (public by default)
    loadRooms('all-rooms');
    
    // Hide user-only tabs and buttons for non-logged in users
    updateRoomsUIForAuthState();
  }
});

// Load rooms based on selected tab
const loadRooms = async (tabType) => {
  try {
    const roomsContainer = document.getElementById('rooms-container');
    
    // Show loading state
    roomsContainer.innerHTML = `
      <div class="room-card-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
      <div class="room-card-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
      <div class="room-card-skeleton">
        <div class="skeleton-header"></div>
        <div class="skeleton-content">
          <div class="skeleton-title"></div>
          <div class="skeleton-text"></div>
          <div class="skeleton-text"></div>
        </div>
      </div>
    `;
    
    let url;
    
    // Determine which API endpoint to use based on tab
    switch (tabType) {
      case 'my-rooms':
        // Rooms created by the user
        url = `${API_URL}/rooms/user?created=true`;
        break;
      case 'joined-rooms':
        // Rooms the user has joined
        url = `${API_URL}/rooms/user`;
        break;
      case 'all-rooms':
      default:
        // Public rooms
        url = `${API_URL}/rooms`;
        break;
    }
    
    // For user-specific tabs, add auth token
    const options = {};
    if (tabType !== 'all-rooms') {
      options.headers = {
        'x-auth-token': token
      };
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error('Failed to fetch rooms');
    }
    
    const data = await response.json();
    
    // Display rooms
    displayRooms(data, tabType);
    
  } catch (error) {
    console.error('Error loading rooms:', error);
    
    const roomsContainer = document.getElementById('rooms-container');
    roomsContainer.innerHTML = `
      <div class="alert alert-danger">
        <p>Failed to load rooms. Please try again later.</p>
      </div>
    `;
  }
};

// Display rooms in the container
const displayRooms = (rooms, tabType) => {
  const roomsContainer = document.getElementById('rooms-container');
  
  // Clear loading skeletons
  roomsContainer.innerHTML = '';
  
  if (rooms.length === 0) {
    let message;
    
    switch (tabType) {
      case 'my-rooms':
        message = "You haven't created any rooms yet";
        break;
      case 'joined-rooms':
        message = "You haven't joined any rooms yet";
        break;
      default:
        message = "No public rooms found";
        break;
    }
    
    roomsContainer.innerHTML = `<p class="text-center">${message}</p>`;
    return;
  }
  
  // Create room cards
  rooms.forEach(room => {
    const roomCard = createRoomCard(room, tabType);
    roomsContainer.appendChild(roomCard);
  });
};

// Create a room card element
const createRoomCard = (room, tabType) => {
  const card = document.createElement('div');
  card.className = 'room-card';
  
  // Make the entire card clickable to enter the room
  card.addEventListener('click', function(e) {
    // Don't navigate if clicking a button
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return;
    }
    
    // Go to room page
    window.location.href = `/room.html?id=${room._id}`;
  });
  
  // Add a cursor pointer to indicate it's clickable
  card.style.cursor = 'pointer';
  
  // Format date
  const date = new Date(room.createdAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Truncate description
  const truncatedDescription = room.description.length > 100 
    ? room.description.substring(0, 100) + '...' 
    : room.description;
  
  card.innerHTML = `
    <div class="room-header">
      <h3>${room.name}</h3>
    </div>
    <div class="room-content">
      <div class="room-destination">
        <i class="fas fa-map-marker-alt"></i>
        <span>${room.destination}</span>
      </div>
      <p class="room-description">${truncatedDescription}</p>
      <div class="room-stats">
        <div class="room-stat">
          <span class="room-stat-value">${room.members.length}</span>
          <span>Members</span>
        </div>
        <div class="room-stat">
          <span class="room-stat-value">${room.messages.length}</span>
          <span>Messages</span>
        </div>
        <div class="room-stat">
          <span class="room-stat-value">${formattedDate}</span>
          <span>Created</span>
        </div>
      </div>
      <div class="room-creator">
        <img src="${room.creator.avatar || 'images/default-avatar.png'}" alt="${room.creator.name}">
        <div>
          <div>Created by ${room.creator.name}</div>
        </div>
      </div>
      <div class="room-actions" style="margin-top: 15px;">
        ${getButtonsForRoom(room, tabType)}
      </div>
    </div>
  `;
  
  return card;
};

// Generate appropriate buttons for each room based on context
const getButtonsForRoom = (room, tabType) => {
  if (!isLoggedIn()) {
    return `<a href="/login.html?redirect=/room.html?id=${room._id}" class="btn btn-primary">Login to Chat</a>`;
  }
  
  // Get user data safely
  const userData = getUserData();
  const userId = userData ? userData._id : null;
  
  // Safety check - if no user data is available, return a simple button
  if (!userId) {
    return `<a href="/room.html?id=${room._id}" class="btn btn-primary">Enter Chat</a>`;
  }
  
  // Check if user is a member
  const isMember = room.members && room.members.some(member => 
    member.user && (member.user._id === userId || member.user === userId)
  );
  
  // Check if user is admin
  const isAdmin = room.members && room.members.some(member => 
    (member.user && (member.user._id === userId || member.user === userId)) && 
    (member.role === 'admin' || member.isAdmin === true)
  );
  
  if (isAdmin) {
    return `
      <a href="/room.html?id=${room._id}" class="btn btn-primary">Enter Chat</a>
      <a href="/edit-room.html?id=${room._id}" class="btn btn-secondary">Manage</a>
    `;
  }
  
  if (isMember) {
    return `
      <a href="/room.html?id=${room._id}" class="btn btn-primary">Enter Chat</a>
      <button class="btn btn-danger leave-room-btn" data-id="${room._id}">Leave</button>
    `;
  }
  
  // Check for pending join requests
  const hasPendingRequest = room.joinRequests && room.joinRequests.some(request => 
    request.user && (request.user === userId || (request.user._id && request.user._id === userId))
  );
  
  if (hasPendingRequest) {
    return `<button class="btn btn-secondary" disabled>Request Pending</button>`;
  }
  
  if (room.isPrivate) {
    return `<button class="btn btn-primary join-room-btn" data-id="${room._id}">Request to Join</button>`;
  }
  
  return `<button class="btn btn-primary join-room-btn" data-id="${room._id}">Join Room</button>`;
};

// Update UI elements based on authentication state
const updateRoomsUIForAuthState = () => {
  const userOnlyElements = document.querySelectorAll('.user-only');
  
  if (isLoggedIn()) {
    // User is logged in, show user-only elements
    userOnlyElements.forEach(element => {
      element.style.display = 'block';
    });
  } else {
    // User is not logged in, hide user-only elements
    userOnlyElements.forEach(element => {
      element.style.display = 'none';
    });
    
    // Ensure public rooms tab is active
    const publicRoomsItem = document.querySelector('.dropdown-item[data-tab="all-rooms"]');
    if (publicRoomsItem) {
      const allItems = document.querySelectorAll('.dropdown-item');
      allItems.forEach(item => item.classList.remove('active'));
      publicRoomsItem.classList.add('active');
      
      // Update dropdown button text
      const currentRoomType = document.getElementById('current-room-type');
      if (currentRoomType) {
        currentRoomType.textContent = publicRoomsItem.textContent;
      }
    }
  }
};

// Event delegation for join/leave room buttons
document.addEventListener('click', async (e) => {
  // Join room button
  if (e.target.classList.contains('join-room-btn')) {
    if (!isLoggedIn()) {
      window.location.href = `/login.html?redirect=/rooms.html`;
      return;
    }
    
    const roomId = e.target.dataset.id;
    await joinRoom(roomId, e.target);
  }
  
  // Leave room button
  if (e.target.classList.contains('leave-room-btn')) {
    if (!isLoggedIn()) return;
    
    const roomId = e.target.dataset.id;
    await leaveRoom(roomId, e.target);
  }
});

// Join a room
const joinRoom = async (roomId, button) => {
  try {
    button.disabled = true;
    button.textContent = 'Joining...';
    
    const response = await fetch(`${API_URL}/rooms/join/${roomId}`, {
      method: 'POST',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      // If successful, enter the room
      window.location.href = `/room.html?id=${roomId}`;
    } else {
      const data = await response.json();
      alert(data.msg || 'Failed to join room');
      button.disabled = false;
      button.textContent = 'Join Room';
    }
  } catch (err) {
    console.error('Error joining room:', err);
    alert('An error occurred while trying to join the room');
    button.disabled = false;
    button.textContent = 'Join Room';
  }
};

// Leave a room
const leaveRoom = async (roomId, button) => {
  if (!confirm('Are you sure you want to leave this room?')) return;
  
  try {
    button.disabled = true;
    button.textContent = 'Leaving...';
    
    const response = await fetch(`${API_URL}/rooms/leave/${roomId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      // Reload the current tab
      const activeTab = document.querySelector('.dropdown-item.active');
      if (activeTab) {
        loadRooms(activeTab.dataset.tab);
      }
    } else {
      const data = await response.json();
      alert(data.msg || 'Failed to leave room');
      button.disabled = false;
      button.textContent = 'Leave Room';
    }
  } catch (err) {
    console.error('Error leaving room:', err);
    alert('An error occurred while trying to leave the room');
    button.disabled = false;
    button.textContent = 'Leave Room';
  }
}; 