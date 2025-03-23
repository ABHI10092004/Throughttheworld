// Nearby Travelers Page Functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  const token = localStorage.getItem('token');
  const forceLoggedIn = true; // For development/testing
  
  if (token || forceLoggedIn) {
    if (!token && forceLoggedIn) {
      console.log('Creating test token for development');
      localStorage.setItem('token', 'test-token-for-development');
    }
    
    document.getElementById('auth-message').style.display = 'none';
    document.getElementById('travelers-main').style.display = 'block';
    
    // Make sure the body has the logged-in class
    document.body.classList.add('logged-in');
    
    // Initialize the page
    initNearbyTravelersPage();
  } else {
    document.getElementById('auth-message').style.display = 'block';
    document.getElementById('travelers-main').style.display = 'none';
    
    // Make sure the body doesn't have the logged-in class
    document.body.classList.remove('logged-in');
  }
  
  // Make sure Nearby Travelers link in nav is active
  const nearbyLink = document.querySelector('a[href="/nearby-travelers.html"]');
  if (nearbyLink) {
    nearbyLink.classList.add('active');
  }
});

// Initialize the page
const initNearbyTravelersPage = () => {
  // Set up event listeners
  setupDistanceSlider();
  setupSearchButton();
  setupUseMyLocationButton();
  setupCreateGroupButton();
  setupDestinationButtons();
  setupModalCloseButtons();
  
  // Load and display initial data
  loadNearbyTravelers();
};

// Set up distance slider with value display
const setupDistanceSlider = () => {
  const distanceSlider = document.getElementById('distance-filter');
  const distanceValue = document.getElementById('distance-value');
  
  distanceSlider.addEventListener('input', () => {
    distanceValue.textContent = `${distanceSlider.value} km`;
  });
};

// Set up search button
const setupSearchButton = () => {
  const searchButton = document.getElementById('search-travelers');
  
  searchButton.addEventListener('click', () => {
    // Get filter values
    const location = document.getElementById('location-filter').value;
    const distance = document.getElementById('distance-filter').value;
    const interestSelect = document.getElementById('interest-filter');
    const interests = Array.from(interestSelect.selectedOptions).map(option => option.value);
    const startDate = document.getElementById('travel-date-start').value;
    const endDate = document.getElementById('travel-date-end').value;
    
    // Validate location
    if (!location) {
      alert('Please enter a location');
      return;
    }
    
    // Show loading state
    document.getElementById('loading-indicator').style.display = 'flex';
    document.getElementById('travelers-list').innerHTML = '';
    
    // Simulate loading data
    setTimeout(() => {
      loadNearbyTravelers(location, distance, interests, startDate, endDate);
    }, 1500);
  });
};

// Set up "Use My Location" button
const setupUseMyLocationButton = () => {
  const useMyLocationButton = document.getElementById('use-my-location');
  
  useMyLocationButton.addEventListener('click', () => {
    // In a real app, this would use geolocation API
    // For this demo, we'll just use a fixed location
    document.getElementById('location-filter').value = 'New York, NY, USA';
  });
};

// Set up Create Group button
const setupCreateGroupButton = () => {
  const createGroupButton = document.getElementById('create-group-btn');
  const createGroupModal = document.getElementById('create-group-modal');
  const createGroupForm = document.getElementById('create-group-form');
  
  createGroupButton.addEventListener('click', () => {
    createGroupModal.style.display = 'block';
  });
  
  createGroupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Get form values
    const name = document.getElementById('group-name').value;
    const destination = document.getElementById('group-destination').value;
    const startDate = document.getElementById('group-date-start').value;
    const endDate = document.getElementById('group-date-end').value;
    const description = document.getElementById('group-description').value;
    const interestSelect = document.getElementById('group-interests');
    const interests = Array.from(interestSelect.selectedOptions).map(option => option.value);
    const privacy = document.getElementById('group-privacy').value;
    
    // In a real app, this would create a new group via API
    // For this demo, we'll just show a success message
    alert(`Group "${name}" created successfully!`);
    
    // Close the modal and reset form
    createGroupModal.style.display = 'none';
    createGroupForm.reset();
  });
};

