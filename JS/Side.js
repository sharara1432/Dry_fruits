/* =========================================================
   SHEERN SIDEBAR: one file, used on every page
   - burger + sidebar visible only after login
   - open / close, overlay, Esc key, Shop submenu
========================================================= */
(function () {
    "use strict";

    if (window.__sheernSidebarReady) return;
    window.__sheernSidebarReady = true;

    var SESSION_KEY = "sheernSession";

    function isLoggedIn() {
        var value = null;
        try { value = sessionStorage.getItem(SESSION_KEY); } catch (e) {}
        if (!value) {
            try { value = localStorage.getItem(SESSION_KEY); } catch (e) {}
        }
        return !!value && value !== "null" && value !== "undefined" && value !== "{}";
    }

    function getParts() {
        return {
            toggle:  document.getElementById("SIDE_toggle"),
            panel:   document.getElementById("sideNavbar"),
            overlay: document.getElementById("sidebarOverlay")
        };
    }

    function closeSidebar() {
        var p = getParts();
        if (p.panel)   p.panel.classList.remove("open");
        if (p.overlay) p.overlay.classList.remove("show");
        if (p.toggle) {
            p.toggle.classList.remove("menu-open");
            p.toggle.setAttribute("aria-expanded", "false");
        }
    }

    function openSidebar() {
        var p = getParts();
        if (!p.panel) return;
        p.panel.classList.add("open");
        if (p.overlay) p.overlay.classList.add("show");
        if (p.toggle) {
            p.toggle.classList.add("menu-open");
            p.toggle.setAttribute("aria-expanded", "true");
        }
    }

    function applyAccess() {
        var loggedIn = isLoggedIn();
        if (document.body) {
            document.body.classList.toggle("is-logged-in", loggedIn);
        }
        if (!loggedIn) closeSidebar();
    }

    /* other scripts (login / logout code) can call this */
    window.updateSidebarAccess = applyAccess;

    /* ---------- burger click (capture phase) ----------
       stopImmediatePropagation stops any old handler left in
       Dry.js / About.js from toggling the sidebar a second time */
    document.addEventListener("click", function (event) {
        var burger = event.target.closest("#SIDE_toggle");
        if (!burger) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        var p = getParts();
        if (!isLoggedIn() || !p.panel) return;

        if (p.panel.classList.contains("open")) closeSidebar();
        else openSidebar();
    }, true);

    /* ---------- overlay click closes it ---------- */
    document.addEventListener("click", function (event) {
        if (event.target.closest("#sidebarOverlay")) {
            event.stopImmediatePropagation();
            closeSidebar();
        }
    }, true);

    /* ---------- Esc closes it ---------- */
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closeSidebar();
    });

    /* ---------- links inside the sidebar ---------- */
    document.addEventListener("click", function (event) {

        /* Shop button opens / closes its submenu */
        var shopBtn = event.target.closest("#shopSideBtn");
        if (shopBtn) {
            event.preventDefault();
            var shopSub = document.getElementById("shopSubmenu");
            if (shopSub) shopSub.classList.toggle("active");
            shopBtn.classList.toggle("active");
            return;
        }

        /* any other sidebar link closes the sidebar */
        if (event.target.closest(".sidebar-menu a, .sidebar-bottom a")) {
            closeSidebar();
        }
    });

    /* ---------- logout: re-check after auth.js clears the session ---------- */
    document.addEventListener("click", function (event) {
        if (event.target.closest("#logoutButton")) {
            setTimeout(applyAccess, 0);
            setTimeout(applyAccess, 300);
        }
    });

    /* ---------- keep state correct ---------- */
    window.addEventListener("pageshow", applyAccess);   // back / forward button
    window.addEventListener("storage", applyAccess);    // login/logout in another tab
    window.addEventListener("load", applyAccess);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", applyAccess);
    } else {
        applyAccess();
    }
})();