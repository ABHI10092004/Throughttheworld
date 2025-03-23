// Create Blog functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  if (!isLoggedIn()) {
    // Hide blog form and show auth message
    document.getElementById('create-blog-content').style.display = 'none';
    document.getElementById('auth-message').style.display = 'block';
    return;
  }

  // Show create blog form
  document.getElementById('create-blog-content').style.display = 'block';
  
  // Initialize editor
  initializeEditor();
  
  // Setup image uploads
  setupImageUploads();
  
  // Setup form submission
  setupFormSubmission();
});

// Initialize rich text editor
const initializeEditor = () => {
  const buttons = document.querySelectorAll('.editor-toolbar button');
  const editor = document.getElementById('blog-content');
  const wordCounter = document.querySelector('.wordcount');
  
  // Add event listeners to toolbar buttons
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const command = button.dataset.command;
      
      switch(command) {
        case 'insertHeading':
          document.execCommand('formatBlock', false, '<h2>');
          break;
        case 'createLink':
          const url = prompt('Enter the link URL:');
          if (url) {
            document.execCommand('createLink', false, url);
            // Set target="_blank" for the link
            const selection = window.getSelection();
            const anchorNode = selection.anchorNode;
            if (anchorNode && (anchorNode.parentNode.tagName === 'A' || anchorNode.tagName === 'A')) {
              const link = anchorNode.tagName === 'A' ? anchorNode : anchorNode.parentNode;
              link.setAttribute('target', '_blank');
              link.setAttribute('rel', 'noopener noreferrer');
            }
          }
          break;
        case 'insertImage':
          openImageModal();
          break;
        default:
          document.execCommand(command, false, null);
          break;
      }
      
      updateWordCount();
    });
  });
  
  // Update word count on content change
  editor.addEventListener('input', updateWordCount);
  
  // Function to update word count
  function updateWordCount() {
    const text = editor.textContent || '';
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    wordCounter.textContent = `${wordCount} words`;
    
    // Update hidden textarea for form submission
    document.getElementById('blog-content-hidden').value = editor.innerHTML;
  }
};

// Setup image uploads
const setupImageUploads = () => {
  // Cover image upload
  const coverImageInput = document.getElementById('cover-image');
  const coverPreview = document.getElementById('cover-image-preview');
  const coverImageButton = document.querySelector('.upload-btn-wrapper .btn');
  
  // Make sure the button triggers the file input
  coverImageButton.addEventListener('click', () => {
    coverImageInput.click();
  });
  
  coverImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Clear existing content
        coverPreview.innerHTML = '';
        coverPreview.style.backgroundImage = `url(${e.target.result})`;
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Image modal functionality
  const modal = document.getElementById('image-modal');
  const closeBtn = document.querySelector('.modal-close');
  const uploadBtn = document.getElementById('upload-new-image-btn');
  const insertBtn = document.getElementById('insert-image-btn');
  const fileInput = document.getElementById('content-image-upload');
  const modalPreview = document.getElementById('modal-image-preview');
  
  // Close modal when clicking the X
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
  
  // Open file dialog when clicking upload button
  uploadBtn.addEventListener('click', () => {
    fileInput.click();
  });
  
  // Preview selected image
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        // Clear existing content
        modalPreview.innerHTML = '';
        modalPreview.classList.add('has-image');
        modalPreview.style.backgroundImage = `url(${e.target.result})`;
        
        // Store image data for insertion
        modalPreview.dataset.imageData = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
  
  // Insert image into editor
  insertBtn.addEventListener('click', () => {
    const imageData = modalPreview.dataset.imageData;
    const altText = document.getElementById('image-alt').value || 'Blog image';
    const caption = document.getElementById('image-caption').value;
    
    if (imageData) {
      insertImageIntoEditor(imageData, altText, caption);
      modal.style.display = 'none';
      
      // Reset form
      document.getElementById('image-alt').value = '';
      document.getElementById('image-caption').value = '';
      modalPreview.style.backgroundImage = 'none';
      modalPreview.classList.remove('has-image');
      modalPreview.innerHTML = `
        <i class="fas fa-image"></i>
        <span>No image selected</span>
      `;
      delete modalPreview.dataset.imageData;
    } else {
      alert('Please select an image to insert');
    }
  });
};

// Open image modal
const openImageModal = () => {
  document.getElementById('image-modal').style.display = 'block';
};

