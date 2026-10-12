(function () {
    "use strict";
    const PRODUCTS_JSON_URL = "DATA/products.json";
    const STORAGE_KEYS = {
        cart: "sheernCart",
        wishlist: "wishlist"
    };
    const DEFAULT_DISCOUNT = 10;
    const MAX_PRODUCTS = 8;      // ADDED: how many products Best Seller shows

    // Discount by product id (overrides the default)
    const DISCOUNT_BY_ID = {
        1: 20,   // Premium Pistachios
        3: 15,   // Premium Cashews
        8: 0     // Premium Raisins: no discount
    };

    // Discount by category (used if the id isn't listed above)
    const DISCOUNT_BY_CATEGORY = {
        // almonds: 12,
        // walnuts: 8
    };

    /* -----------------------------------------------------
       ELEMENTS
    ----------------------------------------------------- */
    const grid = document.getElementById("bestSellerGrid");
    const emptyBox = document.getElementById("bestSellerEmpty");
    const loadingBox = document.getElementById("bestSellerLoading");

    const wishlistCountEls = [
        document.getElementById("headerWishlistCount"),
        document.getElementById("sidebarWishlistCount")
    ];

    const searchInput = document.getElementById("headerSearchInput");
    const searchResults = document.getElementById("headerSearchResults");

    let allProducts = [];

    /* -----------------------------------------------------
       HELPERS
    ----------------------------------------------------- */
    function readStorage(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function writeStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn("Could not save to storage:", e);
        }
    }

    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function formatPrice(n) {
        return "₹" + Number(n || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function starsHTML(rating) {
        const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
        return "★".repeat(r) + "☆".repeat(5 - r);
    }

    function formatCategory(c) {
        return String(c || "").replace(/-/g, " ");
    }

    /* -----------------------------------------------------
       DISCOUNT HELPERS
    ----------------------------------------------------- */
    function getDiscount(p) {
        let d;

        if (p.discount !== undefined) {
            d = Number(p.discount);                    // JSON value wins, if added later
        } else if (DISCOUNT_BY_ID[p.id] !== undefined) {
            d = DISCOUNT_BY_ID[p.id];
        } else if (DISCOUNT_BY_CATEGORY[p.category] !== undefined) {
            d = DISCOUNT_BY_CATEGORY[p.category];
        } else {
            d = DEFAULT_DISCOUNT;
        }

        return d > 0 && d < 100 ? d : 0;
    }

    function getFinalPrice(p) {
        const price = Number(p.price) || 0;
        const d = getDiscount(p);
        return d ? Math.round(price - (price * d) / 100) : price;
    }

    /* -----------------------------------------------------
       LOAD PRODUCTS
    ----------------------------------------------------- */
    async function loadProducts() {
        try {
            const res = await fetch(PRODUCTS_JSON_URL);
            if (!res.ok) throw new Error("HTTP " + res.status);
            const data = await res.json();
            return Array.isArray(data) ? data : [];
        } catch (e) {
            console.error("Could not load products:", e);
            return [];
        }
    }

    /* -----------------------------------------------------
       RENDER PRODUCTS
    ----------------------------------------------------- */
    function renderCards(products) {
        const wishlist = getWishlist();

        loadingBox.classList.add("d-none");

        if (!products.length) {
            grid.innerHTML = "";
            emptyBox.classList.remove("d-none");
            return;
        }

        emptyBox.classList.add("d-none");

        grid.innerHTML = products.map(function (p) {
            const liked = wishlist.includes(String(p.id));
            const discount = getDiscount(p);

            return `
            <article class="best-seller-card" data-id="${escapeHTML(p.id)}">
                <div class="best-seller-image-wrapper">
                    <img class="best-seller-image"
                         src="${escapeHTML(p.image)}"
                         alt="${escapeHTML(p.name)}"
                         loading="lazy">

                    <span class="best-seller-badge">${escapeHTML(p.badge || "BEST SELLER")}</span>
                    ${discount ? `<span class="discount-tag">${discount}% OFF</span>` : ""}

                    <button type="button"
                            class="product-wishlist-btn ${liked ? "active" : ""}"
                            data-action="wishlist"
                            aria-label="Add to wishlist">
                        <i class="bi ${liked ? "bi-heart-fill" : "bi-heart"}"></i>
                    </button>
                </div>

                <div class="best-seller-card-body">
                    <span class="product-category">${escapeHTML(formatCategory(p.category))}</span>
                    <h3 class="best-seller-card-title">${escapeHTML(String(p.name).trim())}</h3>
                    <p class="product-description">${escapeHTML(p.description)}</p>

                    <div class="product-rating">
                        <span class="product-stars">${starsHTML(p.rating)}</span>
                        <span class="rating-number">${Number(p.rating || 0).toFixed(1)}</span>
                        <span class="product-review-count">(${escapeHTML(p.reviews || 0)})</span>
                    </div>

                    <div class="product-price-row">
                        <div class="price-box">
                            <span class="product-price">${formatPrice(getFinalPrice(p))}</span>
                            ${discount ? `<span class="product-old-price">${formatPrice(p.price)}</span>` : ""}
                        </div>
                        <span class="product-weight">${escapeHTML(p.weight)}</span>
                    </div>

                    <div class="product-actions">
                        <button type="button" class="add-cart-btn" data-action="cart">
                            <i class="bi bi-bag"></i> Add to Cart
                        </button>
                        <button type="button" class="buy-now-btn" data-action="buy">
                            <i class="bi bi-lightning-charge-fill"></i> Buy Now
                        </button>
                    </div>
                </div>
            </article>`;
        }).join("");
    }

    /* -----------------------------------------------------
       PAGINATION
    ----------------------------------------------------- */
    let currentList = [];
    let currentPage = 1;
    let lastPageSize = 0;

    // CHANGED: always 8 per page, so the 8 products fit on one page (no pagination bar)
    function perPage() {
        return MAX_PRODUCTS;
    }

    function getNav() {
        let nav = document.getElementById("bestSellerPagination");

        if (!nav) {
            nav = document.createElement("nav");
            nav.id = "bestSellerPagination";
            nav.className = "bs-pagination";
            nav.setAttribute("aria-label", "Product pages");
            grid.insertAdjacentElement("afterend", nav);
        }

        return nav;
    }

    function setProducts(list) {
        currentList = list;
        currentPage = 1;
        renderPage();
    }

    function renderPage() {
        const size = perPage();
        lastPageSize = size;

        const total = Math.max(1, Math.ceil(currentList.length / size));
        if (currentPage > total) currentPage = total;

        const start = (currentPage - 1) * size;
        const end = Math.min(start + size, currentList.length);

        renderCards(currentList.slice(start, end));
        buildNav(total, start, end);
    }

    function goToPage(page) {
        currentPage = page;
        renderPage();

        const section = document.getElementById("bestSellerProducts");
        if (section) section.scrollIntoView({ behavior: "smooth" });
    }

    function pageList(current, total) {
        const pages = [];
        for (let i = 1; i <= total; i++) {
            if (i === 1 || i === total || Math.abs(i - current) <= 1) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
        return pages;
    }

    function buildNav(total, start, end) {
        const nav = getNav();
        nav.innerHTML = "";

        if (total <= 1) {
            nav.style.display = "none";
            return;
        }

        nav.style.display = "";

        const list = document.createElement("ul");
        list.className = "bs-pagination-list";

        function addButton(label, page, active, disabled, aria) {
            const li = document.createElement("li");
            const btn = document.createElement("button");

            btn.type = "button";
            btn.className = "bs-page-btn" + (active ? " active" : "");
            btn.innerHTML = label;
            btn.disabled = !!disabled;
            if (aria) btn.setAttribute("aria-label", aria);
            if (active) btn.setAttribute("aria-current", "page");

            if (!disabled && !active) {
                btn.addEventListener("click", function () { goToPage(page); });
            }

            li.appendChild(btn);
            list.appendChild(li);
        }

        addButton('<i class="bi bi-chevron-left"></i>', currentPage - 1, false, currentPage === 1, "Previous page");

        pageList(currentPage, total).forEach(function (p) {
            if (p === "...") {
                const li = document.createElement("li");
                li.className = "bs-page-dots";
                li.textContent = "...";
                list.appendChild(li);
            } else {
                addButton(String(p), p, p === currentPage, false, "Page " + p);
            }
        });

        addButton('<i class="bi bi-chevron-right"></i>', currentPage + 1, false, currentPage === total, "Next page");

        const info = document.createElement("p");
        info.className = "bs-pagination-info";
        info.textContent = "Showing " + (start + 1) + "-" + end + " of " + currentList.length + " products";

        nav.appendChild(list);
        nav.appendChild(info);
    }

    let resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (currentList.length && perPage() !== lastPageSize) {
                renderPage();
            }
        }, 150);
    });

    /* -----------------------------------------------------
       WISHLIST
    ----------------------------------------------------- */
    function getWishlist() {
        return readStorage(STORAGE_KEYS.wishlist, []).map(String);
    }

    function updateWishlistCount() {
        const count = getWishlist().length;
        wishlistCountEls.forEach(function (el) {
            if (el) el.textContent = count;
        });
    }

    function toggleWishlist(id, btn) {
        const key = String(id);
        const wishlist = getWishlist();
        const index = wishlist.indexOf(key);

        if (index > -1) {
            wishlist.splice(index, 1);
        } else {
            wishlist.push(key);
        }

        writeStorage(STORAGE_KEYS.wishlist, wishlist);

        const active = wishlist.includes(key);
        btn.classList.toggle("active", active);
        btn.querySelector("i").className = "bi " + (active ? "bi-heart-fill" : "bi-heart");

        updateWishlistCount();
    }

    /* -----------------------------------------------------
       CART
    ----------------------------------------------------- */
    function addToCart(product) {
        const finalPrice = getFinalPrice(product);

        if (typeof cart === "undefined" || typeof updateCart !== "function") {
            console.error("Dry.js cart not available. Is Dry.js loaded?");
            return;
        }

        const existing = cart.find(function (item) {
            return String(item.id) === String(product.id);
        });

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push(Object.assign({}, product, {
                price: finalPrice,
                quantity: 1
            }));
        }

        saveCart();
        updateCart();
    }

    function buyNow(product) {
        if (typeof cart === "undefined" || typeof updateCart !== "function") {
            console.error("Dry.js cart not available. Is Dry.js loaded?");
            return;
        }

        // Add the product only if it is not already in the basket
        const inCart = cart.some(function (item) {
            return String(item.id) === String(product.id);
        });

        if (!inCart) {
            addToCart(product);
        }

        // Dry.js checkout(): asks for login, then confirms the order
        if (typeof checkout === "function") {
            checkout();
        } else {
            bootstrap.Offcanvas.getOrCreateInstance("#cartCanvas").show();
        }
    }

    /* -----------------------------------------------------
       HEADER SEARCH
    ----------------------------------------------------- */
    function handleSearch() {
        const term = searchInput.value.trim().toLowerCase();

        if (!term) {
            searchResults.innerHTML = "";
            return;
        }

        const matches = allProducts.filter(function (p) {
            return (p.name + " " + p.category).toLowerCase().includes(term);
        });

        searchResults.innerHTML = matches.length
            ? matches.map(function (p) {
                return `<a href="AllProduct.html" class="d-flex align-items-center gap-3 p-2 text-decoration-none text-dark">
                            <img src="${escapeHTML(p.image)}" alt="" style="width:45px;height:45px;object-fit:cover;border-radius:6px;">
                            <span>${escapeHTML(String(p.name).trim())} <small class="text-muted">${formatPrice(getFinalPrice(p))}</small></span>
                        </a>`;
            }).join("")
            : '<p class="text-muted text-center m-0">No products found.</p>';
    }

    /* -----------------------------------------------------
       EVENTS
    ----------------------------------------------------- */
    grid.addEventListener("click", function (e) {
        const btn = e.target.closest("[data-action]");
        if (!btn) return;

        const card = btn.closest(".best-seller-card");
        const id = card.dataset.id;
        const product = allProducts.find(function (p) { return String(p.id) === id; });
        if (!product) return;

        switch (btn.dataset.action) {
            case "wishlist":
                toggleWishlist(product.id, btn);
                break;
            case "cart":
                addToCart(product);
                bootstrap.Offcanvas.getOrCreateInstance("#cartCanvas").show();
                break;
            case "buy":
                buyNow(product);
                break;
        }
    });

    if (searchInput) searchInput.addEventListener("input", handleSearch);

    const wishlistHeaderBtn = document.getElementById("headerWishlistButton");
    if (wishlistHeaderBtn) {
        wishlistHeaderBtn.addEventListener("click", function () {
            window.location.href = "AllProduct.html";
        });
    }

    /* -----------------------------------------------------
       INIT
    ----------------------------------------------------- */
    async function init() {
        if (!grid) return;

        allProducts = await loadProducts();

        const badge = String(grid.dataset.badge || "").trim().toUpperCase();

        const list = badge
            ? allProducts.filter(function (p) {
                return String(p.badge || "").trim().toUpperCase() === badge;
            })
            : allProducts;

        // CHANGED: show only MAX_PRODUCTS (8) products
        let finalList = list.slice(0, MAX_PRODUCTS);

        // If fewer than 8 have the badge, fill the rest with the highest-rated other products
        if (finalList.length < MAX_PRODUCTS) {
            const extra = allProducts
                .filter(function (p) { return !finalList.includes(p); })
                .sort(function (a, b) { return (b.rating || 0) - (a.rating || 0); })
                .slice(0, MAX_PRODUCTS - finalList.length);

            finalList = finalList.concat(extra);
        }

        setProducts(finalList);
        updateWishlistCount();
    }

    document.addEventListener("DOMContentLoaded", init);
})();