// Create Room JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize event listeners
  initEventListeners();
  
  // Initialize invitedMembers array if it doesn't exist
  if (!window.invitedMembers) {
    window.invitedMembers = [];
  }
});

function initEventListeners() {
  // Step navigation buttons
  const nextToStep2Btn = document.getElementById('next-to-step-2');
  const backToStep1Btn = document.getElementById('back-to-step-1');
  const nextToStep3Btn = document.getElementById('next-to-step-3');
  const backToStep2Btn = document.getElementById('back-to-step-2');
  const createRoomBtn = document.getElementById('create-room-btn');
  
  // Search buttons
  const searchBtn = document.getElementById('search-users-btn');
  const testSearchBtn = document.querySelector('.btn-test-search');
  const listAllBtn = document.querySelector('.btn-list-all');
  
  // Add event listeners if elements exist
  if (nextToStep2Btn) nextToStep2Btn.addEventListener('click', goToNextStep);
  if (backToStep1Btn) backToStep1Btn.addEventListener('click', backToStep1);
  if (nextToStep3Btn) nextToStep3Btn.addEventListener('click', goToStep3);
  if (backToStep2Btn) backToStep2Btn.addEventListener('click', backToStep2);
  if (createRoomBtn) createRoomBtn.addEventListener('click', createRoom);
  
  if (searchBtn) searchBtn.addEventListener('click', searchUsers);
  if (testSearchBtn) testSearchBtn.addEventListener('click', testSearch);
  if (listAllBtn) listAllBtn.addEventListener('click', listAllUsers);
}

// Step Navigation Functions
function goToNextStep() {
  console.log('goToNextStep called');
  // Validate form fields
  const name = document.getElementById('room-name')?.value;
  const destination = document.getElementById('room-destination')?.value;
  const description = document.getElementById('room-description')?.value;
  
  console.log('Form values:', { name, destination, description });
  
  if (!name || !destination || !description) {
    alert('Please fill all required fields');
    return false;
  }
  
  // Move to step 2
  document.getElementById('step-content-1').style.display = 'none';
  document.getElementById('step-content-2').style.display = 'block';
  
  // Update step indicators
  document.querySelector('.step[data-step="1"]').classList.remove('active');
  document.querySelector('.step[data-step="1"]').classList.add('completed');
  document.querySelector('.step[data-step="2"]').classList.add('active');
  
  return false;
}

function backToStep1() {
  document.getElementById('step-content-2').style.display = 'none';
  document.getElementById('step-content-1').style.display = 'block';
  
  document.querySelector('.step[data-step="2"]').classList.remove('active');
  document.querySelector('.step[data-step="1"]').classList.remove('completed');
  document.querySelector('.step[data-step="1"]').classList.add('active');
}

function goToStep3() {
  document.getElementById('step-content-2').style.display = 'none';
  document.getElementById('step-content-3').style.display = 'block';
  
  document.querySelector('.step[data-step="2"]').classList.remove('active');
  document.querySelector('.step[data-step="2"]').classList.add('completed');
  document.querySelector('.step[data-step="3"]').classList.add('active');
  
  // Update room summary
  updateRoomSummary();
}

function backToStep2() {
  document.getElementById('step-content-3').style.display = 'none';
  document.getElementById('step-content-2').style.display = 'block';
  
  document.querySelector('.step[data-step="3"]').classList.remove('active');
  document.querySelector('.step[data-step="2"]').classList.remove('completed');
  document.querySelector('.step[data-step="2"]').classList.add('active');
}

