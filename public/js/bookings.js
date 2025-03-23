// Bookings page functionality
document.addEventListener('DOMContentLoaded', () => {
  // Initialize bookings page
  const bookingsContent = document.getElementById('bookings-content');
  const authMessage = document.getElementById('auth-message');
  const bookingTypes = document.querySelectorAll('.booking-type');
  
  // Check if user is logged in
  if (isLoggedIn()) {
    if (bookingsContent) bookingsContent.style.display = 'block';
    if (authMessage) authMessage.style.display = 'none';
    
    // Add logged-in class to body
    document.body.classList.add('logged-in');
    
    // Load user's bookings
    loadUserBookings();
    
    // Set up booking type tabs
    if (bookingTypes.length > 0) {
      bookingTypes.forEach(type => {
        type.addEventListener('click', () => {
          // Update active tab
          bookingTypes.forEach(t => t.classList.remove('active'));
          type.classList.add('active');
          
          // Load appropriate booking form
          const bookingType = type.dataset.type;
          loadBookingForm(bookingType);
        });
      });
      
      // Set up form submission handlers
      setupFormHandlers();
    }
  } else {
    if (bookingsContent) bookingsContent.style.display = 'none';
    if (authMessage) authMessage.style.display = 'block';
    
    // Remove logged-in class from body
    document.body.classList.remove('logged-in');
  }
});

// Load the appropriate booking form based on type
const loadBookingForm = (type) => {
  const container = document.getElementById('booking-form-container');
  
  if (!container) return;
  
  let formHTML = '';
  
  switch (type) {
    case 'hotel':
      formHTML = `
        <form id="hotel-booking-form" class="booking-form">
          <h3>Book Your Hotel</h3>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="hotel-location">Destination</label>
              <input type="text" id="hotel-location" class="form-control" placeholder="City, Area, or Hotel Name" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="hotel-name">Hotel Name (Optional)</label>
              <input type="text" id="hotel-name" class="form-control" placeholder="Any hotel">
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="check-in-date">Check-in Date</label>
              <input type="date" id="check-in-date" class="form-control" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="check-out-date">Check-out Date</label>
              <input type="date" id="check-out-date" class="form-control" required>
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="room-type">Room Type</label>
              <select id="room-type" class="form-control">
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
                <option value="family">Family Room</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="guests">Number of Guests</label>
              <input type="number" id="guests" class="form-control" min="1" value="2" required>
            </div>
          </div>
          <div class="form-group">
            <label for="hotel-budget">Budget per Night (USD)</label>
            <input type="number" id="hotel-budget" class="form-control" placeholder="Maximum price per night" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Search Hotels</button>
        </form>
      `;
      break;
    case 'car':
      formHTML = `
        <form id="car-booking-form" class="booking-form">
          <h3>Rent a Car</h3>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="pickup-location">Pickup Location</label>
              <input type="text" id="pickup-location" class="form-control" placeholder="City or Airport" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="dropoff-location">Drop-off Location</label>
              <input type="text" id="dropoff-location" class="form-control" placeholder="Same as pickup">
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="pickup-date">Pickup Date</label>
              <input type="date" id="pickup-date" class="form-control" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="dropoff-date">Drop-off Date</label>
              <input type="date" id="dropoff-date" class="form-control" required>
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="car-type">Car Type</label>
              <select id="car-type" class="form-control">
                <option value="economy">Economy</option>
                <option value="compact">Compact</option>
                <option value="midsize">Midsize</option>
                <option value="suv">SUV</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="car-budget">Budget (USD)</label>
              <input type="number" id="car-budget" class="form-control" placeholder="Maximum price" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Search Cars</button>
        </form>
      `;
      break;
    case 'bus':
      formHTML = `
        <form id="bus-booking-form" class="booking-form">
          <h3>Book Your Bus Trip</h3>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="bus-departure-location">From</label>
              <input type="text" id="bus-departure-location" class="form-control" placeholder="City or Bus Station" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="bus-arrival-location">To</label>
              <input type="text" id="bus-arrival-location" class="form-control" placeholder="City or Bus Station" required>
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="bus-departure-date">Departure Date</label>
              <input type="date" id="bus-departure-date" class="form-control" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="bus-return-date">Return Date (Optional)</label>
              <input type="date" id="bus-return-date" class="form-control">
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="bus-passengers">Passengers</label>
              <input type="number" id="bus-passengers" class="form-control" min="1" value="1" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="bus-budget">Budget (USD)</label>
              <input type="number" id="bus-budget" class="form-control" placeholder="Maximum price" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Search Buses</button>
        </form>
      `;
      break;
    case 'train':
      formHTML = `
        <form id="train-booking-form" class="booking-form">
          <h3>Book Your Train Journey</h3>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="train-departure-location">From</label>
              <input type="text" id="train-departure-location" class="form-control" placeholder="City or Train Station" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="train-arrival-location">To</label>
              <input type="text" id="train-arrival-location" class="form-control" placeholder="City or Train Station" required>
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="train-departure-date">Departure Date</label>
              <input type="date" id="train-departure-date" class="form-control" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="train-return-date">Return Date (Optional)</label>
              <input type="date" id="train-return-date" class="form-control">
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="train-class">Class</label>
              <select id="train-class" class="form-control">
                <option value="economy">Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="train-passengers">Passengers</label>
              <input type="number" id="train-passengers" class="form-control" min="1" value="1" required>
            </div>
          </div>
          <div class="form-group">
            <label for="train-budget">Budget (USD)</label>
            <input type="number" id="train-budget" class="form-control" placeholder="Maximum price" required>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Search Trains</button>
        </form>
      `;
      break;
    case 'flight':
    default:
      formHTML = `
        <form id="flight-booking-form" class="booking-form">
          <h3>Book Your Flight</h3>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="departure-location">From</label>
              <input type="text" id="departure-location" class="form-control" placeholder="City or Airport" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="arrival-location">To</label>
              <input type="text" id="arrival-location" class="form-control" placeholder="City or Airport" required>
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="departure-date">Departure Date</label>
              <input type="date" id="departure-date" class="form-control" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="return-date">Return Date</label>
              <input type="date" id="return-date" class="form-control">
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="airline">Airline (Optional)</label>
              <input type="text" id="airline" class="form-control" placeholder="Any airline">
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="flight-class">Class</label>
              <select id="flight-class" class="form-control">
                <option value="economy">Economy</option>
                <option value="premium-economy">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
            </div>
          </div>
          <div class="form-row" style="display: flex; gap: 20px;">
            <div class="form-group" style="flex: 1;">
              <label for="passengers">Passengers</label>
              <input type="number" id="passengers" class="form-control" min="1" value="1" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label for="budget">Budget</label>
              <input type="number" id="budget" class="form-control" placeholder="Maximum price (USD)" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 10px;">Search Flights</button>
        </form>
      `;
      break;
  }
  
  container.innerHTML = formHTML;
  
  // Re-initialize form handlers after changing the form
  setupFormHandlers();
};

