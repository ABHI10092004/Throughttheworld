// Profile page functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in directly from localStorage
  const token = localStorage.getItem('token');
  
  console.log('Profile page loaded, token exists:', !!token);
  
  // For testing, you can force the logged-in state
  const forceLoggedIn = true; // Set to false to test non-logged-in state
  
  console.log('Login state:', token ? 'Logged in with token' : (forceLoggedIn ? 'Force logged in' : 'Not logged in'));
  
  if (token || forceLoggedIn) {
    // If no token exists but we're forcing logged in state, create a test token
    if (!token && forceLoggedIn) {
      console.log('Creating test token for development');
      const testToken = 'test-token-for-development';
      localStorage.setItem('token', testToken);
    }
    
    document.getElementById('auth-message').style.display = 'none';
    document.getElementById('profile-content').style.display = 'block';
    
    // Make sure the body has the logged-in class
    document.body.classList.add('logged-in');
    
    // Initialize profile page
    initializeProfilePage();
  } else {
    document.getElementById('auth-message').style.display = 'block';
    document.getElementById('profile-content').style.display = 'none';
    
    // Make sure the body doesn't have the logged-in class
    document.body.classList.remove('logged-in');
  }
  
  // Make sure Profile link in nav is active
  const profileLink = document.querySelector('a[href="profile.html"]');
  if (profileLink) {
    profileLink.classList.add('active');
  }
});

// Initialize profile page
const initializeProfilePage = () => {
  // Load user profile data
  loadUserProfile();
  
  // Set up tab navigation
  setupTabNavigation();
  
  // Set up form submissions
  setupFormSubmissions();
  
  // Set up file uploads
  setupFileUploads();
};

// Load user profile data
const loadUserProfile = async () => {
  try {
    // First try to get user data from local storage
    const userData = getProfileUserData();
    
    if (userData) {
      // Update profile UI with user data from local storage
      updateProfileUI(userData);
      
      // Still load stats from API
      loadUserStats();
      
      // Load initial tab content
      loadMyBlogs();
      loadMyRooms();
      loadMyBookings();
    } else {
      // If no data in local storage, fetch from API
      try {
        const response = await fetch(`${API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load profile from API');
        }
        
        const apiUserData = await response.json();
        
        // Save to local storage
        localStorage.setItem('userData', JSON.stringify(apiUserData));
        
        // Update profile UI with user data
        updateProfileUI(apiUserData);
        
      } catch (apiError) {
        console.error('Error fetching user data from API:', apiError);
        
        // Use default user data
        const defaultUserData = {
          name: 'Guest User',
          email: 'guest@example.com',
          bio: 'No bio available',
          avatar: 'images/default-avatar.png'
        };
        
        // Update profile UI with default data
        updateProfileUI(defaultUserData);
      }
      
      // Load user stats
      loadUserStats();
      
      // Load initial tab content
      loadMyBlogs();
      loadMyRooms();
      loadMyBookings();
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    alert('Failed to load profile data. Please try again later.');
  }
};

// Update profile UI with user data
const updateProfileUI = (userData) => {
  // Update profile header
  document.getElementById('profile-name').textContent = userData.name;
  document.getElementById('profile-bio').textContent = userData.bio || 'No bio yet';
  
  // Update profile avatar if exists
  if (userData.avatar) {
    document.getElementById('profile-avatar-img').src = userData.avatar;
    
    // Also update navbar avatar if it exists
    const navAvatar = document.getElementById('user-avatar');
    if (navAvatar) navAvatar.src = userData.avatar;
  }
  
  // Update cover image if exists
  if (userData.coverImage) {
    document.querySelector('.profile-cover').style.backgroundImage = `url('${userData.coverImage}')`;
  }
  
  // Update form fields
  document.getElementById('name').value = userData.name || '';
  document.getElementById('email').value = userData.email || '';
  document.getElementById('bio').value = userData.bio || '';
  document.getElementById('location').value = userData.location || '';
  document.getElementById('website').value = userData.website || '';
  
  // Update username in navbar
  const usernameElement = document.getElementById('username');
  if (usernameElement) usernameElement.textContent = userData.name;
  
  // Update social media links
  if (userData.social) {
    document.getElementById('twitter').value = userData.social.twitter || '';
    document.getElementById('instagram').value = userData.social.instagram || '';
    document.getElementById('facebook').value = userData.social.facebook || '';
  }
};

// Load user stats
const loadUserStats = async () => {
  try {
    // Try to fetch stats from API
    const response = await fetch(`${API_URL}/users/stats`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    let stats;
    
    if (!response.ok) {
      console.error('Failed to load user stats from API, using mock data');
      // Use mock data if API fails
      stats = {
        blogsCount: 0,
        roomsCount: 0,
        bookingsCount: 0
      };
    } else {
      stats = await response.json();
    }
    
    // Update stats in the UI
    document.getElementById('blogs-count').textContent = stats.blogsCount || 0;
    document.getElementById('rooms-count').textContent = stats.roomsCount || 0;
    document.getElementById('bookings-count').textContent = stats.bookingsCount || 0;
    
  } catch (error) {
    console.error('Error loading user stats:', error);
    // Set default stats in case of error
    document.getElementById('blogs-count').textContent = '0';
    document.getElementById('rooms-count').textContent = '0';
    document.getElementById('bookings-count').textContent = '0';
  }
};

// Set up tab navigation
const setupTabNavigation = () => {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons and tabs
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Show corresponding tab
      const tabId = button.dataset.tab;
      document.getElementById(tabId).classList.add('active');
    });
  });
};

// Set up form submissions
const setupFormSubmissions = () => {
  // Profile form submission
  const profileForm = document.getElementById('profile-form');
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      // Get form data
      const formData = {
        name: document.getElementById('name').value,
        bio: document.getElementById('bio').value,
        location: document.getElementById('location').value,
        website: document.getElementById('website').value,
        social: {
          twitter: document.getElementById('twitter').value,
          instagram: document.getElementById('instagram').value,
          facebook: document.getElementById('facebook').value
        }
      };
      
      // Send update request
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to update profile');
      }
      
      const updatedProfile = await response.json();
      
      // Update profile UI
      updateProfileUI(updatedProfile);
      
      // Also update the navbar user info
      updateUserInfo(updatedProfile);
      
      showAlert('Profile updated successfully', 'success');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      showAlert(error.message || 'Failed to update profile', 'error');
    }
  });
  
  // Password change form submission
  const passwordForm = document.getElementById('password-form');
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      // Check if passwords match
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }
      
      // Send password update request
      const response = await fetch(`${API_URL}/users/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.msg || 'Failed to update password');
      }
      
      // Clear form
      passwordForm.reset();
      
      showAlert('Password updated successfully', 'success');
      
    } catch (error) {
      console.error('Error updating password:', error);
      showAlert(error.message || 'Failed to update password', 'error');
    }
  });
};