// Set up destination view buttons
const setupDestinationButtons = () => {
  const destinationButtons = document.querySelectorAll('.destination-info button');
  
  destinationButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const destination = e.target.closest('.destination-card').querySelector('h4').textContent;
      document.getElementById('location-filter').value = destination;
      
      // Trigger search
      document.getElementById('search-travelers').click();
    });
  });
};

// Set up modal close buttons
const setupModalCloseButtons = () => {
  const closeButtons = document.querySelectorAll('.close-modal');
  
  closeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const modal = button.closest('.modal');
      modal.style.display = 'none';
    });
  });
  
  // Close modal when clicking outside content
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      e.target.style.display = 'none';
    }
  });
};

// Load nearby travelers data
const loadNearbyTravelers = (location = 'New York, NY, USA', distance = 50, interests = [], startDate = '', endDate = '') => {
  // In a real app, this would fetch data from an API
  // For this demo, we'll use mock data
  const travelers = getMockTravelers();
  
  // Filter travelers based on criteria
  let filteredTravelers = travelers;
  
  if (interests.length > 0) {
    filteredTravelers = filteredTravelers.filter(traveler => {
      return traveler.interests.some(interest => interests.includes(interest));
    });
  }
  
  if (startDate && endDate) {
    filteredTravelers = filteredTravelers.filter(traveler => {
      // Check if any travel plan overlaps with the selected dates
      return traveler.travelPlans.some(plan => {
        const planStart = new Date(plan.startDate);
        const planEnd = new Date(plan.endDate);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        
        return (
          (planStart >= filterStart && planStart <= filterEnd) ||
          (planEnd >= filterStart && planEnd <= filterEnd) ||
          (planStart <= filterStart && planEnd >= filterEnd)
        );
      });
    });
  }
  
  // Display travelers
  displayTravelers(filteredTravelers);
  
  // Update map (in a real app)
  updateMap(location, filteredTravelers);
};

