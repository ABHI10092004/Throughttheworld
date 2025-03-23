// User Profile Page Functionality
let profileUser = null;
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  // Get user ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  
  if (!userId) {
    // No user ID in URL, show error
    showError('No user ID provided');
    return;
  }
  
  // Load current user data for comparison
  if (isLoggedIn()) {
    currentUser = getUserData();
  }
  
  // Load user profile
  loadUserProfile(userId);
  
  // Setup tab navigation
  setupTabNavigation();
});

// Load user profile data
async function loadUserProfile(userId) {
  try {
    // Show loading state
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('profile-content').style.display = 'none';
    document.getElementById('user-not-found').style.display = 'none';
    
    // Fetch user profile from API
    const response = await fetch(`${API_URL}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load user profile');
    }
    
    profileUser = await response.json();
    console.log('Loaded user profile:', profileUser);
    
    // Display user profile data
    displayUserProfile(profileUser);
    
    // Load user's blogs
    loadUserBlogs(userId);
    
    // Load user's rooms
    loadUserRooms(userId);
    
    // Setup chat button functionality
    setupChatButton(userId);
    
  } catch (error) {
    console.error('Error loading user profile:', error);
    showError(error.message);
  }
}

// Display user profile data
function displayUserProfile(user) {
  // Set profile avatar
  const avatarImg = document.getElementById('profile-avatar-img');
  avatarImg.src = user.avatar || 'images/default-avatar.png';
  avatarImg.alt = user.name;
  
  // Set profile name
  document.getElementById('profile-name').textContent = user.name;
  
  // Set profile bio
  const bioElement = document.getElementById('profile-bio');
  bioElement.textContent = user.bio || 'No bio provided';
  
  // Set profile location
  const locationElement = document.getElementById('profile-location');
  if (user.location) {
    locationElement.querySelector('span').textContent = user.location;
    locationElement.style.display = 'flex';
  } else {
    locationElement.style.display = 'none';
  }
  
  // Set follower/following counts
  document.getElementById('following-count').textContent = user.following ? user.following.length : 0;
  document.getElementById('followers-count').textContent = user.followers ? user.followers.length : 0;
  
  // Render social links
  renderSocialLinks(user);
  
  // Render follow button
  renderFollowButton(user);
  
  // Hide loading, show content
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('profile-content').style.display = 'block';
}

// Render social links
function renderSocialLinks(user) {
  const socialContainer = document.querySelector('.profile-social');
  socialContainer.innerHTML = '';
  
  if (user.socialLinks) {
    // Add Twitter link if available
    if (user.socialLinks.twitter) {
      const twitterLink = document.createElement('a');
      twitterLink.href = `https://twitter.com/${user.socialLinks.twitter}`;
      twitterLink.className = 'twitter';
      twitterLink.innerHTML = '<i class="fab fa-twitter"></i>';
      twitterLink.target = '_blank';
      twitterLink.rel = 'noopener noreferrer';
      socialContainer.appendChild(twitterLink);
    }
    
    // Add Facebook link if available
    if (user.socialLinks.facebook) {
      const facebookLink = document.createElement('a');
      facebookLink.href = `https://facebook.com/${user.socialLinks.facebook}`;
      facebookLink.className = 'facebook';
      facebookLink.innerHTML = '<i class="fab fa-facebook-f"></i>';
      facebookLink.target = '_blank';
      facebookLink.rel = 'noopener noreferrer';
      socialContainer.appendChild(facebookLink);
    }
    
    // Add Instagram link if available
    if (user.socialLinks.instagram) {
      const instagramLink = document.createElement('a');
      instagramLink.href = `https://instagram.com/${user.socialLinks.instagram}`;
      instagramLink.className = 'instagram';
      instagramLink.innerHTML = '<i class="fab fa-instagram"></i>';
      instagramLink.target = '_blank';
      instagramLink.rel = 'noopener noreferrer';
      socialContainer.appendChild(instagramLink);
    }
  }
  
  // If no social links, hide the container
  if (socialContainer.children.length === 0) {
    socialContainer.style.display = 'none';
  } else {
    socialContainer.style.display = 'flex';
  }
}

