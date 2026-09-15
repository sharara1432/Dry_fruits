
/* =========================================================
   SHEERN PREMIUM DRY FRUIT
   LOGIN SYSTEM
========================================================= */

"use strict";


/* ================= GET HTML ELEMENTS ================= */

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const passwordToggle = document.getElementById("passwordToggle");
const rememberMe = document.getElementById("rememberMe");
const forgotPassword = document.getElementById("forgotPassword");
const loginMessage = document.getElementById("loginMessage");


/* ================= ADMIN CREDENTIALS ================= */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";


/* ================= SHOW MESSAGE ================= */

function showMessage(message, type = "") {

    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.className = "login-message " + type;

}


/* ================= PASSWORD SHOW / HIDE ================= */

if (passwordToggle && passwordInput) {

    passwordToggle.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            passwordToggle.innerHTML =
                '<i class="bi bi-eye-slash"></i>';

            passwordToggle.setAttribute(
                "aria-label",
                "Hide password"
            );

        } else {

            passwordInput.type = "password";

            passwordToggle.innerHTML =
                '<i class="bi bi-eye"></i>';

            passwordToggle.setAttribute(
                "aria-label",
                "Show password"
            );

        }

    });

}


/* ================= REMEMBERED USER ================= */

const rememberedUser = localStorage.getItem(
    "sheernRememberedUser"
);

if (rememberedUser && usernameInput) {

    usernameInput.value = rememberedUser;

    if (rememberMe) {
        rememberMe.checked = true;
    }

}


/* ================= LOGIN FORM ================= */

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();


        const selectedRole = document.querySelector(
            'input[name="userRole"]:checked'
        );

        const role = selectedRole
            ? selectedRole.value
            : "customer";


        /* ================= EMPTY VALIDATION ================= */

        if (username === "" || password === "") {

            showMessage(
                "Please fill in all fields.",
                "error"
            );

            return;

        }


        /* ================= ADMIN LOGIN ================= */

        if (role === "admin") {

            if (
                username.toLowerCase() === ADMIN_USERNAME &&
                password === ADMIN_PASSWORD
            ) {

                localStorage.setItem(
                    "sheernLoggedIn",
                    "true"
                );

                localStorage.setItem(
                    "sheernUserRole",
                    "admin"
                );

                localStorage.setItem(
                    "sheernUsername",
                    username
                );

                showMessage(
                    "Admin login successful! Redirecting...",
                    "success"
                );

                setTimeout(function () {

                    window.location.href = "index.html";

                }, 1000);

            } else {

                showMessage(
                    "Invalid admin username or password.",
                    "error"
                );

            }

            return;

        }


        /* ================= CUSTOMER LOGIN ================= */

        let registeredUsers = [];

        try {

            registeredUsers = JSON.parse(
                localStorage.getItem("sheernUsers")
            ) || [];

        } catch (error) {

            registeredUsers = [];

        }


        const user = registeredUsers.find(function (account) {

            const emailMatch =
                account.email &&
                account.email.toLowerCase() === username.toLowerCase();

            const usernameMatch =
                account.username &&
                account.username.toLowerCase() === username.toLowerCase();

            return (
                (emailMatch || usernameMatch) &&
                account.password === password
            );

        });


        if (user) {

            localStorage.setItem(
                "sheernLoggedIn",
                "true"
            );

            localStorage.setItem(
                "sheernUserRole",
                "customer"
            );

            localStorage.setItem(
                "sheernUsername",
                user.username || user.email
            );


            /* Remember me */

            if (rememberMe && rememberMe.checked) {

                localStorage.setItem(
                    "sheernRememberedUser",
                    username
                );

            } else {

                localStorage.removeItem(
                    "sheernRememberedUser"
                );

            }


            showMessage(
                "Login successful! Welcome to Sheern.",
                "success"
            );


            setTimeout(function () {

                window.location.href = "index.html";

            }, 1000);

        } else {

            showMessage(
                "Invalid email/username or password.",
                "error"
            );

        }

    });

}


/* ================= FORGOT PASSWORD ================= */

if (forgotPassword) {

    forgotPassword.addEventListener("click", function (event) {

        event.preventDefault();

        showMessage(
            "Please contact Sheern support to reset your password.",
            "error"
        );

    });

}


/* ================= SOCIAL LOGIN ================= */

const socialButtons = document.querySelectorAll(
    ".social-login button"
);

socialButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        showMessage(
            "Social login will be available soon.",
            "error"
        );

    });

});


/* ================= ROLE CHANGE ================= */

const roleInputs = document.querySelectorAll(
    'input[name="userRole"]'
);

roleInputs.forEach(function (input) {

    input.addEventListener("change", function () {

        if (this.value === "admin") {

            showMessage(
                "Admin login selected.",
                "success"
            );

        } else {

            if (loginMessage) {
                loginMessage.textContent = "";
                loginMessage.className = "login-message";
            }

        }

    });

});


/* ================= DEBUG MESSAGE ================= */

console.log("Sheern login.js loaded successfully.");