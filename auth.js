// Enhanced Authentication System
class AuthSystem {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('snap2resolve_users')) || [];
    this.currentUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;
    this.initAuthForms();
    this.checkAuthState();
  }

  initAuthForms() {
    // Login Form
    if (document.getElementById('loginForm')) {
      document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin(
          document.getElementById('loginEmail').value,
          document.getElementById('loginPassword').value
        );
      });
    }

    // Registration Form
    if (document.getElementById('registerForm')) {
      document.getElementById('registerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleRegister({
          name: document.getElementById('regName').value,
          email: document.getElementById('regEmail').value,
          password: document.getElementById('regPassword').value,
          confirmPassword: document.getElementById('regConfirmPassword').value
        });
      });
    }

    // Logout Button
    if (document.getElementById('logoutBtn')) {
      document.getElementById('logoutBtn').addEventListener('click', () => {
        this.handleLogout();
      });
    }
  }

  handleLogin(email, password) {
    const user = this.users.find(u => u.email === email);
    
    if (!user) {
      this.showAuthError('User not found');
      return;
    }

    if (user.password !== password) {
      this.showAuthError('Incorrect password');
      return;
    }

    this.currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    this.redirectTo('welcome.html');
  }

  handleRegister(userData) {
    // Validation
    if (userData.password !== userData.confirmPassword) {
      this.showAuthError("Passwords don't match");
      return;
    }

    if (this.users.some(u => u.email === userData.email)) {
      this.showAuthError('Email already registered');
      return;
    }

    // Create new user
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      points: 0,
      reports: [],
      createdAt: new Date().toISOString()
    };

    this.users.push(newUser);
    localStorage.setItem('snap2resolve_users', JSON.stringify(this.users));
    
    // Auto-login
    this.currentUser = newUser;
    sessionStorage.setItem('currentUser', JSON.stringify(newUser));
    this.redirectTo('welcome.html');
  }

  handleLogout() {
    sessionStorage.removeItem('currentUser');
    this.currentUser = null;
    this.redirectTo('index.html');
  }

  checkAuthState() {
    const publicPages = ['index.html', 'welcome.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (!this.currentUser && !publicPages.includes(currentPage)) {
      this.redirectTo('index.html');
    }

    if (this.currentUser && currentPage === 'index.html') {
      this.redirectTo('home.html');
    }

    // Update UI for logged-in users
    if (this.currentUser) {
      this.updateUserUI();
    }
  }

  updateUserUI() {
    // Update navbar
    if (document.getElementById('userNav')) {
      document.getElementById('userNav').innerHTML = `
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="userDropdown">
            <i class="fas fa-user-circle"></i> ${this.currentUser.name}
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="profile.html"><i class="fas fa-user"></i> Profile</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</button></li>
          </ul>
        </li>
      `;
    }

    // Update points display
    if (document.getElementById('userPoints')) {
      document.getElementById('userPoints').textContent = this.currentUser.points;
    }
  }

  showAuthError(message) {
    const errorEl = document.getElementById('authError') || document.createElement('div');
    errorEl.id = 'authError';
    errorEl.className = 'alert alert-danger mt-3';
    errorEl.textContent = message;
    
    const form = document.querySelector('.tab-pane.active .card-body');
    if (form && !document.getElementById('authError')) {
      form.appendChild(errorEl);
    } else if (document.getElementById('authError')) {
      errorEl.textContent = message;
    }
  }

  redirectTo(path) {
    window.location.href = path;
  }
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', () => {
  new AuthSystem();
});