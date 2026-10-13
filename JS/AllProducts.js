"use strict";

console.log("Sheern AllProducts.js loaded successfully.");

/* =========================================================
   SETTINGS
========================================================= */

const productsPerPage = 10;

const CART_KEY = "sheernCart";
const OLD_CART_KEY = "cart";
const WISHLIST_KEY = "wishlist";
const REVIEWS_KEY = "sheernCustomerReviews";

/* One place to change the checkout file name */
const CHECKOUT_PAGE = "CheckOut.html";


/* =========================================================
   STATE
========================================================= */

let products = [];
let filteredProducts = [];

let currentPage = 1;
let selectedRating = 0;
let showingWishlist = false;


/* =========================================================
   HELPERS
========================================================= */

function readLocalStorage(key, fallback = []) {

    try {

        const rawData = localStorage.getItem(key);

        if (!rawData) {
            return fallback;
        }

        const data = JSON.parse(rawData);

        return Array.isArray(data) ? data : fallback;

    } catch (error) {

        console.error(`Error reading ${key}:`, error);

        return fallback;
    }
}


function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent =
        value === null || value === undefined
            ? ""
            : String(value);

    return div.innerHTML;
}


function formatPrice(price) {

    return (Number(price) || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


function sameId(a, b) {

    return String(a) === String(b);
}


/* =========================================================
   CART + WISHLIST DATA
========================================================= */

let cart = readLocalStorage(
    CART_KEY,
    readLocalStorage(OLD_CART_KEY, [])
);

/* old basket items may use "qty" - make sure every item has a quantity */
cart = cart.map(item => ({
    ...item,
    quantity: Number(item.quantity ?? item.qty) || 1
}));

let wishlist = readLocalStorage(WISHLIST_KEY, []);


/* =========================================================
   DOM ELEMENTS
========================================================= */

let productsGrid, productsEmpty, productsPagination, paginationNumbers,
    productsResult, productSearch, categoryFilter, sortProducts,
    ratingFilter, clearFilters, emptyClearButton, previousPage, nextPage;

let headerCartCount, headerWishlistCount, sidebarWishlistCount,
    cartItems, cartTotal, searchButton, searchInput;

let SIDE_toggle, sideNavbar, sidebarOverlay, shopSideBtn, shopSubmenu,
    headerWishlistButton;

let headerLoginButton, accountDropdown, accountButtonName, accountName,
    loginDropdownLink, registerDropdownLink, logoutButton;


function initializeDOM() {

    const $ = id => document.getElementById(id);

    /* products */
    productsGrid = $("productsGrid");
    productsEmpty = $("productsEmpty");
    productsPagination = $("productsPagination");
    paginationNumbers = $("paginationNumbers");
    productsResult = $("productsResult");

    productSearch = $("productSearch");
    categoryFilter = $("categoryFilter");
    sortProducts = $("sortProducts");
    ratingFilter = $("ratingFilter");

    clearFilters = $("clearFilters");
    emptyClearButton = $("emptyClearButton");

    previousPage = $("previousPage");
    nextPage = $("nextPage");

    /* header */
    headerCartCount = $("headerCartCount");
    headerWishlistCount = $("headerWishlistCount");
    sidebarWishlistCount = $("sidebarWishlistCount");
    headerWishlistButton = $("headerWishlistButton");

    /* cart */
    cartItems = $("cartItems");
    cartTotal = $("cartTotal");

    /* search */
    searchButton = $("headerSearchButton");
    searchInput = $("searchInput");

    /* sidebar */
    SIDE_toggle = $("SIDE_toggle");
    sideNavbar = $("sideNavbar");
    sidebarOverlay = $("sidebarOverlay");
    shopSideBtn = $("shopSideBtn");
    shopSubmenu = $("shopSubmenu");

    /* account */
    headerLoginButton = $("headerLoginButton");
    accountDropdown = $("accountDropdown");
    accountButtonName = $("accountButtonName");
    accountName = $("accountName");
    loginDropdownLink = $("loginDropdownLink");
    registerDropdownLink = $("registerDropdownLink");
    logoutButton = $("logoutButton");
}


/* =========================================================
   LOAD PRODUCTS FROM JSON
========================================================= */

async function loadProducts() {

    const jsonPath = "./DATA/products.json";

    try {

        const response = await fetch(jsonPath);

        if (!response.ok) {

            throw new Error(
                `Could not load products.json. HTTP ${response.status}`
            );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {

            throw new Error("products.json must contain a JSON array.");
        }

        products = data;
        filteredProducts = [...products];

        console.log(`Successfully loaded ${products.length} products.`);

        displayCategories();
        applyURLFilters();
        applyFilters();
        updateCart();
        updateWishlistCount();

    } catch (error) {

        console.error("PRODUCT LOADING ERROR:", error);

        if (productsGrid) {

            productsGrid.style.display = "grid";

            productsGrid.innerHTML = `

                <div class="no-products">

                    <i class="bi bi-exclamation-circle"></i>

                    <h3>Products Could Not Be Loaded</h3>

                    <p>${escapeHTML(error.message)}</p>

                    <p>
                        Please check:
                        <strong>./DATA/products.json</strong>
                    </p>

                </div>

            `;
        }
    }
}


/* =========================================================
   CATEGORIES
========================================================= */

function displayCategories() {

    if (!categoryFilter) {
        return;
    }

    const categories = [
        ...new Set(
            products
                .map(product => String(product.category || "").trim())
                .filter(category => category !== "")
        )
    ].sort((a, b) => a.localeCompare(b));

    categoryFilter.innerHTML =
        `<option value="all">All Categories</option>`;

    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category;
        option.textContent = category;

        categoryFilter.appendChild(option);
    });
}


function applyURLFilters() {

    const params = new URLSearchParams(window.location.search);

    const urlCategory = params.get("category");

    if (!urlCategory || !categoryFilter) {
        return;
    }

    const matchingOption = Array.from(categoryFilter.options).find(
        option =>
            option.value.toLowerCase() === urlCategory.toLowerCase()
    );

    if (matchingOption) {

        categoryFilter.value = matchingOption.value;
    }
}


/* =========================================================
   RATINGS (product rating + customer reviews)
========================================================= */

function getCustomerReviewsForProduct(productId) {

    return readLocalStorage(REVIEWS_KEY, []).filter(
        review => sameId(review.productId, productId)
    );
}


function getProductRatingData(product) {

    const baseRating = Number(product.rating) || 0;
    const baseReviews = Number(product.reviews) || 0;

    const customerReviews = getCustomerReviewsForProduct(product.id);

    if (customerReviews.length === 0) {

        return { rating: baseRating, count: baseReviews };
    }

    const customerTotal = customerReviews.reduce(
        (sum, review) => sum + (Number(review.rating) || 0),
        0
    );

    const totalCount = baseReviews + customerReviews.length;

    const totalRating = (baseRating * baseReviews) + customerTotal;

    return {
        rating: totalCount > 0 ? totalRating / totalCount : 0,
        count: totalCount
    };
}


function createStars(rating) {

    const numericRating = Math.max(0, Math.min(5, Number(rating) || 0));

    const fullStars = Math.floor(numericRating);

    const hasHalfStar = numericRating - fullStars >= 0.5;

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        `<i class="bi bi-star-fill"></i>`.repeat(fullStars) +
        (hasHalfStar ? `<i class="bi bi-star-half"></i>` : "") +
        `<i class="bi bi-star"></i>`.repeat(emptyStars)
    );
}


