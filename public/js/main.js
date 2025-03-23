// Main JavaScript file for the application
document.addEventListener('DOMContentLoaded', () => {
  const popularBlogsContainer = document.getElementById('popular-blogs-container');
  
  // Load popular blogs on homepage
  if (popularBlogsContainer) {
    loadPopularBlogs();
  }
  
  // Initialize page specific functionality
  initPageFunctionality();
});

// Load popular blogs for homepage
const loadPopularBlogs = async () => {
  try {
    const response = await fetch(`${API_URL}/blogs?limit=3`);
    
    if (response.ok) {
      const blogs = await response.json();
      displayBlogs(blogs);
    } else {
      console.error('Failed to fetch blogs');
    }
  } catch (err) {
    console.error('Error loading blogs:', err);
  }
};

// Display blogs in a container
const displayBlogs = (blogs) => {
  const popularBlogsContainer = document.getElementById('popular-blogs-container');
  
  if (!popularBlogsContainer) return;
  
  // Clear loading skeletons
  popularBlogsContainer.innerHTML = '';
  
  if (blogs.length === 0) {
    popularBlogsContainer.innerHTML = '<p class="text-center">No blogs found</p>';
    return;
  }
  
  blogs.forEach(blog => {
    const blogCard = createBlogCard(blog);
    popularBlogsContainer.appendChild(blogCard);
  });
};

// Create a blog card element
const createBlogCard = (blog) => {
  const card = document.createElement('div');
  card.className = 'blog-card';
  
  // Get the first image or use a placeholder
  const imageUrl = blog.images && blog.images.length > 0 
    ? blog.images[0].url 
    : 'https://via.placeholder.com/500x300?text=No+Image';
  
  // Format date
  const date = new Date(blog.date);
  const formattedDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Truncate content
  const truncatedContent = blog.content.length > 100 
    ? blog.content.substring(0, 100) + '...' 
    : blog.content;
  
  card.innerHTML = `
    <div class="blog-img">
      <img src="${imageUrl}" alt="${blog.title}">
    </div>
    <div class="blog-content">
      <h3>${blog.title}</h3>
      <div class="blog-location">
        <i class="fas fa-map-marker-alt"></i>
        <span>${blog.location}</span>
      </div>
      <p class="blog-text">${truncatedContent}</p>
      <div class="blog-author">
        <img src="${blog.user.avatar || 'https://via.placeholder.com/40?text=User'}" alt="${blog.user.name}">
        <div>
          <div class="blog-author-name">${blog.user.name}</div>
          <div class="blog-date">${formattedDate}</div>
        </div>
      </div>
    </div>
  `;
  
  // Add click event to navigate to blog detail
  card.addEventListener('click', () => {
    window.location.href = `/blog.html?id=${blog._id}`;
  });
  
  return card;
};

// Initialize page-specific functionality
const initPageFunctionality = () => {
  const path = window.location.pathname;
  
  // Login page
  if (path.includes('login.html')) {
    initLoginPage();
  }
  
  // Register page
  if (path.includes('register.html')) {
    initRegisterPage();
  }
  
  // Blogs page
  if (path.includes('blogs.html')) {
    initBlogsPage();
  }
  
  // Blog detail page
  if (path.includes('blog.html')) {
    initBlogDetailPage();
  }
  
  // Travel rooms page
  if (path.includes('rooms.html')) {
    initRoomsPage();
  }
  
  // Room detail page
  if (path.includes('room.html')) {
    initRoomDetailPage();
  }
  
  // Bookings page
  if (path.includes('bookings.html')) {
    initBookingsPage();
  }
  
  // Profile page
  if (path.includes('profile.html')) {
    initProfilePage();
  }
};

// Login page functionality
const initLoginPage = () => {
  const loginForm = document.getElementById('login-form');
  const errorMsg = document.getElementById('error-message');
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      const result = await login(email, password);
      
      if (result.success) {
        window.location.href = '/';
      } else {
        errorMsg.textContent = result.message;
        errorMsg.style.display = 'block';
      }
    });
  }
};

// Register page functionality
const initRegisterPage = () => {
  const registerForm = document.getElementById('register-form');
  const errorMsg = document.getElementById('error-message');
  
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const password2 = document.getElementById('password2').value;
      
      // Check if passwords match
      if (password !== password2) {
        errorMsg.textContent = 'Passwords do not match';
        errorMsg.style.display = 'block';
        return;
      }
      
      const result = await register(name, email, password);
      
      if (result.success) {
        window.location.href = '/';
      } else {
        errorMsg.textContent = result.message;
        errorMsg.style.display = 'block';
      }
    });
  }
};

// Utility function to get query params
const getQueryParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}; 