// Insert image into editor
const insertImageIntoEditor = (imageData, altText, caption) => {
  const editor = document.getElementById('blog-content');
  
  // Create image wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'content-image-wrapper';
  
  // Create image element
  const img = document.createElement('img');
  img.src = imageData;
  img.alt = altText;
  wrapper.appendChild(img);
  
  // Add caption if provided
  if (caption) {
    const captionEl = document.createElement('div');
    captionEl.className = 'image-caption';
    captionEl.textContent = caption;
    wrapper.appendChild(captionEl);
  }
  
  // Focus editor and insert at cursor position
  editor.focus();
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(wrapper);
  
  // Move cursor after the inserted image
  range.setStartAfter(wrapper);
  range.setEndAfter(wrapper);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Update the hidden textarea with the editor content
  document.getElementById('blog-content-hidden').value = editor.innerHTML;
};

// Setup form submission
const setupFormSubmission = () => {
  const form = document.getElementById('create-blog-form');
  const publishBtn = document.getElementById('publish-btn');
  const draftBtn = document.getElementById('save-draft-btn');
  
  // Publish blog
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveBlog(true);
  });
  
  // Save as draft
  draftBtn.addEventListener('click', async () => {
    await saveBlog(false);
  });
};

// Save blog (published or draft)
const saveBlog = async (isPublished) => {
  try {
    // Show loader
    const formActions = document.querySelector('.form-actions');
    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML = `
      <div class="loader-spinner"></div>
      <p>Saving your blog...</p>
    `;
    formActions.parentNode.insertBefore(loader, formActions);
    loader.style.display = 'block';
    formActions.style.display = 'none';
    
    // Get form data
    const title = document.getElementById('blog-title').value;
    const location = document.getElementById('blog-location').value;
    const tagsInput = document.getElementById('blog-tags').value;
    const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];
    const excerpt = document.getElementById('blog-excerpt').value;
    const content = document.getElementById('blog-content-hidden').value;
    const coverImageInput = document.getElementById('cover-image');
    
    // Basic validation
    if (!title || !location || !content) {
      alert('Please fill in all required fields: title, location, and content');
      loader.style.display = 'none';
      formActions.style.display = 'flex';
      return;
    }
    
    // Log data for debugging
    console.log('Submitting blog with data:', { 
      title, 
      location, 
      excerpt, 
      tags, 
      content: content.substring(0, 100) + '...',
      hasCoverImage: coverImageInput.files.length > 0
    });
    
    // Prepare form data for API
    const formData = new FormData();
    formData.append('title', title);
    formData.append('location', location);
    formData.append('excerpt', excerpt);
    formData.append('content', content);
    formData.append('isPublished', isPublished.toString());
    
    // Add tags
    if (tags.length > 0) {
      formData.append('tags', JSON.stringify(tags));
    }
    
    // Add cover image if selected
    if (coverImageInput.files[0]) {
      formData.append('coverImage', coverImageInput.files[0]);
      console.log('Adding cover image:', coverImageInput.files[0].name, coverImageInput.files[0].type, coverImageInput.files[0].size);
    }
    
    // Verify token is available
    if (!token) {
      throw new Error('Authentication token not found. Please log in again.');
    }
    
    // Upload blog to API
    const response = await fetch(`${API_URL}/blogs`, {
      method: 'POST',
      headers: {
        'x-auth-token': token
        // Don't set Content-Type header when using FormData - 
        // the browser will automatically set it with the correct boundary
      },
      body: formData
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error response:', errorData);
      
      if (errorData.errors) {
        // Handle validation errors
        const errorMessages = errorData.errors.map(err => err.msg).join(', ');
        throw new Error(`Validation failed: ${errorMessages}`);
      } else {
        throw new Error(errorData.message || errorData.error || 'Failed to save blog');
      }
    }
    
    const data = await response.json();
    console.log('Success response:', data);
    
    // Show success message
    showAlert(
      `Blog ${isPublished ? 'published' : 'saved as draft'} successfully!`,
      'success'
    );
    
    // Redirect to blog details page or blogs list
    setTimeout(() => {
      window.location.href = isPublished ? 
        `blog-details.html?id=${data.blog._id}` : 
        'blogs.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error saving blog:', error);
    showAlert(`Error: ${error.message}`, 'error');
    
    // Hide loader and show buttons
    document.querySelector('.loader').style.display = 'none';
    document.querySelector('.form-actions').style.display = 'flex';
  }
};

// Show alert message
const showAlert = (message, type = 'success') => {
  // Create alert element if it doesn't exist
  let alertEl = document.querySelector('.alert-message');
  
  if (!alertEl) {
    alertEl = document.createElement('div');
    alertEl.className = 'alert-message';
    document.querySelector('.create-blog-content').prepend(alertEl);
  }
  
  // Set alert content and type
  alertEl.textContent = message;
  alertEl.className = `alert-message ${type}`;
  alertEl.style.display = 'block';
  
  // Hide alert after 5 seconds
  setTimeout(() => {
    alertEl.style.display = 'none';
  }, 5000);
}; 