function updateRoomSummary() {
  const roomName = document.getElementById('room-name').value;
  const destination = document.getElementById('room-destination').value;
  const description = document.getElementById('room-description').value;
  const isPrivate = document.querySelector('input[name="isPrivate"]:checked').value === 'true';
  
  const summaryContainer = document.getElementById('room-summary-content');
  
  // Create HTML for summary
  let summaryHTML = `
    <div class="summary-item">
      <span class="summary-label">Room Name</span>
      <div class="summary-value">${roomName}</div>
    </div>
    <div class="summary-item">
      <span class="summary-label">Destination</span>
      <div class="summary-value">${destination}</div>
    </div>
    <div class="summary-item">
      <span class="summary-label">Description</span>
      <div class="summary-value">${description}</div>
    </div>
    <div class="summary-item">
      <span class="summary-label">Privacy</span>
      <div class="summary-value">
        <span class="privacy-indicator ${isPrivate ? 'private' : 'public'}">
          <i class="fas ${isPrivate ? 'fa-lock' : 'fa-globe'}"></i>
          ${isPrivate ? 'Private' : 'Public'}
        </span>
        <div class="summary-note">
          ${isPrivate ? 'Only invited members can join this room.' : 'Anyone can view and join this room.'}
        </div>
      </div>
    </div>
  `;
  
  // Add invited members section if there are any
  if (window.invitedMembers && window.invitedMembers.length > 0) {
    summaryHTML += `
      <div class="summary-item invited-summary">
        <span class="summary-label">Invited Members</span>
        <div class="invited-count">
          ${window.invitedMembers.length} ${window.invitedMembers.length === 1 ? 'person' : 'people'} invited
        </div>
        <div class="invited-list">
    `;
    
    window.invitedMembers.forEach(member => {
      summaryHTML += `
        <div class="invited-chip">
          <img src="${member.avatar}" alt="${member.name}" />
          <span>${member.name}</span>
        </div>
      `;
    });
    
    summaryHTML += `
        </div>
      </div>
    `;
  }
  
  // Add note if needed
  summaryHTML += `
    <div class="summary-note-container">
      <i class="fas fa-info-circle"></i>
      <span>You can always invite more people later or change privacy settings.</span>
    </div>
  `;
  
  summaryContainer.innerHTML = summaryHTML;
}

// User Search Functions
function searchUsers() {
  const searchInput = document.getElementById('user-search');
  const query = searchInput.value.trim();
  
  if (query.length < 2) {
    alert('Please enter at least 2 characters to search');
    return;
  }
  
  // Show loading state
  document.getElementById('search-results').innerHTML = `
    <div class="spinner"></div>
    <p>Searching for "${query}"...</p>
  `;
  
  // Make API call
  fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'x-auth-token': localStorage.getItem('token')
    }
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  })
  .then(users => {
    displaySearchResults(users);
  })
  .catch(error => {
    console.error('Search error:', error);
    document.getElementById('search-results').innerHTML = `
      <div class="empty-state">
        <p>Error searching users</p>
        <p>${error.message}</p>
      </div>
    `;
  });
}

