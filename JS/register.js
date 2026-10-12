"use strict";
/* =========================================================
   SHEERN  register.js
   New accounts are saved in localStorage ("sheernUsers").
   Everyone who registers here is a Customer (role 2).
   Admin (0) and Manager (1) accounts are not created here.
========================================================= */
(function () {

    var USERS_KEY = "sheernUsers";

    var registerForm = document.getElementById("registerForm");
    var registerMessage = document.getElementById("registerMessage");


    /* ---------- messages ---------- */

    function showRegisterMessage(message, type) {
        if (!registerMessage) return;
        registerMessage.textContent = message;
        registerMessage.className = "register-message " + (type || "");
    }


    /* ---------- show / hide password buttons ---------- */

    function setupToggle(buttonId, inputId, label) {
        var btn = document.getElementById(buttonId);
        var input = document.getElementById(inputId);
        if (!btn || !input) return;

        btn.addEventListener("click", function () {
            var hidden = input.type === "password";
            input.type = hidden ? "text" : "password";
            btn.innerHTML = hidden
                ? '<i class="bi bi-eye-slash"></i>'
                : '<i class="bi bi-eye"></i>';
            btn.setAttribute("aria-label", (hidden ? "Hide " : "Show ") + label);
        });
    }

    setupToggle("passwordToggle", "password", "password");
    setupToggle("confirmPasswordToggle", "confirmPassword", "confirm password");


    /* ---------- users ---------- */

    function readUsers() {
        try {
            var list = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
            return Array.isArray(list)
                ? list.filter(function (u) { return u && typeof u === "object"; })
                : [];
        } catch (e) { return []; }
    }

    function valueOf(id) {
        var el = document.getElementById(id);
        return el ? el.value : "";
    }


    /* ---------- register form ---------- */

    if (registerForm) {

        registerForm.addEventListener("submit", function (event) {
            event.preventDefault();

            var fullName = valueOf("fullName").trim();
            var username = valueOf("username").trim();
            var email = valueOf("email").trim().toLowerCase();
            var password = valueOf("password");
            var confirmPassword = valueOf("confirmPassword");
            var terms = document.getElementById("terms");

            if (!fullName || !username || !email || !password || !confirmPassword) {
                return showRegisterMessage("Please fill in all fields.", "error");
            }
            if (fullName.length < 2) {
                return showRegisterMessage("Please enter your full name.", "error");
            }
            if (username.length < 3 || /\s/.test(username)) {
                return showRegisterMessage("Username needs at least 3 characters and no spaces.", "error");
            }
            if (username.indexOf("@") !== -1) {
                return showRegisterMessage("Username cannot contain the @ sign.", "error");
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return showRegisterMessage("Please enter a valid email address.", "error");
            }
            if (password.length < 6) {
                return showRegisterMessage("Password must contain at least 6 characters.", "error");
            }
            if (password !== confirmPassword) {
                return showRegisterMessage("Passwords do not match.", "error");
            }
            if (terms && !terms.checked) {
                return showRegisterMessage("Please agree to the Terms & Conditions.", "error");
            }

            var users = readUsers();

            var usernameTaken = users.some(function (u) {
                return u.username && String(u.username).toLowerCase() === username.toLowerCase();
            });
            if (usernameTaken) {
                return showRegisterMessage("This username is already registered.", "error");
            }

            var emailTaken = users.some(function (u) {
                return u.email && String(u.email).toLowerCase() === email;
            });
            if (emailTaken) {
                return showRegisterMessage("This email address is already registered.", "error");
            }

            users.push({
                id: Date.now(),
                fullName: fullName,
                username: username,
                email: email,
                password: password,
                role: 2,                       /* 0 admin, 1 manager, 2 customer */
                createdAt: new Date().toISOString()
            });

            localStorage.setItem(USERS_KEY, JSON.stringify(users));

            showRegisterMessage("Account created successfully! Redirecting to login...", "success");
            registerForm.reset();

            setTimeout(function () { window.location.href = "login.html"; }, 1500);
        });
    }

})();