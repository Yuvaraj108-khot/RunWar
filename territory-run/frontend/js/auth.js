import { login, register, setToken } from './api.js';
import { showGame, showAuth } from './ui.js';

let currentUser = null;

async function loadUsersList() {
  try {
    const response = await fetch('http://localhost:4000/auth/debug/users');
    const data = await response.json();
    const container = document.getElementById('users-list-content');
    if (data.users && data.users.length > 0) {
      container.innerHTML = data.users.map(u => 
        `<div style="padding: 0.5rem 0; border-bottom: 1px solid rgba(0,229,255,0.1);">
          <div style="color: var(--accent);">${u.email}</div>
          <div style="opacity: 0.7; font-size: 0.8rem;">${u.displayName}</div>
        </div>`
      ).join('');
    } else {
      container.innerHTML = '<div style="opacity: 0.6;">No users registered yet</div>';
    }
  } catch (err) {
    console.error('Error loading users:', err);
    document.getElementById('users-list-content').innerHTML = '<div style="color: var(--danger);">Error loading users</div>';
  }
}

export function initAuth() {
  console.log('🔐 Initializing auth...');
  
  const toggleBtn = document.getElementById('btn-auth-toggle');
  const authContainer = document.getElementById('auth-container');
  const authMenu = document.getElementById('auth-menu');
  const profileView = document.getElementById('profile-view');
  const profileEdit = document.getElementById('profile-edit');
  const usersList = document.getElementById('users-list');
  const profileNameDisplay = document.getElementById('profile-name-display');
  const profileNameInput = document.getElementById('profile-name-input');
  const btnEditName = document.getElementById('btn-edit-name');
  const btnSaveName = document.getElementById('btn-save-name');
  const btnCancelEdit = document.getElementById('btn-cancel-edit');
  const btnShowUsers = document.getElementById('btn-show-users');
  const btnBackToProfile = document.getElementById('btn-back-to-profile');
  const btnLogout = document.getElementById('btn-logout');

  // Try to restore user from storage
  const storedUser = localStorage.getItem('tr_user');
  const storedToken = localStorage.getItem('tr_token');
  
  if (storedUser && storedToken) {
    try {
      currentUser = JSON.parse(storedUser);
      setToken(storedToken);
      console.log('✓ User restored from storage:', currentUser.email);
      toggleBtn.textContent = currentUser.displayName || 'Account';
      profileNameDisplay.textContent = currentUser.displayName || currentUser.email || 'Account';
      showGame();
    } catch (e) {
      console.warn('⚠ Failed to restore user:', e);
      currentUser = null;
      localStorage.removeItem('tr_user');
      localStorage.removeItem('tr_token');
      showAuth();
    }
  } else {
    console.log('👤 No stored user, showing login page');
    toggleBtn.textContent = 'Login';
    showAuth();
  }

  // Auth toggle button (profile menu)
  toggleBtn.addEventListener('click', () => {
    if (currentUser) {
      const isHidden = authMenu.classList.contains('hidden');
      if (isHidden) {
        authMenu.classList.remove('hidden');
        profileView.classList.remove('hidden');
        profileEdit.classList.add('hidden');
      } else {
        authMenu.classList.add('hidden');
      }
    } else {
      showAuth();
    }
  });

  // SIGNUP FORM
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value.trim();
      
      if (!name || !email || !password) {
        alert('❌ Please fill in all fields');
        return;
      }

      if (password.length < 6) {
        alert('❌ Password must be at least 6 characters');
        return;
      }

      try {
        console.log('📝 Attempting signup:', { email, name });
        const data = await register(email, password, name);
        console.log('✓ Signup successful:', data);
        
        setToken(data.token);
        currentUser = data.user;
        localStorage.setItem('tr_user', JSON.stringify(data.user));
        localStorage.setItem('tr_token', data.token);
        toggleBtn.textContent = data.user.displayName || 'Account';
        profileNameDisplay.textContent = data.user.displayName || data.user.email || '';
        signupForm.reset();
        showGame();
      } catch (err) {
        console.error('✗ Signup failed:', err);
        alert(`❌ Signup failed: ${err.message}`);
      }
    });
  }

  // LOGIN FORM
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value.trim();
      
      if (!email || !password) {
        alert('❌ Please fill in all fields');
        return;
      }

      try {
        console.log('🔓 Attempting login:', { email });
        const data = await login(email, password);
        console.log('✓ Login successful:', data);
        
        setToken(data.token);
        currentUser = data.user;
        localStorage.setItem('tr_user', JSON.stringify(data.user));
        localStorage.setItem('tr_token', data.token);
        toggleBtn.textContent = data.user.displayName || 'Account';
        profileNameDisplay.textContent = data.user.displayName || data.user.email || '';
        loginForm.reset();
        showGame();
      } catch (err) {
        console.error('✗ Login failed:', err);
        alert(`❌ Login failed: ${err.message}`);
      }
    });
  }

  // PROFILE MENU - Edit Name
  if (btnEditName) {
    btnEditName.addEventListener('click', () => {
      profileView.classList.add('hidden');
      profileEdit.classList.remove('hidden');
      profileNameInput.value = (currentUser && currentUser.displayName) || '';
      profileNameInput.focus();
    });
  }

  // PROFILE MENU - Cancel Edit
  if (btnCancelEdit) {
    btnCancelEdit.addEventListener('click', () => {
      profileEdit.classList.add('hidden');
      profileView.classList.remove('hidden');
    });
  }

  // PROFILE MENU - Save Name
  if (btnSaveName) {
    btnSaveName.addEventListener('click', () => {
      const v = profileNameInput.value.trim();
      if (!v) {
        alert('❌ Name required');
        return;
      }
      if (!currentUser) return;
      
      currentUser.displayName = v;
      localStorage.setItem('tr_user', JSON.stringify(currentUser));
      toggleBtn.textContent = v;
      profileNameDisplay.textContent = v;
      profileEdit.classList.add('hidden');
      profileView.classList.remove('hidden');
      console.log('✓ Display name updated:', v);
    });
  }

  // PROFILE MENU - Show Users List
  if (btnShowUsers) {
    btnShowUsers.addEventListener('click', () => {
      profileView.classList.add('hidden');
      usersList.classList.remove('hidden');
      loadUsersList();
    });
  }

  // PROFILE MENU - Back to Profile
  if (btnBackToProfile) {
    btnBackToProfile.addEventListener('click', () => {
      usersList.classList.add('hidden');
      profileView.classList.remove('hidden');
    });
  }

  // PROFILE MENU - Logout
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      console.log('🚪 Logging out...');
      currentUser = null;
      setToken(null);
      localStorage.removeItem('tr_user');
      localStorage.removeItem('tr_token');
      toggleBtn.textContent = 'Login';
      authMenu.classList.add('hidden');
      showAuth();
      console.log('✓ Logged out successfully');
    });
  }

  console.log('✓ Auth initialization complete');
}

export function getCurrentUser() {
  return currentUser;
}
