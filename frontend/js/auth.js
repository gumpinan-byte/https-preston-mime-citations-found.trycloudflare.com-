// Authentication and User State Management
const Auth = {
  user: null,
  token: null,
  favorites: new Set(),

  init() {
    const savedUser = localStorage.getItem('autowale_user');
    const savedToken = localStorage.getItem('autowale_token');
    const savedFavs = localStorage.getItem('autowale_favs');

    if (savedUser && savedToken) {
      try {
        this.user = JSON.parse(savedUser);
        this.token = savedToken;
      } catch (e) {
        localStorage.removeItem('autowale_user');
      }
    }

    if (savedFavs) {
      try {
        this.favorites = new Set(JSON.parse(savedFavs));
      } catch (e) {
        this.favorites = new Set();
      }
    }

    this.updateNavbarUser();
  },

  isLoggedIn() {
    return !!this.user;
  },

  setUser(user, token) {
    this.user = user;
    this.token = token;
    localStorage.setItem('autowale_user', JSON.stringify(user));
    localStorage.setItem('autowale_token', token);
    this.updateNavbarUser();
  },

  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('autowale_user');
    localStorage.removeItem('autowale_token');
    this.updateNavbarUser();
    showToast('Logged out successfully', 'info');
  },

  updateNavbarUser() {
    const userContainer = document.getElementById('navbar-auth-container');
    if (!userContainer) return;

    if (this.isLoggedIn()) {
      userContainer.innerHTML = `
        <div class="relative group">
          <button class="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 hover:border-sky-500 transition-all text-sm">
            <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
              ${this.user.full_name ? this.user.full_name[0].toUpperCase() : 'U'}
            </div>
            <span class="text-slate-200 font-medium hidden md:inline">${this.user.username}</span>
            <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400"></i>
          </button>
          
          <div class="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50 animate-fadeIn">
            <div class="px-4 py-2 border-b border-slate-800">
              <p class="text-xs text-slate-400">Signed in as</p>
              <p class="text-sm font-semibold text-white truncate">${this.user.email}</p>
            </div>
            <a href="#favorites" onclick="App.showSavedCars()" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-sky-400 transition-colors">
              <i data-lucide="heart" class="w-4 h-4 text-red-400"></i> Saved Cars (${this.favorites.size})
            </a>
            <a href="#history" onclick="App.showScanHistory()" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-sky-400 transition-colors">
              <i data-lucide="scan" class="w-4 h-4 text-sky-400"></i> Lens Scan History
            </a>
            <div class="border-t border-slate-800 mt-1 pt-1">
              <button onclick="Auth.logout()" class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors">
                <i data-lucide="log-out" class="w-4 h-4"></i> Logout
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      userContainer.innerHTML = `
        <button onclick="AuthModal.open('login')" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition-all">
          Sign In
        </button>
        <button onclick="AuthModal.open('register')" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 transition-all shadow-lg shadow-sky-600/25 flex items-center gap-1.5">
          <i data-lucide="user-plus" class="w-4 h-4"></i> Register
        </button>
      `;
    }
    if (window.lucide) lucide.createIcons();
  },

  toggleFavorite(carId) {
    if (this.favorites.has(carId)) {
      this.favorites.delete(carId);
      showToast('Removed from saved cars', 'info');
    } else {
      this.favorites.add(carId);
      showToast('Added to saved cars!', 'success');
    }
    localStorage.setItem('autowale_favs', JSON.stringify(Array.from(this.favorites)));
    this.updateNavbarUser();
    SearchFilter.updateFavoriteIcons();
  }
};

// Auth Modal Controller (Sign In, Register, Forgot Password)
const AuthModal = {
  currentView: 'login', // 'login', 'register', 'forgot', 'reset'
  resetUsername: '',

  open(view = 'login') {
    this.currentView = view;
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.renderView();
  },

  close() {
    const modal = document.getElementById('auth-modal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  },

  switchView(view) {
    this.currentView = view;
    this.renderView();
  },

  renderView() {
    const container = document.getElementById('auth-modal-content');
    if (!container) return;

    if (this.currentView === 'login') {
      container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-2xl font-bold text-white tracking-tight">Welcome Back</h3>
            <p class="text-sm text-slate-400 mt-1">Sign in to access your saved cars & searches</p>
          </div>
          <button onclick="AuthModal.close()" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="login-form" onsubmit="AuthModal.handleLogin(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Username or Email</label>
            <div class="relative">
              <i data-lucide="user" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="text" id="login-identifier" required placeholder="e.g. rahul123 or rahul@example.com" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <button type="button" onclick="AuthModal.switchView('forgot')" class="text-xs text-sky-400 hover:text-sky-300 transition-colors">
                Forgot Password?
              </button>
            </div>
            <div class="relative">
              <i data-lucide="lock" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="password" id="login-password" required placeholder="????????" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div id="login-error" class="hidden p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-xs font-medium"></div>

          <button type="submit" id="login-submit-btn" class="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 mt-2">
            <span>Sign In</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>

          <div class="text-center pt-2">
            <p class="text-sm text-slate-400">
              Don't have an account? 
              <button type="button" onclick="AuthModal.switchView('register')" class="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
                Create Username
              </button>
            </p>
          </div>
        </form>
      `;
    } else if (this.currentView === 'register') {
      container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-2xl font-bold text-white tracking-tight">Create Account</h3>
            <p class="text-sm text-slate-400 mt-1">Join AutoWale to explore latest cars & AI valuations</p>
          </div>
          <button onclick="AuthModal.close()" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="register-form" onsubmit="AuthModal.handleRegister(event)" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
            <div class="relative">
              <i data-lucide="user" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="text" id="reg-fullname" required placeholder="e.g. Rahul Sharma" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Choose Username</label>
            <div class="relative">
              <i data-lucide="at-sign" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="text" id="reg-username" required minlength="3" placeholder="e.g. rahul_cars" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
            <div class="relative">
              <i data-lucide="mail" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="email" id="reg-email" required placeholder="e.g. rahul@example.com" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Phone Number (Optional)</label>
            <div class="relative">
              <i data-lucide="phone" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="tel" id="reg-phone" placeholder="e.g. +91 98765 43210" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Password</label>
            <div class="relative">
              <i data-lucide="lock" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="password" id="reg-password" required minlength="6" placeholder="At least 6 characters" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div id="reg-error" class="hidden p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-xs font-medium"></div>

          <button type="submit" id="reg-submit-btn" class="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 mt-2">
            <span>Create Account</span>
            <i data-lucide="check-circle" class="w-4 h-4"></i>
          </button>

          <div class="text-center pt-2">
            <p class="text-sm text-slate-400">
              Already have an account? 
              <button type="button" onclick="AuthModal.switchView('login')" class="text-sky-400 hover:text-sky-300 font-semibold transition-colors">
                Sign In
              </button>
            </p>
          </div>
        </form>
      `;
    } else if (this.currentView === 'forgot') {
      container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-2xl font-bold text-white tracking-tight">Reset Password</h3>
            <p class="text-sm text-slate-400 mt-1">Step 1 of 2: Enter your username or email</p>
          </div>
          <button onclick="AuthModal.close()" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="forgot-form" onsubmit="AuthModal.handleForgotPassword(event)" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Registered Username or Email</label>
            <div class="relative">
              <i data-lucide="mail" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="text" id="forgot-identifier" required placeholder="Enter username or email" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div id="forgot-error" class="hidden p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-xs font-medium"></div>

          <button type="submit" id="forgot-submit-btn" class="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2">
            <span>Send Verification Code</span>
            <i data-lucide="send" class="w-4 h-4"></i>
          </button>

          <div class="text-center pt-2">
            <button type="button" onclick="AuthModal.switchView('login')" class="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              ? Back to Sign In
            </button>
          </div>
        </form>
      `;
    } else if (this.currentView === 'reset') {
      container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-2xl font-bold text-white tracking-tight">Enter New Password</h3>
            <p class="text-sm text-slate-400 mt-1">Step 2 of 2: Enter 6-digit OTP code & new password</p>
          </div>
          <button onclick="AuthModal.close()" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <div id="otp-hint-banner" class="mb-4 p-3 rounded-xl bg-sky-950/60 border border-sky-800/80 text-sky-200 text-xs flex items-center gap-2">
          <i data-lucide="info" class="w-4 h-4 text-sky-400 shrink-0"></i>
          <span>Verification code sent to your email. Check your inbox or enter code.</span>
        </div>

        <form id="reset-form" onsubmit="AuthModal.handleResetPassword(event)" class="space-y-3.5">
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">6-Digit Verification Code (OTP)</label>
            <div class="relative">
              <i data-lucide="key" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="text" id="reset-code" required maxlength="6" placeholder="e.g. 742918" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors tracking-widest font-mono">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">New Password</label>
            <div class="relative">
              <i data-lucide="lock" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="password" id="reset-new-password" required minlength="6" placeholder="At least 6 characters" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Confirm New Password</label>
            <div class="relative">
              <i data-lucide="lock" class="w-5 h-5 absolute left-3.5 top-3 text-slate-500"></i>
              <input type="password" id="reset-confirm-password" required minlength="6" placeholder="Repeat new password" 
                class="w-full bg-slate-900/90 border border-slate-700 focus:border-sky-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm outline-none transition-colors">
            </div>
          </div>

          <div id="reset-error" class="hidden p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-xs font-medium"></div>

          <button type="submit" id="reset-submit-btn" class="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 mt-2">
            <span>Update Password & Sign In</span>
            <i data-lucide="shield-check" class="w-4 h-4"></i>
          </button>
        </form>
      `;
    }

    if (window.lucide) lucide.createIcons();
  },

  async handleLogin(e) {
    e.preventDefault();
    const identifier = document.getElementById('login-identifier').value.trim();
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');
    const submitBtn = document.getElementById('login-submit-btn');

    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-2">?</span> Signing in...`;

    try {
      const res = await API.login({ username_or_email: identifier, password });
      Auth.setUser(res.user, res.token);
      showToast(`Welcome back, ${res.user.full_name}!`, 'success');
      this.close();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Sign In</span> <i data-lucide="arrow-right" class="w-4 h-4"></i>`;
      if (window.lucide) lucide.createIcons();
    }
  },

  async handleRegister(e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-fullname').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const password = document.getElementById('reg-password').value;
    const errorEl = document.getElementById('reg-error');
    const submitBtn = document.getElementById('reg-submit-btn');

    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-2">?</span> Creating account...`;

    try {
      const res = await API.register({
        full_name: fullName,
        username: username,
        email: email,
        phone: phone,
        password: password
      });
      Auth.setUser(res.user, res.token);
      showToast(`Account created! Welcome, ${res.user.full_name}!`, 'success');
      this.close();
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Create Account</span> <i data-lucide="check-circle" class="w-4 h-4"></i>`;
      if (window.lucide) lucide.createIcons();
    }
  },

  async handleForgotPassword(e) {
    e.preventDefault();
    const identifier = document.getElementById('forgot-identifier').value.trim();
    const errorEl = document.getElementById('forgot-error');
    const submitBtn = document.getElementById('forgot-submit-btn');

    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-2">?</span> Requesting OTP...`;

    try {
      const res = await API.forgotPassword(identifier);
      this.resetUsername = identifier;
      this.switchView('reset');
      
      // Auto-fill OTP in demo mode for user convenience with a toast notification
      if (res.demo_otp) {
        showToast(`Verification code: ${res.demo_otp}`, 'info');
        const codeInput = document.getElementById('reset-code');
        if (codeInput) codeInput.value = res.demo_otp;
      }
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Send Verification Code</span> <i data-lucide="send" class="w-4 h-4"></i>`;
      if (window.lucide) lucide.createIcons();
    }
  },

  async handleResetPassword(e) {
    e.preventDefault();
    const code = document.getElementById('reset-code').value.trim();
    const newPassword = document.getElementById('reset-new-password').value;
    const confirmPassword = document.getElementById('reset-confirm-password').value;
    const errorEl = document.getElementById('reset-error');
    const submitBtn = document.getElementById('reset-submit-btn');

    if (newPassword !== confirmPassword) {
      errorEl.textContent = 'Passwords do not match. Please re-enter.';
      errorEl.classList.remove('hidden');
      return;
    }

    errorEl.classList.add('hidden');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="inline-block animate-spin mr-2">?</span> Updating password...`;

    try {
      const res = await API.resetPassword(this.resetUsername, code, newPassword);
      showToast(res.message, 'success');
      this.switchView('login');
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.classList.remove('hidden');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Update Password & Sign In</span> <i data-lucide="shield-check" class="w-4 h-4"></i>`;
      if (window.lucide) lucide.createIcons();
    }
  }
};
