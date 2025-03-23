// Blogs page functionality
document.addEventListener('DOMContentLoaded', () => {
  // Initialize blogs page
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get('page')) || 1;
  
  // Load blogs
  loadBlogs(page);
  
  // Setup search functionality
  setupSearch();
  
  // Update create blog button visibility based on auth state
  updateCreateBlogButton();
});

// Load blogs
async function loadBlogs(page = 1) {
  try {
    // Show loading state
    const blogsContainer = document.getElementById('blogs-container');
    blogsContainer.innerHTML = '';
    
    for (let i = 0; i < 6; i++) {
      blogsContainer.innerHTML += `
        <div class="blog-card-skeleton">
          <div class="skeleton-img"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      `;
    }
    
    // Fetch blogs from API
    const response = await fetch(`${API_URL}/blogs?page=${page}&limit=6`);
    
    if (!response.ok) {
      throw new Error('Failed to load blogs');
    }
    
    const data = await response.json();
    console.log('Fetched blogs data:', data);
    
    // Display blogs
    displayBlogsPage(data.blogs, data.pagination);
    
  } catch (error) {
    console.error('Error loading blogs:', error);
    const blogsContainer = document.getElementById('blogs-container');
    blogsContainer.innerHTML = `
      <div class="alert alert-danger">
        <p>Failed to load blogs. Please try again later.</p>
        <p class="error-details">${error.message}</p>
      </div>
    `;
  }
}

// Display blogs page
function displayBlogsPage(blogs, pagination) {
  const blogsContainer = document.getElementById('blogs-container');
  
  // Clear container
  blogsContainer.innerHTML = '';
  
  if (blogs.length === 0) {
    blogsContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <h3>No blogs found</h3>
        <p>Be the first to share your travel adventure!</p>
      </div>
    `;
    return;
  }
  
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
          <div class="blog-author">
            <a href="user-profile.html?id=${blog.user ? blog.user._id : ''}" class="author-link" ${!blog.user ? 'style="pointer-events: none;"' : ''}>
              <img src="${blog.user && blog.user.avatar ? blog.user.avatar : 'images/default-avatar.png'}" alt="${blog.user ? blog.user.name : 'Anonymous'}" class="author-avatar">
              <span>${blog.user ? blog.user.name : 'Anonymous'}</span>
            </a>
          </div>
        </div>
      </div>
    `;
    
    blogsContainer.appendChild(blogCard);
  });
  
  // Create pagination if provided
  if (pagination) {
    createPagination(pagination);
  }
}

// Create pagination
function createPagination(pagination) {
  const paginationContainer = document.getElementById('blogs-pagination');
  
  if (!pagination || pagination.totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }
  
  let paginationHTML = '<ul class="pagination-list">';
  
  // Previous button
  if (pagination.currentPage > 1) {
    paginationHTML += `
      <li>
        <a href="?page=${pagination.currentPage - 1}">
          <i class="fas fa-chevron-left"></i>
        </a>
      </li>
    `;
  }
  
  // First page
  if (pagination.currentPage > 2) {
    paginationHTML += `
      <li>
        <a href="?page=1">1</a>
      </li>
    `;
  }
  
  // Ellipsis before current
  if (pagination.currentPage > 3) {
    paginationHTML += `
      <li class="ellipsis">...</li>
    `;
  }
  
  // Page before current
  if (pagination.currentPage > 1) {
    paginationHTML += `
      <li>
        <a href="?page=${pagination.currentPage - 1}">${pagination.currentPage - 1}</a>
      </li>
    `;
  }
  
  // Current page
  paginationHTML += `
    <li>
      <a href="?page=${pagination.currentPage}" class="active">${pagination.currentPage}</a>
    </li>
  `;
  
  // Page after current
  if (pagination.currentPage < pagination.totalPages) {
    paginationHTML += `
      <li>
        <a href="?page=${pagination.currentPage + 1}">${pagination.currentPage + 1}</a>
      </li>
    `;
  }
  
  // Ellipsis after current
  if (pagination.currentPage < pagination.totalPages - 2) {
    paginationHTML += `
      <li class="ellipsis">...</li>
    `;
  }
  
  // Last page
  if (pagination.currentPage < pagination.totalPages - 1) {
    paginationHTML += `
      <li>
        <a href="?page=${pagination.totalPages}">${pagination.totalPages}</a>
      </li>
    `;
  }
  
  // Next button
  if (pagination.currentPage < pagination.totalPages) {
    paginationHTML += `
      <li>
        <a href="?page=${pagination.currentPage + 1}">
          <i class="fas fa-chevron-right"></i>
        </a>
      </li>
    `;
  }
  
  paginationHTML += '</ul>';
  
  paginationContainer.innerHTML = paginationHTML;
  
  // Add event listeners to pagination links
  const paginationLinks = paginationContainer.querySelectorAll('a');
  paginationLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageUrl = new URL(link.href);
      const page = parseInt(pageUrl.searchParams.get('page')) || 1;
      
      // Update URL without reloading
      window.history.pushState({}, '', `?page=${page}`);
      
      // Load blogs for the selected page
      loadBlogs(page);
      
      // Scroll to top
      window.scrollTo(0, 0);
    });
  });
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('blog-search');
  const searchButton = searchInput.nextElementSibling;
  
  // Search on button click
  searchButton.addEventListener('click', () => {
    performSearch(searchInput.value);
  });
  
  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch(searchInput.value);
    }
  });
}

// Perform search
async function performSearch(query) {
  if (!query) {
    // If search is empty, load all blogs
    loadBlogs(1);
    return;
  }
  
  try {
    // Show loading state
    const blogsContainer = document.getElementById('blogs-container');
    blogsContainer.innerHTML = '';
    
    for (let i = 0; i < 3; i++) {
      blogsContainer.innerHTML += `
        <div class="blog-card-skeleton">
          <div class="skeleton-img"></div>
          <div class="skeleton-content">
            <div class="skeleton-title"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text"></div>
          </div>
        </div>
      `;
    }
    
    // Fetch filtered blogs from API
    const response = await fetch(`${API_URL}/blogs/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Search failed');
    }
    
    const data = await response.json();
    
    // Display search results
    displayBlogsPage(data.blogs, data.pagination);
    
    // Update URL
    window.history.pushState({}, '', `?search=${encodeURIComponent(query)}`);
    
  } catch (error) {
    console.error('Error searching blogs:', error);
    const blogsContainer = document.getElementById('blogs-container');
    blogsContainer.innerHTML = `
      <div class="alert alert-danger">
        <p>Search failed. Please try again later.</p>
      </div>
    `;
  }
}

// Update create blog button visibility based on auth state
function updateCreateBlogButton() {
  const createBlogBtn = document.querySelector('.create-blog-btn');
  
  if (isLoggedIn()) {
    createBlogBtn.style.display = 'block';
  } else {
    createBlogBtn.style.display = 'none';
  }
}

// Format date
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
} 