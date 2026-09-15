/* =========================================================
   SHEERN PREMIUM DRY FRUIT
   REGISTRATION SYSTEM
========================================================= */

"use strict";


/* ================= GET ELEMENTS ================= */

const registerForm = document.getElementById("registerForm");

const fullNameInput = document.getElementById("fullName");

const usernameInput = document.getElementById("username");

const emailInput = document.getElementById("email");

const passwordInput = document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const passwordToggle =
    document.getElementById("passwordToggle");

const confirmPasswordToggle =
    document.getElementById("confirmPasswordToggle");

const termsCheckbox =
    document.getElementById("terms");

const registerMessage =
    document.getElementById("registerMessage");


/* =========================================================
   SHOW MESSAGE
========================================================= */

function showRegisterMessage(message, type) {

    if (!registerMessage) {
        return;
    }

    registerMessage.textContent = message;

    registerMessage.className =
        "register-message " + type;

}


/* =========================================================
   PASSWORD TOGGLE
========================================================= */

if (passwordToggle && passwordInput) {

    passwordToggle.addEventListener(
        "click",
        function () {

            if (passwordInput.type === "password") {

                passwordInput.type = "text";

                passwordToggle.innerHTML =
                    '<i class="bi bi-eye-slash"></i>';

            } else {

                passwordInput.type = "password";

                passwordToggle.innerHTML =
                    '<i class="bi bi-eye"></i>';

            }

        }
    );

}


/* =========================================================
   CONFIRM PASSWORD TOGGLE
========================================================= */

if (
    confirmPasswordToggle &&
    confirmPasswordInput
) {

    confirmPasswordToggle.addEventListener(
        "click",
        function () {

            if (
                confirmPasswordInput.type ===
                "password"
            ) {

                confirmPasswordInput.type = "text";

                confirmPasswordToggle.innerHTML =
                    '<i class="bi bi-eye-slash"></i>';

            } else {

                confirmPasswordInput.type =
                    "password";

                confirmPasswordToggle.innerHTML =
                    '<i class="bi bi-eye"></i>';

            }

        }
    );

}


/* =========================================================
   REGISTER FORM
========================================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            /* ================= GET VALUES ================= */

            const fullName =
                fullNameInput.value.trim();

            const username =
                usernameInput.value.trim();

            const email =
                emailInput.value.trim().toLowerCase();

            const password =
                passwordInput.value;

            const confirmPassword =
                confirmPasswordInput.value;


            /* ================= EMPTY CHECK ================= */

            if (
                fullName === "" ||
                username === "" ||
                email === "" ||
                password === "" ||
                confirmPassword === ""
            ) {

                showRegisterMessage(
                    "Please fill in all fields.",
                    "error"
                );

                return;

            }


            /* ================= USERNAME CHECK ================= */

            if (username.length < 3) {

                showRegisterMessage(
                    "Username must contain at least 3 characters.",
                    "error"
                );

                return;

            }


            /* ================= EMAIL CHECK ================= */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {

                showRegisterMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;

            }


            /* ================= PASSWORD CHECK ================= */

            if (password.length < 6) {

                showRegisterMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;

            }


            /* ================= CONFIRM PASSWORD ================= */

            if (password !== confirmPassword) {

                showRegisterMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;

            }


            /* ================= TERMS ================= */

            if (
                termsCheckbox &&
                !termsCheckbox.checked
            ) {

                showRegisterMessage(
                    "Please agree to the Terms & Conditions.",
                    "error"
                );

                return;

            }


            /* =================================================
               GET EXISTING USERS
            ================================================= */

            let users = [];

            try {

                users = JSON.parse(
                    localStorage.getItem("sheernUsers")
                ) || [];

            } catch (error) {

                users = [];

            }


            /* ================= DUPLICATE USERNAME ================= */

            const usernameExists =
                users.some(function (user) {

                    return (
                        user.username &&
                        user.username.toLowerCase() ===
                        username.toLowerCase()
                    );

                });


            if (usernameExists) {

                showRegisterMessage(
                    "This username is already registered.",
                    "error"
                );

                return;

            }


            /* ================= DUPLICATE EMAIL ================= */

            const emailExists =
                users.some(function (user) {

                    return (
                        user.email &&
                        user.email.toLowerCase() ===
                        email.toLowerCase()
                    );

                });


            if (emailExists) {

                showRegisterMessage(
                    "This email address is already registered.",
                    "error"
                );

                return;

            }


            /* =================================================
               CREATE NEW USER
            ================================================= */

            const newUser = {

                id: Date.now(),

                fullName: fullName,

                username: username,

                email: email,

                password: password,

                role: "customer",

                createdAt:
                    new Date().toISOString()

            };


            /* ================= SAVE USER ================= */

            users.push(newUser);

            localStorage.setItem(
                "sheernUsers",
                JSON.stringify(users)
            );


            /* ================= SUCCESS ================= */

            showRegisterMessage(
                "Account created successfully! Redirecting to login...",
                "success"
            );


            /* ================= CLEAR FORM ================= */

            registerForm.reset();


            /* ================= REDIRECT ================= */

            setTimeout(function () {

                window.location.href = "login.html";

            }, 1500);

        }
    );

}


/* =========================================================
   CONSOLE TEST
========================================================= */

console.log(
    "Sheern register.js loaded successfully."
);