// Set up file uploads
const setupFileUploads = () => {
  // Helper function to show success indicator temporarily
  function showSuccessIndicator(element) {
    element.style.display = 'flex';
    setTimeout(() => {
      element.style.display = 'none';
    }, 3000);
  }

  // Avatar upload
  const avatarUpload = document.getElementById('avatar-upload');
  avatarUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show loading spinner
    document.getElementById('avatar-loading').style.display = 'flex';
    document.getElementById('avatar-success').style.display = 'none';
    
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/uploads/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }
      
      const data = await response.json();
      
      // Update avatar in UI
      document.getElementById('profile-avatar-img').src = data.fileUrl;
      const navAvatar = document.getElementById('user-avatar');
      if (navAvatar) navAvatar.src = data.fileUrl;
      
      // Update user data in local storage
      const userData = getProfileUserData();
      if (userData) {
        userData.avatar = data.fileUrl;
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      
      // Show success indicator
      showSuccessIndicator(document.getElementById('avatar-success'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      // Hide loading spinner
      document.getElementById('avatar-loading').style.display = 'none';
    }
  });
  
  // Cover image upload
  const coverUpload = document.getElementById('cover-upload');
  coverUpload.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show loading spinner
    document.getElementById('cover-loading').style.display = 'flex';
    document.getElementById('cover-success').style.display = 'none';
    
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_URL}/uploads/cover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload cover image');
      }
      
      const data = await response.json();
      
      // Update cover image in UI
      document.querySelector('.profile-cover').style.backgroundImage = `url('${data.fileUrl}')`;
      
      // Update user data in local storage
      const userData = getProfileUserData();
      if (userData) {
        userData.coverImage = data.fileUrl;
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      
      // Show success indicator
      showSuccessIndicator(document.getElementById('cover-success'));
    } catch (error) {
      console.error('Error uploading cover image:', error);
      alert('Failed to upload cover image. Please try again.');
    } finally {
      // Hide loading spinner
      document.getElementById('cover-loading').style.display = 'none';
    }
  });

  // Set up delete account action
  const deleteAccountBtn = document.getElementById('delete-account-btn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
        try {
          const response = await fetch(`${API_URL}/users/delete-account`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete account');
          }

          // Clear local storage and redirect to home
          localStorage.clear();
          window.location.href = '/';
        } catch (error) {
          console.error('Delete account error:', error);
          alert(`Failed to delete account: ${error.message}`);
        }
      }
    });
  }
};

