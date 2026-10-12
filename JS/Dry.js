let products = [];

let cart = [];

try {
    cart = JSON.parse(localStorage.getItem("sheernCart")) || [];
} catch (error) {
    cart = [];
}

/* repair old items saved with "qty" or without a quantity */
cart = cart.map(function (item) {
    return {
        ...item,
        quantity: Number(item.quantity ?? item.qty) || 1
    };
});


/* =========================================================
   LOAD PRODUCTS FROM JSON
========================================================= */

async function loadProducts() {

    try {

        const response = await fetch("DATA/products.json");

        if (!response.ok) {
            throw new Error("Could not load DATA/products.json");
        }

        const data = await response.json();

        console.log("JSON DATA:", data);

        products = Array.isArray(data)
            ? data
            : data.products;

        if (!Array.isArray(products)) {
            throw new Error(
                "products.json must contain an array or a products array."
            );
        }

        console.log("Products successfully loaded:", products);

        displayCategories();

        displayProducts(products);

        updateCart();

        loadWishlist();

    }

    catch (error) {

        console.error("Error loading products:", error);

        const productGrid = document.getElementById("productGrid");

        if (productGrid) {

            productGrid.innerHTML = `
                <div class="col-12 text-center">
                    <p>
                        Unable to load products.
                    </p>
                </div>
            `;

        }

    }

}


/* =========================================================
   DISPLAY CATEGORIES
========================================================= */

function displayCategories() {

    const categorySlider = document.getElementById("categorySlider");

    if (!categorySlider) {
        return;
    }

    categorySlider.innerHTML = "";

    const categories = [];

    products.forEach(function (product) {

        const category =
            String(product.category || "")
                .trim()
                .toLowerCase();

        if (category && !categories.includes(category)) {
            categories.push(category);
        }

    });

    categories.forEach(function (category) {

        const product =
            products.find(function (item) {

                return String(item.category || "")
                    .trim()
                    .toLowerCase() === category;

            });

        if (!product) return;

        const categoryName =
            category
                .split(" ")
                .map(function (word) {

                    return (
                        word.charAt(0).toUpperCase() +
                        word.slice(1)
                    );

                })
                .join(" ");

        categorySlider.insertAdjacentHTML(
            "beforeend",
            `
            <div
                class="category-card"
                data-category="${escapeHTML(category)}"
            >

                <div class="category-image">

                    <img
                        src="${escapeAttribute(product.image)}"
                        alt="${escapeAttribute(categoryName)}"
                        loading="lazy"
                        onerror="this.src='Photos/Logo.png'"
                    >

                </div>

                <h5>
                    ${escapeHTML(categoryName)}
                </h5>

            </div>
            `
        );

    });

    /*
        Add click events AFTER
        the cards have been created.
    */

    document
        .querySelectorAll(".category-card")
        .forEach(function (card) {

            card.addEventListener("click", function () {

                const category = this.dataset.category;

                filterByCategory(category);

            });

        });

}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(productList = products) {

    const productGrid = document.getElementById("productGrid");

    if (!productGrid) {
        return;
    }

    productGrid.innerHTML = "";

    if (!Array.isArray(productList) || productList.length === 0) {

        productGrid.innerHTML = `
            <div class="col-12 text-center">
                <p>No products found.</p>
            </div>
        `;

        return;

    }

    productList.forEach(function (product) {

        const rating =
            Math.max(0, Math.min(5, Number(product.rating) || 0));

        const stars =
            "★".repeat(rating) +
            "☆".repeat(5 - rating);

        const productHTML = `

            <div class="col-6 col-md-4 col-lg-3">

                <div
                    class="product-card"
                    data-category="${escapeAttribute(product.category || "")}"
                    data-detail-url="ProductDetail.html?id=${encodeURIComponent(product.id)}"
                    style="cursor:pointer"
                >

                    <!-- PRODUCT BADGE -->

                    <span class="product-badge">

                        ${escapeHTML(product.badge || "Premium")}

                    </span>


                    <!-- WISHLIST -->

                    <button
                        class="wishlist-btn"
                        data-id="${escapeAttribute(product.id)}"
                        type="button"
                        aria-label="Add to Wishlist"
                    >

                        <i class="bi bi-heart"></i>

                    </button>


                    <!-- PRODUCT IMAGE -->

                    <div class="product-image">

                        <a href="ProductDetail.html?id=${encodeURIComponent(product.id)}"
                            style="display:block;color:inherit;text-decoration:none"
                            aria-label="View ${escapeAttribute(product.name)}">

                            <img
                                src="${escapeAttribute(product.image)}"
                                alt="${escapeAttribute(product.name)}"
                                loading="lazy"
                                onerror="this.src='Photos/Logo.png'"
                            >

                        </a>

                    </div>


                    <!-- PRODUCT INFORMATION -->

                    <div class="product-info">

                        <h4>

                            <a href="ProductDetail.html?id=${encodeURIComponent(product.id)}"
                                style="color:inherit;text-decoration:none">${escapeHTML(product.name)}</a>

                        </h4>


                        <!-- RATING -->

                        <div class="product-rating">

                            ${stars}

                            <span>

                                (${escapeHTML(product.reviews || 0)})

                            </span>

                        </div>


                        <!-- DESCRIPTION -->

                        <p class="product-description">

                            ${escapeHTML(product.description || "")}

                        </p>


                        <!-- PRICE -->

                        <div class="product-price">

                            ₹${Number(product.price || 0).toFixed(2)}

                            <small>

                                / ${escapeHTML(product.weight || "")}

                            </small>

                        </div>


                        <!-- ADD TO CART -->

                        <button
                            class="add-cart-btn"
                            type="button"
                            onclick="addToCart('${escapeAttribute(product.id)}')"
                        >

                            <i class="bi bi-cart-plus"></i>

                            ADD TO CART

                        </button>

                    </div>

                </div>

            </div>

        `;

        productGrid.insertAdjacentHTML("beforeend", productHTML);

    });

    loadWishlist();

    /* clicking a card (not a button or link) opens the product details page */
    if (!productGrid.dataset.detailClick) {

        productGrid.dataset.detailClick = "true";

        productGrid.addEventListener("click", function (event) {

            const card = event.target.closest(".product-card");

            if (
                card &&
                card.dataset.detailUrl &&
                !event.target.closest("button, a")
            ) {
                window.location.href = card.dataset.detailUrl;
            }

        });

    }

}


