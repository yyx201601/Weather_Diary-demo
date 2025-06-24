class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.userEmail = localStorage.getItem('userEmail');
        this.init();
    }

    // initialize Auth
    init() {
        console.log('AuthManager initializing...', {
            hasToken: !!this.token,
            userEmail: this.userEmail
        });

        this.updateAuthUI();
        this.setupEventListeners();

        if (this.token && !this.userEmail) {
            this.fetchUserInfo();
        }

        if (this.token) {
            this.verifyToken();
        }
    }

    async fetchUserInfo() {
        try {
            console.log('Fetching user info from server...');
            const response = await fetch('/api/auth/user-info', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userData = await response.json();
                console.log('User info fetched:', userData);

                this.userEmail = userData.email;
                localStorage.setItem('userEmail', userData.email);
                this.updateAuthUI();

                return userData;
            } else {
                console.log('Failed to fetch user info, status:', response.status);

                // clean login status
                if (response.status === 401 || response.status === 403) {
                    this.logout();
                    window.location.href = 'login/login.html';
                }
            }
        } catch (error) {
            console.log('Error fetching user info:', error);
        }
        return null;
    }

    setupEventListeners() {
        const userMenuBtn = document.getElementById('userMenuBtn');
        const userDropdown = document.getElementById('userDropdown');

        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('show');
            });
        }

        document.addEventListener('click', () => {
            if (userDropdown) {
                userDropdown.classList.remove('show');
            }
        });
    }

    updateAuthUI() {
        const authButtons = document.getElementById('auth-buttons');
        const userMenu = document.getElementById('user-menu');
        const userEmailSpan = document.getElementById('userEmail');

        console.log('Updating auth UI...', {
            isLoggedIn: this.isLoggedIn(),
            userEmail: this.userEmail
        });

        if (this.isLoggedIn()) {
            if (authButtons) authButtons.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';

            const displayEmail = this.userEmail || 'User';
            const displayName = displayEmail.includes('@') ? displayEmail.split('@')[0] : displayEmail;

            if (userEmailSpan) {
                userEmailSpan.textContent = displayName;
            }

            console.log('Auth UI updated for logged in user:', displayName);
        } else {
            if (authButtons) authButtons.style.display = 'flex';
            if (userMenu) userMenu.style.display = 'none';

            console.log('Auth UI updated for logged out state');
        }
    }

    isLoggedIn() {
        return !!this.token;
    }

    async verifyToken() {
        try {
            if (!this.userEmail) {
                await this.fetchUserInfo();
            }
            return true;
        } catch (error) {
            console.error('Token verification failed:', error);
            this.logout();
            return false;
        }
    }

    setLoginState(token, email) {
        console.log('Setting login state:', { token: !!token, email });

        this.token = token;
        this.userEmail = email;

        localStorage.setItem('token', token);
        if (email) {
            localStorage.setItem('userEmail', email);
        }

        this.updateAuthUI();

        console.log('Login state set successfully');
    }

    logout() {
        console.log('Logging out user...');

        this.token = null;
        this.userEmail = null;

        localStorage.removeItem('token');
        localStorage.removeItem('userEmail');

        this.updateAuthUI();

        this.showMessage('You have been logged out successfully', 'success');

        console.log('User logged out successfully');
    }

    showMessage(message, type = 'info') {
        console.log('Showing message:', message, 'Type:', type);

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            animation: slideIn 0.3s ease;
        `;

        switch (type) {
            case 'success':
                messageDiv.style.backgroundColor = '#10b981';
                break;
            case 'error':
                messageDiv.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                messageDiv.style.backgroundColor = '#f59e0b';
                break;
            default:
                messageDiv.style.backgroundColor = '#3b82f6';
        }

        messageDiv.textContent = message;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        if (!document.head.querySelector('style[data-message-style]')) {
            style.setAttribute('data-message-style', 'true');
            document.head.appendChild(style);
        }

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);

        messageDiv.addEventListener('click', () => {
            messageDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        });
    }


    getAuthHeaders() {
        return this.token ? { 'Authorization': `Bearer ${this.token}` } : {};
    }
}

function logout() {
    if (window.authManager) {
        window.authManager.logout();
    }
}


function openProfile() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.remove('show');
    }

    window.location.href = 'profile.html';
}

function openDiary() {
    const userDropdown = document.getElementById('userDropdown');
    if (userDropdown) {
        userDropdown.classList.remove('show');
    }

    window.location.href = 'diary.html';
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AuthManager...');
    window.authManager = new AuthManager();
});