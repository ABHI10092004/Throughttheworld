// Blog Details Page Functionality
document.addEventListener('DOMContentLoaded', () => {
  // Get blog ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  const blogId = urlParams.get('id');
  
  if (!blogId) {
    // No blog ID in URL, show error
    showError('No blog ID provided');
    return;
  }
  
  // Load blog post
  loadBlogPost(blogId);
  
  // Setup comment functionality (only for logged in users)
  if (isLoggedIn()) {
    setupCommentForm(blogId);
  }
});

// Load blog post with given ID
async function loadBlogPost(blogId) {
  try {
    // Show loading state
    document.getElementById('blog-loading').style.display = 'block';
    document.getElementById('blog-content').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    
    // Fetch blog from API
    const response = await fetch(`${API_URL}/blogs/${blogId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load blog post');
    }
    
    const blog = await response.json();
    console.log('Loaded blog:', blog);
    
    // Display blog post content
    displayBlogPost(blog);
    
    // Load comments for this blog
    loadComments(blogId);
    
  } catch (error) {
    console.error('Error loading blog post:', error);
    showError(error.message);
  }
}

// Display blog post content
function displayBlogPost(blog) {
  const blogContent = document.getElementById('blog-content');
  
  // Handle cover image path
  const coverImage = blog.coverImage 
    ? (blog.coverImage.startsWith('http') ? blog.coverImage : blog.coverImage)
    : 'images/blog-placeholder.jpg';
  
  // Format date
  const blogDate = formatDate(blog.date);
  
  // Prepare tags HTML if tags exist
  let tagsHtml = '';
  if (blog.tags && blog.tags.length > 0) {
    tagsHtml = `
      <div class="blog-tags">
        ${blog.tags.map(tag => `<a href="blogs.html?tag=${tag}" class="blog-tag">${tag}</a>`).join('')}
      </div>
    `;
  }
  
  // Create blog HTML
  blogContent.innerHTML = `
    <article>
      <div class="blog-header">
        <h1 class="blog-title">${blog.title}</h1>
        <div class="blog-meta">
          <div class="blog-meta-item">
            <i class="far fa-calendar-alt"></i> ${blogDate}
          </div>
          <div class="blog-meta-item">
            <i class="fas fa-map-marker-alt"></i> ${blog.location || 'Worldwide'}
          </div>
        </div>
      </div>
      
      <div class="blog-author">
        <a href="user-profile.html?id=${blog.user ? blog.user._id : ''}" class="author-link" ${!blog.user ? 'style="pointer-events: none;"' : ''}>
          <img src="${blog.user && blog.user.avatar ? blog.user.avatar : 'images/default-avatar.png'}" 
               alt="${blog.user ? blog.user.name : 'Anonymous'}" class="author-avatar">
          <span class="author-name">${blog.user ? blog.user.name : 'Anonymous'}</span>
        </a>
      </div>
      
      <img src="${coverImage}" alt="${blog.title}" class="blog-cover" onerror="this.src='images/blog-placeholder.jpg'">
      
      <div class="blog-body">
        ${blog.content}
      </div>
      
      ${tagsHtml}
    </article>
  `;
  
  // Hide loading, show content
  document.getElementById('blog-loading').style.display = 'none';
  blogContent.style.display = 'block';
}

// Load comments for blog post
async function loadComments(blogId) {
  try {
    const commentSection = document.getElementById('comments-section');
    const commentsList = document.getElementById('comments-list');
    
    // Show comments section
    commentSection.style.display = 'block';
    
    // Fetch comments from API
    const response = await fetch(`${API_URL}/blogs/${blogId}`);
    
    if (!response.ok) {
      throw new Error('Failed to load comments');
    }
    
    const blog = await response.json();
    const comments = blog.comments || [];
    
    // Display comments
    if (comments.length === 0) {
      commentsList.innerHTML = `
        <div class="no-comments">
          <p>No comments yet. Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }
    
    // Sort comments by date (newest first)
    comments.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Create comments HTML
    commentsList.innerHTML = comments.map(comment => {
      const commentDate = formatDate(comment.date);
      const isOwner = isLoggedIn() && getUserData() && comment.user === getUserData().id;
      
      return `
        <div class="comment" data-id="${comment._id}">
          <div class="comment-header">
            <div class="comment-author">
              <img src="${comment.avatar || 'images/default-avatar.png'}" alt="${comment.name}" class="comment-avatar">
              <span class="comment-name">${comment.name}</span>
            </div>
            <span class="comment-date">${commentDate}</span>
          </div>
          <div class="comment-text">${comment.text}</div>
          ${isOwner ? `
            <div class="comment-actions">
              <span class="comment-action delete-comment" data-id="${comment._id}">
                <i class="fas fa-trash-alt"></i> Delete
              </span>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
    
    // Setup delete comment functionality
    setupDeleteComment(blogId);
    
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

// Setup comment form submission
function setupCommentForm(blogId) {
  const commentForm = document.querySelector('.comment-form');
  const commentText = document.getElementById('comment-text');
  const postCommentBtn = document.getElementById('post-comment-btn');
  
  // Show comment form for logged in users
  commentForm.style.display = 'block';
  
  // Handle comment submission
  postCommentBtn.addEventListener('click', async () => {
    try {
      const text = commentText.value.trim();
      
      if (!text) {
        alert('Please write a comment before posting');
        return;
      }
      
      // Disable button and show loading state
      postCommentBtn.disabled = true;
      postCommentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Posting...';
      
      // Submit comment to API
      const response = await fetch(`${API_URL}/blogs/comment/${blogId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post comment');
      }
      
      // Clear comment form
      commentText.value = '';
      
      // Reload comments
      loadComments(blogId);
      
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      // Reset button
      postCommentBtn.disabled = false;
      postCommentBtn.innerHTML = 'Post Comment';
    }
  });
}

// Setup delete comment functionality
function setupDeleteComment(blogId) {
  const deleteButtons = document.querySelectorAll('.delete-comment');
  
  deleteButtons.forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const commentId = button.dataset.id;
        
        if (!confirm('Are you sure you want to delete this comment?')) {
          return;
        }
        
        // Delete comment via API
        const response = await fetch(`${API_URL}/blogs/comment/${blogId}/${commentId}`, {
          method: 'DELETE',
          headers: {
            'x-auth-token': token
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete comment');
        }
        
        // Reload comments
        loadComments(blogId);
        
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Failed to delete comment. Please try again.');
      }
    });
  });
}

// Show error message when blog can't be loaded
function showError(message) {
  document.getElementById('blog-loading').style.display = 'none';
  document.getElementById('blog-content').style.display = 'none';
  document.getElementById('error-message').style.display = 'block';
}

// Format date for display
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
} 