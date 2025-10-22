// Configuration
const CONFIG = {
  API_URL: window.location.origin
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
    const response = await fetch(`${CONFIG.API_URL}/api/v1/auth/register`, {
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
    const response = await fetch(`${CONFIG.API_URL}/api/v1/auth/login`, {
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
    
    // Hide CAPTCHA error initially
    const captchaError = document.getElementById('captchaError');
    if (captchaError) {
      captchaError.classList.remove('show');
    }

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

    // Validate CAPTCHA
    const recaptchaResponse = typeof grecaptcha !== 'undefined' ? grecaptcha.getResponse() : '';
    if (!recaptchaResponse) {
      if (captchaError) {
        captchaError.classList.add('show');
      }
      hasError = true;
    } else {
      formData.recaptchaToken = recaptchaResponse;
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
      
      // Reset CAPTCHA on error
      if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset();
      }
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

// Clear errors on input
document.querySelectorAll('input').forEach(input => {
  input.addEventListener('input', (e) => {
    const fieldId = e.target.id;
    clearError(fieldId);
  });
});

// Check if user is already logged in on page load
window.addEventListener('DOMContentLoaded', () => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken && (window.location.pathname === '/' || window.location.pathname === '/index.html' || window.location.pathname === '/login.html')) {
    // User is already logged in, redirect to dashboard
    redirectAfterAuth();
  }
});