/* =========================================================
   FILTERS + SORTING
========================================================= */

function applyFilters(resetPage = true) {

    const searchValue =
        productSearch?.value?.trim()?.toLowerCase() || "";

    const categoryValue =
        String(categoryFilter?.value || "all").toLowerCase();

    filteredProducts = products.filter(product => {

        const name = String(product.name || "").toLowerCase();
        const description = String(product.description || "").toLowerCase();
        const category = String(product.category || "").toLowerCase();
        const badge = String(product.badge || "").toLowerCase();
        const weight = String(product.weight || "").toLowerCase();

        const searchMatches =
            !searchValue ||
            name.includes(searchValue) ||
            description.includes(searchValue) ||
            category.includes(searchValue) ||
            badge.includes(searchValue) ||
            weight.includes(searchValue);

        const categoryMatches =
            categoryValue === "all" || category === categoryValue;

        const productRating =
            Number(getProductRatingData(product).rating) || 0;

        const ratingMatches =
            selectedRating === 0 || productRating >= selectedRating;

        return searchMatches && categoryMatches && ratingMatches;
    });

    applySorting();

    if (resetPage) {

        currentPage = 1;
    }

    displayProducts(filteredProducts);
}


function applySorting() {

    if (!sortProducts) {
        return;
    }

    const sortValue = sortProducts.value;

    if (sortValue === "price-low" || sortValue === "priceLow") {

        filteredProducts.sort(
            (a, b) => Number(a.price || 0) - Number(b.price || 0)
        );

    } else if (sortValue === "price-high" || sortValue === "priceHigh") {

        filteredProducts.sort(
            (a, b) => Number(b.price || 0) - Number(a.price || 0)
        );

    } else if (sortValue === "rating-high" || sortValue === "ratingHigh") {

        filteredProducts.sort(
            (a, b) =>
                getProductRatingData(b).rating -
                getProductRatingData(a).rating
        );

    } else if (sortValue === "name" || sortValue === "nameAZ") {

        filteredProducts.sort(
            (a, b) => String(a.name || "").localeCompare(String(b.name || ""))
        );

    } else if (sortValue === "nameZA") {

        filteredProducts.sort(
            (a, b) => String(b.name || "").localeCompare(String(a.name || ""))
        );
    }
}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(productList) {

    if (!productsGrid) {

        console.error("productsGrid was not found.");

        return;
    }

    productsGrid.innerHTML = "";

    const totalProducts = productList.length;

    if (productsResult) {

        const label = totalProducts === 1 ? "product" : "products";

        productsResult.textContent = showingWishlist
            ? `Showing ${totalProducts} wishlist ${label}`
            : `Showing ${totalProducts} ${label}`;
    }

    /* empty */
    if (totalProducts === 0) {

        productsGrid.style.display = "none";

        if (productsEmpty) {
            productsEmpty.hidden = false;
        }

        if (productsPagination) {
            productsPagination.style.display = "none";
        }

        return;
    }

    productsGrid.style.display = "grid";

    if (productsEmpty) {
        productsEmpty.hidden = true;
    }

    /* pages */
    const totalPages = Math.ceil(totalProducts / productsPerPage);

    if (currentPage > totalPages) {
        currentPage = totalPages;
    }

    const startIndex = (currentPage - 1) * productsPerPage;

    productList
        .slice(startIndex, startIndex + productsPerPage)
        .forEach(product => {

            const card = createProductCard(product);

            if (card) {
                productsGrid.appendChild(card);
            }
        });

    createPagination(totalPages);
}