// Display travelers in the list
const displayTravelers = (travelers) => {
  const travelersList = document.getElementById('travelers-list');
  
  // Hide loading indicator
  document.getElementById('loading-indicator').style.display = 'none';
  
  if (travelers.length === 0) {
    travelersList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-friends"></i>
        <h4>No Travelers Found</h4>
        <p>Try adjusting your filters or try a different location.</p>
      </div>
    `;
    return;
  }
  
  let travelersHTML = '';
  
  travelers.forEach(traveler => {
    // Get the closest travel plan to current location
    const currentPlan = traveler.travelPlans.find(plan => 
      plan.destination.toLowerCase().includes('new york'));
    
    // Format dates
    const dateText = currentPlan 
      ? `${formatDate(currentPlan.startDate)} - ${formatDate(currentPlan.endDate)}`
      : formatDate(traveler.travelPlans[0].startDate);
    
    // Format interests (max 3)
    const interestsHTML = traveler.interests.slice(0, 3).map(interest => 
      `<span class="interest-tag">${formatInterest(interest)}</span>`
    ).join('');
    
    travelersHTML += `
      <div class="traveler-card">
        <div class="traveler-avatar">
          <img src="${traveler.avatar}" alt="${traveler.name}">
        </div>
        <div class="traveler-info">
          <h3>${traveler.name}</h3>
          <div class="traveler-location">
            <i class="fas fa-map-marker-alt"></i> ${traveler.location}
          </div>
          <div class="traveler-dates">
            <i class="fas fa-calendar"></i> ${dateText}
          </div>
          <div class="traveler-interests">
            ${interestsHTML}
            ${traveler.interests.length > 3 ? `<span class="interest-tag">+${traveler.interests.length - 3} more</span>` : ''}
          </div>
          <button class="btn btn-primary btn-sm connect-btn" data-id="${traveler.id}">Connect</button>
        </div>
      </div>
    `;
  });
  
  travelersList.innerHTML = travelersHTML;
  
  // Add event listeners to connect buttons
  document.querySelectorAll('.connect-btn').forEach(button => {
    button.addEventListener('click', () => {
      const travelerId = button.dataset.id;
      showTravelerProfile(travelerId);
    });
  });
};

// Show traveler profile in modal
const showTravelerProfile = (travelerId) => {
  const travelers = getMockTravelers();
  const traveler = travelers.find(t => t.id === travelerId);
  
  if (!traveler) return;
  
  // Format travel plans
  const travelPlansHTML = traveler.travelPlans.map(plan => `
    <div class="travel-plan-item">
      <div class="travel-plan-destination">${plan.destination}</div>
      <div class="travel-plan-dates">${formatDate(plan.startDate)} - ${formatDate(plan.endDate)}</div>
    </div>
  `).join('');
  
  // Format interests
  const interestsHTML = traveler.interests.map(interest => 
    `<span class="interest-tag">${formatInterest(interest)}</span>`
  ).join('');
  
  const modalContent = document.getElementById('connect-modal-content');
  modalContent.innerHTML = `
    <div class="traveler-profile">
      <div class="traveler-profile-header">
        <div class="traveler-profile-avatar">
          <img src="${traveler.avatar}" alt="${traveler.name}">
        </div>
        <h2 class="traveler-profile-name">${traveler.name}</h2>
        <div class="traveler-profile-location">
          <i class="fas fa-map-marker-alt"></i> ${traveler.location}
        </div>
      </div>
      
      <p class="traveler-profile-bio">${traveler.bio}</p>
      
      <div class="traveler-profile-stats">
        <div class="traveler-stat">
          <span class="traveler-stat-value">${traveler.stats.trips}</span>
          <span class="traveler-stat-label">Trips</span>
        </div>
        <div class="traveler-stat">
          <span class="traveler-stat-value">${traveler.stats.countries}</span>
          <span class="traveler-stat-label">Countries</span>
        </div>
        <div class="traveler-stat">
          <span class="traveler-stat-value">${traveler.stats.connections}</span>
          <span class="traveler-stat-label">Connections</span>
        </div>
      </div>
      
      <div class="traveler-profile-interests">
        ${interestsHTML}
      </div>
      
      <div class="traveler-travel-plans">
        <h4>Upcoming Travel Plans</h4>
        ${travelPlansHTML}
      </div>
      
      <div class="traveler-profile-actions">
        <button class="btn btn-primary">Send Message</button>
        <button class="btn btn-secondary">Invite to Group</button>
      </div>
    </div>
  `;
  
  // Show modal
  document.getElementById('connect-modal').style.display = 'block';
};

// Update map (mock function, would use a real map API in a real app)
const updateMap = (location, travelers) => {
  console.log(`Updating map for ${location} with ${travelers.length} travelers`);
  // In a real app, this would use a mapping API like Google Maps or Mapbox
  // For this demo, we'll just hide the placeholder
  document.querySelector('.map-placeholder').style.display = 'none';
};

// Format date for display
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format interest name for display
const formatInterest = (interest) => {
  return interest.charAt(0).toUpperCase() + interest.slice(1);
};

// Get mock travelers data
const getMockTravelers = () => {
  return [
    {
      id: '1',
      name: 'Emily Chen',
      avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
      location: 'Brooklyn, NY',
      bio: 'Passionate photographer and foodie who loves exploring new cultures. Always ready for the next adventure!',
      interests: ['photography', 'food', 'culture', 'hiking'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-15',
          endDate: '2023-10-25'
        },
        {
          destination: 'Tokyo, Japan',
          startDate: '2023-12-10',
          endDate: '2023-12-30'
        }
      ],
      stats: {
        trips: 14,
        countries: 9,
        connections: 47
      }
    },
    {
      id: '2',
      name: 'Michael Rodriguez',
      avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      location: 'Manhattan, NY',
      bio: 'Adventure seeker and mountain climber. Looking for travel buddies for my next expedition!',
      interests: ['adventure', 'nature', 'hiking', 'backpacking'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-10',
          endDate: '2023-10-30'
        },
        {
          destination: 'Nepal, Himalayas',
          startDate: '2023-11-15',
          endDate: '2023-12-05'
        }
      ],
      stats: {
        trips: 22,
        countries: 15,
        connections: 63
      }
    },
    {
      id: '3',
      name: 'Sarah Johnson',
      avatar: 'https://randomuser.me/api/portraits/women/32.jpg',
      location: 'Queens, NY',
      bio: 'Food blogger and culinary explorer. I travel to taste the world!',
      interests: ['food', 'culture', 'luxury', 'photography'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-05',
          endDate: '2023-10-20'
        },
        {
          destination: 'Paris, France',
          startDate: '2023-11-01',
          endDate: '2023-11-15'
        }
      ],
      stats: {
        trips: 18,
        countries: 12,
        connections: 85
      }
    },
    {
      id: '4',
      name: 'David Kim',
      avatar: 'https://randomuser.me/api/portraits/men/15.jpg',
      location: 'Jersey City, NJ',
      bio: 'History buff and architecture enthusiast. I love exploring ancient cities and learning about different cultures.',
      interests: ['culture', 'history', 'architecture', 'budget'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-10',
          endDate: '2023-10-18'
        },
        {
          destination: 'Rome, Italy',
          startDate: '2023-11-20',
          endDate: '2023-12-05'
        }
      ],
      stats: {
        trips: 11,
        countries: 8,
        connections: 37
      }
    },
    {
      id: '5',
      name: 'Jessica Patel',
      avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      location: 'Hoboken, NJ',
      bio: 'Digital nomad and yoga instructor. I work remotely while traveling the world!',
      interests: ['nature', 'yoga', 'backpacking', 'budget'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-08',
          endDate: '2023-10-22'
        },
        {
          destination: 'Bali, Indonesia',
          startDate: '2023-11-10',
          endDate: '2023-12-15'
        }
      ],
      stats: {
        trips: 26,
        countries: 18,
        connections: 102
      }
    },
    {
      id: '6',
      name: 'Alex Thompson',
      avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
      location: 'Brooklyn, NY',
      bio: 'Travel writer and wildlife photographer. Always seeking the road less traveled.',
      interests: ['adventure', 'photography', 'nature', 'wildlife'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-12',
          endDate: '2023-10-28'
        },
        {
          destination: 'Kenya, Safari',
          startDate: '2023-12-01',
          endDate: '2023-12-20'
        }
      ],
      stats: {
        trips: 31,
        countries: 21,
        connections: 79
      }
    },
    {
      id: '7',
      name: 'Olivia Martinez',
      avatar: 'https://randomuser.me/api/portraits/women/23.jpg',
      location: 'Manhattan, NY',
      bio: 'Luxury travel enthusiast and fashion blogger. I believe in traveling in style!',
      interests: ['luxury', 'fashion', 'food', 'culture'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-15',
          endDate: '2023-10-30'
        },
        {
          destination: 'Milan, Italy',
          startDate: '2023-11-25',
          endDate: '2023-12-10'
        }
      ],
      stats: {
        trips: 19,
        countries: 14,
        connections: 93
      }
    },
    {
      id: '8',
      name: 'Ryan Wilson',
      avatar: 'https://randomuser.me/api/portraits/men/37.jpg',
      location: 'Staten Island, NY',
      bio: 'Budget backpacker and hostel enthusiast. I've traveled to 25 countries on a shoestring budget!',
      interests: ['backpacking', 'budget', 'adventure', 'hiking'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-10',
          endDate: '2023-10-20'
        },
        {
          destination: 'Vietnam',
          startDate: '2023-11-05',
          endDate: '2023-12-01'
        }
      ],
      stats: {
        trips: 28,
        countries: 25,
        connections: 67
      }
    },
    {
      id: '9',
      name: 'Sophia Wang',
      avatar: 'https://randomuser.me/api/portraits/women/79.jpg',
      location: 'Queens, NY',
      bio: 'Culinary school graduate exploring the world through its kitchens. Love to learn cooking techniques from locals.',
      interests: ['food', 'cooking', 'culture', 'markets'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-05',
          endDate: '2023-10-25'
        },
        {
          destination: 'Bangkok, Thailand',
          startDate: '2023-11-15',
          endDate: '2023-12-10'
        }
      ],
      stats: {
        trips: 16,
        countries: 11,
        connections: 52
      }
    },
    {
      id: '10',
      name: 'James Anderson',
      avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
      location: 'Bronx, NY',
      bio: 'History teacher and ancient civilization enthusiast. I travel to bring history to life for my students!',
      interests: ['history', 'culture', 'archeology', 'education'],
      travelPlans: [
        {
          destination: 'New York City, USA',
          startDate: '2023-10-01',
          endDate: '2023-10-20'
        },
        {
          destination: 'Egypt, Cairo',
          startDate: '2023-12-15',
          endDate: '2024-01-05'
        }
      ],
      stats: {
        trips: 12,
        countries: 7,
        connections: 41
      }
    }
  ];
}; 