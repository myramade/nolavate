// Configuration - Update these with your actual OAuth credentials
const CONFIG = {
  API_URL: window.location.origin,
  GOOGLE_CLIENT_ID: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  APPLE_CLIENT_ID: 'YOUR_APPLE_CLIENT_ID',
  APPLE_REDIRECT_URI: window.location.origin + '/auth/apple/callback'
};

// Utility Functions
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  const messageEl = notification.querySelector('.notification-message');
  const iconEl = notification.querySelector('.notification-icon');
  
  notification.className = `notification ${type} show`;
  messageEl.textContent = message;
  iconEl.textContent = type === 'success' ? '✓' : '✕';
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 4000);
}

function setLoading(button, isLoading) {
  const btnText = button.querySelector('.btn-text');
  const btnLoader = button.querySelector('.btn-loader');
  
  if (isLoading) {
    button.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'block';
  } else {
    button.disabled = false;
    btnText.style.display = 'block';
    btnLoader.style.display = 'none';
  }
}

function showError(fieldId, message) {
  const errorEl = document.getElementById(fieldId + 'Error');
  const inputEl = document.getElementById(fieldId);
  
  if (errorEl && inputEl) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
    inputEl.classList.add('error');
  }
}

function clearError(fieldId) {
  const errorEl = document.getElementById(fieldId + 'Error');
  const inputEl = document.getElementById(fieldId);
  
  if (errorEl && inputEl) {
    errorEl.classList.remove('show');
    inputEl.classList.remove('error');
  }
}

function clearAllErrors() {
  document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
}

// Password Toggle
function togglePassword() {
  const input = document.getElementById('password');
  const showText = event.target.querySelector('.show-text');
  const hideText = event.target.querySelector('.hide-text');
  
  if (input.type === 'password') {
    input.type = 'text';
    showText.style.display = 'none';
    hideText.style.display = 'block';
  } else {
    input.type = 'password';
    showText.style.display = 'block';
    hideText.style.display = 'none';
  }
}

// Email Validation
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// API Calls
async function registerUser(userData) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function loginUser(credentials) {
  try {
    const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Save user data to localStorage
function saveUserData(data) {
  if (data && data.data) {
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.data.user));
  }
}

// Redirect after successful authentication
function redirectAfterAuth() {
  // Redirect to dashboard or home page
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.roleSubtype === 'RECRUITER') {
    window.location.href = '/recruiter/dashboard.html';
  } else {
    window.location.href = '/candidate/dashboard.html';
  }
}

// Sign Up Form Handler
const signupForm = document.getElementById('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const submitBtn = document.getElementById('submitBtn');
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      roleSubtype: document.getElementById('roleSubtype').value
    };

    // Validation
    let hasError = false;

    if (formData.name.length < 2) {
      showError('name', 'Please enter your full name');
      hasError = true;
    }

    if (!validateEmail(formData.email)) {
      showError('email', 'Please enter a valid email address');
      hasError = true;
    }

    if (formData.password.length < 8) {
      showError('password', 'Password must be at least 8 characters');
      hasError = true;
    }

    if (hasError) return;

    setLoading(submitBtn, true);

    try {
      const data = await registerUser(formData);
      saveUserData(data);
      showNotification('Account created successfully! Redirecting...', 'success');
      
      setTimeout(() => {
        redirectAfterAuth();
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      showNotification(error.message || 'Failed to create account. Please try again.', 'error');
      setLoading(submitBtn, false);
    }
  });
}

// Login Form Handler
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const submitBtn = document.getElementById('submitBtn');
    const formData = {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    };

    // Validation
    let hasError = false;

    if (!validateEmail(formData.email)) {
      showError('email', 'Please enter a valid email address');
      hasError = true;
    }

    if (formData.password.length < 1) {
      showError('password', 'Please enter your password');
      hasError = true;
    }

    if (hasError) return;

    setLoading(submitBtn, true);

    try {
      const data = await loginUser(formData);
      saveUserData(data);
      showNotification('Welcome back! Redirecting...', 'success');
      
      setTimeout(() => {
        redirectAfterAuth();
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
      showNotification(error.message || 'Invalid email or password', 'error');
      setLoading(submitBtn, false);
    }
  });
}

// Google Sign-In Handler
function triggerGoogleSignIn() {
  // NOTE: You need to replace YOUR_GOOGLE_CLIENT_ID in index.html and login.html
  // with your actual Google OAuth client ID
  showNotification('Please configure your Google OAuth credentials first', 'error');
  
  // Uncomment below when credentials are configured:
  // google.accounts.id.prompt();
}

function handleGoogleSignIn(response) {
  console.log('Google ID Token:', response.credential);
  
  // TODO: Send the ID token to your backend for verification
  // The backend should verify the token and create/login the user
  
  // Example implementation:
  /*
  fetch(`${CONFIG.API_URL}/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      idToken: response.credential
    })
  })
  .then(res => res.json())
  .then(data => {
    saveUserData(data);
    showNotification('Signed in with Google successfully!', 'success');
    setTimeout(() => redirectAfterAuth(), 1500);
  })
  .catch(error => {
    showNotification('Google sign-in failed. Please try again.', 'error');
  });
  */
}

// Apple Sign-In Handler
function handleAppleSignIn() {
  // NOTE: You need to configure Apple Sign-In credentials
  showNotification('Please configure your Apple Sign-In credentials first', 'error');
  
  // Uncomment below when credentials are configured:
  /*
  AppleID.auth.signIn().then(response => {
    console.log('Apple authorization:', response);
    
    // Send authorization code to backend
    fetch(`${CONFIG.API_URL}/auth/apple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: response.authorization.code,
        idToken: response.authorization.id_token
      })
    })
    .then(res => res.json())
    .then(data => {
      saveUserData(data);
      showNotification('Signed in with Apple successfully!', 'success');
      setTimeout(() => redirectAfterAuth(), 1500);
    })
    .catch(error => {
      showNotification('Apple sign-in failed. Please try again.', 'error');
    });
  }).catch(error => {
    console.error('Apple sign-in error:', error);
    if (error.error !== 'popup_closed_by_user') {
      showNotification('Apple sign-in failed. Please try again.', 'error');
    }
  });
  */
}

// Clear errors on input
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', (e) => {
    const fieldId = e.target.id;
    clearError(fieldId);
  });
});

// Check if user is already logged in
window.addEventListener('DOMContentLoaded', () => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken && (window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '/login.html')) {
    // User is already logged in, redirect to dashboard
    redirectAfterAuth();
  }
});