/* =========================================================
   PRODUCT CARD
========================================================= */

function createProductCard(product) {

    if (!product) {
        return null;
    }

    const id = product.id;
    const name = product.name || "Premium Dry Fruit";
    const image = product.image || "Photos/MIX.jpg";
    const price = Number(product.price) || 0;

    const isWishlisted = wishlist.some(item => sameId(item.id, id));

    const wishlistLabel = isWishlisted
        ? "Remove from wishlist"
        : "Add to wishlist";

    const detailUrl = "ProductDetail.html?id=" + encodeURIComponent(id);

    const card = document.createElement("article");

    card.className = "product-card";
    card.dataset.productId = id;

    card.innerHTML = `

        <button
            type="button"
            class="wishlist-btn ${isWishlisted ? "active" : ""}"
            data-wishlist-id="${escapeHTML(id)}"
            aria-label="${wishlistLabel}"
            title="${wishlistLabel}">

            <i class="bi ${isWishlisted ? "bi-heart-fill" : "bi-heart"}"></i>

        </button>

        <a class="pc-link" href="${detailUrl}">

            <div class="pc-image">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(name)}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='Photos/MIX.jpg'">

                <span class="pc-quality">Premium Quality</span>

            </div>

            <div class="pc-body">

                <h3 class="pc-name">${escapeHTML(name)}</h3>

                <span class="pc-brand">Sheern</span>

                <div class="pc-price">₹${formatPrice(price)}</div>

            </div>

        </a>

        <a class="pc-button" href="${detailUrl}">Choose options</a>

    `;

    return card;
}


/* =========================================================
   PAGINATION
========================================================= */