// Set up form submission handlers
const setupFormHandlers = () => {
  // Flight booking form
  const flightForm = document.getElementById('flight-booking-form');
  if (flightForm) {
    flightForm.addEventListener('submit', (e) => handleBookingFormSubmit(e, 'flight'));
  }
  
  // Hotel booking form
  const hotelForm = document.getElementById('hotel-booking-form');
  if (hotelForm) {
    hotelForm.addEventListener('submit', (e) => handleBookingFormSubmit(e, 'hotel'));
  }
  
  // Car booking form
  const carForm = document.getElementById('car-booking-form');
  if (carForm) {
    carForm.addEventListener('submit', (e) => handleBookingFormSubmit(e, 'car'));
  }
  
  // Bus booking form
  const busForm = document.getElementById('bus-booking-form');
  if (busForm) {
    busForm.addEventListener('submit', (e) => handleBookingFormSubmit(e, 'bus'));
  }
  
  // Train booking form
  const trainForm = document.getElementById('train-booking-form');
  if (trainForm) {
    trainForm.addEventListener('submit', (e) => handleBookingFormSubmit(e, 'train'));
  }
};

// Handle booking form submission
const handleBookingFormSubmit = (e, type) => {
  e.preventDefault();
  
  // In a real app, this would send data to an API
  // For this demo, we'll create a mock booking
  
  let bookingData = {
    type,
    details: {},
    price: {
      amount: 0,
      currency: 'USD'
    },
    status: 'confirmed'
  };
  
  // Get form data based on booking type
  switch (type) {
    case 'flight':
      bookingData.details = {
        airline: document.getElementById('airline').value || 'Various Airlines',
        departure: {
          location: document.getElementById('departure-location').value,
          date: new Date(document.getElementById('departure-date').value),
          time: '10:00 AM' // Mock time
        },
        arrival: {
          location: document.getElementById('arrival-location').value,
          date: new Date(document.getElementById('departure-date').value),
          time: '12:00 PM' // Mock time
        }
      };
      bookingData.price.amount = parseInt(document.getElementById('budget').value);
      break;
    case 'hotel':
      bookingData.details = {
        hotelName: document.getElementById('hotel-name').value || 'Best Available Hotel',
        checkIn: new Date(document.getElementById('check-in-date').value),
        checkOut: new Date(document.getElementById('check-out-date').value),
        roomType: document.getElementById('room-type').value,
        guests: parseInt(document.getElementById('guests').value)
      };
      bookingData.price.amount = parseInt(document.getElementById('hotel-budget').value);
      break;
    case 'car':
      bookingData.details = {
        carType: document.getElementById('car-type').value,
        pickupLocation: document.getElementById('pickup-location').value,
        dropoffLocation: document.getElementById('dropoff-location').value || document.getElementById('pickup-location').value,
        departure: {
          date: new Date(document.getElementById('pickup-date').value),
          time: '10:00 AM' // Mock time
        },
        arrival: {
          date: new Date(document.getElementById('dropoff-date').value),
          time: '10:00 AM' // Mock time
        }
      };
      bookingData.price.amount = parseInt(document.getElementById('car-budget').value);
      break;
    case 'bus':
      bookingData.details = {
        departure: {
          location: document.getElementById('bus-departure-location').value,
          date: new Date(document.getElementById('bus-departure-date').value),
          time: '10:00 AM' // Mock time
        },
        arrival: {
          location: document.getElementById('bus-arrival-location').value,
          date: new Date(document.getElementById('bus-departure-date').value),
          time: '02:00 PM' // Mock time
        }
      };
      bookingData.price.amount = parseInt(document.getElementById('bus-budget').value);
      break;
    case 'train':
      bookingData.details = {
        departure: {
          location: document.getElementById('train-departure-location').value,
          date: new Date(document.getElementById('train-departure-date').value),
          time: '10:00 AM' // Mock time
        },
        arrival: {
          location: document.getElementById('train-arrival-location').value,
          date: new Date(document.getElementById('train-departure-date').value),
          time: '12:30 PM' // Mock time
        }
      };
      bookingData.price.amount = parseInt(document.getElementById('train-budget').value);
      break;
  }
  
  // Create booking in the database
  createBooking(bookingData);
};

