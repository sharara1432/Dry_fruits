"use strict";
(function () {

    var CART_KEY = "sheernCart";
    var OLD_CART_KEY = "cart";
    var WISHLIST_KEY = "wishlist";
    var CHECKOUT_PAGE = "CheckOut.html";
    var LOGIN_PAGE = "login.html";

    var root = document.getElementById("productDetail");
    var relatedBox = document.getElementById("relatedProducts");
    var relatedSection = document.getElementById("relatedSection");

    var product = null;
    var options = [];
    var selected = 0;
    var qty = 1;

    /* ---------- helpers ---------- */

    function esc(value) {
        var d = document.createElement("div");
        d.textContent = value == null ? "" : String(value);
        return d.innerHTML;
    }

    function money(n) {
        return (Number(n) || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2, maximumFractionDigits: 2
        });
    }

    function toast(message) {
        if (window.Sheern && typeof Sheern.toast === "function") {
            Sheern.toast(message);
            return;
        }
        var t = document.getElementById("pdToast");
        if (!t) {
            t = document.createElement("div");
            t.id = "pdToast";
            document.body.appendChild(t);
        }
        t.textContent = message;
        t.classList.add("show");
        setTimeout(function () { t.classList.remove("show"); }, 2200);
    }

    /* "250g" / "1 kg" -> grams, or 0 if it cannot be read */
    function toGrams(text) {
        var m = String(text || "").toLowerCase().replace(/\s/g, "").match(/^([\d.]+)(kg|g)$/);
        if (!m) return 0;
        return Math.round(parseFloat(m[1]) * (m[2] === "kg" ? 1000 : 1));
    }

    function label(grams) {
        return grams >= 1000 && grams % 1000 === 0 ? (grams / 1000) + "kg" : grams + "g";
    }

    function readList(key) {
        try {
            var data = JSON.parse(localStorage.getItem(key));
            return Array.isArray(data) ? data : [];
        } catch (e) { return []; }
    }

    /* ---------- login ---------- */

    function isLoggedIn() {

        if (window.Sheern && typeof Sheern.getSession === "function") {
            return !!Sheern.getSession();
        }

        var keys = ["sheernSession", "loggedInUser", "currentUser", "sheernUser"];

        for (var i = 0; i < keys.length; i++) {
            var raw = sessionStorage.getItem(keys[i]) || localStorage.getItem(keys[i]);
            if (raw) return true;
        }

        return localStorage.getItem("sheernLoggedIn") === "true";
    }

    function requireLoginFirst(message) {

        if (isLoggedIn()) return true;

        alert(message);

        if (window.Sheern && typeof Sheern.goToLogin === "function") {
            Sheern.goToLogin();
        } else {
            window.location.href = LOGIN_PAGE;
        }

        return false;
    }

    /* ---------- weight options ---------- */

    function buildOptions(p) {

        var base = Number(p.price) || 0;

        if (Array.isArray(p.weights) && p.weights.length) {
            return p.weights.map(function (w) {
                return { label: String(w.label), price: Number(w.price) || base, grams: toGrams(w.label) };
            });
        }

        var baseGrams = toGrams(p.weight);

        if (!baseGrams) {
            return [{ label: p.weight ? String(p.weight) : "", price: base }];
        }

        return [250, 500, 1000].map(function (g) {
            return { label: label(g), price: Math.round(base * g / baseGrams * 100) / 100, grams: g };
        });
    }

    /* ---------- cart ---------- */

    function addToBasket() {

        var option = options[selected];
        var lineId = option.label ? product.id + "-" + option.label : String(product.id);
        var lineName = option.label ? product.name + " (" + option.label + ")" : product.name;

        var items = readList(CART_KEY);

        var found = items.find(function (i) { return String(i.id) === String(lineId); });

        if (found) {
            found.quantity = (Number(found.quantity != null ? found.quantity : found.qty) || 0) + qty;
            delete found.qty;
        } else {
            items.push({
                id: lineId,
                name: lineName,
                image: product.image,
                price: option.price,
                quantity: qty
            });
        }

        var data = JSON.stringify(items);

        localStorage.setItem(CART_KEY, data);
        localStorage.setItem(OLD_CART_KEY, data);

        /* let the shared header script redraw the basket, if it is on this page */
        try {
            if (typeof cart !== "undefined") {
                cart.length = 0;
                items.forEach(function (i) { cart.push(i); });
            }
            if (typeof updateCart === "function") updateCart();
        } catch (e) { /* header script not loaded: the saved basket is still correct */ }

        refreshBasketBadge(items);
    }

    function refreshBasketBadge(items) {
        var badge = document.getElementById("headerCartCount");
        if (!badge) return;
        badge.textContent = items.reduce(function (t, i) {
            return t + (Number(i.quantity != null ? i.quantity : i.qty) || 0);
        }, 0);
    }

    /* ---------- wishlist ---------- */

    function inWishlist() {
        return readList(WISHLIST_KEY).some(function (i) {
            return String(i.id) === String(product.id);
        });
    }

    function toggleWishlist() {

        var list = readList(WISHLIST_KEY);

        var index = list.findIndex(function (i) {
            return String(i.id) === String(product.id);
        });

        if (index === -1) {
            list.push(product);
            toast("Added to your wishlist");
        } else {
            list.splice(index, 1);
            toast("Removed from your wishlist");
        }

        localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));

        ["headerWishlistCount", "sidebarWishlistCount"].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.textContent = list.length;
        });

        paintHeart();
    }

    function paintHeart() {

        var btn = document.getElementById("pdWish");
        if (!btn) return;

        var on = inWishlist();

        btn.classList.toggle("active", on);
        btn.setAttribute("aria-label", on ? "Remove from wishlist" : "Add to wishlist");
        btn.innerHTML = '<i class="bi ' + (on ? "bi-heart-fill" : "bi-heart") + '"></i>';
    }

    /* ---------- render ---------- */

    function section(title, html) {
        return html ? "<h3>" + esc(title) + "</h3>" + html : "";
    }

    function listHtml(items) {
        if (!Array.isArray(items) || !items.length) return "";
        return "<ul>" + items.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
    }

    function paramsHtml(params) {
        if (!params || typeof params !== "object") return "";
        var keys = Object.keys(params);
        if (!keys.length) return "";
        return "<ul>" + keys.map(function (k) {
            return "<li>" + esc(k) + " : " + esc(params[k]) + "</li>";
        }).join("") + "</ul>";
    }

    function render() {

        var p = product;
        var name = esc(p.name);
        var topic = p.shortName || p.name;

        var weightsHtml = options.length > 1 || (options[0] && options[0].label)
            ? '<span class="pd-label">Weight</span><div class="pd-weights">' +
            options.map(function (o, i) {
                return '<button type="button" class="pd-weight' + (i === selected ? " active" : "") +
                    '" data-index="' + i + '">' + esc(o.label) + "</button>";
            }).join("") + "</div>"
            : "";

        root.innerHTML =
            '<div class="pd-layout">' +

            '<div class="pd-gallery">' +
            '<button type="button" class="pd-wish" id="pdWish"></button>' +
            '<img src="' + esc(p.image || "Photos/MIX.jpg") + '" alt="' + name + '"' +
            " onerror=\"this.onerror=null;this.src='Photos/MIX.jpg'\">" +
            '<span class="pc-quality">Premium Quality</span>' +
            "</div>" +

            '<div class="pd-info">' +
            '<span class="pd-brand">Sheern</span>' +
            '<h1 class="pd-title">' + name + "</h1>" +
            '<div class="pd-price" id="pdPrice"></div>' +
            '<div class="pd-tax">Taxes included.</div>' +

            weightsHtml +

            '<span class="pd-label">Quantity</span>' +
            '<div class="pd-qty">' +
            '<button type="button" id="pdMinus" aria-label="Decrease quantity">&minus;</button>' +
            '<input type="number" id="pdQty" value="1" min="1" max="99" aria-label="Quantity">' +
            '<button type="button" id="pdPlus" aria-label="Increase quantity">+</button>' +
            "</div>" +

            '<div class="pd-buttons">' +
            '<button type="button" class="pd-add" id="pdAdd">Add to cart</button>' +
            '<button type="button" class="pd-buy" id="pdBuy">Buy it now</button>' +
            "</div>" +

            (p.description ? '<p class="pd-desc">' + esc(p.description) + "</p>" : "") +
            section("Dryfruit Parameter", paramsHtml(p.parameters)) +
            section("Benefits of " + topic, listHtml(p.benefits)) +
            section("Fun fact about " + topic, listHtml(p.funFacts)) +
            section("Use of " + topic, listHtml(p.uses)) +

            '<button type="button" class="pd-share" id="pdShare">' +
            '<i class="bi bi-share"></i> Share</button>' +

            "</div></div>";

        showPrice();
        paintHeart();
        bind();
    }

    function showPrice() {
        var el = document.getElementById("pdPrice");
        if (el) el.textContent = "₹" + money(options[selected].price);
    }

    function bind() {

        var input = document.getElementById("pdQty");

        function setQty(n) {
            qty = Math.min(99, Math.max(1, parseInt(n, 10) || 1));
            input.value = qty;
        }

        document.getElementById("pdMinus").addEventListener("click", function () { setQty(qty - 1); });
        document.getElementById("pdPlus").addEventListener("click", function () { setQty(qty + 1); });
        input.addEventListener("change", function () { setQty(input.value); });

        root.querySelectorAll(".pd-weight").forEach(function (b) {
            b.addEventListener("click", function () {
                selected = Number(b.dataset.index);
                root.querySelectorAll(".pd-weight").forEach(function (x) {
                    x.classList.toggle("active", x === b);
                });
                showPrice();
            });
        });

        document.getElementById("pdAdd").addEventListener("click", function () {
            if (!requireLoginFirst("Please login to add items to your cart.")) return;
            addToBasket();
            toast("Added to your basket");
        });

        document.getElementById("pdBuy").addEventListener("click", function () {
            if (!requireLoginFirst("Please login to your Sheern account to checkout.")) return;
            addToBasket();
            window.location.href = CHECKOUT_PAGE;
        });

        document.getElementById("pdShare").addEventListener("click", function () {

            var url = window.location.href;

            if (navigator.share) {
                navigator.share({ title: product.name, url: url }).catch(function () { });
                return;
            }

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(
                    function () { toast("Link copied"); },
                    function () { window.prompt("Copy this link", url); }
                );
                return;
            }

            window.prompt("Copy this link", url);
        });

        document.getElementById("pdWish").addEventListener("click", function () {
            if (!requireLoginFirst("Please login to use your wishlist.")) return;
            toggleWishlist();
        });
    }

    /* ---------- you may also like ---------- */

    function renderRelated(all) {

        var others = all.filter(function (p) {
            return String(p.id) !== String(product.id);
        });

        var same = others.filter(function (p) {
            return p.category && p.category === product.category;
        });

        var rest = others.filter(function (p) {
            return same.indexOf(p) === -1;
        });

        var list = same.concat(rest).slice(0, 4);

        if (!list.length || !relatedBox) return;

        relatedBox.innerHTML = list.map(function (p) {

            var url = "ProductDetail.html?id=" + encodeURIComponent(p.id);

            return '<article class="product-card">' +
                '<a class="pc-link" href="' + url + '">' +
                '<div class="pc-image">' +
                '<img src="' + esc(p.image || "Photos/MIX.jpg") + '" alt="' + esc(p.name) + '" loading="lazy"' +
                " onerror=\"this.onerror=null;this.src='Photos/MIX.jpg'\">" +
                '<span class="pc-quality">Premium Quality</span>' +
                "</div>" +
                '<div class="pc-body">' +
                '<h3 class="pc-name">' + esc(p.name) + "</h3>" +
                '<span class="pc-brand">Sheern</span>' +
                '<div class="pc-price">₹' + money(p.price) + "</div>" +
                "</div></a>" +
                '<a class="pc-button" href="' + url + '">Choose options</a>' +
                "</article>";

        }).join("");

        if (relatedSection) relatedSection.hidden = false;
    }

    function notFound(message) {
        root.innerHTML = '<div class="pd-notfound"><h2>' + esc(message) + '</h2>' +
            '<p><a href="AllProduct.html">Back to all products</a></p></div>';
    }

    /* ---------- extra details (DATA/product-details.json) ---------- */

    /* a details entry matches by "id", or by a keyword found in the product name */
    function mergeDetails(p, details) {

        var name = String(p.name || "").toLowerCase();

        var hit = details.find(function (d) {
            if (d.id != null && String(d.id) === String(p.id)) return true;
            return (d.match || []).some(function (k) {
                return name.indexOf(String(k).toLowerCase()) > -1;
            });
        });

        if (!hit) {
            console.warn("No entry in product-details.json matches \"" + p.name + "\".");
            return p;
        }

        var out = {};

        Object.keys(p).forEach(function (k) { out[k] = p[k]; });

        ["shortName", "description", "parameters", "benefits", "funFacts", "uses", "weights"]
            .forEach(function (k) {
                if (hit[k] != null) out[k] = hit[k];
            });

        return out;
    }

    /* ---------- start ---------- */

    if (!root) return;

    var wantedId = new URLSearchParams(window.location.search).get("id");

    if (!wantedId) {
        notFound("No product selected");
        return;
    }

    /* the details file may be named product-details.json or productdetails.json */
    var DETAIL_FILES = [
        "DATA/product-details.json",
        "DATA/productdetails.json",
        "DATA/ProductDetails.json",
        "DATA/productDetails.json"
    ];

    function loadDetails(index) {

        if (index >= DETAIL_FILES.length) {
            console.warn("Details file not found. Put product-details.json in your DATA folder, next to products.json.");
            return Promise.resolve([]);
        }

        return fetch(DETAIL_FILES[index])
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.json();
            })
            .then(function (data) {
                console.log("Loaded product details from " + DETAIL_FILES[index]);
                return data;
            })
            .catch(function () { return loadDetails(index + 1); });
    }

    var detailsRequest = loadDetails(0);

    var productsRequest = fetch("DATA/products.json")
        .then(function (r) {
            if (!r.ok) throw new Error("Could not load DATA/products.json");
            return r.json();
        });

    Promise.all([productsRequest, detailsRequest])
        .then(function (results) {

            var data = results[0];
            var details = Array.isArray(results[1]) ? results[1] : [];

            var all = Array.isArray(data) ? data : data.products;

            product = (all || []).find(function (p) {
                return String(p.id) === String(wantedId);
            });

            if (!product) {
                notFound("Product not found");
                return;
            }

            product = mergeDetails(product, details);

            document.title = product.name + " | Sheern Premium Dry Fruit";

            options = buildOptions(product);

            var baseGrams = toGrams(product.weight);
            var match = options.findIndex(function (o) { return o.grams && o.grams === baseGrams; });
            selected = match > -1 ? match : 0;

            render();
            renderRelated(all);
        })
        .catch(function (error) {
            console.error(error);
            notFound("Unable to load this product");
        });

})();