console.log("--- auth.js script started execution ---");

// --- Get DOM Elements ---
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const showLoginLink = document.getElementById('showLoginLink');
const showRegisterLink = document.getElementById('showRegisterLink');
const registerMessage = document.getElementById('registerMessage');
const loginMessage = document.getElementById('loginMessage');

if (!registerForm || !loginForm || !registerBtn || !loginBtn || !showLoginLink || !showRegisterLink || !registerMessage || !loginMessage) {
    console.error("CRITICAL: One or more authentication form elements are missing from index.html!");
}

// --- UI Switching Functions ---
function showRegisterForm() {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
}

function showLoginForm() {
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
}

// --- Event Listeners ---
if (showLoginLink) {
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
}

if (showRegisterLink) {
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
}

// --- Authentication Functions ---
async function registerUser(username, password) {
    try {
        const response = await fetch('/api/auth/register', { // Adjust URL if needed
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            registerMessage.textContent = data.message;
            registerMessage.classList.remove('error');
            registerMessage.classList.add('success');
            showLoginForm(); // Automatically switch to login form after successful registration
        } else {
            registerMessage.textContent = data.message || 'Registration failed';
            registerMessage.classList.remove('success');
            registerMessage.classList.add('error');
        }
    } catch (error) {
        console.error("Registration Error:", error);
        registerMessage.textContent = 'Network error during registration';
        registerMessage.classList.remove('success');
        registerMessage.classList.add('error');
    }
}

async function loginUser(username, password) {
    try {
        const response = await fetch('/api/auth/login', { // Adjust URL if needed
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store the token (e.g., in localStorage)
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username); // Store username
            console.log("Login successful. Token:", data.token);
            // TODO: Redirect to game or update UI to show logged-in state
            loginMessage.textContent = 'Login successful!';
            loginMessage.classList.remove('error');
            loginMessage.classList.add('success');
            // For now, just reload the game (simplest way to refresh UI)
            window.location.reload(); // Reload the page
        } else {
            loginMessage.textContent = data.message || 'Login failed';
            loginMessage.classList.remove('success');
            loginMessage.classList.add('error');
        }
    } catch (error) {
        console.error("Login Error:", error);
        loginMessage.textContent = 'Network error during login';
        loginMessage.classList.remove('success');
        loginMessage.classList.add('error');
    }
}

// --- Form Submission Listeners ---
if (registerBtn) {
    registerBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        await registerUser(username, password);
    });
}

if (loginBtn) {
    loginBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        await loginUser(username, password);
    });
}

// --- Initialization ---
// Check if there's a token in localStorage on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log("auth.js DOMContentLoaded");
    const token = localStorage.getItem('token');
    if (token) {
        console.log("Token found in localStorage:", token);
        // TODO: Validate token with server (more secure)
        // For now, just assume valid and update UI
        // Example: showGameUI(); // Function to hide auth forms and show game
        // For now, just log the user in the console
        console.log(`Welcome back, ${localStorage.getItem('username')}!`);
    } else {
        console.log("No token found in localStorage. Showing auth forms.");
        // Show auth forms if no token
        showRegisterForm(); // Or show login form by default
    }
});