function testSearch() {
  console.log('Test search function called');
  const searchInput = document.getElementById('user-search');
  const query = searchInput.value.trim() || 'Abhi';
  
  // Ensure search minimum characters
  if (query.length < 2) {
    alert('Please enter at least 2 characters to search');
    return;
  }
  
  // Show loading state and debugging info
  document.getElementById('search-results').innerHTML = `
    <div class="spinner"></div>
    <p>Searching for "${query}" using test endpoint...</p>
    <div class="debug-info">
      <p>API URL: /api/users/search-test?q=${encodeURIComponent(query)}</p>
      <p>Date/Time: ${new Date().toLocaleString()}</p>
    </div>
  `;
  
  // Direct fetch to test endpoint
  fetch(`/api/users/search-test?q=${encodeURIComponent(query)}`)
  .then(response => {
    console.log('Test endpoint response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    const contentType = response.headers.get('content-type');
    document.getElementById('search-results').innerHTML += `
      <div class="debug-info">
        <p>Response status: ${response.status} ${response.statusText}</p>
        <p>Content-Type: ${contentType || 'not specified'}</p>
      </div>
    `;
    
    // Check if the Content-Type header indicates JSON
    const isJson = contentType && contentType.includes('application/json');
    if (!isJson) {
      document.getElementById('search-results').innerHTML += `
        <div class="debug-info error">
          <p>Warning: Response is not JSON (${contentType})</p>
          <p>The server might not be configured correctly or the endpoint may not exist.</p>
        </div>
      `;
    }
    
    return response.text().then(text => {
      try {
        // Try to parse as JSON
        const jsonData = JSON.parse(text);
        console.log('Parsed JSON response:', jsonData);
        return { data: jsonData, isMockData: false };
      } catch (e) {
        // If not JSON, show the raw text (first 300 chars)
        document.getElementById('search-results').innerHTML += `
          <div class="debug-info error">
            <p>Error parsing JSON response: ${e.message}</p>
            <p>Response starts with: <pre>${text.substring(0, 300)}...</pre></p>
          </div>
        `;
        
        // Use mock data as fallback since we couldn't get real data
        console.log('Using mock data as fallback for search');
        document.getElementById('search-results').innerHTML += `
          <div class="debug-info">
            <p><strong>Using mock data as fallback</strong> - API endpoint issue detected</p>
          </div>
        `;
        
        // Return mock data that matches the search query
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
        
        // Filter mock users based on the search query
        const filteredUsers = mockUsers.filter(user => {
          const searchTerm = query.toLowerCase();
          return (
            user.name.toLowerCase().includes(searchTerm) || 
            user.email.toLowerCase().includes(searchTerm)
          );
        });
        
        return { 
          data: filteredUsers, 
          isMockData: true 
        };
      }
    });
  })
  .then(result => {
    const { data, isMockData } = result;
    console.log('Search results (mock: ' + isMockData + '):', data);
    
    // Process user data separately
    const users = Array.isArray(data) ? data : (data.users || data);
    const processedUsers = processUserData(users);
    
    // Display search debug info
    document.getElementById('search-results').innerHTML += `
      <div class="debug-info">
        <p>Search for "${query}" found ${processedUsers.length} users ${isMockData ? '(mock data)' : ''}</p>
        <p>Raw response sample: ${JSON.stringify(users).substring(0, 200)}${JSON.stringify(users).length > 200 ? '...' : ''}</p>
      </div>
    `;
    
    // Render users in the UI
    renderUserResults(processedUsers);
  })
  .catch(error => {
    console.error('Test search error:', error);
    document.getElementById('search-results').innerHTML += `
      <div class="empty-state">
        <p>Error searching users: ${error.message}</p>
        <p>Using mock data instead.</p>
        <div class="debug-info">
          <p>Error details: ${error.stack || error}</p>
        </div>
      </div>
    `;
    
    // Fallback to mock data even in case of network error
    const query = document.getElementById('user-search').value.trim() || 'Abhi';
    const searchTerm = query.toLowerCase();
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
    
    // Filter by search term
    const filteredUsers = mockUsers.filter(user => {
      return (
        user.name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
      );
    });
    
    // Process and display the mock data
    const processedUsers = processUserData(filteredUsers);
    document.getElementById('search-results').innerHTML += `
      <div class="debug-info">
        <p>Using mock data: found ${processedUsers.length} users matching "${query}"</p>
      </div>
    `;
    renderUserResults(processedUsers, true);
  });
}

function listAllUsers() {
  console.log('Listing all users in the collection');
  
  // Show loading state
  document.getElementById('search-results').innerHTML = `
    <div class="spinner"></div>
    <p>Loading all users from the database...</p>
    <div class="debug-info">
      <p>API URL: /api/users/list/all</p>
      <p>Date/Time: ${new Date().toLocaleString()}</p>
    </div>
  `;
  
  // Direct fetch to the list all users endpoint
  fetch('/api/users/list/all')
  .then(response => {
    console.log('List all users endpoint response:', {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    const contentType = response.headers.get('content-type');
    document.getElementById('search-results').innerHTML += `
      <div class="debug-info">
        <p>Response status: ${response.status} ${response.statusText}</p>
        <p>Content-Type: ${contentType || 'not specified'}</p>
      </div>
    `;
    
    // Check if the Content-Type header indicates JSON
    const isJson = contentType && contentType.includes('application/json');
    if (!isJson) {
      document.getElementById('search-results').innerHTML += `
        <div class="debug-info error">
          <p>Warning: Response is not JSON (${contentType})</p>
          <p>The server might not be configured correctly or the endpoint may not exist.</p>
        </div>
      `;
    }
    
    return response.text().then(text => {
      try {
        // Try to parse as JSON
        const jsonData = JSON.parse(text);
        console.log('Parsed JSON response:', jsonData);
        return jsonData;
      } catch (e) {
        // If not JSON, show the raw text (first 300 chars)
        document.getElementById('search-results').innerHTML += `
          <div class="debug-info error">
            <p>Error parsing JSON response: ${e.message}</p>
            <p>Response starts with: <pre>${text.substring(0, 300)}...</pre></p>
          </div>
        `;
        
        // Return mock data since we couldn't get real data
        console.log('Using mock data as fallback');
        document.getElementById('search-results').innerHTML += `
          <div class="debug-info">
            <p><strong>Using mock data as fallback</strong> - API endpoint issue detected</p>
          </div>
        `;
        
        // Return mock data structure with the MongoDB users from the screenshot
        return {
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
        };
      }
    });
  })
  .then(data => {
    console.log('Users data (real or mock):', data);
    
    // Extract users array and process it
    const users = data.users || [];
    const processedUsers = processUserData(users);
    
    // Display debug information
    document.getElementById('search-results').innerHTML += `
      <div class="debug-info">
        <p>Found ${processedUsers.length} total users in ${data.isMockData ? 'mock data' : 'database'}</p>
        <p>Collection: ${data.collection || 'users'}</p>
      </div>
    `;
    
    // Render users in the UI
    renderUserResults(processedUsers, true);
  })
  .catch(error => {
    console.error('Error listing all users:', error);
    document.getElementById('search-results').innerHTML += `
      <div class="empty-state">
        <p>Error loading users: ${error.message}</p>
        <p>Using mock data instead.</p>
        <div class="debug-info">
          <p>Error details: ${error.stack || error}</p>
        </div>
      </div>
    `;
    
    // Fallback to mock data even in case of network error
    const mockData = {
      collection: 'users (mock data after error)',
      isMockData: true,
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
    };
    
    // Process and display the mock data
    const processedUsers = processUserData(mockData.users);
    document.getElementById('search-results').innerHTML += `
      <div class="debug-info">
        <p>Using mock data with ${processedUsers.length} users</p>
      </div>
    `;
    renderUserResults(processedUsers, true);
  });
}

// Process user data to ensure we have valid information and sanitize any problematic fields
function processUserData(users) {
  if (!users || !Array.isArray(users)) {
    console.error('Invalid user data received:', users);
    return [];
  }
  
  return users.map(user => {
    // Ensure user has required fields
    if (!user || !user._id) {
      console.warn('Invalid user object found:', user);
      return null;
    }
    
    // Create a sanitized user object with default values if fields are missing
    return {
      _id: user._id,
      name: user.name || 'Unknown User',
      email: user.email || '',
      location: user.location || '',
      avatar: user.avatar || 'images/default-avatar.png'
    };
  }).filter(user => user !== null); // Remove any invalid users
}

// Render user results in the UI
function renderUserResults(users, showIds = false) {
  if (!users || users.length === 0) {
    document.getElementById('search-results').innerHTML += `
      <div class="empty-state">
        <p>No users found.</p>
        <p>Try a different search or contact support.</p>
      </div>
    `;
    return;
  }
  
  // Display results
  let resultsHTML = `<div class="results-header">Found ${users.length} user${users.length > 1 ? 's' : ''}</div>`;
  
  users.forEach(user => {
    resultsHTML += `
      <div class="user-item" data-user-id="${user._id}">
        <div class="user-info">
          <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
          <div class="user-details">
            <h4>${user.name}</h4>
            <p>${user.email}</p>
            ${user.location ? `<p class="user-location"><i class="fas fa-map-marker-alt"></i> ${user.location}</p>` : ''}
            ${showIds ? `<p class="user-id">ID: ${user._id}</p>` : ''}
          </div>
        </div>
        <div class="user-action">
          <button type="button" class="invite-user-btn" 
                  data-user-id="${user._id}" 
                  data-user-name="${user.name}" 
                  data-user-avatar="${user.avatar}">
            <i class="fas fa-user-plus"></i> Invite
          </button>
        </div>
      </div>
    `;
  });
  
  document.getElementById('search-results').innerHTML += resultsHTML;
  
  // Add event listeners to invite buttons
  document.querySelectorAll('.invite-user-btn').forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.dataset.userId;
      const userName = this.dataset.userName;
      const userAvatar = this.dataset.userAvatar;
      
      // Change button state
      this.innerHTML = '<i class="fas fa-check"></i> Invited';
      this.disabled = true;
      this.classList.add('invited');
      
      // Initialize invitedMembers if it doesn't exist
      if (!window.invitedMembers) {
        window.invitedMembers = [];
      }
      
      // Add to invited members if not already added
      if (!window.invitedMembers.some(m => m.userId === userId)) {
        window.invitedMembers.push({
          userId,
          name: userName,
          avatar: userAvatar
        });
        
        // Show success message
        showAlert(`${userName} has been invited to the room`, 'success');
        
        // Update display
        updateInvitedMembersDisplay();
      }
    });
  });
}

