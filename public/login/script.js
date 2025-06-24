const signInBtn = document.getElementById("signIn");
const signUpBtn = document.getElementById("signUp");
const fistForm = document.getElementById("form1");
const secondForm = document.getElementById("form2");
const container = document.querySelector(".container");


document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');

    console.log('Login page loaded, checking existing login...', { hasToken: !!token, email });

    if (token && email) {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect') || '../index.html';

        console.log('User already logged in, redirecting to:', redirect);
        window.location.href = redirect;
    }
});

signInBtn.addEventListener("click", () => {
    container.classList.remove("right-panel-active");
});

signUpBtn.addEventListener("click", () => {
    container.classList.add("right-panel-active");
});
const passwordInput = document.querySelector('#signupPassword');

if (passwordInput) {
    passwordInput.addEventListener("keyup", function () {
        const value = this.value;
        const color = testPasswordStrength(value);
        styleStrengthLine(color, value);
    });
}

//尝试动态获取密码强度

function testPasswordStrength(value) {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{10,}$/;
    const mediumRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;


    if (strongRegex.test(value)) {
        return "green";
    } else if (mediumRegex.test(value)) {
        return "orange";
    } else {
        return "red";
    }
}

function styleStrengthLine(color, value) {
    const lines = document.querySelectorAll(".line");
    lines.forEach(line => {
        line.classList.remove("bg-red", "bg-orange", "bg-green");
        line.classList.add("bg-transparent");
    });

    if (value) {
        if (color === "red") {
            lines[0].classList.remove("bg-transparent");
            lines[0].classList.add("bg-red");
        } else if (color === "orange") {
            lines[0].classList.remove("bg-transparent");
            lines[1].classList.remove("bg-transparent");
            lines[0].classList.add("bg-orange");
            lines[1].classList.add("bg-orange");
        } else if (color === "green") {
            lines.forEach(line => {
                line.classList.remove("bg-transparent");
                line.classList.add("bg-green");
            });
        }
    }
}

function showMessage(message, type = 'info') {

    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }


    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 10000;
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
        `;
        document.head.appendChild(style);
    }

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 3000);
}


fistForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = fistForm.querySelector('input[placeholder="User"]').value.trim();
    const email = fistForm.querySelector('input[placeholder="Email"]').value.trim();
    const password = fistForm.querySelector('input[placeholder="Password"]').value;

    console.log('Sign up attempt...', { username, email, hasPassword: !!password });

    if (!username || !email || !password) {
        showMessage("Please fill in all fields", 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage("Please enter a valid email address", 'error');
        return;
    }



    try {
        const submitBtn = fistForm.querySelector('.btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing Up...';
        submitBtn.disabled = true;


        const response = await fetch('/api/auth/signIn', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showMessage("Registration successful! Please sign in.", 'success');

            fistForm.reset();

            container.classList.remove("right-panel-active");
        } else {
            showMessage(data.error || "Registration failed", 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showMessage("Network error occurred during registration", 'error');
    } finally {
        const submitBtn = fistForm.querySelector('.btn');
        submitBtn.textContent = 'Sign Up';
        submitBtn.disabled = false;
    }
});


secondForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = secondForm.querySelector('input[placeholder="Email"]').value.trim();
    const password = secondForm.querySelector('input[placeholder="Password"]').value;

    console.log('Sign in attempt for email:', email);

    if (!email || !password) {
        showMessage("Please fill in all fields", 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showMessage("Please enter a valid email address", 'error');
        return;
    }

    try {
        const submitBtn = secondForm.querySelector('.btn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Signing In...';
        submitBtn.disabled = true;

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (response.ok && data.token) {

            const userEmail = data.email || email;

            localStorage.setItem('token', data.token);
            localStorage.setItem('userEmail', userEmail);

            const savedToken = localStorage.getItem('token');
            const savedEmail = localStorage.getItem('userEmail');
            console.log('Verification - saved data:', {
                token: !!savedToken,
                email: savedEmail
            });

            showMessage("Login successful! Redirecting...", 'success');

            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || '../index.html';

            console.log('Redirecting to:', redirect);

            setTimeout(() => {
                window.location.href = redirect;
            }, 1500);

        } else {
            showMessage(data.error || "Login failed", 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage("Network error occurred during login", 'error');
    } finally {
        const submitBtn = secondForm.querySelector('.btn');
        submitBtn.textContent = 'Sign In';
        submitBtn.disabled = false;
    }
});