/* =========================================================
   WISHLIST
========================================================= */

function getWishlist() {

    try {

        return JSON.parse(localStorage.getItem("wishlist")) || [];

    }

    catch (error) {

        return [];

    }

}


/* =========================================================
   LOAD WISHLIST
========================================================= */

function loadWishlist() {

    const wishlist = getWishlist();

    document
        .querySelectorAll(".wishlist-btn")
        .forEach(function (btn) {

            const productId = String(btn.dataset.id);

            if (wishlist.includes(productId)) {

                btn.classList.add("active");

                btn.innerHTML = '<i class="bi bi-heart-fill"></i>';

            }

            else {

                btn.classList.remove("active");

                btn.innerHTML = '<i class="bi bi-heart"></i>';

            }

            btn.onclick = function (event) {

                event.preventDefault();

                event.stopPropagation();

                toggleWishlist(productId);

            };

        });

    updateWishlistCount(wishlist.length);

}


/* =========================================================
   TOGGLE WISHLIST
========================================================= */

function toggleWishlist(productId) {

    let wishlist = getWishlist();

    productId = String(productId);

    const index = wishlist.indexOf(productId);

    if (index === -1) {

        wishlist.push(productId);

        alert("Product added to your wishlist.");

    }

    else {

        wishlist.splice(index, 1);

        alert("Product removed from your wishlist.");

    }

    localStorage.setItem("wishlist", JSON.stringify(wishlist));

    loadWishlist();

}


/* =========================================================
   WISHLIST COUNT
========================================================= */

function updateWishlistCount(count) {

    const headerWishlistCount =
        document.getElementById("headerWishlistCount");

    const sidebarWishlistCount =
        document.getElementById("sidebarWishlistCount");

    if (headerWishlistCount) {
        headerWishlistCount.textContent = count;
    }

    if (sidebarWishlistCount) {
        sidebarWishlistCount.textContent = count;
    }

}


/* =========================================================
   HEADER WISHLIST BUTTON
========================================================= */

function setupWishlistButton() {

    const headerWishlistButton =
        document.getElementById("headerWishlistButton");

    if (!headerWishlistButton) return;

    headerWishlistButton.addEventListener("click", function () {

        const wishlist = getWishlist();

        if (wishlist.length === 0) {

            alert("Your wishlist is empty.");

            return;

        }

        const wishlistProducts =
            products.filter(function (product) {

                return wishlist.includes(String(product.id));

            });

        displayProducts(wishlistProducts);

        const productSection = document.getElementById("products");

        if (productSection) {

            productSection.scrollIntoView({
                behavior: "smooth"
            });

        }

    });

}


