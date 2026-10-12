"use strict";

(function () {

    var USERS_KEY = "sheernUsers";
    var SESSION_KEY = "sheernSession";
    var RETURN_KEY = "sheernReturnTo";

    var ROLE_NAME = { 0: "Admin", 1: "Manager", 2: "Customer" };
    var ROLE_TEXT = { 0: "admin", 1: "manager", 2: "customer" };

    /* old localStorage keys that some of your pages may still read */
    var LEGACY_KEYS = [
        "sheernLoggedIn",
        "sheernUserRole",
        "sheernUsername",
        "sheernUserName",
        "sheernLoggedInUser"
    ];

    /* What each role may DO (cart / wishlist / buy).
       Guests (not logged in) are always blocked and sent to login. */
    var PERMISSIONS = {
        0: { buy: true, cart: true, wishlist: true },
        1: { buy: true, cart: true, wishlist: true },
        2: { buy: true, cart: true, wishlist: true }
    };

    /* Which roles may OPEN a page (file name, lowercase).
       Pages not listed here are public: everyone can look at them.
       0 = Admin, 1 = Manager, 2 = Customer */
    var PAGE_ACCESS = {
        "admin.html":     [0],
        "users.html":     [0],
        "manager.html":   [0, 1],
        "orders.html":    [0, 1],
        "inventory.html": [0, 1],
        "checkout.html":  [0, 1, 2],

        /* admin + manager only */
        "dashboard.html": [0, 1],
        "invoices.html":  [0, 1],
        "settings.html":  [0, 1],

        /* every logged-in user (customers too) */
        "myorders.html":  [0, 1, 2],
        "account.html":   [0, 1, 2]
    };

    /* Buttons that need login (and permission).
       Easiest: add data-action="cart" | "wishlist" | "buy" to a button. */
    var ACTION_SELECTORS = {
        cart:     ".add-to-cart, .btn-cart, [data-action='cart']",
        wishlist: ".wishlist-btn, .btn-wishlist, .add-to-wishlist, [data-action='wishlist']",
        buy:      ".buy-now, .btn-buy, [data-action='buy']"
    };


    /* ---------- roles ---------- */

    /* accepts 2, "2", "customer", "Admin" ... and always returns 0 / 1 / 2 */
    function normalizeRole(role) {
        if (typeof role === "number") return role;

        var text = String(role === undefined || role === null ? "" : role)
            .trim().toLowerCase();

        if (text === "admin") return 0;
        if (text === "manager") return 1;
        if (text === "customer" || text === "") return 2;

        var n = Number(text);
        return isNaN(n) ? 2 : n;
    }


    /* ---------- users (localStorage) ---------- */

    function getUsers() {
        try {
            var list = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
            if (!Array.isArray(list)) return [];

            return list
                .filter(function (u) { return u && typeof u === "object"; })
                .map(function (u) {
                    u.role = normalizeRole(u.role);
                    return u;
                });
        } catch (e) { return []; }
    }

    function saveUsers(list) {
        localStorage.setItem(USERS_KEY, JSON.stringify(list));
    }

    /* Demo admin + manager so you can test straight away.
       CHANGE these passwords (or delete this block) before going live. */
    function seedDefaultUsers() {
        var users = getUsers();
        var changed = false;

        function has(username) {
            return users.some(function (u) { return u.username === username; });
        }

        if (!has("admin")) {
            users.push({ id: 1, fullName: "Sheern Admin", username: "admin",
                email: "admin@sheern.com", password: "admin123", role: 0,
                createdAt: new Date().toISOString() });
            changed = true;
        }
        if (!has("manager")) {
            users.push({ id: 2, fullName: "Sheern Manager", username: "manager",
                email: "manager@sheern.com", password: "manager123", role: 1,
                createdAt: new Date().toISOString() });
            changed = true;
        }
        if (changed) saveUsers(users);
    }


    /* ---------- session (sessionStorage) ---------- */

    function getSession() {
        try {
            var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
            return s && typeof s.role === "number" ? s : null;
        } catch (e) { return null; }
    }

    /* keeps the old localStorage keys in step, so older code still works */
    function writeLegacyKeys(session) {
        var roleText = ROLE_TEXT[session.role] || "customer";

        localStorage.setItem("sheernLoggedIn", "true");
        localStorage.setItem("sheernUserRole", roleText);
        localStorage.setItem("sheernUsername", session.username || session.email || "");
        localStorage.setItem("sheernUserName", session.fullName || session.username || "Sheern Customer");
        localStorage.setItem("sheernLoggedInUser", JSON.stringify({
            id: session.id,
            fullName: session.fullName,
            username: session.username,
            email: session.email,
            role: roleText,
            avatar: session.avatar || ""
        }));
    }

    function clearLegacyKeys() {
        LEGACY_KEYS.forEach(function (key) { localStorage.removeItem(key); });
    }

    function startSession(user) {
        /* never keep the password in the session */
        var session = {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: normalizeRole(user.role),
            avatar: user.avatar || "",
            loginAt: new Date().toISOString()
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        writeLegacyKeys(session);
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(RETURN_KEY);
        clearLegacyKeys();
        window.location.href = "index.html";
    }

    function isLoggedIn() { return getSession() !== null; }

    function can(action) {
        var s = getSession();
        if (!s) return false;
        return !!(PERMISSIONS[s.role] && PERMISSIONS[s.role][action]);
    }


    /* ---------- small toast message ---------- */

    function toast(message) {
        var old = document.getElementById("sheernToast");
        if (old) old.remove();

        var box = document.createElement("div");
        box.id = "sheernToast";
        box.textContent = message;
        box.style.cssText =
            "position:fixed;left:50%;bottom:30px;transform:translateX(-50%);" +
            "background:#1f3a1f;color:#fff;padding:12px 22px;border-radius:30px;" +
            "box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:99999;" +
            "font:500 14px Poppins,sans-serif;max-width:90vw;text-align:center;";
        document.body.appendChild(box);
        setTimeout(function () { box.remove(); }, 3200);
    }

    function goToLogin() {
        sessionStorage.setItem(RETURN_KEY, window.location.pathname.split("/").pop() || "index.html");
        window.location.href = "login.html";
    }


    /* ---------- action guard (cart / wishlist / buy) ---------- */

    function guard(action) {
        var s = getSession();

        /* not logged in -> must login first */
        if (!s) {
            alert("Please login to your Sheern account first.");
            goToLogin();
            return false;
        }

        /* logged in but this role is not allowed */
        if (!can(action)) {
            toast("Your account does not have permission to do this.");
            return false;
        }

        return true;
    }

    /* Capture phase: runs before any other click code, also for
       products that are rendered later by JavaScript. */
    document.addEventListener("click", function (event) {
        var actions = Object.keys(ACTION_SELECTORS);

        for (var i = 0; i < actions.length; i++) {
            if (event.target.closest(ACTION_SELECTORS[actions[i]])) {
                if (!guard(actions[i])) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return;
            }
        }
    }, true);


    /* ---------- sidebar / menu links that need a login ----------
       <a data-login-required>      any logged-in user
       <a data-login-required="0,1"> only admin and manager       */

    document.addEventListener("click", function (event) {
        var link = event.target.closest("[data-login-required]");
        if (!link) return;

        var s = getSession();

        /* guest -> login first */
        if (!s) {
            event.preventDefault();
            alert("Please login to your Sheern account to open this page.");
            goToLogin();
            return;
        }

        /* logged in, but the link is limited to some roles */
        var list = link.getAttribute("data-login-required");
        if (list) {
            var roles = list.split(",").map(function (r) { return Number(r.trim()); });
            if (roles.indexOf(s.role) === -1) {
                event.preventDefault();
                toast("This page is only for the admin and the manager.");
            }
        }
    });


    /* ---------- page access ---------- */

    function currentPage() {
        return (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    }

    function protectPage() {
        var allowed = PAGE_ACCESS[currentPage()];
        if (!allowed) return;                       /* public page */

        var s = getSession();

        if (!s) {
            alert("Please login to open this page.");
            goToLogin();
            return;
        }
        if (allowed.indexOf(s.role) === -1) {
            alert("You do not have permission to open this page.");
            window.location.replace("index.html");
        }
    }


    /* ---------- show / hide by role ----------
       <a href="Admin.html" data-roles="0">Admin</a>
       <a href="Orders.html" data-roles="0,1">Orders</a>
       <a href="Login.html" data-guest>Login</a>   (only for visitors) */

    function applyRoleVisibility() {
        var s = getSession();

        document.querySelectorAll("[data-roles]").forEach(function (el) {
            var roles = el.getAttribute("data-roles").split(",").map(function (r) {
                return Number(r.trim());
            });
            var show = s && roles.indexOf(s.role) !== -1;
            el.classList.toggle("d-none", !show);
        });

        document.querySelectorAll("[data-guest]").forEach(function (el) {
            el.classList.toggle("d-none", !!s);
        });
    }


    /* ---------- header avatar + dropdown ---------- */

    function updateAccountUI() {
        var s = getSession();
        if (!s) return;

        var fullName = s.fullName || s.username || "Customer";
        var firstName = String(fullName).split(" ")[0];

        var nameSpan = document.getElementById("accountButtonName");
        var dropdownName = document.getElementById("accountName");
        var roleLabel = document.getElementById("accountRole");

        if (nameSpan) nameSpan.textContent = firstName;
        if (dropdownName) dropdownName.textContent = fullName;
        if (roleLabel) roleLabel.textContent = ROLE_NAME[s.role] || "";

        /* replace the person icon with the avatar (only once) */
        var icon = document.querySelector("#headerLoginButton .bi-person-circle");

        if (icon) {
            var avatar;

            if (s.avatar) {
                avatar = document.createElement("img");
                avatar.src = s.avatar;
                avatar.alt = "";
                avatar.style.cssText = "width:28px;height:28px;border-radius:50%;object-fit:cover;";
            } else {
                avatar = document.createElement("span");
                avatar.textContent = String(fullName).charAt(0).toUpperCase();
                avatar.style.cssText =
                    "width:28px;height:28px;border-radius:50%;background:#1f3a1f;color:#fff;" +
                    "display:inline-flex;align-items:center;justify-content:center;font-weight:600;";
            }
            avatar.className = "sheern-avatar";
            icon.replaceWith(avatar);
        }

        var loginLink = document.getElementById("loginDropdownLink");
        var registerLink = document.getElementById("registerDropdownLink");
        var logoutBtn = document.getElementById("logoutButton");

        if (loginLink) loginLink.classList.add("d-none");
        if (registerLink) registerLink.classList.add("d-none");
        if (logoutBtn) logoutBtn.classList.remove("d-none");

        var sideAccount = document.querySelector('.sidebar-bottom a[href$="ogin.html"] span');
        if (sideAccount) sideAccount.textContent = firstName;
    }


    /* ---------- start ---------- */

    seedDefaultUsers();

    /* no session (for example a new browser tab) -> forget old login keys */
    if (!getSession()) clearLegacyKeys();

    document.addEventListener("DOMContentLoaded", function () {
        protectPage();
        updateAccountUI();
        applyRoleVisibility();

        var logoutBtn = document.getElementById("logoutButton");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                logout();
            });
        }
    });

    /* use from your own JS:  if (!Sheern.guard("cart")) return; */
    window.Sheern = {
        ROLE_NAME: ROLE_NAME,
        ROLE_TEXT: ROLE_TEXT,
        RETURN_KEY: RETURN_KEY,
        getUsers: getUsers,
        saveUsers: saveUsers,
        getSession: getSession,
        startSession: startSession,
        logout: logout,
        isLoggedIn: isLoggedIn,
        can: can,
        guard: guard,
        toast: toast,
        goToLogin: goToLogin,
        updateAccountUI: updateAccountUI
    };

})();"use strict";
/* =========================================================
   SHEERN  auth.js  -  load on EVERY page, BEFORE login.js and Dry.js
   Roles: 0 = Admin, 1 = Manager, 2 = Customer
   Accounts  -> localStorage  ("sheernUsers")
   Login     -> sessionStorage ("sheernSession")
   This file is the ONE place that knows who is logged in.
========================================================= */
(function () {

    var USERS_KEY = "sheernUsers";
    var SESSION_KEY = "sheernSession";
    var RETURN_KEY = "sheernReturnTo";

    var ROLE_NAME = { 0: "Admin", 1: "Manager", 2: "Customer" };
    var ROLE_TEXT = { 0: "admin", 1: "manager", 2: "customer" };

    /* old localStorage keys that some of your pages may still read */
    var LEGACY_KEYS = [
        "sheernLoggedIn",
        "sheernUserRole",
        "sheernUsername",
        "sheernUserName",
        "sheernLoggedInUser"
    ];

    /* What each role may DO (cart / wishlist / buy).
       Guests (not logged in) are always blocked and sent to login. */
    var PERMISSIONS = {
        0: { buy: true, cart: true, wishlist: true },
        1: { buy: true, cart: true, wishlist: true },
        2: { buy: true, cart: true, wishlist: true }
    };

    /* Which roles may OPEN a page (file name, lowercase).
       Pages not listed here are public: everyone can look at them.
       0 = Admin, 1 = Manager, 2 = Customer */
    var PAGE_ACCESS = {
        "admin.html":     [0],
        "users.html":     [0],
        "manager.html":   [0, 1],
        "orders.html":    [0, 1],
        "inventory.html": [0, 1],
        "checkout.html":  [0, 1, 2],

        /* admin + manager only */
        "dashboard.html": [0, 1],
        "invoices.html":  [0, 1],
        "settings.html":  [0, 1],

        /* every logged-in user (customers too) */
        "myorders.html":  [0, 1, 2],
        "account.html":   [0, 1, 2]
    };

    /* Buttons that need login (and permission).
       Easiest: add data-action="cart" | "wishlist" | "buy" to a button. */
    var ACTION_SELECTORS = {
        cart:     ".add-to-cart, .btn-cart, [data-action='cart']",
        wishlist: ".wishlist-btn, .btn-wishlist, .add-to-wishlist, [data-action='wishlist']",
        buy:      ".buy-now, .btn-buy, [data-action='buy']"
    };


    /* ---------- roles ---------- */

    /* accepts 2, "2", "customer", "Admin" ... and always returns 0 / 1 / 2 */
    function normalizeRole(role) {
        if (typeof role === "number") return role;

        var text = String(role === undefined || role === null ? "" : role)
            .trim().toLowerCase();

        if (text === "admin") return 0;
        if (text === "manager") return 1;
        if (text === "customer" || text === "") return 2;

        var n = Number(text);
        return isNaN(n) ? 2 : n;
    }


    /* ---------- users (localStorage) ---------- */

    function getUsers() {
        try {
            var list = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
            if (!Array.isArray(list)) return [];

            return list
                .filter(function (u) { return u && typeof u === "object"; })
                .map(function (u) {
                    u.role = normalizeRole(u.role);
                    return u;
                });
        } catch (e) { return []; }
    }

    function saveUsers(list) {
        localStorage.setItem(USERS_KEY, JSON.stringify(list));
    }

    /* Demo admin + manager so you can test straight away.
       CHANGE these passwords (or delete this block) before going live. */
    function seedDefaultUsers() {
        var users = getUsers();
        var changed = false;

        function has(username) {
            return users.some(function (u) { return u.username === username; });
        }

        if (!has("admin")) {
            users.push({ id: 1, fullName: "Sheern Admin", username: "admin",
                email: "admin@sheern.com", password: "admin123", role: 0,
                createdAt: new Date().toISOString() });
            changed = true;
        }
        if (!has("manager")) {
            users.push({ id: 2, fullName: "Sheern Manager", username: "manager",
                email: "manager@sheern.com", password: "manager123", role: 1,
                createdAt: new Date().toISOString() });
            changed = true;
        }
        if (changed) saveUsers(users);
    }


    /* ---------- session (sessionStorage) ---------- */

    function getSession() {
        try {
            var s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
            return s && typeof s.role === "number" ? s : null;
        } catch (e) { return null; }
    }

    /* keeps the old localStorage keys in step, so older code still works */
    function writeLegacyKeys(session) {
        var roleText = ROLE_TEXT[session.role] || "customer";

        localStorage.setItem("sheernLoggedIn", "true");
        localStorage.setItem("sheernUserRole", roleText);
        localStorage.setItem("sheernUsername", session.username || session.email || "");
        localStorage.setItem("sheernUserName", session.fullName || session.username || "Sheern Customer");
        localStorage.setItem("sheernLoggedInUser", JSON.stringify({
            id: session.id,
            fullName: session.fullName,
            username: session.username,
            email: session.email,
            role: roleText,
            avatar: session.avatar || ""
        }));
    }

    function clearLegacyKeys() {
        LEGACY_KEYS.forEach(function (key) { localStorage.removeItem(key); });
    }

    function startSession(user) {
        /* never keep the password in the session */
        var session = {
            id: user.id,
            fullName: user.fullName,
            username: user.username,
            email: user.email,
            role: normalizeRole(user.role),
            avatar: user.avatar || "",
            loginAt: new Date().toISOString()
        };

        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
        writeLegacyKeys(session);
    }

    function logout() {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(RETURN_KEY);
        clearLegacyKeys();
        window.location.href = "index.html";
    }

    function isLoggedIn() { return getSession() !== null; }

    function can(action) {
        var s = getSession();
        if (!s) return false;
        return !!(PERMISSIONS[s.role] && PERMISSIONS[s.role][action]);
    }


    /* ---------- small toast message ---------- */

    function toast(message) {
        var old = document.getElementById("sheernToast");
        if (old) old.remove();

        var box = document.createElement("div");
        box.id = "sheernToast";
        box.textContent = message;
        box.style.cssText =
            "position:fixed;left:50%;bottom:30px;transform:translateX(-50%);" +
            "background:#1f3a1f;color:#fff;padding:12px 22px;border-radius:30px;" +
            "box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:99999;" +
            "font:500 14px Poppins,sans-serif;max-width:90vw;text-align:center;";
        document.body.appendChild(box);
        setTimeout(function () { box.remove(); }, 3200);
    }

    function goToLogin() {
        sessionStorage.setItem(RETURN_KEY, window.location.pathname.split("/").pop() || "index.html");
        window.location.href = "login.html";
    }


    /* ---------- action guard (cart / wishlist / buy) ---------- */

    function guard(action) {
        var s = getSession();

        /* not logged in -> must login first */
        if (!s) {
            alert("Please login to your Sheern account first.");
            goToLogin();
            return false;
        }

        /* logged in but this role is not allowed */
        if (!can(action)) {
            toast("Your account does not have permission to do this.");
            return false;
        }

        return true;
    }

    /* Capture phase: runs before any other click code, also for
       products that are rendered later by JavaScript. */
    document.addEventListener("click", function (event) {
        var actions = Object.keys(ACTION_SELECTORS);

        for (var i = 0; i < actions.length; i++) {
            if (event.target.closest(ACTION_SELECTORS[actions[i]])) {
                if (!guard(actions[i])) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                return;
            }
        }
    }, true);


    /* ---------- sidebar / menu links that need a login ----------
       <a data-login-required>      any logged-in user
       <a data-login-required="0,1"> only admin and manager       */

    document.addEventListener("click", function (event) {
        var link = event.target.closest("[data-login-required]");
        if (!link) return;

        var s = getSession();

        /* guest -> login first */
        if (!s) {
            event.preventDefault();
            alert("Please login to your Sheern account to open this page.");
            goToLogin();
            return;
        }

        /* logged in, but the link is limited to some roles */
        var list = link.getAttribute("data-login-required");
        if (list) {
            var roles = list.split(",").map(function (r) { return Number(r.trim()); });
            if (roles.indexOf(s.role) === -1) {
                event.preventDefault();
                toast("This page is only for the admin and the manager.");
            }
        }
    });


    /* ---------- page access ---------- */

    function currentPage() {
        return (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
    }

    function protectPage() {
        var allowed = PAGE_ACCESS[currentPage()];
        if (!allowed) return;                       /* public page */

        var s = getSession();

        if (!s) {
            alert("Please login to open this page.");
            goToLogin();
            return;
        }
        if (allowed.indexOf(s.role) === -1) {
            alert("You do not have permission to open this page.");
            window.location.replace("index.html");
        }
    }


    /* ---------- show / hide by role ----------
       <a href="Admin.html" data-roles="0">Admin</a>
       <a href="Orders.html" data-roles="0,1">Orders</a>
       <a href="Login.html" data-guest>Login</a>   (only for visitors) */

    function applyRoleVisibility() {
        var s = getSession();

        document.querySelectorAll("[data-roles]").forEach(function (el) {
            var roles = el.getAttribute("data-roles").split(",").map(function (r) {
                return Number(r.trim());
            });
            var show = s && roles.indexOf(s.role) !== -1;
            el.classList.toggle("d-none", !show);
        });

        document.querySelectorAll("[data-guest]").forEach(function (el) {
            el.classList.toggle("d-none", !!s);
        });
    }


    /* ---------- header avatar + dropdown ---------- */

    function updateAccountUI() {
        var s = getSession();
        if (!s) return;

        var fullName = s.fullName || s.username || "Customer";
        var firstName = String(fullName).split(" ")[0];

        var nameSpan = document.getElementById("accountButtonName");
        var dropdownName = document.getElementById("accountName");
        var roleLabel = document.getElementById("accountRole");

        if (nameSpan) nameSpan.textContent = firstName;
        if (dropdownName) dropdownName.textContent = fullName;
        if (roleLabel) roleLabel.textContent = ROLE_NAME[s.role] || "";

        /* replace the person icon with the avatar (only once) */
        var icon = document.querySelector("#headerLoginButton .bi-person-circle");

        if (icon) {
            var avatar;

            if (s.avatar) {
                avatar = document.createElement("img");
                avatar.src = s.avatar;
                avatar.alt = "";
                avatar.style.cssText = "width:28px;height:28px;border-radius:50%;object-fit:cover;";
            } else {
                avatar = document.createElement("span");
                avatar.textContent = String(fullName).charAt(0).toUpperCase();
                avatar.style.cssText =
                    "width:28px;height:28px;border-radius:50%;background:#1f3a1f;color:#fff;" +
                    "display:inline-flex;align-items:center;justify-content:center;font-weight:600;";
            }
            avatar.className = "sheern-avatar";
            icon.replaceWith(avatar);
        }

        var loginLink = document.getElementById("loginDropdownLink");
        var registerLink = document.getElementById("registerDropdownLink");
        var logoutBtn = document.getElementById("logoutButton");

        if (loginLink) loginLink.classList.add("d-none");
        if (registerLink) registerLink.classList.add("d-none");
        if (logoutBtn) logoutBtn.classList.remove("d-none");

        var sideAccount = document.querySelector('.sidebar-bottom a[href$="ogin.html"] span');
        if (sideAccount) sideAccount.textContent = firstName;
    }


    /* ---------- start ---------- */

    seedDefaultUsers();

    /* no session (for example a new browser tab) -> forget old login keys */
    if (!getSession()) clearLegacyKeys();

    document.addEventListener("DOMContentLoaded", function () {
        protectPage();
        updateAccountUI();
        applyRoleVisibility();

        var logoutBtn = document.getElementById("logoutButton");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function (e) {
                e.preventDefault();
                logout();
            });
        }
    });

    /* use from your own JS:  if (!Sheern.guard("cart")) return; */
    window.Sheern = {
        ROLE_NAME: ROLE_NAME,
        ROLE_TEXT: ROLE_TEXT,
        RETURN_KEY: RETURN_KEY,
        getUsers: getUsers,
        saveUsers: saveUsers,
        getSession: getSession,
        startSession: startSession,
        logout: logout,
        isLoggedIn: isLoggedIn,
        can: can,
        guard: guard,
        toast: toast,
        goToLogin: goToLogin,
        updateAccountUI: updateAccountUI
    };

})();