// Render follow button
function renderFollowButton(user) {
  const followAction = document.getElementById('follow-action');
  
  // Clear previous content
  followAction.innerHTML = '';
  
  // Don't show follow button if:
  // - User is not logged in
  // - User is viewing their own profile
  if (!isLoggedIn() || (currentUser && currentUser.id === user._id)) {
    followAction.style.display = 'none';
    return;
  }
  
  // Check if current user is already following this user
  const isFollowing = currentUser && 
                    currentUser.following && 
                    Array.isArray(currentUser.following) && 
                    currentUser.following.some(follow => follow.user === user._id);
  
  if (isFollowing) {
    // Create unfollow button
    const unfollowBtn = document.createElement('button');
    unfollowBtn.className = 'unfollow-btn';
    unfollowBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
    unfollowBtn.addEventListener('click', () => unfollowUser(user._id));
    followAction.appendChild(unfollowBtn);
  } else {
    // Create follow button
    const followBtn = document.createElement('button');
    followBtn.className = 'follow-btn';
    followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
    followBtn.addEventListener('click', () => followUser(user._id));
    followAction.appendChild(followBtn);
  }
  
  followAction.style.display = 'block';
}

// Follow user
async function followUser(userId) {
  if (!isLoggedIn()) {
    alert('Please login to follow this user');
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/follow/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': getToken()
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to follow user');
    }
    
    // Update current user data
    const data = await response.json();
    if (currentUser) {
      currentUser.following = data;
    }
    
    // Update UI
    renderFollowButton(profileUser);
    
    // Update follower count
    const followersCount = document.getElementById('followers-count');
    followersCount.textContent = parseInt(followersCount.textContent) + 1;
    
  } catch (error) {
    console.error('Error following user:', error);
    alert('Failed to follow user. Please try again.');
  }
}

// Unfollow user
async function unfollowUser(userId) {
  if (!isLoggedIn()) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/unfollow/${userId}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': getToken()
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to unfollow user');
    }
    
    // Update current user data
    const data = await response.json();
    if (currentUser) {
      currentUser.following = data;
    }
    
    // Update UI
    renderFollowButton(profileUser);
    
    // Update follower count
    const followersCount = document.getElementById('followers-count');
    followersCount.textContent = Math.max(0, parseInt(followersCount.textContent) - 1);
    
  } catch (error) {
    console.error('Error unfollowing user:', error);
    alert('Failed to unfollow user. Please try again.');
  }
}

// Setup tab navigation
function setupTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button and corresponding pane
      button.classList.add('active');
      const tabId = button.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Load user's blogs
async function loadUserBlogs(userId) {
  try {
    const blogsContainer = document.getElementById('user-blogs-list');
    
    // Show loading state
    blogsContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading blogs...</p>
      </div>
    `;
    
    // Fetch user's blogs from API
    const response = await fetch(`${API_URL}/blogs?user=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load blogs');
    }
    
    const data = await response.json();
    const blogs = data.blogs || [];
    
    // Update blogs count
    document.getElementById('blogs-count').textContent = blogs.length;
    
    // Display blogs
    displayBlogs(blogs);
    
  } catch (error) {
    console.error('Error loading user blogs:', error);
    const blogsContainer = document.getElementById('user-blogs-list');
    blogsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error Loading Blogs</h3>
        <p>Failed to load blogs. Please try again later.</p>
      </div>
    `;
  }
}

// Display blogs
function displayBlogs(blogs) {
  const blogsContainer = document.getElementById('user-blogs-list');
  
  if (blogs.length === 0) {
    blogsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book"></i>
        <h3>No Blogs Yet</h3>
        <p>This user hasn't published any blogs yet.</p>
      </div>
    `;
    return;
  }
  
  // Clear container
  blogsContainer.innerHTML = '';
  
  // Create blog cards
  blogs.forEach(blog => {
    const blogCard = document.createElement('div');
    blogCard.className = 'blog-card';
    
    // Get cover image or default placeholder
    const coverImage = blog.coverImage 
      ? (blog.coverImage.startsWith('http') ? blog.coverImage : blog.coverImage)
      : 'images/blog-placeholder.jpg';
    
    blogCard.innerHTML = `
      <div class="blog-image">
        <img src="${coverImage}" alt="${blog.title}" onerror="this.src='images/blog-placeholder.jpg'">
      </div>
      <div class="blog-content">
        <div class="blog-meta">
          <span class="blog-date"><i class="far fa-calendar-alt"></i> ${formatDate(blog.createdAt || blog.date)}</span>
          <span class="blog-location"><i class="fas fa-map-marker-alt"></i> ${blog.location || 'Worldwide'}</span>
        </div>
        <h3 class="blog-title">${blog.title}</h3>
        <p class="blog-excerpt">${blog.excerpt || (blog.content && blog.content.replace(/<[^>]*>/g, '').substring(0, 150) + '...') || 'No content available.'}</p>
        <div class="blog-footer">
          <a href="blog-details.html?id=${blog._id}" class="read-more">Read More <i class="fas fa-arrow-right"></i></a>
        </div>
      </div>
    `;
    
    blogsContainer.appendChild(blogCard);
  });
}