// Show alert message
function showAlert(message, type = 'info') {
  const alertContainer = document.getElementById('alert-container');
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type}`;
  alertElement.textContent = message;
  alertContainer.appendChild(alertElement);
  
  // Auto-remove alert after 5 seconds
  setTimeout(() => alertElement.remove(), 5000);
}

function displaySearchResults(users) {
  // Process user data first
  const processedUsers = processUserData(users);
  
  // Render users using the shared rendering function
  renderUserResults(processedUsers);
}

function updateInvitedMembersDisplay() {
  const invitedMembersContainer = document.getElementById('invited-members');
  const invitedCountElement = document.getElementById('invited-count');
  const noInvitesMessage = document.getElementById('no-invites-message');
  
  // Update count
  const count = window.invitedMembers.length;
  invitedCountElement.textContent = `(${count})`;
  
  // Show/hide empty state
  if (count === 0) {
    noInvitesMessage.style.display = 'flex';
    return;
  } else {
    noInvitesMessage.style.display = 'none';
  }
  
  // Generate HTML for invited members
  let invitedMembersHTML = '';
  
  window.invitedMembers.forEach(member => {
    invitedMembersHTML += `
      <div class="invited-member" data-user-id="${member.userId}">
        <div class="user-info">
          <img src="${member.avatar}" alt="${member.name}" class="user-avatar">
          <div class="user-details">
            <h4>${member.name}</h4>
          </div>
        </div>
        <div class="user-action">
          <button type="button" class="remove-invite-btn remove" data-user-id="${member.userId}">
            <i class="fas fa-times"></i> Remove
          </button>
        </div>
      </div>
    `;
  });
  
  // Keep the no invites message in the DOM but hide it
  invitedMembersContainer.innerHTML = invitedMembersHTML;
  invitedMembersContainer.appendChild(noInvitesMessage);
  
  // Add event listeners to remove buttons
  document.querySelectorAll('.remove-invite-btn').forEach(button => {
    button.addEventListener('click', function() {
      const userId = this.dataset.userId;
      const memberIndex = window.invitedMembers.findIndex(m => m.userId === userId);
      
      if (memberIndex !== -1) {
        const removedMember = window.invitedMembers[memberIndex];
        window.invitedMembers.splice(memberIndex, 1);
        
        // Update display
        updateInvitedMembersDisplay();
        
        // Update invite button if visible
        const inviteButton = document.querySelector(`.invite-user-btn[data-user-id="${userId}"]`);
        if (inviteButton) {
          inviteButton.classList.remove('invited');
          inviteButton.disabled = false;
          inviteButton.innerHTML = '<i class="fas fa-user-plus"></i> Invite';
        }
      }
    });
  });
}

// Create Room Function
function createRoom() {
  // Show loading overlay
  document.getElementById('loading-overlay').style.display = 'flex';
  
  // Validate invited members - make sure they have valid user IDs
  const validMembers = window.invitedMembers ? window.invitedMembers.filter(member => {
    if (!member.userId) {
      console.warn('Skipping member with missing userId:', member);
      return false;
    }
    return true;
  }) : [];
  
  // Get room data from form fields
  const roomData = {
    name: document.getElementById('room-name').value,
    destination: document.getElementById('room-destination').value,
    description: document.getElementById('room-description').value,
    isPrivate: document.querySelector('input[name="isPrivate"]:checked').value === 'true',
    members: validMembers.map(m => m.userId)
  };
  
  console.log('Creating room with data:', roomData);
  console.log('Invited members:', validMembers.length);
  
  // API request to create room
  fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': localStorage.getItem('token')
    },
    body: JSON.stringify(roomData)
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(err => {
        throw new Error(err.msg || 'Failed to create room');
      });
    }
    return response.json();
  })
  .then(data => {
    console.log('Room created successfully:', data);
    
    // Show success message
    showAlert('Room created successfully! Redirecting...', 'success');
    
    // Delay redirect for a moment to show the message
    setTimeout(() => {
      // Redirect to the new room page
      window.location.href = `/room.html?id=${data._id}`;
    }, 1500);
  })
  .catch(error => {
    console.error('Error creating room:', error);
    // Hide loading overlay
    document.getElementById('loading-overlay').style.display = 'none';
    
    // Show error message
    showAlert(`Error creating room: ${error.message}`, 'error');
    
    // Scroll to top to show the error
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
