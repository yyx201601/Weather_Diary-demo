class ProfileManager {
    constructor() {
        this.init();
    }

    async init() {
        console.log('ProfileManager initializing...');

        if (!this.checkAuthStatus()) {
            return;
        }

        await this.loadUserInfo();

        this.setupEventListeners();

        console.log('ProfileManager initialized successfully');
    }

    checkAuthStatus() {
        const token = localStorage.getItem('token');
        const email = localStorage.getItem('userEmail');

        console.log('Auth check - Token exists:', !!token, 'Email:', email);

        if (!token) {
            console.log('No token found, redirecting to login');
            window.location.href = 'login/login.html';
            return false;
        }
        return true;
    }

    async loadUserInfo() {
        console.log('Loading user info...');

        const email = localStorage.getItem('userEmail');
        const token = localStorage.getItem('token');

        console.log('Retrieved from localStorage - Email:', email, 'Token exists:', !!token);

        let displayEmail = email;
        if (!email && token) {
            try {
                // try get email from localstrorage
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    displayEmail = payload.email;
                    // update localStorage
                    localStorage.setItem('userEmail', displayEmail);
                    console.log('Email extracted from token:', displayEmail);
                }
            } catch (error) {
                console.log('Could not parse token:', error);
            }
        }

        // if not, fetch from server
        if (!displayEmail) {
            try {
                const response = await fetch('/api/auth/user-info', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    displayEmail = userData.email;
                    localStorage.setItem('userEmail', displayEmail);
                    console.log('Email fetched from server:', displayEmail);
                } else {
                    console.log('Failed to fetch user info from server');
                }
            } catch (error) {
                console.log('Error fetching user info:', error);
            }
        }
        // defalt
        const finalEmail = displayEmail || 'Unknown';

        console.log('Final email to display:', finalEmail);

        const profileEmailElement = document.getElementById('profileEmail');
        const userEmailInfoElement = document.getElementById('userEmailInfo');

        if (profileEmailElement) {
            profileEmailElement.textContent = finalEmail;
            console.log('Updated profileEmail element');
        } else {
            console.log('profileEmail element not found');
        }

        if (userEmailInfoElement) {
            userEmailInfoElement.textContent = finalEmail;
            console.log('Updated userEmailInfo element');
        } else {
            console.log('userEmailInfo element not found');
        }

        const memberSinceElement = document.getElementById('memberSince');
        if (memberSinceElement) {
            memberSinceElement.textContent = new Date().toLocaleDateString();
        }

        console.log('User info loaded successfully');
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');

        const emailForm = document.getElementById('emailForm');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                this.handleEmailChange(e);
            });
            console.log('Email form listener added');
        } else {
            console.log('Email form not found');
        }

        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                this.handlePasswordChange(e);
            });
            console.log('Password form listener added');
        } else {
            console.log('Password form not found');
        }

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModal = document.querySelector('.modal.show');
                if (openModal) {
                    this.closeModal(openModal.id);
                }
            }
        });

    }

    async handleEmailChange(e) {
        e.preventDefault();

        const newEmail = document.getElementById('newEmail').value.trim();
        const currentEmail = localStorage.getItem('userEmail');

        console.log('Changing email from', currentEmail, 'to', newEmail);

        if (!newEmail) {
            this.showMessage('Please enter a new email', 'warning');
            return;
        }

        if (newEmail === currentEmail) {
            this.showMessage('New email is the same as current email', 'warning');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(newEmail)) {
            this.showMessage('Please enter a valid email address', 'warning');
            return;
        }

        try {
            const submitBtn = e.target.querySelector('.form-button');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="loading"></span>Updating...';
            submitBtn.disabled = true;

            const token = localStorage.getItem('token');

            const response = await fetch('/api/auth/change-email', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ newEmail })
            });

            const data = await response.json();
            console.log('Email change response:', data);

            if (response.ok) {
                localStorage.setItem('userEmail', newEmail);

                document.getElementById('profileEmail').textContent = newEmail;
                document.getElementById('userEmailInfo').textContent = newEmail;

                this.showMessage('Email updated successfully! Please log in again.', 'success');
                this.closeModal('emailModal');

                document.getElementById('newEmail').value = '';
                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userEmail');
                    window.location.href = 'login/login.html';
                }, 3000)
            } else {
                this.showMessage(data.error || 'Failed to update email', 'error');
            }

        } catch (error) {
            console.error('Error updating email:', error);
            this.showMessage('An error occurred while updating email', 'error');
        } finally {
            const submitBtn = e.target.querySelector('.form-button');
            submitBtn.textContent = 'Update';
            submitBtn.disabled = false;
        }
    }

    async handlePasswordChange(e) {
        e.preventDefault();

        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;


        if (!currentPassword || !newPassword || !confirmPassword) {
            this.showMessage('Please fill in all password fields', 'warning');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showMessage('New passwords do not match', 'warning');
            return;
        }

        if (currentPassword === newPassword) {
            this.showMessage('New password must be different from current password', 'warning');
            return;
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            this.showMessage('Password does not meet requirements', 'warning');
            return;
        }

        try {
            const submitBtn = e.target.querySelector('.form-button');
            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="loading"></span>Updating...';
            submitBtn.disabled = true;

            const token = localStorage.getItem('token');

            const response = await fetch('/api/auth/change-password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    oldPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                this.showMessage('Password updated successfully! Please log in again.', 'success');
                this.closeModal('passwordModal');

                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';

                setTimeout(() => {
                    localStorage.removeItem('token');
                    localStorage.removeItem('userEmail');
                    window.location.href = 'login/login.html';
                }, 3000);

            } else {
                this.showMessage(data.error || 'Failed to update password', 'error');
            }

        } catch (error) {
            console.error('Error updating password:', error);
            this.showMessage('An error occurred while updating password', 'error');
        } finally {
            const submitBtn = e.target.querySelector('.form-button');
            submitBtn.textContent = 'Update';
            submitBtn.disabled = false;
        }
    }

    openModal(modalId) {
        console.log('Opening modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        } else {
            console.log('Modal not found:', modalId);
        }
    }

    closeModal(modalId) {
        console.log('Closing modal:', modalId);
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    showMessage(message, type = 'info') {
        console.log('Showing message:', message, 'Type:', type);

        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 10001;
            max-width: 400px;
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

        if (!document.head.querySelector('style[data-message-style]')) {
            const style = document.createElement('style');
            style.setAttribute('data-message-style', 'true');
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
    }
}

function openChangeEmailModal() {
    if (window.profileManager) {
        window.profileManager.openModal('emailModal');
    }
}

function openChangePasswordModal() {
    if (window.profileManager) {
        window.profileManager.openModal('passwordModal');
    }
}

function closeModal(modalId) {
    if (window.profileManager) {
        window.profileManager.closeModal(modalId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.profileManager = new ProfileManager();
});