function createPagination(totalPages) {

    if (!productsPagination || !paginationNumbers) {
        return;
    }

    if (totalPages <= 1) {

        productsPagination.style.display = "none";

        return;
    }

    productsPagination.style.display = "flex";

    paginationNumbers.innerHTML = "";

    if (previousPage) {
        previousPage.disabled = currentPage === 1;
    }

    if (nextPage) {
        nextPage.disabled = currentPage === totalPages;
    }

    const pageNumbers = [];

    if (totalPages <= 5) {

        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }

    } else {

        pageNumbers.push(1);

        if (currentPage > 3) {
            pageNumbers.push("dots");
        }

        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);

        for (let i = start; i <= end; i++) {
            pageNumbers.push(i);
        }

        if (currentPage < totalPages - 2) {
            pageNumbers.push("dots");
        }

        pageNumbers.push(totalPages);
    }

    pageNumbers.forEach(page => {

        if (page === "dots") {

            const dots = document.createElement("span");

            dots.className = "pagination-dots";
            dots.textContent = "...";

            paginationNumbers.appendChild(dots);

            return;
        }

        const button = document.createElement("button");

        button.type = "button";
        button.className = "page-number";
        button.textContent = page;

        if (page === currentPage) {
            button.classList.add("active");
        }

        button.addEventListener("click", () => {

            currentPage = page;

            displayProducts(filteredProducts);

            scrollToProducts();
        });

        paginationNumbers.appendChild(button);
    });
}


function goToNextPage() {

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    if (currentPage < totalPages) {

        currentPage++;

        displayProducts(filteredProducts);

        scrollToProducts();
    }
}


function goToPreviousPage() {

    if (currentPage > 1) {

        currentPage--;

        displayProducts(filteredProducts);

        scrollToProducts();
    }
}


