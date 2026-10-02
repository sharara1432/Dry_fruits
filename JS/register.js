"use strict";
const registerForm =
    document.getElementById("registerForm");

const fullNameInput =
    document.getElementById("fullName");

const usernameInput =
    document.getElementById("username");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

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
   SHOW REGISTER MESSAGE
========================================================= */

function showRegisterMessage(message, type = "") {

    if (!registerMessage) {
        return;
    }

    registerMessage.textContent =
        message;

    registerMessage.className =
        "register-message " + type;
}


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

if (passwordToggle && passwordInput) {

    passwordToggle.addEventListener(
        "click",
        function () {

            if (passwordInput.type === "password") {

                passwordInput.type =
                    "text";

                passwordToggle.innerHTML =
                    '<i class="bi bi-eye-slash"></i>';

                passwordToggle.setAttribute(
                    "aria-label",
                    "Hide password"
                );

            }

            else {

                passwordInput.type =
                    "password";

                passwordToggle.innerHTML =
                    '<i class="bi bi-eye"></i>';

                passwordToggle.setAttribute(
                    "aria-label",
                    "Show password"
                );

            }

        }
    );

}


/* =========================================================
   CONFIRM PASSWORD SHOW / HIDE
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

                confirmPasswordInput.type =
                    "text";

                confirmPasswordToggle.innerHTML =
                    '<i class="bi bi-eye-slash"></i>';

                confirmPasswordToggle.setAttribute(
                    "aria-label",
                    "Hide confirm password"
                );

            }

            else {

                confirmPasswordInput.type =
                    "password";

                confirmPasswordToggle.innerHTML =
                    '<i class="bi bi-eye"></i>';

                confirmPasswordToggle.setAttribute(
                    "aria-label",
                    "Show confirm password"
                );

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


            /* =================================================
               GET VALUES
            ================================================= */

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


            /* =================================================
               EMPTY CHECK
            ================================================= */

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


            /* =================================================
               FULL NAME CHECK
            ================================================= */

            if (fullName.length < 2) {

                showRegisterMessage(
                    "Please enter your full name.",
                    "error"
                );

                return;
            }


            /* =================================================
               USERNAME CHECK
            ================================================= */

            if (username.length < 3) {

                showRegisterMessage(
                    "Username must contain at least 3 characters.",
                    "error"
                );

                return;
            }


            /* =================================================
               EMAIL FORMAT CHECK
            ================================================= */

            const emailPattern =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailPattern.test(email)) {

                showRegisterMessage(
                    "Please enter a valid email address.",
                    "error"
                );

                return;
            }


            /* =================================================
               PASSWORD CHECK
            ================================================= */

            if (password.length < 6) {

                showRegisterMessage(
                    "Password must contain at least 6 characters.",
                    "error"
                );

                return;
            }


            /* =================================================
               CONFIRM PASSWORD CHECK
            ================================================= */

            if (
                password !==
                confirmPassword
            ) {

                showRegisterMessage(
                    "Passwords do not match.",
                    "error"
                );

                return;
            }


            /* =================================================
               TERMS & CONDITIONS
            ================================================= */

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

            let users = [];


            try {

                const storedUsers =
                    localStorage.getItem(
                        "sheernUsers"
                    );


                if (storedUsers) {

                    users =
                        JSON.parse(storedUsers);

                }


                if (!Array.isArray(users)) {

                    users = [];

                }

            }

            catch (error) {

                console.error(
                    "Error reading Sheern users:",
                    error
                );

                users = [];

            }


            /* =================================================
               CHECK USERNAME
            ================================================= */

            const usernameExists =
                users.some(
                    function (user) {

                        return (
                            user.username &&
                            user.username
                                .toLowerCase() ===
                            username.toLowerCase()
                        );

                    }
                );


            if (usernameExists) {

                showRegisterMessage(
                    "This username is already registered.",
                    "error"
                );

                return;
            }


            /* =================================================
               CHECK EMAIL
            ================================================= */

            const emailExists =
                users.some(
                    function (user) {

                        return (
                            user.email &&
                            user.email
                                .toLowerCase() ===
                            email.toLowerCase()
                        );

                    }
                );


            if (emailExists) {

                showRegisterMessage(
                    "This email address is already registered.",
                    "error"
                );

                return;
            }


            /* =================================================
               CREATE NEW CUSTOMER
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


            /* =================================================
               ADD NEW USER
            ================================================= */

            users.push(newUser);


            /* =================================================
               SAVE USERS TO LOCAL STORAGE
            ================================================= */

            localStorage.setItem(
                "sheernUsers",
                JSON.stringify(users)
            );


            /* =================================================
               CHECK THAT USER WAS SAVED
            ================================================= */

            console.log(
                "New Sheern user registered:",
                newUser
            );


            console.log(
                "All Sheern users:",
                users
            );


            /* =================================================
               SUCCESS MESSAGE
            ================================================= */

            showRegisterMessage(
                "Account created successfully! Redirecting to login...",
                "success"
            );


            /* =================================================
               RESET FORM
            ================================================= */

            registerForm.reset();


            /* =================================================
               REDIRECT TO LOGIN
            ================================================= */

            setTimeout(
                function () {

                    window.location.href =
                        "Login.html";

                },
                1500
            );

        }
    );

}


/* =========================================================
   REGISTER.JS LOADED
========================================================= */

console.log(
    "Sheern register.js loaded successfully."
);