// Load my blogs
const loadMyBlogs = async () => {
  const blogsList = document.getElementById('my-blogs-list');
  
  try {
    // Try to fetch blogs from API
    const response = await fetch(`${API_URL}/blogs/user`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    let blogs;
    
    if (!response.ok) {
      console.error('Failed to load blogs from API, using mock data');
      // Use mock data if API fails
      blogs = [];
    } else {
      blogs = await response.json();
    }
    
    if (blogs.length === 0) {
      blogsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-book"></i>
          <h4>No Blogs Yet</h4>
          <p>You haven't created any travel blogs yet.</p>
          <a href="create-blog.html" class="btn btn-primary">Write Your First Blog</a>
        </div>
      `;
      return;
    }
    
    let blogsHTML = '';
    
    blogs.forEach(blog => {
      blogsHTML += `
        <div class="blog-card">
          <div class="blog-image">
            <img src="${blog.image || 'images/default-blog.jpg'}" alt="${blog.title}">
          </div>
          <div class="blog-content">
            <h3>${blog.title}</h3>
            <div class="blog-meta">
              <span><i class="fas fa-calendar"></i> ${formatDate(blog.createdAt)}</span>
              <span><i class="fas fa-heart"></i> ${blog.likes.length} Likes</span>
              <span><i class="fas fa-comment"></i> ${blog.comments.length} Comments</span>
            </div>
            <div class="blog-excerpt">${blog.content.substring(0, 100)}...</div>
            <div class="blog-actions">
              <a href="blog.html?id=${blog._id}" class="btn btn-secondary btn-sm">View</a>
              <a href="edit-blog.html?id=${blog._id}" class="btn btn-primary btn-sm">Edit</a>
            </div>
          </div>
        </div>
      `;
    });
    
    blogsList.innerHTML = blogsHTML;
    
  } catch (error) {
    console.error('Error loading blogs:', error);
    blogsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book"></i>
        <h4>No Blogs Yet</h4>
        <p>You haven't created any travel blogs yet.</p>
        <a href="create-blog.html" class="btn btn-primary">Write Your First Blog</a>
      </div>
    `;
  }
};

// Load my rooms
const loadMyRooms = async () => {
  const roomsList = document.getElementById('my-rooms-list');
  
  try {
    // Try to fetch rooms from API
    const response = await fetch(`${API_URL}/rooms/my`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    let rooms;
    
    if (!response.ok) {
      console.error('Failed to load rooms from API, using mock data');
      // Use mock data if API fails
      rooms = [];
    } else {
      rooms = await response.json();
    }
    
    if (rooms.length === 0) {
      roomsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-door-open"></i>
          <h4>No Rooms Yet</h4>
          <p>You haven't created any travel rooms yet.</p>
          <button id="create-room-empty-btn" class="btn btn-primary">Create Your First Room</button>
        </div>
      `;
      
      // Add event listener for create room button
      document.getElementById('create-room-empty-btn').addEventListener('click', openCreateRoomModal);
      return;
    }
    
    let roomsHTML = '';
    
    rooms.forEach(room => {
      roomsHTML += `
        <div class="room-card">
          <div class="room-header">
            <h3>${room.name}</h3>
          </div>
          <div class="room-content">
            <div class="room-destination">
              <i class="fas fa-map-marker-alt"></i> ${room.destination}
            </div>
            <div class="room-stats">
              <div class="room-stat">
                <i class="fas fa-users"></i> ${room.members.length} Members
              </div>
              <div class="room-stat">
                <i class="fas fa-comment"></i> ${room.messageCount || 0} Messages
              </div>
            </div>
            <div class="room-actions">
              <a href="chat.html?id=${room._id}" class="btn btn-primary btn-sm">Enter Room</a>
              <button class="btn btn-danger btn-sm delete-room-btn" data-id="${room._id}">Delete</button>
            </div>
          </div>
        </div>
      `;
    });
    
    roomsList.innerHTML = roomsHTML;
    
    // Add event listeners for delete room buttons
    document.querySelectorAll('.delete-room-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteRoom(btn.dataset.id));
    });
    
  } catch (error) {
    console.error('Error loading rooms:', error);
    roomsList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-door-open"></i>
        <h4>No Rooms Yet</h4>
        <p>You haven't created any travel rooms yet.</p>
        <button id="create-room-empty-btn" class="btn btn-primary">Create Your First Room</button>
      </div>
    `;
    
    // Add event listener for create room button
    document.getElementById('create-room-empty-btn').addEventListener('click', openCreateRoomModal);
  }
};

// Load my bookings
const loadMyBookings = async () => {
  const bookingsList = document.getElementById('my-bookings-list');
  
  try {
    // Try to fetch bookings from API
    const response = await fetch(`${API_URL}/bookings`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    let bookings;
    
    if (!response.ok) {
      console.error('Failed to load bookings from API, using mock data');
      // Use mock data if API fails
      bookings = [];
    } else {
      bookings = await response.json();
    }
    
    if (bookings.length === 0) {
      bookingsList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-ticket-alt"></i>
          <h4>No Bookings Yet</h4>
          <p>You haven't made any travel bookings yet.</p>
          <a href="bookings.html" class="btn btn-primary">Book Your First Trip</a>
        </div>
      `;
      return;
    }
    
    // Sort bookings by date (most recent first)
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    let bookingsHTML = '';
    
    bookings.forEach(booking => {
      // Format the booking details based on type
      const bookingDetails = formatBookingDetails(booking);
      
      bookingsHTML += `
        <div class="booking-card ${booking.status.toLowerCase()}">
          <div class="booking-icon">
            <i class="${getIconForBookingType(booking.type)}"></i>
          </div>
          <div class="booking-details">
            <div class="booking-type-badge">${capitalizeFirstLetter(booking.type)}</div>
            <h4>${bookingDetails.title}</h4>
            <div class="booking-info">
              <div>${bookingDetails.info}</div>
              <div>${bookingDetails.date}</div>
            </div>
            <div class="booking-price">$${booking.price.amount.toFixed(2)} ${booking.price.currency}</div>
            <div class="booking-status">
              Status: <span class="status-badge ${booking.status.toLowerCase()}">${booking.status}</span>
            </div>
          </div>
          <div class="booking-actions">
            ${booking.status === 'confirmed' ? 
              `<button class="btn btn-danger btn-sm cancel-booking-btn" data-id="${booking._id}">Cancel</button>` : 
              ''}
            <button class="btn btn-secondary btn-sm view-booking-btn" data-id="${booking._id}">View Details</button>
          </div>
        </div>
      `;
    });
    
    bookingsList.innerHTML = bookingsHTML;
    
    // Add event listeners for booking actions
    document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
      btn.addEventListener('click', () => cancelBooking(btn.dataset.id));
    });
    
    document.querySelectorAll('.view-booking-btn').forEach(btn => {
      btn.addEventListener('click', () => viewBookingDetails(btn.dataset.id));
    });
    
  } catch (error) {
    console.error('Error loading bookings:', error);
    bookingsList.innerHTML = `
      <div class="error-state">
        <p>Failed to load bookings. Please try again later.</p>
      </div>
    `;
  }
};

// Create Room Modal (would be implemented in a real app)
const openCreateRoomModal = () => {
  // In a real app, this would open a modal with a form
  // For this demo, we'll just use a simple prompt
  const roomName = prompt('Enter room name:');
  if (!roomName) return;
  
  const roomDestination = prompt('Enter destination:');
  if (!roomDestination) return;
  
  createRoom(roomName, roomDestination);
};

// Create a new room
const createRoom = async (name, destination) => {
  try {
    const response = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        name,
        destination,
        description: `A travel room for ${destination}`
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Failed to create room');
    }
    
    // Reload rooms
    loadMyRooms();
    
    // Update room count
    loadUserStats();
    
    showAlert('Room created successfully', 'success');
    
  } catch (error) {
    console.error('Error creating room:', error);
    showAlert(error.message || 'Failed to create room', 'error');
  }
};

// Delete a room
const deleteRoom = async (roomId) => {
  if (!confirm('Are you sure you want to delete this room? All messages will be permanently deleted.')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Failed to delete room');
    }
    
    // Reload rooms
    loadMyRooms();
    
    // Update room count
    loadUserStats();
    
    showAlert('Room deleted successfully', 'success');
    
  } catch (error) {
    console.error('Error deleting room:', error);
    showAlert(error.message || 'Failed to delete room', 'error');
  }
};

// Cancel a booking
const cancelBooking = async (bookingId) => {
  if (!confirm('Are you sure you want to cancel this booking?')) {
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/bookings/cancel/${bookingId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Failed to cancel booking');
    }
    
    // Reload bookings
    loadMyBookings();
    
    showAlert('Booking cancelled successfully', 'success');
    
  } catch (error) {
    console.error('Error cancelling booking:', error);
    showAlert(error.message || 'Failed to cancel booking', 'error');
  }
};

// View booking details (this would show a modal in a real app)
const viewBookingDetails = (bookingId) => {
  alert(`Viewing details for booking ${bookingId}. In a real app, this would show a modal with complete booking information.`);
};

// Format booking details for display
const formatBookingDetails = (booking) => {
  let title = '';
  let info = '';
  let date = '';
  
  switch (booking.type) {
    case 'flight':
      title = `${booking.details.departure.location} to ${booking.details.arrival.location}`;
      info = `${booking.details.airline || 'Various Airlines'}`;
      date = formatDate(booking.details.departure.date);
      break;
    case 'hotel':
      title = `${booking.details.hotelName || 'Hotel Stay'}`;
      info = `${booking.details.roomType || 'Standard'} Room, ${booking.details.guests} Guests`;
      date = `${formatDate(booking.details.checkIn)} - ${formatDate(booking.details.checkOut)}`;
      break;
    case 'car':
      title = `Car Rental: ${capitalizeFirstLetter(booking.details.carType) || 'Standard'} Car`;
      info = `Pickup: ${booking.details.pickupLocation}, Drop-off: ${booking.details.dropoffLocation || booking.details.pickupLocation}`;
      date = `${formatDate(booking.details.departure.date)} - ${formatDate(booking.details.arrival.date)}`;
      break;
    case 'bus':
      title = `${booking.details.departure.location} to ${booking.details.arrival.location}`;
      info = `Bus Journey`;
      date = formatDate(booking.details.departure.date);
      break;
    case 'train':
      title = `${booking.details.departure.location} to ${booking.details.arrival.location}`;
      info = `Train Journey`;
      date = formatDate(booking.details.departure.date);
      break;
  }
  
  return { title, info, date };
};

// Get icon class for booking type
const getIconForBookingType = (type) => {
  switch (type) {
    case 'flight': return 'fas fa-plane';
    case 'hotel': return 'fas fa-hotel';
    case 'car': return 'fas fa-car';
    case 'bus': return 'fas fa-bus';
    case 'train': return 'fas fa-train';
    default: return 'fas fa-ticket-alt';
  }
};

// Format date for display
const formatDate = (dateStr) => {
  try {
    const date = new Date(dateStr || new Date());
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
};

// Helper function to capitalize first letter
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

// Update user info in navbar
const updateUserInfo = (userData) => {
  // Update username in navbar
  const usernameElement = document.getElementById('username');
  if (usernameElement) {
    usernameElement.textContent = userData.name;
  }
  
  // Update user data in local storage
  localStorage.setItem('userData', JSON.stringify(userData));
};

// Show alert message
const showAlert = (message, type = 'success') => {
  // Create alert element
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type}`;
  alertElement.textContent = message;
  
  // Add to the page
  const container = document.querySelector('.profile-content');
  if (container) {
    container.insertBefore(alertElement, container.firstChild);
    
    // Remove after 3 seconds
    setTimeout(() => {
      alertElement.remove();
    }, 3000);
  } else {
    // Fallback to standard alert if container not found
    alert(message);
  }
};

// Get user data from local storage
const getProfileUserData = () => {
  const userData = localStorage.getItem('userData') || localStorage.getItem('user');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  }
  return null;
}; 