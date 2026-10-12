/* =========================================================
   SHEERN - MY ORDERS
   Roles: 0 = admin, 1 = manager, 2 = customer
   - customer: sees only his own orders, can cancel Pending
               orders and re-order.
   - manager : sees all orders, can change the order status.
   - admin   : sees all orders, can change the status and
               delete orders.

   Load AFTER auth.js and Dry.js:
   <script src="JS/auth.js"></script>
   <script src="JS/Dry.js"></script>
   <script src="JS/MyOrders.js"></script>
========================================================= */

(function () {
    "use strict";

    /* -----------------------------------------------------
       SETTINGS
    ----------------------------------------------------- */

    var ORDERS_KEYS = ["sheernOrders", "orders"];   // first one that holds an array is used
    var CART_KEY = "sheernCart";
    var USERS_KEY = "sheernUsers";
    var PAGE_SIZE = 5;

    var STATUS_FLOW = ["Pending", "Processing", "Shipped", "Delivered"];
    var ALL_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

    // known session key names (the page also scans every key if none match)
    var USER_KEYS = ["sheernUser", "sheernSession", "sheernCurrentUser", "loggedInUser", "currentUser", "user", "userData"];

    var ROLE_NAMES = { 0: "Admin", 1: "Manager", 2: "Customer" };


    /* -----------------------------------------------------
       STATE
    ----------------------------------------------------- */

    var user = null;
    var role = 2;
    var ordersKey = ORDERS_KEYS[0];
    var orders = [];
    var shown = PAGE_SIZE;
    var openDetails = {};


    /* -----------------------------------------------------
       ELEMENTS
    ----------------------------------------------------- */

    function $(id) { return document.getElementById(id); }

    var elStats = $("ordersStats");
    var elList = $("ordersList");
    var elEmpty = $("ordersEmpty");
    var elCount = $("ordersCount");
    var elSearch = $("ordersSearch");
    var elStatus = $("ordersStatusFilter");
    var elSort = $("ordersSort");
    var elMore = $("ordersMore");

    if (!elList) return;


    /* -----------------------------------------------------
       HELPERS
    ----------------------------------------------------- */

    function esc(value) {
        return String(value === null || value === undefined ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function money(n) {
        return "₹" + (Number(n) || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function formatDate(value) {
        var d = new Date(value);
        if (isNaN(d.getTime())) return "-";
        return d.toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        });
    }

    function readJSON(storage, key) {
        try {
            var raw = storage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }

    function toast(message) {
        var t = $("ordersToast");
        if (!t) return;
        t.textContent = message;
        t.classList.add("show");
        clearTimeout(toast._timer);
        toast._timer = setTimeout(function () {
            t.classList.remove("show");
        }, 2600);
    }

    function statusClass(status) {
        return "status-" + String(status || "Pending").toLowerCase();
    }


    /* -----------------------------------------------------
       USER + ROLE
    ----------------------------------------------------- */

    function looksLikeUser(obj) {
        return !!obj && typeof obj === "object" && !Array.isArray(obj) &&
            !!(obj.email || obj.username || obj.name || obj.fullName || obj.firstName);
    }

    // handles { email, ... } and also { user: { email, ... } }
    function unwrapUser(value) {
        if (looksLikeUser(value)) return value;

        if (value && typeof value === "object" && !Array.isArray(value)) {
            var keys = Object.keys(value);
            for (var i = 0; i < keys.length; i++) {
                if (looksLikeUser(value[keys[i]])) return value[keys[i]];
            }
        }
        return null;
    }

    function skipKey(key) {
        return key === USERS_KEY || key === CART_KEY || ORDERS_KEYS.indexOf(key) !== -1 ||
            key === "wishlist" || key === "sheernWishlist" || key === "sheernReviews";
    }

    function findInUsersList(raw) {
        var users = readJSON(localStorage, USERS_KEY);
        if (!Array.isArray(users) || !raw) return null;

        var text = String(raw).replace(/^"|"$/g, "").trim().toLowerCase();

        for (var i = 0; i < users.length; i++) {
            if (String(users[i].email || "").toLowerCase() === text ||
                String(users[i].id) === text) return users[i];
        }
        return null;
    }

    function getUser() {

        /* 1) ask auth.js, if it exposes a helper */

        var helpers = [window.SheernAuth, window.Auth, window.auth];

        for (var h = 0; h < helpers.length; h++) {
            var api = helpers[h];
            if (!api) continue;

            var names = ["getCurrentUser", "getUser", "currentUser", "getSession"];
            for (var n = 0; n < names.length; n++) {
                if (typeof api[names[n]] === "function") {
                    try {
                        var fromApi = unwrapUser(api[names[n]]());
                        if (fromApi) return fromApi;
                    } catch (e) { }
                }
            }
        }

        /* 2) known key names */

        for (var i = 0; i < USER_KEYS.length; i++) {
            var found = unwrapUser(readJSON(sessionStorage, USER_KEYS[i])) ||
                unwrapUser(readJSON(localStorage, USER_KEYS[i]));
            if (found) return found;
        }

        /* 3) scan every key in both storages */

        var stores = [sessionStorage, localStorage];

        for (var s = 0; s < stores.length; s++) {
            for (var k = 0; k < stores[s].length; k++) {
                var key = stores[s].key(k);
                if (skipKey(key)) continue;

                var candidate = unwrapUser(readJSON(stores[s], key));
                if (candidate) return candidate;
            }
        }

        /* 4) session only stores an email or id -> look it up in the users list */

        for (var x = 0; x < stores.length; x++) {
            for (var y = 0; y < stores[x].length; y++) {
                var storeKey = stores[x].key(y);
                if (skipKey(storeKey)) continue;

                var match = findInUsersList(stores[x].getItem(storeKey));
                if (match) return match;
            }
        }

        return null;
    }

    function getRole(u) {
        if (!u) return 2;
        var r = u.role !== undefined ? u.role : (u.roleId !== undefined ? u.roleId : u.userRole);

        if (r === 0 || r === 1 || r === 2) return r;
        if (/^[012]$/.test(String(r))) return Number(r);

        var text = String(r || "").toLowerCase();
        if (text === "admin") return 0;
        if (text === "manager") return 1;
        return 2;
    }

    function isStaff() { return role === 0 || role === 1; }

    function userName(u) {
        return u.name || u.fullName || u.username || u.firstName || u.email || "";
    }

    function sameText(a, b) {
        return !!a && !!b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
    }


    /* -----------------------------------------------------
       LOAD / SAVE ORDERS
    ----------------------------------------------------- */

    function normalizeOrder(o, index) {

        var items = o.items || o.cart || o.products || [];

        if (!Array.isArray(items)) items = [];

        items = items.map(function (item) {
            return {
                id: item.id,
                name: item.name || "Product",
                image: item.image || "Photos/MIX.jpg",
                price: Number(item.price) || 0,
                weight: item.weight || "",
                quantity: Number(item.quantity !== undefined ? item.quantity : item.qty) || 1
            };
        });

        var computed = items.reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);

        var status = String(o.status || "Pending");
        status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        if (ALL_STATUSES.indexOf(status) === -1) status = "Pending";

        /* some orders keep the customer details inside o.customer */

        var c = o.customer && typeof o.customer === "object" ? o.customer : {};

        return {
            id: o.id || o.orderId || o.orderNumber || ("SH-" + (1000 + index)),
            date: o.date || o.createdAt || o.orderDate || new Date().toISOString(),
            items: items,
            total: o.total !== undefined && o.total !== null && !isNaN(Number(o.total))
                ? Number(o.total) : computed,
            status: status,
            customerName: o.customerName || o.userName || c.name || o.name || "",
            customerEmail: o.customerEmail || o.userEmail || c.email || o.email || "",
            customerId: o.customerId !== undefined ? o.customerId : (o.userId !== undefined ? o.userId : ""),
            phone: o.phone || c.phone || "",
            address: o.address || o.shippingAddress ||
                [c.address, c.city, c.state, c.pincode].filter(Boolean).join(", "),
            payment: (typeof o.payment === "string" ? o.payment : "") ||
                (o.payment && o.payment.methodName) ||
                (o.paymentInfo && o.paymentInfo.methodName) ||
                o.paymentMethod || "",
            note: o.note || c.deliveryNote || ""
        };
    }

    function loadOrders() {

        var list = [];

        for (var i = 0; i < ORDERS_KEYS.length; i++) {
            var data = readJSON(localStorage, ORDERS_KEYS[i]);
            if (Array.isArray(data)) {
                ordersKey = ORDERS_KEYS[i];
                list = data;
                break;
            }
        }

        orders = list.map(normalizeOrder);
    }

    function saveOrders() {

        /*
           Save only the fields the page changes, so the extra
           details written by checkout.js are never lost.
        */

        try {

            var raw = readJSON(localStorage, ordersKey);
            if (!Array.isArray(raw)) raw = [];

            var kept = [];

            raw.forEach(function (original, index) {

                var rawId = original.id || original.orderId || original.orderNumber || ("SH-" + (1000 + index));

                var current = null;
                for (var i = 0; i < orders.length; i++) {
                    if (String(orders[i].id) === String(rawId)) { current = orders[i]; break; }
                }

                if (!current) return;           // deleted

                original.status = current.status;
                kept.push(original);
            });

            localStorage.setItem(ordersKey, JSON.stringify(kept));

        } catch (e) {
            console.error("Could not save orders:", e);
        }
    }

    function belongsToUser(order) {
        if (!user) return false;

        if (order.customerId !== "" && user.id !== undefined &&
            String(order.customerId) === String(user.id)) return true;

        if (sameText(order.customerEmail, user.email)) return true;

        if (!order.customerEmail && order.customerName &&
            sameText(order.customerName, userName(user))) return true;

        return false;
    }

    function visibleOrders() {
        return isStaff() ? orders.slice() : orders.filter(belongsToUser);
    }


    /* -----------------------------------------------------
       FILTER + SORT
    ----------------------------------------------------- */

    function filteredOrders() {

        var list = visibleOrders();

        var text = (elSearch.value || "").trim().toLowerCase();
        var status = elStatus.value;

        if (status !== "all") {
            list = list.filter(function (o) { return o.status === status; });
        }

        if (text) {
            list = list.filter(function (o) {
                var haystack = [o.id, o.customerName, o.customerEmail]
                    .concat(o.items.map(function (i) { return i.name; }))
                    .join(" ").toLowerCase();
                return haystack.indexOf(text) !== -1;
            });
        }

        var sort = elSort.value;

        list.sort(function (a, b) {
            if (sort === "oldest") return new Date(a.date) - new Date(b.date);
            if (sort === "high") return b.total - a.total;
            if (sort === "low") return a.total - b.total;
            return new Date(b.date) - new Date(a.date);
        });

        return list;
    }


    /* -----------------------------------------------------
       RENDER: STATS
    ----------------------------------------------------- */

    function renderStats() {

        var list = visibleOrders();

        var pending = list.filter(function (o) {
            return o.status === "Pending" || o.status === "Processing" || o.status === "Shipped";
        }).length;

        var delivered = list.filter(function (o) { return o.status === "Delivered"; }).length;

        var amount = list.reduce(function (sum, o) {
            return o.status === "Cancelled" ? sum : sum + o.total;
        }, 0);

        var cards = [
            { icon: "bi-bag-check", value: list.length, label: isStaff() ? "Total Orders" : "My Orders" },
            { icon: "bi-hourglass-split", value: pending, label: "In Progress" },
            { icon: "bi-check2-circle", value: delivered, label: "Delivered" },
            { icon: "bi-currency-rupee", value: money(amount), label: isStaff() ? "Revenue" : "Total Spent" }
        ];

        elStats.innerHTML = cards.map(function (c) {
            return '<div class="stat-card">' +
                '<div class="stat-icon"><i class="bi ' + c.icon + '"></i></div>' +
                '<div><div class="stat-value">' + esc(c.value) + '</div>' +
                '<div class="stat-label">' + esc(c.label) + '</div></div>' +
                '</div>';
        }).join("");
    }


    /* -----------------------------------------------------
       RENDER: ORDER CARD
    ----------------------------------------------------- */

    function trackerHTML(order) {

        if (order.status === "Cancelled") {
            return '<p class="cancelled-note"><i class="bi bi-x-circle"></i> This order was cancelled.</p>';
        }

        var current = STATUS_FLOW.indexOf(order.status);

        return '<div class="tracker">' + STATUS_FLOW.map(function (step, index) {
            var done = index <= current;
            return '<div class="track-step' + (done ? " done" : "") + '">' +
                '<div class="track-dot"><i class="bi bi-check-lg"></i></div>' +
                esc(step) + '</div>';
        }).join("") + '</div>';
    }

    function actionsHTML(order) {

        var html = "";
        var id = esc(order.id);

        html += '<button type="button" class="orders-ghost-btn" data-action="details" data-id="' + id + '">' +
            '<i class="bi bi-eye"></i> Details</button>';

        if (isStaff()) {

            html += '<select data-action="status" data-id="' + id + '" aria-label="Change status">' +
                ALL_STATUSES.map(function (s) {
                    return '<option value="' + s + '"' + (s === order.status ? " selected" : "") + '>' + s + '</option>';
                }).join("") + '</select>';

            if (role === 0) {
                html += '<button type="button" class="orders-danger-btn" data-action="delete" data-id="' + id + '">' +
                    '<i class="bi bi-trash"></i> Delete</button>';
            }

        } else if (order.status === "Pending") {

            html += '<button type="button" class="orders-danger-btn" data-action="cancel" data-id="' + id + '">' +
                '<i class="bi bi-x-circle"></i> Cancel Order</button>';
        }

        html += '<button type="button" class="orders-primary-btn" data-action="reorder" data-id="' + id + '">' +
            '<i class="bi bi-arrow-repeat"></i> Order Again</button>';

        return html;
    }

    function orderHTML(order) {

        var id = esc(order.id);
        var isOpen = !!openDetails[order.id];

        var itemsHTML = order.items.map(function (item) {
            return '<div class="order-item">' +
                '<img src="' + esc(item.image) + '" alt="' + esc(item.name) +
                '" onerror="this.onerror=null;this.src=\'Photos/MIX.jpg\'">' +
                '<div class="order-item-info"><h4>' + esc(item.name) + '</h4>' +
                '<p>' + money(item.price) + ' × ' + item.quantity +
                (item.weight ? ' · ' + esc(item.weight) : '') + '</p></div>' +
                '<div class="order-item-total">' + money(item.price * item.quantity) + '</div>' +
                '</div>';
        }).join("");

        /* staff also see the customer's name next to the email */

        var customerMeta = isStaff() && order.customerName
            ? '<div><span>Customer</span><strong>' + esc(order.customerName) + '</strong></div>'
            : "";

        /* order number is shown first inside the Details panel */

        var detailRows = '<div><span>Order Number</span><strong>#' + id + '</strong></div>';

        if (order.customerName) detailRows += '<div><span>Name</span><strong>' + esc(order.customerName) + '</strong></div>';
        if (order.phone) detailRows += '<div><span>Phone</span><strong>' + esc(order.phone) + '</strong></div>';
        if (order.payment) detailRows += '<div><span>Payment</span><strong>' + esc(order.payment) + '</strong></div>';
        if (order.address) detailRows += '<div><span>Delivery Address</span><strong>' + esc(order.address) + '</strong></div>';
        if (order.note) detailRows += '<div><span>Note</span><strong>' + esc(order.note) + '</strong></div>';

        return '<article class="order-card" data-order="' + id + '">' +

            '<div class="order-head">' +
            '<div class="order-meta">' +
            '<div><span>Email</span><strong>' + esc(order.customerEmail || "-") + '</strong></div>' +
            '<div><span>Placed on</span><strong>' + formatDate(order.date) + '</strong></div>' +
            '<div><span>Items</span><strong>' + order.items.reduce(function (s, i) { return s + i.quantity; }, 0) + '</strong></div>' +
            customerMeta +
            '</div>' +
            '<span class="order-status ' + statusClass(order.status) + '">' + esc(order.status) + '</span>' +
            '</div>' +

            '<div class="order-items">' + itemsHTML + '</div>' +

            '<div class="order-foot">' +
            '<div class="order-total">Order total<strong>' + money(order.total) + '</strong></div>' +
            '<div class="order-actions">' + actionsHTML(order) + '</div>' +
            '</div>' +

            '<div class="order-details"' + (isOpen ? "" : " hidden") + '>' +
            '<div class="order-detail-grid">' + detailRows + '</div>' +
            trackerHTML(order) +
            '</div>' +

            '</article>';
    }


    /* -----------------------------------------------------
       RENDER: PAGE
    ----------------------------------------------------- */

    function render() {

        renderStats();

        var list = filteredOrders();
        var total = visibleOrders().length;

        elList.innerHTML = list.slice(0, shown).map(orderHTML).join("");

        elEmpty.hidden = list.length > 0;
        elList.hidden = list.length === 0;

        if (list.length === 0) {

            var filtering = total > 0;

            $("ordersEmptyTitle").textContent = filtering ? "No orders match your search" : "No orders yet";

            $("ordersEmptyText").textContent = filtering
                ? "Try a different search or clear the status filter."
                : (isStaff()
                    ? "Customer orders will appear here once they are placed."
                    : "When you place an order, it will appear here.");

            $("ordersShopLink").hidden = filtering || isStaff();
        }

        elCount.textContent = list.length
            ? "Showing " + Math.min(shown, list.length) + " of " + list.length +
            " order" + (list.length === 1 ? "" : "s")
            : "";

        elMore.hidden = list.length <= shown;
    }


    /* -----------------------------------------------------
       ACTIONS
    ----------------------------------------------------- */

    function findOrder(id) {
        for (var i = 0; i < orders.length; i++) {
            if (String(orders[i].id) === String(id)) return orders[i];
        }
        return null;
    }

    function canManage(order) {
        return isStaff() || belongsToUser(order);
    }

    function cancelOrder(order) {
        if (!canManage(order) || order.status !== "Pending") return;

        if (!confirm("Cancel order #" + order.id + "?")) return;

        order.status = "Cancelled";
        saveOrders();
        render();
        toast("Order #" + order.id + " was cancelled.");
    }

    function changeStatus(order, status) {
        if (!isStaff()) return;
        if (ALL_STATUSES.indexOf(status) === -1) return;

        order.status = status;
        saveOrders();
        render();
        toast("Order #" + order.id + " is now " + status + ".");
    }

    function deleteOrder(order) {
        if (role !== 0) return;

        if (!confirm("Delete order #" + order.id + " permanently?")) return;

        orders = orders.filter(function (o) { return o !== order; });
        saveOrders();
        render();
        toast("Order deleted.");
    }

    function reorder(order) {

        if (!order.items.length) return;

        /* use the basket from Dry.js when it is on the page */

        if (typeof cart !== "undefined" &&
            typeof saveCart === "function" &&
            typeof updateCart === "function") {

            order.items.forEach(function (item) {
                var found = null;
                for (var i = 0; i < cart.length; i++) {
                    if (String(cart[i].id) === String(item.id)) { found = cart[i]; break; }
                }
                if (found) {
                    found.quantity = (Number(found.quantity) || 0) + item.quantity;
                } else {
                    cart.push({
                        id: item.id, name: item.name, image: item.image,
                        price: item.price, weight: item.weight, quantity: item.quantity
                    });
                }
            });

            saveCart();
            updateCart();

        } else {

            var saved = readJSON(localStorage, CART_KEY) || [];

            order.items.forEach(function (item) {
                var found = null;
                for (var i = 0; i < saved.length; i++) {
                    if (String(saved[i].id) === String(item.id)) { found = saved[i]; break; }
                }
                if (found) {
                    found.quantity = (Number(found.quantity) || 0) + item.quantity;
                } else {
                    saved.push({
                        id: item.id, name: item.name, image: item.image,
                        price: item.price, weight: item.weight, quantity: item.quantity
                    });
                }
            });

            localStorage.setItem(CART_KEY, JSON.stringify(saved));

            var count = $("headerCartCount");
            if (count) {
                count.textContent = saved.reduce(function (s, i) {
                    return s + (Number(i.quantity) || 0);
                }, 0);
            }
        }

        toast("Items from order #" + order.id + " added to your basket.");

        var canvas = $("cartCanvas");
        if (canvas && window.bootstrap && bootstrap.Offcanvas) {
            bootstrap.Offcanvas.getOrCreateInstance(canvas).show();
        }
    }


    /* -----------------------------------------------------
       EVENTS
    ----------------------------------------------------- */

    function setupEvents() {

        elList.addEventListener("click", function (event) {

            var button = event.target.closest("button[data-action]");
            if (!button) return;

            var order = findOrder(button.dataset.id);
            if (!order) return;

            var action = button.dataset.action;

            if (action === "details") {
                openDetails[order.id] = !openDetails[order.id];
                var card = button.closest(".order-card");
                var panel = card && card.querySelector(".order-details");
                if (panel) panel.hidden = !openDetails[order.id];
            }

            else if (action === "cancel") cancelOrder(order);
            else if (action === "delete") deleteOrder(order);
            else if (action === "reorder") reorder(order);
        });

        elList.addEventListener("change", function (event) {

            var select = event.target.closest("select[data-action='status']");
            if (!select) return;

            var order = findOrder(select.dataset.id);
            if (order) changeStatus(order, select.value);
        });

        var searchTimer;

        elSearch.addEventListener("input", function () {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function () { shown = PAGE_SIZE; render(); }, 180);
        });

        elStatus.addEventListener("change", function () { shown = PAGE_SIZE; render(); });
        elSort.addEventListener("change", function () { shown = PAGE_SIZE; render(); });

        elMore.addEventListener("click", function () {
            shown += PAGE_SIZE;
            render();
        });

        /* keep the page in sync if another tab changes the orders */

        window.addEventListener("storage", function (event) {
            if (ORDERS_KEYS.indexOf(event.key) !== -1) {
                loadOrders();
                render();
            }
        });
    }


    /* -----------------------------------------------------
       START
    ----------------------------------------------------- */

    function init() {

        user = getUser();

        /* login is required */

        if (!user) {
            console.warn("MyOrders: no logged-in user found.",
                "sessionStorage keys:", Object.keys(sessionStorage),
                "localStorage keys:", Object.keys(localStorage));

            window.location.href = "Login.html";
            return;
        }

        role = getRole(user);

        var roleLabel = $("ordersRoleLabel");
        var subtitle = $("ordersSubtitle");

        if (roleLabel) {
            roleLabel.textContent = isStaff()
                ? (ROLE_NAMES[role] || "").toUpperCase() + " · ORDERS"
                : "MY ACCOUNT";
        }

        if (subtitle) {
            subtitle.textContent = isStaff()
                ? "View every customer order and update its status."
                : "Track your orders and see what you have bought from Sheern.";
        }

        loadOrders();
        setupEvents();
        render();
    }

    /*
       Helper for other pages:
       SheernOrders.add({ items: [...], total: 123 })
       creates a Pending order for the logged-in user.
    */

    window.SheernOrders = {

        add: function (data) {

            var u = getUser() || {};
            var list = [];

            for (var i = 0; i < ORDERS_KEYS.length; i++) {
                var found = readJSON(localStorage, ORDERS_KEYS[i]);
                if (Array.isArray(found)) { ordersKey = ORDERS_KEYS[i]; list = found; break; }
            }

            var order = Object.assign({
                id: "SH-" + Date.now().toString().slice(-8),
                date: new Date().toISOString(),
                status: "Pending",
                customerId: u.id !== undefined ? u.id : "",
                customerName: userName(u),
                customerEmail: u.email || ""
            }, data || {});

            list.push(order);

            localStorage.setItem(ordersKey, JSON.stringify(list));

            return order;
        }
    };

    init();

})();