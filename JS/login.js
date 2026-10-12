"use strict";
(function () {

    var PREFIX = "pbkdf2";
    var ITERATIONS = 150000;
    var SALT_BYTES = 16;
    var HASH_BITS = 256;

    var encoder = new TextEncoder();


    /* ---------- base64 helpers ---------- */

    function toBase64(bytes) {
        var binary = "";
        bytes = new Uint8Array(bytes);
        for (var i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    function fromBase64(text) {
        var binary = atob(text);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }


    /* ---------- core ---------- */

    function derive(password, salt, iterations) {

        return crypto.subtle
            .importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
            .then(function (key) {
                return crypto.subtle.deriveBits(
                    { name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
                    key,
                    HASH_BITS
                );
            });
    }

    function isHashed(stored) {
        return typeof stored === "string" && stored.indexOf(PREFIX + "$") === 0;
    }

    function hash(password) {

        var salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));

        return derive(String(password), salt, ITERATIONS).then(function (bits) {
            return [PREFIX, ITERATIONS, toBase64(salt), toBase64(bits)].join("$");
        });
    }

    /* compares without stopping at the first different character */
    function sameText(a, b) {

        if (a.length !== b.length) return false;

        var diff = 0;

        for (var i = 0; i < a.length; i++) {
            diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }

        return diff === 0;
    }

    function verify(password, stored) {

        /* old accounts that still have a plain-text password */
        if (!isHashed(stored)) {
            return Promise.resolve(
                typeof stored === "string" && sameText(String(password), stored)
            );
        }

        var parts = stored.split("$");

        if (parts.length !== 4) return Promise.resolve(false);

        var iterations = parseInt(parts[1], 10);

        if (!iterations) return Promise.resolve(false);

        return derive(String(password), fromBase64(parts[2]), iterations)
            .then(function (bits) {
                return sameText(toBase64(bits), parts[3]);
            })
            .catch(function () {
                return false;
            });
    }


    window.SheernPassword = {
        hash: hash,
        verify: verify,
        isHashed: isHashed
    };

})();

(function () {

    if (!window.Sheern) {
        console.error("login.js: auth.js must be loaded before login.js");
        return;
    }

    var loginForm = document.getElementById("loginForm");
    var usernameInput = document.getElementById("username");
    var passwordInput = document.getElementById("password");
    var passwordToggle = document.getElementById("passwordToggle");
    var rememberMe = document.getElementById("rememberMe");
    var loginMessage = document.getElementById("loginMessage");


    /* =====================================================
       LOGIN MESSAGES
    ===================================================== */

    function showMessage(message, type) {
        if (!loginMessage) return;
        loginMessage.textContent = message;
        loginMessage.className = "login-message " + (type || "");
    }

    function clearMessage() {
        if (!loginMessage) return;
        loginMessage.textContent = "";
        loginMessage.className = "login-message";
    }


    /* =====================================================
       PASSWORD SHOW / HIDE
    ===================================================== */

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


    /* =====================================================
       REMEMBERED USER (only the username is remembered)
    ===================================================== */

    var rememberedUser = localStorage.getItem("sheernRememberedUser");

    if (rememberedUser && usernameInput) {
        usernameInput.value = rememberedUser;
        if (rememberMe) rememberMe.checked = true;
    }


    /* =====================================================
       UPGRADE AN OLD PLAIN-TEXT PASSWORD TO A HASH
       Only runs after a correct login. It needs a save
       function in auth.js (Sheern.saveUsers).
    ===================================================== */

    function upgradePassword(account, password) {

        if (SheernPassword.isHashed(account.password)) {
            return Promise.resolve();
        }

        if (typeof Sheern.saveUsers !== "function") {
            console.warn(
                "login.js: Sheern.saveUsers was not found in auth.js, " +
                "so the old password could not be upgraded to a hash."
            );
            return Promise.resolve();
        }

        return SheernPassword.hash(password).then(function (hashed) {

            var users = Sheern.getUsers();

            var saved = users.find(function (item) {
                return (item.id !== undefined && item.id === account.id) ||
                    (item.username === account.username && item.email === account.email);
            });

            if (saved) {
                saved.password = hashed;
                Sheern.saveUsers(users);
            }
        });
    }


    /* =====================================================
       HASH EVERY PASSWORD THAT IS STILL PLAIN TEXT
       Runs once when the login page opens, so the demo admin /
       manager and the old customer accounts are protected too.
    ===================================================== */

    function hashAllStoredPasswords() {

        if (typeof Sheern.saveUsers !== "function") return;

        var users = Sheern.getUsers();

        var pending = users.filter(function (account) {
            return typeof account.password === "string" &&
                account.password !== "" &&
                !SheernPassword.isHashed(account.password);
        });

        if (pending.length === 0) return;

        Promise.all(pending.map(function (account) {
            return SheernPassword.hash(account.password).then(function (hashed) {
                account.password = hashed;
            });
        }))
            .then(function () {
                Sheern.saveUsers(users);
            })
            .catch(function (error) {
                console.error("login.js: could not hash the saved passwords:", error);
            });
    }

    hashAllStoredPasswords();


    /* =====================================================
       LOGIN FORM
       The role (0 admin / 1 manager / 2 customer) is stored in
       the account itself, so the form does not need a role choice.
    ===================================================== */

    if (loginForm) {

        loginForm.addEventListener("submit", function (event) {

            event.preventDefault();
            clearMessage();

            var username = usernameInput ? usernameInput.value.trim() : "";
            var password = passwordInput ? passwordInput.value : "";

            if (username === "" || password === "") {
                showMessage("Please fill in all fields.", "error");
                return;
            }

            var wanted = username.toLowerCase();

            /* find the account by username or email first */
            var account = Sheern.getUsers().find(function (item) {

                var emailMatch = item.email &&
                    String(item.email).toLowerCase() === wanted;

                var usernameMatch = item.username &&
                    String(item.username).toLowerCase() === wanted;

                return emailMatch || usernameMatch;
            });

            if (!account) {
                showMessage("Invalid username/email or password.", "error");
                return;
            }

            /* then compare the password with the saved hash */
            SheernPassword.verify(password, account.password)
                .then(function (isCorrect) {

                    if (!isCorrect) {
                        showMessage("Invalid username/email or password.", "error");
                        return;
                    }

                    return upgradePassword(account, password).then(function () {

                        /* the session never needs the password */
                        var safeUser = Object.assign({}, account);
                        delete safeUser.password;

                        /* one call: saves the session and the old login keys */
                        Sheern.startSession(safeUser);

                        if (rememberMe && rememberMe.checked) {
                            localStorage.setItem("sheernRememberedUser", username);
                        } else {
                            localStorage.removeItem("sheernRememberedUser");
                        }

                        showMessage("Login successful! Welcome to Sheern.", "success");

                        /* go back to the page the person came from, else the home page */
                        var returnTo = sessionStorage.getItem(Sheern.RETURN_KEY);

                        setTimeout(function () {
                            sessionStorage.removeItem(Sheern.RETURN_KEY);
                            window.location.href = returnTo || "index.html";
                        }, 1000);
                    });
                })
                .catch(function (error) {
                    console.error("Login error:", error);
                    showMessage("Something went wrong. Please try again.", "error");
                });
        });
    }


    /* =====================================================
       SOCIAL LOGIN
       (Forgot Password is now handled by the modal and
        JS/ForgotPassword.js, so there is no handler here.)
    ===================================================== */

    document.querySelectorAll(".social-login button").forEach(function (button) {
        button.addEventListener("click", function () {
            showMessage("Social login will be available soon.", "error");
        });
    });


    /* =====================================================
       HELPERS USED BY YOUR OTHER PAGES
       (same names as before, now backed by auth.js)
    ===================================================== */

    function isUserLoggedIn() {
        return Sheern.isLoggedIn();
    }

    function getLoggedInUser() {
        var s = Sheern.getSession();
        if (!s) return null;

        return Object.assign({}, s, { role: Sheern.ROLE_TEXT[s.role] || "customer" });
    }

    function getAccountName() {
        var s = Sheern.getSession();
        return s ? (s.fullName || s.username || "Login") : "Login";
    }

    function requireLogin(actionMessage) {

        if (!Sheern.isLoggedIn()) {
            alert("Please login to your Sheern account to " + (actionMessage || "continue") + ".");
            Sheern.goToLogin();      /* remembers this page, comes back after login */
            return false;
        }

        return true;
    }

    function logoutUser() {
        Sheern.logout();
    }

    function updateAccountUI() {
        Sheern.updateAccountUI();
    }

    function protectCheckoutPage() { return requireLogin("access checkout"); }
    function protectWishlist()     { return requireLogin("add products to your wishlist"); }
    function protectPurchase()     { return requireLogin("buy products"); }
    function protectPayment()      { return requireLogin("make a payment"); }
    function protectPlaceOrder()   { return requireLogin("place an order"); }

    /* make them available to every other script on the page */
    window.isUserLoggedIn = isUserLoggedIn;
    window.getLoggedInUser = getLoggedInUser;
    window.getAccountName = getAccountName;
    window.requireLogin = requireLogin;
    window.logoutUser = logoutUser;
    window.updateAccountUI = updateAccountUI;
    window.protectCheckoutPage = protectCheckoutPage;
    window.protectWishlist = protectWishlist;
    window.protectPurchase = protectPurchase;
    window.protectPayment = protectPayment;
    window.protectPlaceOrder = protectPlaceOrder;

    console.log("Sheern login.js loaded successfully.");

})();