// Auth related code
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? `${window.location.protocol}//${window.location.hostname}:5000/api` 
    : `${window.location.protocol}//${window.location.hostname}/api`;

let token = localStorage.getItem('token');
let user = null;

// DOM Elements
const userNavElements = document.querySelectorAll('.user-nav');
const authNavElements = document.querySelectorAll('.auth-nav');
const logoutBtn = document.getElementById('logout');

// Initialize auth state when the page loads
document.addEventListener('DOMContentLoaded', () => {
  token = localStorage.getItem('token');
  
  if (token) {
    // If we have a token but no user data, fetch it
    if (!getUserData()) {
      fetchUserData();
    }
  }
  
  // Update navigation based on auth status
  updateNavigation();
  
  // Set up logout functionality
  setupLogout();
});

// Setup logout functionality
const setupLogout = () => {
  const logoutLink = document.getElementById('logout-link');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
};

// Check if user is logged in
const isLoggedIn = () => {
  return !!token;
};

// Show or hide navigation items based on auth status
const updateNavigation = () => {
  const authLinks = document.querySelector('.auth-links');
  const userMenu = document.querySelector('.user-menu');
  
  if (isLoggedIn()) {
    // Hide auth links and show user menu
    if (authLinks) authLinks.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'block';
      
      // Get user data from local storage
      const userData = getUserData();
      if (userData) {
        document.getElementById('username').textContent = userData.name;
        if (userData.avatar) {
          document.getElementById('user-avatar').src = userData.avatar;
        }
      } else {
        // If we have a token but no user data, fetch it
        fetchUserData();
      }
    }
    
    // Add logged-in class to body for CSS targeting
    document.body.classList.add('logged-in');
  } else {
    // Show auth links and hide user menu
    if (authLinks) authLinks.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
    
    // Remove logged-in class from body
    document.body.classList.remove('logged-in');
  }
};

// Get user data from local storage
const getUserData = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Fetch user data from API
const fetchUserData = async () => {
  try {
    const response = await fetch(`${API_URL}/auth`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (!response.ok) {
      // If token is invalid, log out
      if (response.status === 401) {
        logout();
      }
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await response.json();
    
    // Save user data to local storage
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Update UI
    const usernameElement = document.getElementById('username');
    const userAvatarElement = document.getElementById('user-avatar');
    
    if (usernameElement) usernameElement.textContent = userData.name;
    if (userAvatarElement && userData.avatar) {
      userAvatarElement.src = userData.avatar;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }
};

// Logout function
const logout = () => {
  // Clear local storage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Update token variable
  token = null;
  
  // Update navigation
  updateNavigation();
  
  // Redirect to home page if needed
  if (window.location.pathname.includes('profile.html') || 
      window.location.pathname.includes('create-blog.html') ||
      window.location.pathname.includes('edit-blog.html')) {
    window.location.href = 'index.html';
  } else {
    // Just refresh the current page
    window.location.reload();
  }
};

// Register function
const register = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Registration failed');
    }
    
    const data = await response.json();
    
    // Save token to local storage
    localStorage.setItem('token', data.token);
    token = data.token;
    
    // Save user data to local storage
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      // If user data not included in response, fetch it
      await fetchUserData();
    }
    
    // Update navigation
    updateNavigation();
    
    return data;
  } catch (error) {
    console.error('Error registering:', error);
    throw error;
  }
};

// Login function
const login = async (credentials) => {
  try {
    const response = await fetch(`${API_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || 'Login failed');
    }
    
    const data = await response.json();
    
    // Save token to local storage
    localStorage.setItem('token', data.token);
    token = data.token;
    
    // Save user data to local storage
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      // If user data not included in response, fetch it
      await fetchUserData();
    }
    
    // Update navigation
    updateNavigation();
    
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}; 