/* =========================================================
   CART - SAVE
========================================================= */

function saveCart() {

    localStorage.setItem("sheernCart", JSON.stringify(cart));

}


/* =========================================================
   ADD TO CART
   Accepts either a product id or a whole product object
   (the Hampers page sends an object).
========================================================= */

function addToCart(productOrId) {

    const product =
        (productOrId && typeof productOrId === "object")
            ? productOrId
            : products.find(function (item) {

                return String(item.id) === String(productOrId);

            });

    if (!product) {

        console.error("Product not found:", productOrId);

        return;

    }

    const existingProduct =
        cart.find(function (item) {

            return String(item.id) === String(product.id);

        });

    if (existingProduct) {

        existingProduct.quantity =
            (Number(existingProduct.quantity) || 0) + 1;

    }

    else {

        cart.push({

            ...product,

            quantity: 1

        });

    }

    saveCart();

    updateCart();

    showAddedMessage(product.name);

}


/* =========================================================
   UPDATE CART
========================================================= */

function updateCart() {

    const cartItems = document.getElementById("cartItems");

    const cartCount = document.getElementById("headerCartCount");

    const cartTotal = document.getElementById("cartTotal");

    let totalItems = 0;

    let totalPrice = 0;

    cart.forEach(function (item) {

        totalItems += Number(item.quantity) || 0;

        totalPrice +=
            Number(item.price || 0) *
            Number(item.quantity || 0);

    });

    if (cartCount) {
        cartCount.textContent = totalItems;
    }

    if (cartTotal) {
        cartTotal.textContent = "₹" + totalPrice.toFixed(2);
    }

    if (!cartItems) return;

    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                <i class="bi bi-cart-x"></i>

                <p>
                    Your cart is empty.
                </p>

            </div>

        `;

        return;

    }

    cartItems.innerHTML = "";

    cart.forEach(function (item) {

        cartItems.insertAdjacentHTML(
            "beforeend",
            `

            <div class="cart-product">

                <img
                    src="${escapeAttribute(item.image)}"
                    alt="${escapeAttribute(item.name)}"
                    onerror="this.src='Photos/Logo.png'"
                >


                <div class="cart-product-info">

                    <h6>

                        ${escapeHTML(item.name)}

                    </h6>

                    <p>

                        ₹${Number(item.price || 0).toFixed(2)}

                        ×

                        ${Number(item.quantity)}

                    </p>

                </div>


                <div class="cart-quantity">

                    <button
                        class="btn btn-sm btn-light"
                        type="button"
                        onclick="changeQuantity('${escapeAttribute(item.id)}', -1)"
                    >

                        −

                    </button>


                    <span class="mx-2">

                        ${Number(item.quantity)}

                    </span>


                    <button
                        class="btn btn-sm btn-light"
                        type="button"
                        onclick="changeQuantity('${escapeAttribute(item.id)}', 1)"
                    >

                        +

                    </button>

                </div>


                <button
                    class="remove-cart"
                    type="button"
                    onclick="removeFromCart('${escapeAttribute(item.id)}')"
                >

                    <i class="bi bi-trash"></i>

                    Remove

                </button>

            </div>

            `
        );

    });

}


/* =========================================================
   CHANGE CART QUANTITY
========================================================= */

function changeQuantity(productId, change) {

    const product =
        cart.find(function (item) {

            return String(item.id) === String(productId);

        });

    if (!product) return;

    product.quantity =
        Number(product.quantity) + Number(change);

    if (product.quantity <= 0) {

        cart =
            cart.filter(function (item) {

                return String(item.id) !== String(productId);

            });

    }

    saveCart();

    updateCart();

}


/* =========================================================
   REMOVE FROM CART
========================================================= */

function removeFromCart(productId) {

    cart =
        cart.filter(function (item) {

            return String(item.id) !== String(productId);

        });

    saveCart();

    updateCart();

}


/* =========================================================
   CART MESSAGE
========================================================= */

function showAddedMessage(productName) {

    alert(productName + " has been added to your cart.");

}


/* =========================================================
   SEARCH PRODUCTS
========================================================= */

function searchProducts() {

    const searchInput = document.getElementById("searchInput");

    const searchResults = document.getElementById("searchResults");

    if (!searchInput) return;

    const searchText = searchInput.value.trim().toLowerCase();

    if (searchText === "") {

        displayProducts(products);

        if (searchResults) {

            searchResults.innerHTML = `

                <p class="search-hint">

                    <i class="bi bi-info-circle"></i>

                    Search for your favorite
                    dry fruits.

                </p>

            `;

        }

        return;

    }

    const results =
        products.filter(function (product) {

            return (

                String(product.name || "").toLowerCase().includes(searchText)

                ||

                String(product.description || "").toLowerCase().includes(searchText)

                ||

                String(product.badge || "").toLowerCase().includes(searchText)

                ||

                String(product.weight || "").toLowerCase().includes(searchText)

                ||

                String(product.category || "").toLowerCase().includes(searchText)

            );

        });

    displayProducts(results);

    if (searchResults) {

        if (results.length === 0) {

            searchResults.innerHTML = `

                <p class="search-hint">

                    No products found.

                </p>

            `;

        }

        else {

            searchResults.innerHTML = `

                <p class="search-result-title">

                    ${results.length}
                    product(s) found.

                </p>

            `;

        }

    }

}


/* =========================================================
   CATEGORY FILTER
========================================================= */

function filterByCategory(category) {

    const results =
        products.filter(function (product) {

            return (
                String(product.category || "").trim().toLowerCase()
                ===
                String(category || "").trim().toLowerCase()
            );

        });

    displayProducts(results);

    const productSection = document.getElementById("products");

    if (productSection) {

        productSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}


/* =========================================================
   CATEGORY ARROWS
========================================================= */

function setupCategoryArrows() {

    const categorySlider = document.getElementById("categorySlider");

    const categoryPrev = document.getElementById("categoryPrev");

    const categoryNext = document.getElementById("categoryNext");

    if (!categorySlider) return;

    if (categoryPrev) {

        categoryPrev.addEventListener("click", function () {

            categorySlider.scrollBy({

                left: -450,

                behavior: "smooth"

            });

        });

    }

    if (categoryNext) {

        categoryNext.addEventListener("click", function () {

            categorySlider.scrollBy({

                left: 450,

                behavior: "smooth"

            });

        });

    }

}


/* =========================================================
   SEARCH BUTTON + ENTER + LIVE SEARCH
========================================================= */

function setupSearch() {

    const searchButton = document.getElementById("searchSubmitButton");

    const searchInput = document.getElementById("searchInput");

    if (searchButton) {

        searchButton.addEventListener("click", searchProducts);

    }

    if (!searchInput) return;

    searchInput.addEventListener("keydown", function (event) {

        if (event.key === "Enter") {

            event.preventDefault();

            searchProducts();

        }

    });

    searchInput.addEventListener("input", function () {

        const value = this.value.trim();

        if (value.length >= 2) {

            searchProducts();

        }

        else if (value === "") {

            displayProducts(products);

            const searchResults = document.getElementById("searchResults");

            if (searchResults) {

                searchResults.innerHTML = `

                    <p class="search-hint">

                        <i class="bi bi-info-circle"></i>

                        Search for your favorite
                        dry fruits.

                    </p>

                `;

            }

        }

    });

}


/* =========================================================
   SIDEBAR
========================================================= */

function setupSidebar() {

    const SIDE_toggle = document.getElementById("SIDE_toggle");

    const sideNavbar = document.getElementById("sideNavbar");

    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (!SIDE_toggle || !sideNavbar) {

        console.error("Sidebar elements not found.");

        return;

    }

    SIDE_toggle.addEventListener("click", function () {

        const isOpen = sideNavbar.classList.toggle("open");

        if (sidebarOverlay) {

            sidebarOverlay.classList.toggle("show", isOpen);

        }

        SIDE_toggle.classList.toggle("menu-open", isOpen);

        SIDE_toggle.setAttribute("aria-expanded", isOpen);

    });

    if (sidebarOverlay) {

        sidebarOverlay.addEventListener("click", closeSidebar);

    }

    /*
        Close sidebar when clicking
        a sidebar link.
    */

    document
        .querySelectorAll(".sidebar-menu a, .sidebar-bottom a")
        .forEach(function (link) {

            link.addEventListener("click", function () {

                /*
                    Do not close the Shop button.
                */

                if (this.id === "shopSideBtn") {
                    return;
                }

                closeSidebar();

            });

        });

    function closeSidebar() {

        sideNavbar.classList.remove("open");

        if (sidebarOverlay) {

            sidebarOverlay.classList.remove("show");

        }

        SIDE_toggle.classList.remove("menu-open");

        SIDE_toggle.setAttribute("aria-expanded", "false");

    }

}


/* =========================================================
   SIDEBAR SHOP DROPDOWN
========================================================= */

function setupShopSidebar() {

    const shopSideBtn = document.getElementById("shopSideBtn");

    const shopSubmenu = document.getElementById("shopSubmenu");

    if (!shopSideBtn || !shopSubmenu) {
        return;
    }

    shopSideBtn.addEventListener("click", function (event) {

        event.preventDefault();

        shopSubmenu.classList.toggle("active");

        shopSideBtn.classList.toggle("active");

    });

}


/* =========================================================
   CHECKOUT
========================================================= */

function checkout() {

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;

    }

    /*
        Check login.
    */

    const user = getLoggedInUser();

    if (!user) {

        alert("Please login to your account before checkout.");

        window.location.href = "Login.html";

        return;

    }

    /* make sure the checkout page receives the current cart */
    saveCart();

    window.location.href = "CheckOut.html";

}


/* =========================================================
   CHECKOUT BUTTON
========================================================= */

function setupCheckout() {

    const checkoutButton =
        document.getElementById("checkoutButton") ||
        document.getElementById("CHEACKOUTBUTTON");

    if (checkoutButton) {

        checkoutButton.addEventListener("click", checkout);

    }

}


/* =========================================================
   ACCOUNT
========================================================= */

function getLoggedInUser() {

    /* auth.js keeps the login in sessionStorage ("sheernSession") */
    if (window.Sheern && typeof Sheern.getSession === "function") {

        const session = Sheern.getSession();

        if (session) {
            return session;
        }

    }

    const possibleKeys = [

        "sheernSession",
        "sheernLoggedInUser",
        "sheernUser",
        "loggedInUser",
        "currentUser",
        "user",
        "userData"

    ];

    for (let i = 0; i < possibleKeys.length; i++) {

        const key = possibleKeys[i];

        const storedUser =
            localStorage.getItem(key) ||
            sessionStorage.getItem(key);

        if (!storedUser) continue;

        try {

            const user = JSON.parse(storedUser);

            if (user) {

                return user;

            }

        }

        catch (error) {

        }

    }

    return null;

}


/* =========================================================
   GET USER NAME
========================================================= */

function getUserName(user) {

    if (!user) {

        return "Login";

    }

    return (
        user.name ||
        user.fullName ||
        user.username ||
        user.firstName ||
        user.email ||
        "Account"
    );

}


/* =========================================================
   GET USER AVATAR
========================================================= */

function getUserAvatar(user) {

    if (!user) return "";

    return (
        user.avatar ||
        user.photo ||
        user.profileImage ||
        user.image ||
        ""
    );

}


/* =========================================================
   UPDATE ACCOUNT UI
========================================================= */

function updateAccountUI() {

    const accountButton = document.getElementById("headerLoginButton");

    const accountButtonName = document.getElementById("accountButtonName");

    const accountName = document.getElementById("accountName");

    const accountStatus = document.getElementById("accountStatus");

    const loginDropdownLink = document.getElementById("loginDropdownLink");

    const registerDropdownLink = document.getElementById("registerDropdownLink");

    const logoutButton = document.getElementById("logoutButton");

    if (!accountButton) return;

    const user = getLoggedInUser();

    /* logged in through auth.js: let it draw the avatar and the name */
    if (user && window.Sheern && typeof Sheern.updateAccountUI === "function") {

        Sheern.updateAccountUI();

        return;

    }

    /*
        USER IS LOGGED IN
    */

    if (user) {

        const userName = getUserName(user);

        if (accountButtonName) {
            accountButtonName.textContent = userName;
        }

        if (accountName) {
            accountName.textContent = userName;
        }

        if (accountStatus) {
            accountStatus.textContent = "Welcome back!";
        }

        if (loginDropdownLink) {
            loginDropdownLink.classList.add("d-none");
        }

        if (registerDropdownLink) {
            registerDropdownLink.classList.add("d-none");
        }

        if (logoutButton) {
            logoutButton.classList.remove("d-none");
        }

    }

    else {

        if (accountButtonName) {
            accountButtonName.textContent = "Login";
        }

        if (accountName) {
            accountName.textContent = "My Account";
        }

        if (accountStatus) {
            accountStatus.textContent = "Welcome to Sheern";
        }

        if (loginDropdownLink) {
            loginDropdownLink.classList.remove("d-none");
        }

        if (registerDropdownLink) {
            registerDropdownLink.classList.remove("d-none");
        }

        if (logoutButton) {
            logoutButton.classList.add("d-none");
        }

    }

}


/* =========================================================
   ACCOUNT DROPDOWN
========================================================= */

function setupAccountDropdown() {

    const accountButton = document.getElementById("headerLoginButton");

    const accountDropdown = document.getElementById("accountDropdown");

    const logoutButton = document.getElementById("logoutButton");

    if (!accountButton || !accountDropdown) {

        console.error("Account elements not found.");

        return;

    }

    accountButton.addEventListener("click", function (event) {

        event.preventDefault();

        event.stopPropagation();

        const isOpen = accountDropdown.classList.toggle("show");

        accountButton.setAttribute("aria-expanded", isOpen);

    });

    /*
        PREVENT DROPDOWN CLICKS
        FROM CLOSING IT.
    */

    accountDropdown.addEventListener("click", function (event) {

        event.stopPropagation();

    });

    /*
        CLOSE WHEN CLICKING OUTSIDE
    */

    document.addEventListener("click", function () {

        accountDropdown.classList.remove("show");

        accountButton.setAttribute("aria-expanded", "false");

    });

    /* when auth.js is on the page, it already handles the logout button */
    if (logoutButton && !window.Sheern) {

        logoutButton.addEventListener("click", function (event) {

            event.preventDefault();

            [
                "sheernUser",
                "loggedInUser",
                "currentUser",
                "user",
                "userData"
            ].forEach(function (key) {

                localStorage.removeItem(key);

                sessionStorage.removeItem(key);

            });

            updateAccountUI();

            accountDropdown.classList.remove("show");

            accountButton.setAttribute("aria-expanded", "false");

            alert("You have been logged out.");

        });

    }

}


/* =========================================================
   HTML SAFETY HELPERS
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =========================================================
   INITIALIZE WEBSITE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    console.log("Sheern website JavaScript started.");

    setupWishlistButton();

    setupCategoryArrows();

    setupSearch();

    setupSidebar();

    setupShopSidebar();

    setupCheckout();

    setupAccountDropdown();

    updateAccountUI();

    loadProducts();

});
(function () {
    const feedbacks = [
        {
            title: "Premium Quality in Every Bite",
            text: "The quality and freshness of Sheern's dry fruits make every bite special. Truly a premium experience.",
            name: "Sharara Naderi",
            job: "Verified Customer",
            rating: 5,
            image: "Photos/flag.png",
            profile: "Photos/feedback2.jpeg"
        },
        {
            title: "Fresh and Beautifully Packed",
            text: "Everything arrived fresh, crunchy and neatly packed. The almonds and cashews are the best I have bought online.",

            name: "Anahita Samadi",
            job: "Verified Customer",
            rating: 5,
            image: "Photos/flag.png",
            profile: "Photos/feedback1.jpeg"
        },
        {
            title: "My Family's Favourite",
            text: "We order Sheern every month now. The taste is natural, the delivery is quick, and the prices are fair for this quality.",
            name: "Madhina Qazizada",
            job: "Verified Customer",
            rating: 4,
            image: "Photos/flag.png",
            profile: "Photos/feedback3.jpeg"
        }
    ];

    const box = document.getElementById("fbContent");
    if (!box) return;

    const el = id => document.getElementById(id);
    let index = 0;
    let timer;

    function show(i) {
        index = (i + feedbacks.length) % feedbacks.length;
        const f = feedbacks[index];

        box.classList.add("fade");

        setTimeout(() => {
            el("fbImage").src = f.image;
            el("fbProfile").src = f.profile;
            el("fbTitle").textContent = f.title;
            el("fbDescription").textContent = f.text;
            el("fbName").textContent = f.name;
            el("fbJob").textContent = f.job;
            el("fbStars").textContent = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
            box.classList.remove("fade");
        }, 250);
    }

    function restart() {
        clearInterval(timer);
        timer = setInterval(() => show(index + 1), 7000);
    }

    el("fbPrev").addEventListener("click", () => { show(index - 1); restart(); });
    el("fbNext").addEventListener("click", () => { show(index + 1); restart(); });

    show(0);
    restart();
})();

/* =========================================================
   SHEERN - PRODUCT PAGINATION
   Load AFTER Dry.js:  <script src="JS/Pagination.js"></script>
========================================================= */

(function () {
    "use strict";

    var grid = document.getElementById("productGrid");
    if (!grid) return;

    function perPage() {
        return window.innerWidth >= 992 ? 10 : 6;
    }

    var nav = document.getElementById("productPagination");

    if (!nav) {
        nav = document.createElement("nav");
        nav.id = "productPagination";
        nav.className = "product-pagination";
        nav.setAttribute("aria-label", "Product pages");

        var holder = grid.closest(".container-fluid") || grid.parentElement;
        holder.insertAdjacentElement("beforeend", nav);
    }

    var currentPage = 1;
    var lastSignature = "";
    var queued = false;

    function visibleItems() {
        return Array.prototype.filter.call(grid.children, function (el) {
            return !el.hidden &&
                el.style.display !== "none" &&
                !el.classList.contains("d-none");
        });
    }

    function pageList(current, total) {
        var pages = [];
        for (var i = 1; i <= total; i++) {
            if (i === 1 || i === total || Math.abs(i - current) <= 1) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== "...") {
                pages.push("...");
            }
        }
        return pages;
    }

    function scrollToProducts() {
        var section = document.getElementById("products");
        if (!section) return;

        var promo = document.querySelector(".sheern-promo-bar");
        var header = document.querySelector(".sheern-header");
        var offset = (promo ? promo.offsetHeight : 0) + (header ? header.offsetHeight : 0);

        var top = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: "smooth" });
    }

    function goTo(page) {
        currentPage = page;
        render();
        scrollToProducts();
    }

    function render() {
        queued = false;

        var items = visibleItems();
        var size = perPage();
        var total = Math.max(1, Math.ceil(items.length / size));

        // new result set (filter / search / fresh load) -> back to page 1
        var signature = items.length + "|" +
            (items[0] ? items[0].textContent.replace(/\s+/g, " ").trim().slice(0, 40) : "");

        if (signature !== lastSignature) {
            currentPage = 1;
            lastSignature = signature;
        }

        if (currentPage > total) currentPage = total;

        var start = (currentPage - 1) * size;
        var end = start + size;

        items.forEach(function (el, index) {
            el.classList.toggle("page-hidden", index < start || index >= end);
        });

        buildNav(items.length, total, start, Math.min(end, items.length));
    }

    function buildNav(count, total, start, end) {
        nav.innerHTML = "";

        if (total <= 1) {
            nav.style.display = "none";
            return;
        }

        nav.style.display = "";

        var info = document.createElement("p");
        info.className = "pagination-info";
        info.textContent = "Showing " + (start + 1) + "-" + end + " of " + count + " products";

        var list = document.createElement("ul");
        list.className = "pagination-list";

        function addButton(label, page, options) {
            options = options || {};

            var li = document.createElement("li");
            var btn = document.createElement("button");

            btn.type = "button";
            btn.className = "page-btn" + (options.active ? " active" : "");
            btn.innerHTML = label;
            btn.disabled = !!options.disabled;

            if (options.aria) btn.setAttribute("aria-label", options.aria);
            if (options.active) btn.setAttribute("aria-current", "page");

            if (!options.disabled && !options.active) {
                btn.addEventListener("click", function () { goTo(page); });
            }

            li.appendChild(btn);
            list.appendChild(li);
        }

        addButton('<i class="bi bi-chevron-left"></i>', currentPage - 1, {
            disabled: currentPage === 1, aria: "Previous page"
        });

        pageList(currentPage, total).forEach(function (p) {
            if (p === "...") {
                var li = document.createElement("li");
                li.className = "page-dots";
                li.textContent = "...";
                list.appendChild(li);
            } else {
                addButton(String(p), p, { active: p === currentPage, aria: "Page " + p });
            }
        });

        addButton('<i class="bi bi-chevron-right"></i>', currentPage + 1, {
            disabled: currentPage === total, aria: "Next page"
        });

        nav.appendChild(list);
        nav.appendChild(info);
    }

    /* ---------- keep in sync with Dry.js ---------- */

    function queueRender() {
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(render);
    }

    new MutationObserver(queueRender).observe(grid, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "hidden"]
    });

    // page size changes between desktop and mobile
    var resizeTimer;
    window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 150);
    });

    render();
})();