function scrollToProducts() {

    const productSection = document.getElementById("products");

    if (productSection) {

        productSection.scrollIntoView({ behavior: "smooth", block: "start" });

    } else {

        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}


/* =========================================================
   CART
========================================================= */

function saveCart() {

    const cartData = JSON.stringify(cart);

    localStorage.setItem(CART_KEY, cartData);

    /* old key kept for compatibility */
    localStorage.setItem(OLD_CART_KEY, cartData);
}


function addToCart(productId) {

    const product = products.find(item => sameId(item.id, productId));

    if (!product) {

        console.error("Product not found:", productId);

        return;
    }

    const existingItem = cart.find(item => sameId(item.id, productId));

    if (existingItem) {

        existingItem.quantity = Number(existingItem.quantity || 1) + 1;

    } else {

        /* store the COMPLETE product - checkout needs it */
        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCart();

    showCartMessage(product.name);
}


/*
   BUY NOW
   Adds the product (quantity 1 if it is not in the basket yet)
   and goes straight to checkout.
*/

function buyNow(productId) {

    const product = products.find(item => sameId(item.id, productId));

    if (!product) {

        console.error("Product not found:", productId);

        return;
    }

    const existingItem = cart.find(item => sameId(item.id, productId));

    if (!existingItem) {

        cart.push({ ...product, quantity: 1 });
    }

    saveCart();
    updateCart();

    if (!getLoggedInUser()) {

        alert("Please login to your Sheern account to checkout.");

        if (window.Sheern && typeof Sheern.goToLogin === "function") {
            Sheern.goToLogin();
        } else {
            window.location.href = "Login.html";
        }

        return;
    }

    window.location.href = CHECKOUT_PAGE;
}


function updateCart() {

    const totalQuantity = cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    );

    if (headerCartCount) {
        headerCartCount.textContent = totalQuantity;
    }

    renderCart();
}


/*
   The basket uses the SAME markup / classes as the Home and About
   pages (cart-product, cart-product-info, cart-quantity, remove-cart),
   so it looks identical.
*/

function renderCart() {

    if (!cartItems) {
        return;
    }

    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="cart-empty">

                <i class="bi bi-bag"></i>

                <h4>Your cart is empty</h4>

                <p>Add some premium dry fruits to your cart.</p>

            </div>

        `;

        if (cartTotal) {
            cartTotal.textContent = "₹0.00";
        }

        return;
    }

    let total = 0;

    cartItems.innerHTML = cart.map(item => {

        const quantity = Number(item.quantity || 1);
        const price = Number(item.price || 0);

        total += price * quantity;

        const id = escapeHTML(item.id);

        return `

            <div class="cart-product">

                <img
                    src="${escapeHTML(item.image || "Photos/MIX.jpg")}"
                    alt="${escapeHTML(item.name || "Product")}"
                    onerror="this.onerror=null;this.src='Photos/MIX.jpg'">

                <div class="cart-product-info">

                    <h6>${escapeHTML(item.name || "Product")}</h6>

                    <p>₹${formatPrice(price)} × ${quantity}</p>

                </div>

                <div class="cart-quantity">

                    <button
                        type="button"
                        data-cart-action="decrease"
                        data-cart-id="${id}"
                        aria-label="Decrease quantity">−</button>

                    <span>${quantity}</span>

                    <button
                        type="button"
                        data-cart-action="increase"
                        data-cart-id="${id}"
                        aria-label="Increase quantity">+</button>

                </div>

                <button
                    type="button"
                    class="remove-cart"
                    data-cart-action="remove"
                    data-cart-id="${id}">

                    <i class="bi bi-trash"></i> Remove

                </button>

            </div>

        `;

    }).join("");

    if (cartTotal) {
        cartTotal.textContent = `₹${formatPrice(total)}`;
    }
}


function changeCartQuantity(productId, amount) {

    const item = cart.find(cartItem => sameId(cartItem.id, productId));

    if (!item) {
        return;
    }

    item.quantity = Number(item.quantity || 1) + amount;

    if (item.quantity <= 0) {

        cart = cart.filter(cartItem => !sameId(cartItem.id, productId));
    }

    saveCart();
    updateCart();
}


function removeFromCart(productId) {

    cart = cart.filter(item => !sameId(item.id, productId));

    saveCart();
    updateCart();
}


function proceedToCheckout(event) {

    if (event) {
        event.preventDefault();
    }

    if (!cart || cart.length === 0) {

        alert("Your cart is empty. Please add a product first.");

        return;
    }

    /* make sure checkout receives the current cart */
    saveCart();

    if (!getLoggedInUser()) {

        alert("Please login to your Sheern account to checkout.");

        if (window.Sheern && typeof Sheern.goToLogin === "function") {
            Sheern.goToLogin();
        } else {
            window.location.href = "Login.html";
        }

        return;
    }

    window.location.href = CHECKOUT_PAGE;
}


function showCartMessage(productName) {

    console.log(`${productName} added to cart.`);

    const toast = document.getElementById("cartToast");

    if (!toast) {
        return;
    }

    const toastText = toast.querySelector(".toast-message");

    if (toastText) {
        toastText.textContent = `${productName} added to cart.`;
    }

    toast.classList.add("show");

    setTimeout(() => toast.classList.remove("show"), 2500);
}


/* =========================================================
   WISHLIST
========================================================= */

function toggleWishlist(productId) {

    const product = products.find(item => sameId(item.id, productId));

    if (!product) {
        return;
    }

    const index = wishlist.findIndex(item => sameId(item.id, productId));

    if (index === -1) {

        wishlist.push(product);

    } else {

        wishlist.splice(index, 1);
    }

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));

    updateWishlistCount();

    if (showingWishlist) {

        filteredProducts = products.filter(
            p => wishlist.some(item => sameId(item.id, p.id))
        );

        displayProducts(filteredProducts);

    } else {

        /* keep the current page when a heart is clicked */
        applyFilters(false);
    }
}


function updateWishlistCount() {

    const count = wishlist.length;

    if (headerWishlistCount) {
        headerWishlistCount.textContent = count;
    }

    if (sidebarWishlistCount) {
        sidebarWishlistCount.textContent = count;
    }
}


function showWishlist() {

    showingWishlist = true;

    filteredProducts = products.filter(
        product => wishlist.some(item => sameId(item.id, product.id))
    );

    currentPage = 1;

    displayProducts(filteredProducts);
}


/* =========================================================
   SEARCH + RESET
========================================================= */

function searchProducts(value) {

    if (productSearch) {
        productSearch.value = value;
    }

    showingWishlist = false;

    applyFilters();
}


function resetFilters() {

    showingWishlist = false;

    if (productSearch) {
        productSearch.value = "";
    }

    if (categoryFilter) {
        categoryFilter.value = "all";
    }

    if (sortProducts) {
        sortProducts.value = "default";
    }

    selectedRating = 0;

    if (ratingFilter) {

        ratingFilter
            .querySelectorAll(".rating-filter-button")
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.rating === "0"
                );
            });
    }

    currentPage = 1;

    if (window.location.search) {

        window.history.replaceState({}, "", window.location.pathname);
    }

    applyFilters();
}


/* =========================================================
   SIDEBAR
========================================================= */

function openSidebar() {

    sideNavbar?.classList.add("open");
    sidebarOverlay?.classList.add("show");

    document.body.classList.add("menu-open");

    if (SIDE_toggle) {

        SIDE_toggle.classList.add("open", "menu-open");

        SIDE_toggle.setAttribute("aria-expanded", "true");
    }
}


function closeSidebar() {

    sideNavbar?.classList.remove("open");
    sidebarOverlay?.classList.remove("show");

    document.body.classList.remove("menu-open");

    if (SIDE_toggle) {

        SIDE_toggle.classList.remove("open", "menu-open");

        SIDE_toggle.setAttribute("aria-expanded", "false");
    }
}


function setupSidebarCloseButton() {

    ["closeSidebar", "SIDE_close", "sidebarClose"].forEach(id => {

        document.getElementById(id)?.addEventListener("click", closeSidebar);
    });

    document
        .querySelectorAll(".sidebar-close, [data-sidebar-close]")
        .forEach(button => button.addEventListener("click", closeSidebar));
}


/* style.css opens the submenu with the class "active" */

function toggleShopSubmenu(event) {

    if (!shopSubmenu || !shopSideBtn) {
        return;
    }

    if (event) {
        event.preventDefault();
    }

    shopSubmenu.classList.toggle("active");
    shopSideBtn.classList.toggle("active");
}


/* =========================================================
   ACCOUNT
========================================================= */

function getLoggedInUser() {

    /* the real login session is kept by auth.js */
    if (window.Sheern && typeof Sheern.getSession === "function") {

        const session = Sheern.getSession();

        if (session) {
            return { ...session, name: session.fullName || session.username };
        }
    }

    const possibleKeys = ["sheernSession", "loggedInUser", "currentUser", "sheernUser"];

    for (const key of possibleKeys) {

        const raw = localStorage.getItem(key);

        if (!raw) {
            continue;
        }

        try {

            return JSON.parse(raw);

        } catch {

            return { name: raw };
        }
    }

    /* support the existing localStorage login system */

    const loggedIn = localStorage.getItem("sheernLoggedIn");
    const userName = localStorage.getItem("sheernUserName");

    if (loggedIn === "true" && userName) {

        return { name: userName };
    }

    return null;
}


function updateAccountUI() {

    const user = getLoggedInUser();

    /* auth.js draws the header (name, avatar, role links) */
    if (user && window.Sheern && typeof Sheern.updateAccountUI === "function") {

        Sheern.updateAccountUI();

        return;
    }

    if (!user) {

        if (accountButtonName) accountButtonName.textContent = "Login";
        if (accountName) accountName.textContent = "My Account";

        loginDropdownLink?.classList.remove("d-none");
        registerDropdownLink?.classList.remove("d-none");
        logoutButton?.classList.add("d-none");

        return;
    }

    const userName =
        user.name ||
        user.username ||
        user.fullName ||
        user.email ||
        "Account";

    if (accountButtonName) accountButtonName.textContent = userName;
    if (accountName) accountName.textContent = userName;

    loginDropdownLink?.classList.add("d-none");
    registerDropdownLink?.classList.add("d-none");
    logoutButton?.classList.remove("d-none");
}


function toggleAccountDropdown() {

    accountDropdown?.classList.toggle("show");
}


function closeAccountDropdown() {

    accountDropdown?.classList.remove("show");
}


function logoutUser(event) {

    if (event) {
        event.preventDefault();
    }

    if (window.Sheern && typeof Sheern.logout === "function") {

        Sheern.logout();

        return;
    }

    ["loggedInUser", "currentUser", "sheernUser",
        "sheernLoggedIn", "sheernUserName"]
        .forEach(key => localStorage.removeItem(key));

    updateAccountUI();
    closeAccountDropdown();

    console.log("User logged out successfully.");
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    /* ---------- filters ---------- */

    productSearch?.addEventListener("input", () => {

        showingWishlist = false;

        applyFilters();
    });

    categoryFilter?.addEventListener("change", () => {

        showingWishlist = false;

        applyFilters();
    });

    sortProducts?.addEventListener("change", () => {

        showingWishlist = false;

        applyFilters();
    });

    ratingFilter?.addEventListener("click", event => {

        const button = event.target.closest(".rating-filter-button");

        if (!button) {
            return;
        }

        selectedRating = Number(button.dataset.rating || 0);

        ratingFilter
            .querySelectorAll(".rating-filter-button")
            .forEach(item => item.classList.remove("active"));

        button.classList.add("active");

        showingWishlist = false;

        applyFilters();
    });

    clearFilters?.addEventListener("click", resetFilters);
    emptyClearButton?.addEventListener("click", resetFilters);


    /* ---------- pagination ---------- */

    previousPage?.addEventListener("click", goToPreviousPage);
    nextPage?.addEventListener("click", goToNextPage);


    /* ---------- product card buttons ---------- */

    productsGrid?.addEventListener("click", event => {

        const wishlistButton = event.target.closest(".wishlist-btn");

        if (wishlistButton) {

            toggleWishlist(wishlistButton.dataset.wishlistId);

            return;
        }

        const cartButton = event.target.closest(".add-cart-btn");

        if (cartButton) {

            addToCart(cartButton.dataset.cartId);

            return;
        }

        const buyNowButton = event.target.closest(".buy-now-btn");

        if (buyNowButton) {

            buyNow(buyNowButton.dataset.buyId);
        }
    });


    /* ---------- basket buttons (+ / - / remove) ---------- */

    cartItems?.addEventListener("click", event => {

        const button = event.target.closest("[data-cart-action]");

        if (!button) {
            return;
        }

        const productId = button.dataset.cartId;
        const action = button.dataset.cartAction;

        if (action === "increase") {

            changeCartQuantity(productId, 1);

        } else if (action === "decrease") {

            changeCartQuantity(productId, -1);

        } else if (action === "remove") {

            removeFromCart(productId);
        }
    });


    /* ---------- checkout button ---------- */

    document
        .getElementById("checkoutButton")
        ?.addEventListener("click", proceedToCheckout);


    /* ---------- header search ---------- */

    searchButton?.addEventListener("click", () => {

        setTimeout(() => {

            const modalElement = document.getElementById("searchModal");

            if (modalElement?.classList.contains("show")) {

                searchInput?.focus();
            }

        }, 300);
    });

    searchInput?.addEventListener("input", event => {

        searchProducts(event.target.value);
    });


    /* ---------- header wishlist ---------- */

    headerWishlistButton?.addEventListener("click", showWishlist);


    /* ---------- account ---------- */

    headerLoginButton?.addEventListener("click", event => {

        event.preventDefault();
        event.stopPropagation();

        toggleAccountDropdown();
    });

    /* auth.js already handles the logout button when it is loaded */
    if (!window.Sheern) {
        logoutButton?.addEventListener("click", logoutUser);
    }


    /* ---------- sidebar ---------- */

    SIDE_toggle?.addEventListener("click", () => {

        if (sideNavbar?.classList.contains("open")) {

            closeSidebar();

        } else {

            openSidebar();
        }
    });

    sidebarOverlay?.addEventListener("click", closeSidebar);

    setupSidebarCloseButton();

    shopSideBtn?.addEventListener("click", toggleShopSubmenu);

    sideNavbar?.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            /* the Shop button only opens the submenu - keep the drawer open */
            if (link.id === "shopSideBtn") {
                return;
            }

            if (window.innerWidth <= 991) {
                closeSidebar();
            }
        });
    });


    /* ---------- click outside the account dropdown ---------- */

    document.addEventListener("click", event => {

        if (!accountDropdown || !headerLoginButton) {
            return;
        }

        const insideButton = headerLoginButton.contains(event.target);
        const insideDropdown = accountDropdown.contains(event.target);

        if (!insideButton && !insideDropdown) {

            closeAccountDropdown();
        }
    });


    /* ---------- escape key ---------- */

    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            closeSidebar();
            closeAccountDropdown();
        }
    });
}


function setupResizeHandler() {

    window.addEventListener("resize", () => {

        if (window.innerWidth > 991) {

            closeSidebar();
        }
    });
}


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    console.log("DOM loaded. Initializing Sheern All Products...");

    initializeDOM();

    setupEventListeners();
    setupResizeHandler();

    updateCart();
    updateWishlistCount();
    updateAccountUI();

    loadProducts();
});