// Dashboard Shared Utilities

// Get user data from localStorage
function getUser() {
  const user = localStorage.getItem('user');
  if (!user) {
    window.location.href = '/login.html';
    return null;
  }
  return JSON.parse(user);
}

// Get access token
function getAccessToken() {
  const token = localStorage.getItem('accessToken');
  if (!token) {
    window.location.href = '/login.html';
    return null;
  }
  return token;
}

// Logout function
function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// API call helper
async function apiCall(endpoint, options = {}) {
  const token = getAccessToken();
  if (!token) return null;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  const response = await fetch(`${window.location.origin}${endpoint}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    logout();
    return null;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({message: 'Request failed'}));
    const err = new Error(error.message || 'Request failed');
    err.status = response.status;
    err.statusCode = response.status;
    throw err;
  }

  return response.json();
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (!notification) return;

  notification.className = `notification ${type} show`;
  notification.innerHTML = `
    <span>${type === 'success' ? '✓' : '✕'}</span>
    <span>${message}</span>
  `;

  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return date.toLocaleDateString();
}

// Format salary
function formatSalary(salary) {
  if (!salary) return 'Not specified';
  if (typeof salary === 'string') return salary;
  return `$${salary.toLocaleString()}`;
}

// Get initials from name
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

// Create avatar background color from name
function getAvatarColor(name) {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#fa709a', '#fee140', '#30cfd0', '#330867'
  ];
  const index = name ? name.charCodeAt(0) % colors.length : 0;
  return colors[index];
}

// Tab switching
function switchTab(tabName) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Deactivate all buttons
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Show selected tab
  const selectedTab = document.getElementById(`tab-${tabName}`);
  const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
  
  if (selectedTab) selectedTab.classList.add('active');
  if (selectedButton) selectedButton.classList.add('active');
  
  // Call tab load function if exists
  const loadFunction = window[`load${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`];
  if (loadFunction && typeof loadFunction === 'function') {
    loadFunction();
  }
}

// Show loading state
function showLoading(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `;
}

// Show empty state
function showEmptyState(containerId, icon, title, description, buttonText = null, buttonAction = null) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">${icon}</div>
      <h3>${title}</h3>
      <p>${description}</p>
      ${buttonText ? `<button class="btn btn-primary" onclick="${buttonAction}">${buttonText}</button>` : ''}
    </div>
  `;
}

// Show error state
function showError(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <h3>Oops! Something went wrong</h3>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
    </div>
  `;
}