// Load user's rooms
async function loadUserRooms(userId) {
  try {
    const roomsContainer = document.getElementById('user-rooms-list');
    
    // Show loading state
    roomsContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Loading rooms...</p>
      </div>
    `;
    
    // Fetch user's rooms from API
    const response = await fetch(`${API_URL}/rooms/user/${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load rooms');
    }
    
    const rooms = await response.json();
    
    // Display rooms
    displayRooms(rooms);
    
  } catch (error) {
    console.error('Error loading user rooms:', error);
    const roomsContainer = document.getElementById('user-rooms-list');
    roomsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-circle"></i>
        <h3>Error Loading Rooms</h3>
        <p>Failed to load travel rooms. Please try again later.</p>
      </div>
    `;
  }
}

// Display rooms
function displayRooms(rooms) {
  const roomsContainer = document.getElementById('user-rooms-list');
  
  if (!rooms || rooms.length === 0) {
    roomsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-comments"></i>
        <h3>No Travel Rooms</h3>
        <p>This user hasn't created any travel rooms yet.</p>
      </div>
    `;
    return;
  }
  
  // Clear container
  roomsContainer.innerHTML = '';
  
  // Create room cards
  rooms.forEach(room => {
    const roomCard = document.createElement('div');
    roomCard.className = 'room-card';
    
    roomCard.innerHTML = `
      <div class="room-header">
        <h3 class="room-name">${room.name}</h3>
        <span class="room-type ${room.isPrivate ? 'private' : 'public'}">
          <i class="fas fa-${room.isPrivate ? 'lock' : 'globe'}"></i>
          ${room.isPrivate ? 'Private' : 'Public'}
        </span>
      </div>
      <div class="room-content">
        <p class="room-description">${room.description || 'No description provided.'}</p>
        <div class="room-meta">
          <span class="room-members">
            <i class="fas fa-users"></i> ${room.members ? room.members.length : 0} members
          </span>
          <span class="room-created">
            <i class="far fa-calendar-alt"></i> Created ${formatDate(room.date)}
          </span>
        </div>
      </div>
      <div class="room-footer">
        <a href="chat.html?id=${room._id}" class="join-room-btn">
          <i class="fas fa-sign-in-alt"></i> Join Room
        </a>
      </div>
    `;
    
    roomsContainer.appendChild(roomCard);
  });
}

// Setup chat button functionality
function setupChatButton(userId) {
  const chatButton = document.getElementById('start-chat-btn');
  
  // Don't show chat button if:
  // - User is not logged in
  // - User is viewing their own profile
  if (!isLoggedIn() || (currentUser && currentUser.id === userId)) {
    chatButton.style.display = 'none';
    return;
  }
  
  chatButton.addEventListener('click', () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      alert('Please login to start a chat');
      return;
    }
    
    // Create a new direct message room or join existing one
    createOrJoinDirectMessageRoom(userId);
  });
}

// Create or join direct message room
async function createOrJoinDirectMessageRoom(userId) {
  try {
    // Disable button and show loading state
    const chatButton = document.getElementById('start-chat-btn');
    chatButton.disabled = true;
    chatButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
    
    // Verify we have a token
    const token = getToken();
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    console.log('Creating/joining DM room with user:', userId);
    console.log('Using API URL:', API_URL);
    
    // Check if a DM room already exists with this user
    const response = await fetch(`${API_URL}/rooms/direct/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      }
    });
    
    // Log the response status for debugging
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error response:', errorData);
      console.error('Response headers:', Object.fromEntries([...response.headers]));
      throw new Error(`Failed to create or join direct message room: ${errorData.msg || response.statusText}`);
    }
    
    const room = await response.json();
    console.log('Room created/joined successfully:', room);
    
    // Redirect to chat page with id parameter instead of roomId
    window.location.href = `chat.html?id=${room._id}`;
    
  } catch (error) {
    console.error('Error creating or joining DM room:', error);
    alert(`Failed to start chat: ${error.message}. Please try again.`);
    
    // Reset button
    const chatButton = document.getElementById('start-chat-btn');
    chatButton.disabled = false;
    chatButton.innerHTML = '<i class="fas fa-comments"></i> Start Chat';
  }
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Show error when user can't be loaded
function showError(message) {
  document.getElementById('loading-state').style.display = 'none';
  document.getElementById('profile-content').style.display = 'none';
  document.getElementById('user-not-found').style.display = 'block';
}

// Get token
function getToken() {
  return localStorage.getItem('token');
} 