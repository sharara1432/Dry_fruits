"use strict";
const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");
const rememberMe = document.getElementById("rememberMe");
const forgotPassword = document.getElementById("forgotPassword");
const loginMessage = document.getElementById("loginMessage");


/* =========================================================
   LOGIN MESSAGES
========================================================= */

function showMessage(message, type = "") {
    if (!loginMessage) return;
    loginMessage.textContent = message;
    loginMessage.className = "login-message " + type;
}

function clearMessage() {
    if (!loginMessage) return;
    loginMessage.textContent = "";
    loginMessage.className = "login-message";
}


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener("click", function () {
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            passwordToggle.innerHTML = '<i class="bi bi-eye-slash"></i>';
            passwordToggle.setAttribute("aria-label", "Hide password");
        } else {
            passwordInput.type = "password";
            passwordToggle.innerHTML = '<i class="bi bi-eye"></i>';
            passwordToggle.setAttribute("aria-label", "Show password");
        }
    });
}


/* =========================================================
   REMEMBERED USER
========================================================= */

const rememberedUser = localStorage.getItem("sheernRememberedUser");

if (rememberedUser && usernameInput) {
    usernameInput.value = rememberedUser;
    if (rememberMe) rememberMe.checked = true;
}


/* =========================================================
   ROLE
========================================================= */

function getSelectedRole() {
    const selectedRole = document.querySelector('input[name="userRole"]:checked');
    if (!selectedRole) return "customer";
    return selectedRole.value;
}


/* =========================================================
   USERS / LOGIN STATE (localStorage)
========================================================= */

function loadUsers() {
    try {
        const storedUsers = localStorage.getItem("sheernUsers");
        if (!storedUsers) return [];
        const users = JSON.parse(storedUsers);
        if (!Array.isArray(users)) {
            console.error("sheernUsers must contain an array.");
            return [];
        }
        return users;
    } catch (error) {
        console.error("Error loading users from localStorage:", error);
        return [];
    }
}

function saveLoggedInUser(user) {
    localStorage.setItem("sheernLoggedIn", "true");
    localStorage.setItem("sheernUserRole", user.role || "customer");
    localStorage.setItem("sheernUsername", user.username || user.email || "");
    localStorage.setItem(
        "sheernUserName",
        user.fullName || user.name || user.username || user.email || "Sheern Customer"
    );
    localStorage.setItem("sheernLoggedInUser", JSON.stringify(user));
}

function isUserLoggedIn() {
    return localStorage.getItem("sheernLoggedIn") === "true";
}

function getLoggedInUser() {
    try {
        const storedUser = localStorage.getItem("sheernLoggedInUser");
        if (!storedUser) return null;
        return JSON.parse(storedUser);
    } catch (error) {
        console.error("Error reading logged-in user:", error);
        return null;
    }
}

function getAccountName() {
    return localStorage.getItem("sheernUserName") || "Login";
}


/* =========================================================
   NEW: HEADER ACCOUNT UI
   Works with the header ids used in your pages:
   headerLoginButton, accountButtonName, accountName,
   loginDropdownLink, registerDropdownLink, logoutButton
========================================================= */

function updateAccountUI() {

    if (!isUserLoggedIn()) return;

    const user = getLoggedInUser() || {};

    const fullName =
        user.fullName || user.name || user.username || user.email || getAccountName();

    const firstName = String(fullName).split(" ")[0];

    /* Button text + dropdown title */
    const nameSpan = document.getElementById("accountButtonName");
    const dropdownName = document.getElementById("accountName");

    if (nameSpan) nameSpan.textContent = firstName;
    if (dropdownName) dropdownName.textContent = fullName;

    /* Avatar: picture if saved, otherwise first letter */
    const icon = document.querySelector("#headerLoginButton .bi-person-circle");

    if (icon) {

        let avatar;

        if (user.avatar) {
            avatar = document.createElement("img");
            avatar.src = user.avatar;
            avatar.alt = "";
            avatar.style.cssText =
                "width:28px;height:28px;border-radius:50%;object-fit:cover;";
        } else {
            avatar = document.createElement("span");
            avatar.textContent = String(fullName).charAt(0).toUpperCase();
            avatar.style.cssText =
                "width:28px;height:28px;border-radius:50%;background:#1f3a1f;" +
                "color:#fff;display:inline-flex;align-items:center;" +
                "justify-content:center;font-weight:600;";
        }

        icon.replaceWith(avatar);
    }

    /* Dropdown links: hide Login / Create Account, show Logout */
    const loginLink = document.getElementById("loginDropdownLink");
    const registerLink = document.getElementById("registerDropdownLink");
    const logoutBtn = document.getElementById("logoutButton");

    if (loginLink) loginLink.classList.add("d-none");
    if (registerLink) registerLink.classList.add("d-none");
    if (logoutBtn) logoutBtn.classList.remove("d-none");

    /* Sidebar "Account" link */
    const sideAccountText =
        document.querySelector('.sidebar-bottom a[href="Login.html"] span');

    if (sideAccountText) sideAccountText.textContent = firstName;
}


