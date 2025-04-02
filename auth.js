console.log("--- auth.js script started execution ---");

// --- Get DOM Elements ---
// It's better practice to get elements inside the functions that use them
// or within the DOMContentLoaded listener to ensure they exist.

// --- UI Switching Functions ---
function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.style.display = 'none';
    if (registerForm) registerForm.style.display = 'block';
}

function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (registerForm) registerForm.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
}

function showGameUI() {
    const gameContainer = document.querySelector('.game-container');
    const authForms = document.getElementById('authForms');
    if (gameContainer) gameContainer.style.display = 'flex'; // Or 'block' depending on layout needs
    if (authForms) authForms.style.display = 'none';
}

function showAuthForms() {
    const gameContainer = document.querySelector('.game-container');
    const authForms = document.getElementById('authForms');
    if (gameContainer) gameContainer.style.display = 'none';
    if (authForms) authForms.style.display = 'flex'; // Use flex to enable centering via CSS
    showLoginForm(); // Default to showing login form when auth is needed
}

// --- Message Display ---
function displayMessage(elementId, message, isSuccess) {
    const messageElement = document.getElementById(elementId);
    if (messageElement) {
        messageElement.textContent = message;
        if (isSuccess) {
            messageElement.classList.remove('error');
            messageElement.classList.add('success');
        } else {
            messageElement.classList.remove('success');
            messageElement.classList.add('error');
        }
    }
}

// --- Authentication Functions ---
async function registerUser(username, password) {
    try {
        const response = await fetch('/api/auth/register', { // Relative URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            displayMessage('registerMessage', data.message, true);
            showLoginForm();
        } else {
            displayMessage('registerMessage', data.message || 'Registration failed', false);
        }
    } catch (error) {
        console.error("Registration Error:", error);
        displayMessage('registerMessage', 'Network error during registration', false);
    }
}

async function loginUser(username, password) {
    try {
        const response = await fetch('/api/auth/login', { // Relative URL
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.user.username);
            console.log("Login successful. Token:", data.token);
            console.log("Received user data:", data.user);

            // Store data and dispatch event. game.js will handle initialization.
            localStorage.setItem('initialPlayerData', JSON.stringify(data.user)); // Store data
            showGameUI(); // Show the game interface directly
            document.dispatchEvent(new CustomEvent('playerDataReady')); // Dispatch event
        } else {
            displayMessage('loginMessage', data.message || 'Login failed', false);
            // Don't dispatch event if login failed
        }
    } catch (error) {
        console.error("Login Error:", error);
        displayMessage('loginMessage', 'Network error during login', false);
    }
}

// --- Function to Fetch User Data and Initialize ---
async function fetchAndInitializePlayerData(token) {
    console.log("Attempting to fetch user data with token...");
    try {
        const response = await fetch('/api/auth/me', { // Relative URL
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const userData = await response.json();
            console.log("Successfully fetched user data:", userData);
            localStorage.setItem('username', userData.username); // Update username

            // Store data and dispatch event. game.js will handle initialization.
            localStorage.setItem('initialPlayerData', JSON.stringify(userData)); // Store data
            showGameUI(); // Show game now that data is loaded
            console.log(`Welcome back, ${userData.username}!`);
            document.dispatchEvent(new CustomEvent('playerDataReady')); // Dispatch event
        } else {
            console.error(`Failed to fetch user data: ${response.status}`);
            localStorage.removeItem('token'); // Remove invalid token
            localStorage.removeItem('username');
            localStorage.removeItem('initialPlayerData'); // Clear stored data
            showAuthForms(); // Show login forms if token is invalid/expired
            // DO NOT dispatch playerDataReady here - wait for successful login
        }
    } catch (error) {
        console.error("Network error while fetching user data:", error);
        localStorage.removeItem('initialPlayerData'); // Clear stored data
        showAuthForms(); // Show auth forms on network error
        // DO NOT dispatch playerDataReady here - wait for successful login
    }
}

// --- Initialization and Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("auth.js DOMContentLoaded");

    // Get elements needed for listeners
    const registerBtn = document.getElementById('registerBtn');
    const loginBtn = document.getElementById('loginBtn');
    const showLoginLink = document.getElementById('showLoginLink');
    const showRegisterLink = document.getElementById('showRegisterLink');

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

    if (registerBtn) {
        registerBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('registerUsername');
            const passwordInput = document.getElementById('registerPassword');
            if (usernameInput && passwordInput) {
                await registerUser(usernameInput.value, passwordInput.value);
            }
        });
    }

    if (loginBtn) {
        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const usernameInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');
            if (usernameInput && passwordInput) {
                await loginUser(usernameInput.value, passwordInput.value);
            }
        });
    }

    // --- Check Authentication State on Load ---
    const token = localStorage.getItem('token');
    if (token) {
        console.log("Token found in localStorage. Fetching user data...");
        fetchAndInitializePlayerData(token); // Fetch data using the token
    } else {
        console.log("No token found in localStorage. Showing auth forms.");
        localStorage.removeItem('initialPlayerData'); // Ensure no stale data
        showAuthForms(); // Show auth forms if no token
        // DO NOT dispatch playerDataReady here - wait for successful login
    }
});

// Export functions if needed by other modules (though likely not needed here)
// export { showGameUI, showAuthForms };