// Create a new booking
const createBooking = async (bookingData) => {
  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': token
      },
      body: JSON.stringify(bookingData)
    });
    
    if (response.ok) {
      const booking = await response.json();
      alert('Booking confirmed! Check your bookings below.');
      
      // Reload user's bookings
      loadUserBookings();
    } else {
      const error = await response.json();
      alert(error.msg || 'Failed to create booking');
    }
  } catch (err) {
    console.error('Error creating booking:', err);
    alert('An error occurred while creating your booking');
  }
};

// Load user's bookings
const loadUserBookings = async () => {
  try {
    const bookingsContainer = document.getElementById('bookings-container');
    
    if (!bookingsContainer) return;
    
    // Show loading state
    bookingsContainer.innerHTML = '<p class="text-center">Loading your bookings...</p>';
    
    const response = await fetch(`${API_URL}/bookings`, {
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      const bookings = await response.json();
      displayUserBookings(bookings);
    } else {
      bookingsContainer.innerHTML = '<p class="text-center">Failed to load bookings</p>';
    }
  } catch (err) {
    console.error('Error loading bookings:', err);
    document.getElementById('bookings-container').innerHTML = 
      '<p class="text-center">An error occurred while loading your bookings</p>';
  }
};

// Display user's bookings
const displayUserBookings = (bookings) => {
  const bookingsContainer = document.getElementById('bookings-container');
  
  if (!bookingsContainer) return;
  
  if (bookings.length === 0) {
    bookingsContainer.innerHTML = '<p class="text-center">You have no bookings yet</p>';
    return;
  }
  
  // Sort bookings by date (most recent first)
  bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  let bookingsHTML = '<div class="bookings-list">';
  
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
            `<button class="btn btn-danger cancel-booking-btn" data-id="${booking._id}">Cancel</button>` : 
            ''}
          <button class="btn btn-secondary view-booking-btn" data-id="${booking._id}">View Details</button>
        </div>
      </div>
    `;
  });
  
  bookingsHTML += '</div>';
  bookingsContainer.innerHTML = bookingsHTML;
  
  // Add event listeners for booking actions
  document.querySelectorAll('.cancel-booking-btn').forEach(btn => {
    btn.addEventListener('click', () => cancelBooking(btn.dataset.id));
  });
  
  document.querySelectorAll('.view-booking-btn').forEach(btn => {
    btn.addEventListener('click', () => viewBookingDetails(btn.dataset.id));
  });
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
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Cancel a booking
const cancelBooking = async (bookingId) => {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  
  try {
    const response = await fetch(`${API_URL}/bookings/cancel/${bookingId}`, {
      method: 'PUT',
      headers: {
        'x-auth-token': token
      }
    });
    
    if (response.ok) {
      alert('Booking cancelled successfully');
      loadUserBookings();
    } else {
      const error = await response.json();
      alert(error.msg || 'Failed to cancel booking');
    }
  } catch (err) {
    console.error('Error cancelling booking:', err);
    alert('An error occurred while cancelling your booking');
  }
};

// View booking details (this would show a modal in a real app)
const viewBookingDetails = (bookingId) => {
  alert(`Viewing details for booking ${bookingId}. In a real app, this would show a modal with complete booking information.`);
};

// Helper function to capitalize first letter
const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
}; 