/* =========================================================
   REQUIRE LOGIN (wishlist, cart, checkout, payment, order)
========================================================= */

function requireLogin(actionMessage = "continue") {

    if (!isUserLoggedIn()) {

        alert("Please login to your Sheern account to " + actionMessage + ".");

        localStorage.setItem("sheernLoginRequiredAction", actionMessage);

        window.location.href = "Login.html";

        return false;
    }

    return true;
}


/* =========================================================
   LOGIN FORM
========================================================= */

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();
        clearMessage();

        const username = usernameInput ? usernameInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const selectedRole = getSelectedRole();

        if (username === "" || password === "") {
            showMessage("Please fill in all fields.", "error");
            return;
        }

        const users = loadUsers();

        const user = users.find(function (account) {

            if (!account) return false;

            const emailMatch =
                account.email &&
                account.email.toLowerCase() === username.toLowerCase();

            const usernameMatch =
                account.username &&
                account.username.toLowerCase() === username.toLowerCase();

            const passwordMatch = account.password === password;

            const roleMatch = account.role === selectedRole;

            return (emailMatch || usernameMatch) && passwordMatch && roleMatch;
        });

        if (!user) {
            if (selectedRole === "admin") {
                showMessage("Invalid admin username or password.", "error");
            } else {
                showMessage("Invalid customer username/email or password.", "error");
            }
            return;
        }

        saveLoggedInUser(user);

        if (rememberMe && rememberMe.checked) {
            localStorage.setItem("sheernRememberedUser", username);
        } else {
            localStorage.removeItem("sheernRememberedUser");
        }

        if (user.role === "admin") {
            showMessage("Admin login successful! Redirecting...", "success");
        } else {
            showMessage("Customer login successful! Welcome to Sheern.", "success");
        }

        const requiredAction = localStorage.getItem("sheernLoginRequiredAction");

        setTimeout(function () {

            localStorage.removeItem("sheernLoginRequiredAction");

            if (requiredAction === "access checkout") {
                window.location.href = "Checkout.html";
                return;
            }

            window.location.href = "index.html";

        }, 1000);
    });
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

if (forgotPassword) {
    forgotPassword.addEventListener("click", function (event) {
        event.preventDefault();
        showMessage("Please contact Sheern support to reset your password.", "error");
    });
}


/* =========================================================
   SOCIAL LOGIN
========================================================= */

document.querySelectorAll(".social-login button").forEach(function (button) {
    button.addEventListener("click", function () {
        showMessage("Social login will be available soon.", "error");
    });
});


/* =========================================================
   ROLE SELECTION
========================================================= */

document.querySelectorAll('input[name="userRole"]').forEach(function (input) {
    input.addEventListener("change", function () {
        clearMessage();
        if (this.value === "admin") {
            showMessage("Admin login selected.", "success");
        }
    });
});


/* =========================================================
   LOGOUT
   Remember-me username is kept on purpose.
========================================================= */

function logoutUser() {

    localStorage.removeItem("sheernLoggedIn");
    localStorage.removeItem("sheernUserRole");
    localStorage.removeItem("sheernUsername");
    localStorage.removeItem("sheernUserName");
    localStorage.removeItem("sheernLoggedInUser");

    window.location.href = "index.html";
}


/* =========================================================
   PROTECTION HELPERS
========================================================= */

function protectCheckoutPage() {

    if (!isUserLoggedIn()) {

        alert("Please login to access checkout.");

        localStorage.setItem("sheernLoginRequiredAction", "access checkout");

        window.location.href = "Login.html";

        return false;
    }

    return true;
}

function protectWishlist() {
    return requireLogin("add products to your wishlist");
}

function protectPurchase() {
    return requireLogin("buy products");
}

function protectPayment() {
    return requireLogin("make a payment");
}

function protectPlaceOrder() {
    return requireLogin("place an order");
}


/* =========================================================
   ON PAGE LOAD (runs on every page that loads login.js)
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    updateAccountUI();

    const logoutBtn = document.getElementById("logoutButton");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", function (event) {
            event.preventDefault();
            logoutUser();
        });
    }

    if (isUserLoggedIn()) {
        console.log("Sheern user is logged in:", getAccountName());
    } else {
        console.log("No Sheern user is currently logged in.");
    }
});

console.log("Sheern login.js loaded successfully.");