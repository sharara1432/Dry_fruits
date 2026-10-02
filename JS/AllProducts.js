"use strict";

console.log("Sheern AllProducts.js loaded successfully.");

/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let products = [];
let filteredProducts = [];

let currentPage = 1;

const productsPerPage = 8;

let selectedRating = 0;

let showingWishlist = false;


/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const CART_KEY = "sheernCart";
const OLD_CART_KEY = "cart";
const WISHLIST_KEY = "wishlist";
const REVIEWS_KEY = "sheernCustomerReviews";


/* =========================================================
   LOCAL STORAGE HELPER
========================================================= */

function readLocalStorage(key, fallback = []) {

    try {

        const rawData = localStorage.getItem(key);

        if (!rawData) {
            return fallback;
        }

        const data = JSON.parse(rawData);

        return Array.isArray(data)
            ? data
            : fallback;

    } catch (error) {

        console.error(
            `Error reading ${key}:`,
            error
        );

        return fallback;
    }
}


/* =========================================================
   SAFE HTML HELPER
========================================================= */

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent =
        value === null || value === undefined
            ? ""
            : String(value);

    return div.innerHTML;
}


/* =========================================================
   PRICE FORMATTER
========================================================= */

function formatPrice(price) {

    const number = Number(price) || 0;

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* =========================================================
   CART
========================================================= */

let cart = readLocalStorage(
    CART_KEY,
    readLocalStorage(
        OLD_CART_KEY,
        []
    )
);


/* =========================================================
   WISHLIST
========================================================= */

let wishlist = readLocalStorage(
    WISHLIST_KEY,
    []
);


/* =========================================================
   REVIEW SYSTEM
========================================================= */

let selectedReviewRating = 0;


/* =========================================================
   DOM ELEMENTS
========================================================= */

let productsGrid;
let productsEmpty;
let productsPagination;
let paginationNumbers;
let productsResult;

let productSearch;
let categoryFilter;
let sortProducts;
let ratingFilter;

let clearFilters;
let emptyClearButton;

let previousPage;
let nextPage;

let headerCartCount;
let headerWishlistCount;
let sidebarWishlistCount;

let cartItems;
let cartTotal;

let searchButton;
let searchInput;

let SIDE_toggle;
let sideNavbar;
let sidebarOverlay;

let shopSideBtn;
let shopSubmenu;

let headerWishlistButton;


/* =========================================================
   ACCOUNT DOM ELEMENTS
========================================================= */

let headerLoginButton;
let accountDropdown;

let accountButtonName;
let accountName;

let loginDropdownLink;
let registerDropdownLink;
let logoutButton;


/* =========================================================
   INITIALIZE DOM
========================================================= */

function initializeDOM() {

    /* =====================================================
       PRODUCTS
    ===================================================== */

    productsGrid =
        document.getElementById("productsGrid");

    productsEmpty =
        document.getElementById("productsEmpty");

    productsPagination =
        document.getElementById("productsPagination");

    paginationNumbers =
        document.getElementById("paginationNumbers");

    productsResult =
        document.getElementById("productsResult");


    productSearch =
        document.getElementById("productSearch");

    categoryFilter =
        document.getElementById("categoryFilter");

    sortProducts =
        document.getElementById("sortProducts");

    ratingFilter =
        document.getElementById("ratingFilter");


    clearFilters =
        document.getElementById("clearFilters");

    emptyClearButton =
        document.getElementById("emptyClearButton");


    previousPage =
        document.getElementById("previousPage");

    nextPage =
        document.getElementById("nextPage");


    /* =====================================================
       HEADER
    ===================================================== */

    headerCartCount =
        document.getElementById("headerCartCount");

    headerWishlistCount =
        document.getElementById("headerWishlistCount");

    sidebarWishlistCount =
        document.getElementById("sidebarWishlistCount");


    /* =====================================================
       CART
    ===================================================== */

    cartItems =
        document.getElementById("cartItems");

    cartTotal =
        document.getElementById("cartTotal");


    /* =====================================================
       SEARCH
    ===================================================== */

    searchButton =
        document.getElementById("headerSearchButton");

    searchInput =
        document.getElementById("searchInput");


    /* =====================================================
       SIDEBAR
    ===================================================== */

    SIDE_toggle =
        document.getElementById("SIDE_toggle");

    sideNavbar =
        document.getElementById("sideNavbar");

    sidebarOverlay =
        document.getElementById("sidebarOverlay");

    shopSideBtn =
        document.getElementById("shopSideBtn");

    shopSubmenu =
        document.getElementById("shopSubmenu");


    /* =====================================================
       WISHLIST
    ===================================================== */

    headerWishlistButton =
        document.getElementById("headerWishlistButton");


    /* =====================================================
       ACCOUNT
    ===================================================== */

    headerLoginButton =
        document.getElementById("headerLoginButton");

    accountDropdown =
        document.getElementById("accountDropdown");

    accountButtonName =
        document.getElementById("accountButtonName");

    accountName =
        document.getElementById("accountName");

    loginDropdownLink =
        document.getElementById("loginDropdownLink");

    registerDropdownLink =
        document.getElementById("registerDropdownLink");

    logoutButton =
        document.getElementById("logoutButton");
}


/* =========================================================
   LOAD PRODUCTS FROM JSON
========================================================= */

async function loadProducts() {

    const jsonPath = "./DATA/products.json";

    try {

        console.log(
            "Loading products from:",
            jsonPath
        );

        console.log(
            "Current page:",
            window.location.href
        );


        const response =
            await fetch(jsonPath);


        console.log(
            "Products response:",
            response
        );


        if (!response.ok) {

            throw new Error(
                `Could not load products.json. HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        console.log(
            "Products JSON:",
            data
        );


        /* =================================================
           JSON MUST BE AN ARRAY
        ================================================= */

        if (!Array.isArray(data)) {

            throw new Error(
                "products.json must contain a JSON array."
            );
        }


        products = data;

        filteredProducts = [...products];


        console.log(
            `Successfully loaded ${products.length} products.`
        );


        /* =================================================
           DISPLAY CATEGORIES
        ================================================= */

        displayCategories();


        /* =================================================
           APPLY URL FILTER
        ================================================= */

        applyURLFilters();


        /* =================================================
           APPLY FILTERS
        ================================================= */

        applyFilters();


        /* =================================================
           CART
        ================================================= */

        updateCart();


        /* =================================================
           WISHLIST
        ================================================= */

        updateWishlistCount();

    }

    catch (error) {

        console.error(
            "PRODUCT LOADING ERROR:",
            error
        );


        if (productsGrid) {

            productsGrid.style.display = "grid";


            productsGrid.innerHTML = `

                <div class="no-products">

                    <i class="bi bi-exclamation-circle"></i>

                    <h3>
                        Products Could Not Be Loaded
                    </h3>

                    <p>
                        ${escapeHTML(error.message)}
                    </p>

                    <p>
                        Please check:
                        <strong>
                            ./DATA/products.json
                        </strong>
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

    if (!categoryFilter) {
        return;
    }


    const categories = [
        ...new Set(
            products
                .map(product =>
                    String(
                        product.category || ""
                    ).trim()
                )
                .filter(category =>
                    category !== ""
                )
        )
    ];


    categories.sort(
        (a, b) =>
            a.localeCompare(b)
    );


    categoryFilter.innerHTML = `

        <option value="all">
            All Categories
        </option>

    `;


    categories.forEach(category => {

        const option =
            document.createElement("option");


        option.value =
            category;


        option.textContent =
            category;


        categoryFilter.appendChild(
            option
        );

    });
}


/* =========================================================
   URL FILTERS
========================================================= */

function applyURLFilters() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const urlCategory =
        params.get("category");


    if (
        urlCategory &&
        categoryFilter
    ) {

        const matchingOption =
            Array.from(
                categoryFilter.options
            ).find(
                option =>
                    option.value.toLowerCase() ===
                    urlCategory.toLowerCase()
            );


        if (matchingOption) {

            categoryFilter.value =
                matchingOption.value;
        }
    }
}


/* =========================================================
   CUSTOMER REVIEW DATA
========================================================= */

function getCustomerReviewsForProduct(productId) {

    const reviews =
        readLocalStorage(
            REVIEWS_KEY,
            []
        );


    return reviews.filter(review =>
        String(review.productId) ===
        String(productId)
    );
}


/* =========================================================
   PRODUCT RATING DATA
========================================================= */

function getProductRatingData(product) {

    const baseRating =
        Number(product.rating) || 0;

    const baseReviews =
        Number(product.reviews) || 0;


    const customerReviews =
        getCustomerReviewsForProduct(
            product.id
        );


    if (customerReviews.length === 0) {

        return {
            rating: baseRating,
            count: baseReviews
        };
    }


    const customerTotal =
        customerReviews.reduce(
            (sum, review) =>
                sum +
                (Number(review.rating) || 0),
            0
        );


    const totalCount =
        baseReviews +
        customerReviews.length;


    const totalRating =
        (baseRating * baseReviews) +
        customerTotal;


    return {

        rating:
            totalCount > 0
                ? totalRating / totalCount
                : 0,

        count:
            totalCount
    };
}


/* =========================================================
   APPLY FILTERS
========================================================= */

function applyFilters() {

    const searchValue =
        productSearch?.value
            ?.trim()
            ?.toLowerCase() || "";


    const categoryValue =
        categoryFilter?.value ||
        "all";


    const categoryFilterValue =
        String(categoryValue)
            .toLowerCase();


    filteredProducts =
        products.filter(product => {

            const name =
                String(
                    product.name || ""
                ).toLowerCase();


            const description =
                String(
                    product.description || ""
                ).toLowerCase();


            const category =
                String(
                    product.category || ""
                ).toLowerCase();


            const badge =
                String(
                    product.badge || ""
                ).toLowerCase();


            const weight =
                String(
                    product.weight || ""
                ).toLowerCase();


            const searchMatches =

                !searchValue ||

                name.includes(
                    searchValue
                ) ||

                description.includes(
                    searchValue
                ) ||

                category.includes(
                    searchValue
                ) ||

                badge.includes(
                    searchValue
                ) ||

                weight.includes(
                    searchValue
                );


            const categoryMatches =

                categoryFilterValue === "all" ||

                category ===
                categoryFilterValue;


            const ratingData =
                getProductRatingData(
                    product
                );


            const productRating =
                Number(
                    ratingData.rating
                ) || 0;


            const ratingMatches =

                selectedRating === 0 ||

                productRating >=
                selectedRating;


            return (
                searchMatches &&
                categoryMatches &&
                ratingMatches
            );

        });


    applySorting();


    currentPage = 1;


    displayProducts(
        filteredProducts
    );
}


/* =========================================================
   SORT PRODUCTS
========================================================= */

function applySorting() {

    if (!sortProducts) {
        return;
    }


    const sortValue =
        sortProducts.value;


    if (
        sortValue === "price-low" ||
        sortValue === "priceLow"
    ) {

        filteredProducts.sort(
            (a, b) =>
                Number(a.price || 0) -
                Number(b.price || 0)
        );

    }


    else if (
        sortValue === "price-high" ||
        sortValue === "priceHigh"
    ) {

        filteredProducts.sort(
            (a, b) =>
                Number(b.price || 0) -
                Number(a.price || 0)
        );

    }


    else if (
        sortValue === "rating-high" ||
        sortValue === "ratingHigh"
    ) {

        filteredProducts.sort(
            (a, b) =>
                getProductRatingData(b).rating -
                getProductRatingData(a).rating
        );

    }


    else if (
        sortValue === "name" ||
        sortValue === "nameAZ"
    ) {

        filteredProducts.sort(
            (a, b) =>
                String(a.name || "")
                    .localeCompare(
                        String(b.name || "")
                    )
        );

    }


    else if (
        sortValue === "nameZA"
    ) {

        filteredProducts.sort(
            (a, b) =>
                String(b.name || "")
                    .localeCompare(
                        String(a.name || "")
                    )
        );
    }
}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(productList) {

    if (!productsGrid) {

        console.error(
            "productsGrid was not found."
        );

        return;
    }


    productsGrid.innerHTML = "";


    const totalProducts =
        productList.length;


    /* =====================================================
       RESULT TEXT
    ===================================================== */

    if (productsResult) {

        if (showingWishlist) {

            productsResult.textContent =
                `Showing ${totalProducts} wishlist ${totalProducts === 1
                    ? "product"
                    : "products"
                }`;

        }

        else {

            productsResult.textContent =
                `Showing ${totalProducts} ${totalProducts === 1
                    ? "product"
                    : "products"
                }`;
        }
    }


    /* =====================================================
       EMPTY
    ===================================================== */

    if (totalProducts === 0) {

        productsGrid.style.display =
            "none";


        if (productsEmpty) {

            productsEmpty.hidden =
                false;
        }


        if (productsPagination) {

            productsPagination.style.display =
                "none";
        }


        return;
    }


    /* =====================================================
       SHOW GRID
    ===================================================== */

    productsGrid.style.display =
        "grid";


    if (productsEmpty) {

        productsEmpty.hidden =
            true;
    }


    /* =====================================================
       TOTAL PAGES
    ===================================================== */

    const totalPages =
        Math.ceil(
            totalProducts /
            productsPerPage
        );


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;
    }


    /* =====================================================
       PAGE SLICE
    ===================================================== */

    const startIndex =
        (currentPage - 1) *
        productsPerPage;


    const endIndex =
        startIndex +
        productsPerPage;


    const pageProducts =
        productList.slice(
            startIndex,
            endIndex
        );


    /* =====================================================
       CREATE CARDS
    ===================================================== */

    pageProducts.forEach(product => {

        const card =
            createProductCard(
                product
            );


        if (card) {

            productsGrid.appendChild(
                card
            );
        }

    });


    /* =====================================================
       PAGINATION
    ===================================================== */

    createPagination(
        totalPages
    );
}


/* =========================================================
   CREATE PRODUCT CARD
========================================================= */

function createProductCard(product) {

    if (!product) {
        return null;
    }


    const id =
        product.id;


    const name =
        product.name ||
        "Premium Dry Fruit";


    const image =
        product.image ||
        "Photos/MIX.jpg";


    const price =
        Number(
            product.price
        ) || 0;


    const weight =
        product.weight ||
        "";


    const description =
        product.description ||
        "";


    const category =
        product.category ||
        "Dry Fruits";


    const badge =
        product.badge ||
        "";


    const ratingData =
        getProductRatingData(
            product
        );


    const rating =
        Number(
            ratingData.rating
        ) || 0;


    const reviews =
        Number(
            ratingData.count
        ) || 0;


    const isWishlisted =
        wishlist.some(
            item =>
                String(item.id) ===
                String(id)
        );


    /* =====================================================
       CARD
    ===================================================== */

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    card.dataset.productId =
        id;


    /* =====================================================
       IMAGE WRAPPER
    ===================================================== */

    const imageWrapper =
        document.createElement(
            "div"
        );


    imageWrapper.className =
        "product-image-wrapper";


    /* =====================================================
       IMAGE
    ===================================================== */

    const productImage =
        document.createElement(
            "img"
        );


    productImage.src =
        image;


    productImage.alt =
        name;


    productImage.className =
        "product-image";


    productImage.loading =
        "lazy";


    productImage.onerror =
        function () {

            console.warn(
                "Product image could not be loaded:",
                image
            );

            this.onerror = null;

            this.src =
                "Photos/MIX.jpg";
        };


    imageWrapper.appendChild(
        productImage
    );


    /* =====================================================
       BADGE
    ===================================================== */

    if (badge) {

        const badgeElement =
            document.createElement(
                "span"
            );


        badgeElement.className =
            "product-badge";


        badgeElement.textContent =
            badge;


        imageWrapper.appendChild(
            badgeElement
        );
    }


    /* =====================================================
       WISHLIST BUTTON
    ===================================================== */

    const wishlistButton =
        document.createElement(
            "button"
        );


    wishlistButton.type =
        "button";


    wishlistButton.className =
        `wishlist-btn ${isWishlisted
            ? "active"
            : ""
        }`;


    wishlistButton.dataset.wishlistId =
        id;


    wishlistButton.setAttribute(
        "aria-label",
        isWishlisted
            ? "Remove from wishlist"
            : "Add to wishlist"
    );


    wishlistButton.title =
        isWishlisted
            ? "Remove from wishlist"
            : "Add to wishlist";


    const wishlistIcon =
        document.createElement(
            "i"
        );


    wishlistIcon.className =
        `bi ${isWishlisted
            ? "bi-heart-fill"
            : "bi-heart"
        }`;


    wishlistButton.appendChild(
        wishlistIcon
    );


    imageWrapper.appendChild(
        wishlistButton
    );


    /* =====================================================
       PRODUCT CONTENT
    ===================================================== */

    const productContent =
        document.createElement(
            "div"
        );


    productContent.className =
        "product-content";


    /* =====================================================
       CATEGORY
    ===================================================== */

    const categoryElement =
        document.createElement(
            "div"
        );


    categoryElement.className =
        "product-category";


    categoryElement.textContent =
        category;


    productContent.appendChild(
        categoryElement
    );


    /* =====================================================
       NAME
    ===================================================== */

    const productName =
        document.createElement(
            "h3"
        );


    productName.className =
        "product-name";


    productName.textContent =
        name;


    productContent.appendChild(
        productName
    );


    /* =====================================================
       DESCRIPTION
    ===================================================== */

    const productDescription =
        document.createElement(
            "p"
        );


    productDescription.className =
        "product-description";


    productDescription.textContent =
        description;


    productContent.appendChild(
        productDescription
    );


    /* =====================================================
       RATING
    ===================================================== */

    const productRating =
        document.createElement(
            "div"
        );


    productRating.className =
        "product-rating";


    const stars =
        document.createElement(
            "span"
        );


    stars.className =
        "stars";


    stars.innerHTML =
        createStars(
            rating
        );


    const ratingNumber =
        document.createElement(
            "span"
        );


    ratingNumber.className =
        "rating-number";


    ratingNumber.textContent =
        rating.toFixed(1);


    const reviewCount =
        document.createElement(
            "span"
        );


    reviewCount.className =
        "review-count";


    reviewCount.textContent =
        `(${reviews})`;


    productRating.appendChild(
        stars
    );


    productRating.appendChild(
        ratingNumber
    );


    productRating.appendChild(
        reviewCount
    );


    productContent.appendChild(
        productRating
    );


    /* =====================================================
       PRICE ROW
    ===================================================== */

    const priceRow =
        document.createElement(
            "div"
        );


    priceRow.className =
        "product-price-row";


    const productPrice =
        document.createElement(
            "div"
        );


    productPrice.className =
        "product-price";


    productPrice.textContent =
        `₹${formatPrice(price)}`;


    priceRow.appendChild(
        productPrice
    );


    if (weight) {

        const productWeight =
            document.createElement(
                "div"
            );


        productWeight.className =
            "product-weight";


        productWeight.textContent =
            weight;


        priceRow.appendChild(
            productWeight
        );
    }


    productContent.appendChild(
        priceRow
    );


    /* =====================================================
       ACTIONS
    ===================================================== */

    const productActions =
        document.createElement(
            "div"
        );


    productActions.className =
        "product-actions";


    /* =====================================================
       ADD TO CART
    ===================================================== */

    const cartButton =
        document.createElement(
            "button"
        );


    cartButton.type =
        "button";


    cartButton.className =
        "add-cart-btn";


    cartButton.dataset.cartId =
        id;


    const cartIcon =
        document.createElement(
            "i"
        );


    cartIcon.className =
        "bi bi-bag-plus";


    cartButton.appendChild(
        cartIcon
    );


    cartButton.appendChild(
        document.createTextNode(
            " Add to Cart"
        )
    );


    productActions.appendChild(
        cartButton
    );


    /* =====================================================
       REVIEW BUTTON
    ===================================================== */

    const reviewButton =
        document.createElement(
            "button"
        );


    reviewButton.type =
        "button";


    reviewButton.className =
        "review-btn";


    reviewButton.dataset.reviewId =
        id;


    reviewButton.setAttribute(
        "aria-label",
        `Give feedback for ${name}`
    );


    reviewButton.title =
        "Give Feedback";


    const reviewStar =
        document.createElement(
            "i"
        );


    reviewStar.className =
        "bi bi-star";


    reviewButton.appendChild(
        reviewStar
    );


    productActions.appendChild(
        reviewButton
    );


    productContent.appendChild(
        productActions
    );


    /* =====================================================
       APPEND EVERYTHING
    ===================================================== */

    card.appendChild(
        imageWrapper
    );


    card.appendChild(
        productContent
    );


    return card;
}


/* =========================================================
   CREATE STARS
========================================================= */

function createStars(rating) {

    const numericRating =
        Math.max(
            0,
            Math.min(
                5,
                Number(rating) || 0
            )
        );


    const fullStars =
        Math.floor(
            numericRating
        );


    const hasHalfStar =
        numericRating - fullStars >= 0.5;


    const emptyStars =
        5 -
        fullStars -
        (hasHalfStar ? 1 : 0);


    let stars = "";


    for (
        let i = 0;
        i < fullStars;
        i++
    ) {

        stars +=
            `<i class="bi bi-star-fill"></i>`;
    }


    if (hasHalfStar) {

        stars +=
            `<i class="bi bi-star-half"></i>`;
    }


    for (
        let i = 0;
        i < emptyStars;
        i++
    ) {

        stars +=
            `<i class="bi bi-star"></i>`;
    }


    return stars;
}


/* =========================================================
   REVIEW MODAL
========================================================= */

function openReviewModal(productId) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        console.error(
            "Product not found for review:",
            productId
        );

        return;
    }


    const modalElement =
        document.getElementById(
            "reviewModal"
        );


    if (!modalElement) {

        console.error(
            "reviewModal was not found."
        );

        return;
    }


    modalElement.dataset.productId =
        productId;


    const productNameElement =
        modalElement.querySelector(
            ".review-product-name"
        );


    if (productNameElement) {

        productNameElement.textContent =
            product.name;
    }


    selectedReviewRating =
        0;


    updateReviewStars();


    const reviewerName =
        document.getElementById(
            "reviewerName"
        );


    if (reviewerName) {

        reviewerName.value =
            "";
    }


    const reviewText =
        document.getElementById(
            "reviewText"
        );


    if (reviewText) {

        reviewText.value =
            "";
    }


    const reviewError =
        document.getElementById(
            "reviewError"
        );


    if (reviewError) {

        reviewError.textContent =
            "";

        reviewError.classList.remove(
            "success"
        );
    }


    if (
        window.bootstrap &&
        window.bootstrap.Modal
    ) {

        const modal =
            window.bootstrap.Modal
                .getOrCreateInstance(
                    modalElement
                );


        modal.show();

    }

    else {

        console.error(
            "Bootstrap Modal is not available."
        );
    }
}


/* =========================================================
   UPDATE REVIEW STARS
========================================================= */

function updateReviewStars() {

    const ratingContainer =
        document.getElementById(
            "ratingInput"
        );


    if (!ratingContainer) {
        return;
    }


    const ratingStars =
        ratingContainer.querySelectorAll(
            ".rating-star"
        );


    ratingStars.forEach(star => {

        const rating =
            Number(
                star.dataset.rating
            );


        const icon =
            star.querySelector("i");


        if (!icon) {
            return;
        }


        if (
            rating <=
            selectedReviewRating
        ) {

            icon.classList.remove(
                "bi-star"
            );

            icon.classList.add(
                "bi-star-fill"
            );

            star.classList.add(
                "selected"
            );

        }

        else {

            icon.classList.remove(
                "bi-star-fill"
            );

            icon.classList.add(
                "bi-star"
            );

            star.classList.remove(
                "selected"
            );
        }

    });
}


/* =========================================================
   SETUP REVIEW RATING
========================================================= */

function setupReviewRating() {

    const ratingContainer =
        document.getElementById(
            "ratingInput"
        );


    if (!ratingContainer) {
        return;
    }


    ratingContainer.addEventListener(
        "click",
        event => {

            const star =
                event.target.closest(
                    ".rating-star"
                );


            if (!star) {
                return;
            }


            selectedReviewRating =
                Number(
                    star.dataset.rating
                ) || 0;


            updateReviewStars();
        }
    );
}


/* =========================================================
   SUBMIT REVIEW
========================================================= */

function submitReview() {

    const modalElement =
        document.getElementById(
            "reviewModal"
        );


    if (!modalElement) {
        return;
    }


    const productId =
        modalElement.dataset.productId;


    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    const reviewerName =
        document.getElementById(
            "reviewerName"
        )?.value.trim() || "";


    const reviewText =
        document.getElementById(
            "reviewText"
        )?.value.trim() || "";


    const reviewError =
        document.getElementById(
            "reviewError"
        );


    if (reviewError) {

        reviewError.textContent =
            "";

        reviewError.classList.remove(
            "success"
        );
    }


    if (
        selectedReviewRating < 1
    ) {

        if (reviewError) {

            reviewError.textContent =
                "Please select a star rating.";
        }

        return;
    }


    if (!reviewerName) {

        if (reviewError) {

            reviewError.textContent =
                "Please enter your name.";
        }

        return;
    }


    if (!reviewText) {

        if (reviewError) {

            reviewError.textContent =
                "Please write your feedback.";
        }

        return;
    }


    const reviews =
        readLocalStorage(
            REVIEWS_KEY,
            []
        );


    reviews.push({

        productId:
            productId,

        productName:
            product?.name || "",

        name:
            reviewerName,

        rating:
            selectedReviewRating,

        comment:
            reviewText,

        date:
            new Date().toISOString()

    });


    localStorage.setItem(
        REVIEWS_KEY,
        JSON.stringify(
            reviews
        )
    );


    if (reviewError) {

        reviewError.textContent =
            "Thank you! Your feedback has been submitted.";

        reviewError.classList.add(
            "success"
        );
    }

    if (!showingWishlist) {

        applyFilters();

    }

    else {

        displayProducts(
            filteredProducts
        );
    }


    setTimeout(
        () => {

            if (
                window.bootstrap &&
                window.bootstrap.Modal
            ) {

                const modal =
                    window.bootstrap.Modal
                        .getOrCreateInstance(
                            modalElement
                        );


                modal.hide();
            }


            selectedReviewRating =
                0;


            updateReviewStars();

        },
        1000
    );
}


/* =========================================================
   PAGINATION
========================================================= */

function createPagination(totalPages) {

    if (
        !productsPagination ||
        !paginationNumbers
    ) {

        return;
    }


    if (totalPages <= 1) {

        productsPagination.style.display =
            "none";

        return;
    }


    productsPagination.style.display =
        "flex";


    paginationNumbers.innerHTML =
        "";


    if (previousPage) {

        previousPage.disabled =
            currentPage === 1;
    }


    if (nextPage) {

        nextPage.disabled =
            currentPage === totalPages;
    }


    const pageNumbers = [];


    if (totalPages <= 5) {

        for (
            let i = 1;
            i <= totalPages;
            i++
        ) {

            pageNumbers.push(i);
        }

    }

    else {

        pageNumbers.push(1);


        if (currentPage > 3) {

            pageNumbers.push(
                "dots"
            );
        }


        const start =
            Math.max(
                2,
                currentPage - 1
            );


        const end =
            Math.min(
                totalPages - 1,
                currentPage + 1
            );


        for (
            let i = start;
            i <= end;
            i++
        ) {

            pageNumbers.push(i);
        }


        if (
            currentPage <
            totalPages - 2
        ) {

            pageNumbers.push(
                "dots"
            );
        }


        pageNumbers.push(
            totalPages
        );
    }


    pageNumbers.forEach(page => {

        if (page === "dots") {

            const dots =
                document.createElement(
                    "span"
                );


            dots.className =
                "pagination-dots";


            dots.textContent =
                "...";


            paginationNumbers.appendChild(
                dots
            );


            return;
        }


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "page-number";


        if (
            page === currentPage
        ) {

            button.classList.add(
                "active"
            );
        }


        button.textContent =
            page;


        button.addEventListener(
            "click",
            () => {

                currentPage =
                    page;


                displayProducts(
                    filteredProducts
                );


                scrollToProducts();

            }
        );


        paginationNumbers.appendChild(
            button
        );

    });
}


/* =========================================================
   NEXT PAGE
========================================================= */

function goToNextPage() {

    const totalPages =
        Math.ceil(
            filteredProducts.length /
            productsPerPage
        );


    if (
        currentPage <
        totalPages
    ) {

        currentPage++;


        displayProducts(
            filteredProducts
        );


        scrollToProducts();
    }
}


/* =========================================================
   PREVIOUS PAGE
========================================================= */

function goToPreviousPage() {

    if (
        currentPage >
        1
    ) {

        currentPage--;


        displayProducts(
            filteredProducts
        );


        scrollToProducts();
    }
}


/* =========================================================
   SCROLL TO PRODUCTS
========================================================= */

function scrollToProducts() {

    const productSection =
        document.getElementById(
            "products"
        );


    if (productSection) {

        productSection.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    }

    else {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(productId) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {

        console.error(
            "Product not found:",
            productId
        );

        return;
    }


    const existingItem =
        cart.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (existingItem) {

        existingItem.quantity =
            Number(
                existingItem.quantity || 1
            ) + 1;

    }

    else {

        /*
           Store the COMPLETE product.
           This is important for checkout.
        */

        cart.push({

            ...product,

            quantity: 1

        });
    }


    saveCart();


    updateCart();


    showCartMessage(
        product.name
    );
}


/* =========================================================
   SAVE CART
========================================================= */

function saveCart() {

    const cartData =
        JSON.stringify(
            cart
        );


    localStorage.setItem(
        CART_KEY,
        cartData
    );


    /*
       Keep old cart key for compatibility.
    */

    localStorage.setItem(
        OLD_CART_KEY,
        cartData
    );
}


/* =========================================================
   UPDATE CART
========================================================= */

function updateCart() {

    const totalQuantity =
        cart.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );


    if (headerCartCount) {

        headerCartCount.textContent =
            totalQuantity;
    }


    renderCart();
}


/* =========================================================
   RENDER CART
========================================================= */

function renderCart() {

    if (!cartItems) {
        return;
    }


    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="cart-empty">

                <i class="bi bi-bag"></i>

                <h4>
                    Your cart is empty
                </h4>

                <p>
                    Add some premium dry fruits
                    to your cart.
                </p>

            </div>

        `;


        if (cartTotal) {

            cartTotal.textContent =
                "₹0.00";
        }


        return;
    }


    cartItems.innerHTML =
        "";


    let total = 0;


    cart.forEach(item => {

        const quantity =
            Number(
                item.quantity || 1
            );


        const price =
            Number(
                item.price || 0
            );


        total +=
            price *
            quantity;


        const cartItem =
            document.createElement(
                "div"
            );


        cartItem.className =
            "cart-item";


        cartItem.innerHTML = `

            <div class="cart-item-image">

                <img
                    src="${escapeHTML(
            item.image ||
            "Photos/MIX.jpg"
        )}"
                    alt="${escapeHTML(
            item.name ||
            "Product"
        )}"
                    onerror="this.onerror=null;this.src='Photos/MIX.jpg'"
                >

            </div>


            <div class="cart-item-info">

                <div class="cart-item-name">

                    ${escapeHTML(
            item.name ||
            "Product"
        )}

                </div>


                ${item.weight
                ? `
                            <div class="cart-item-weight">

                                ${escapeHTML(
                    item.weight
                )}

                            </div>
                        `
                : ""
            }


                <div class="cart-item-price">

                    ₹${formatPrice(price)}

                </div>


                <div class="quantity-controls">

                    <button
                        type="button"
                        data-cart-action="decrease"
                        data-cart-id="${escapeHTML(
                item.id
            )}"
                    >
                        −
                    </button>


                    <span>
                        ${quantity}
                    </span>


                    <button
                        type="button"
                        data-cart-action="increase"
                        data-cart-id="${escapeHTML(
                item.id
            )}"
                    >
                        +
                    </button>

                </div>

            </div>


            <button
                type="button"
                class="remove-cart-item"
                data-cart-action="remove"
                data-cart-id="${escapeHTML(
                item.id
            )}"
                aria-label="Remove item"
            >

                <i class="bi bi-trash"></i>

            </button>

        `;


        cartItems.appendChild(
            cartItem
        );

    });


    if (cartTotal) {

        cartTotal.textContent =
            `₹${formatPrice(total)}`;
    }
}


/* =========================================================
   CHANGE CART QUANTITY
========================================================= */

function changeCartQuantity(
    productId,
    amount
) {

    const item =
        cart.find(
            cartItem =>
                String(
                    cartItem.id
                ) ===
                String(productId)
        );


    if (!item) {
        return;
    }


    item.quantity =
        Number(
            item.quantity || 1
        ) + amount;


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(
                cartItem =>
                    String(
                        cartItem.id
                    ) !==
                    String(productId)
            );
    }


    saveCart();


    updateCart();
}


/* =========================================================
   REMOVE FROM CART
========================================================= */

function removeFromCart(productId) {

    cart =
        cart.filter(
            item =>
                String(item.id) !==
                String(productId)
        );


    saveCart();


    updateCart();
}


/* =========================================================
   PROCEED TO CHECKOUT
========================================================= */

function proceedToCheckout(event) {

    if (event) {
        event.preventDefault();
    }


    if (!cart || cart.length === 0) {

        alert(
            "Your cart is empty. Please add a product first."
        );

        return;
    }


    /*
       Make absolutely sure checkout
       receives the current cart.
    */

    saveCart();


    console.log(
        "Checkout cart:",
        cart
    );


    window.location.href =
        "checkout.html";
}


/* =========================================================
   TOGGLE WISHLIST
========================================================= */

function toggleWishlist(productId) {

    const product =
        products.find(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (!product) {
        return;
    }


    const index =
        wishlist.findIndex(
            item =>
                String(item.id) ===
                String(productId)
        );


    if (index === -1) {

        wishlist.push(
            product
        );

    }

    else {

        wishlist.splice(
            index,
            1
        );
    }


    localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(
            wishlist
        )
    );


    updateWishlistCount();


    if (showingWishlist) {

        filteredProducts =
            products.filter(
                product =>
                    wishlist.some(
                        item =>
                            String(item.id) ===
                            String(product.id)
                    )
            );
    }


    else {

        
        applyFilters();
        return;
    }


    displayProducts(
        filteredProducts
    );
}


/* =========================================================
   UPDATE WISHLIST COUNT
========================================================= */

function updateWishlistCount() {

    const count =
        wishlist.length;


    if (headerWishlistCount) {

        headerWishlistCount.textContent =
            count;
    }


    if (sidebarWishlistCount) {

        sidebarWishlistCount.textContent =
            count;
    }
}


/* =========================================================
   SHOW WISHLIST
========================================================= */

function showWishlist() {

    showingWishlist =
        true;


    filteredProducts =
        products.filter(
            product =>
                wishlist.some(
                    item =>
                        String(item.id) ===
                        String(product.id)
                )
        );


    currentPage =
        1;


    displayProducts(
        filteredProducts
    );
}


/* =========================================================
   SEARCH PRODUCTS
========================================================= */

function searchProducts(value) {

    if (productSearch) {

        productSearch.value =
            value;
    }


    showingWishlist =
        false;


    applyFilters();
}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function resetFilters() {

    showingWishlist =
        false;


    if (productSearch) {

        productSearch.value =
            "";
    }


    if (categoryFilter) {

        categoryFilter.value =
            "all";
    }


    if (sortProducts) {

        sortProducts.value =
            "default";
    }


    selectedRating =
        0;


    if (ratingFilter) {

        ratingFilter
            .querySelectorAll(
                ".rating-filter-button"
            )
            .forEach(button => {

                button.classList.remove(
                    "active"
                );


                if (
                    button.dataset.rating ===
                    "0"
                ) {

                    button.classList.add(
                        "active"
                    );
                }

            });
    }


    currentPage =
        1;


    if (window.location.search) {

        window.history.replaceState(
            {},
            "",
            window.location.pathname
        );
    }


    applyFilters();
}


/* =========================================================
   SIDEBAR OPEN
========================================================= */

function openSidebar() {

    if (sideNavbar) {

        sideNavbar.classList.add(
            "open"
        );
    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.add(
            "show"
        );
    }


    document.body.classList.add(
        "menu-open"
    );


    if (SIDE_toggle) {

        SIDE_toggle.classList.add(
            "open"
        );


        SIDE_toggle.setAttribute(
            "aria-expanded",
            "true"
        );
    }
}


/* =========================================================
   SIDEBAR CLOSE
========================================================= */

function closeSidebar() {

    if (sideNavbar) {

        sideNavbar.classList.remove(
            "open"
        );
    }


    if (sidebarOverlay) {

        sidebarOverlay.classList.remove(
            "show"
        );
    }


    document.body.classList.remove(
        "menu-open"
    );


    if (SIDE_toggle) {

        SIDE_toggle.classList.remove(
            "open"
        );


        SIDE_toggle.setAttribute(
            "aria-expanded",
            "false"
        );
    }
}


/* =========================================================
   SIDEBAR CLOSE BUTTON
========================================================= */

function setupSidebarCloseButton() {

    const closeButtons = [

        document.getElementById(
            "closeSidebar"
        ),

        document.getElementById(
            "SIDE_close"
        ),

        document.getElementById(
            "sidebarClose"
        )

    ];


    closeButtons.forEach(button => {

        if (!button) {
            return;
        }


        button.addEventListener(
            "click",
            closeSidebar
        );

    });


    document
        .querySelectorAll(
            ".sidebar-close, [data-sidebar-close]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                closeSidebar
            );

        });
}


/* =========================================================
   SHOP SUBMENU
========================================================= */

function toggleShopSubmenu(event) {

    if (
        !shopSubmenu ||
        !shopSideBtn
    ) {

        return;
    }


    if (event) {

        event.preventDefault();
    }


    shopSubmenu.classList.toggle(
        "show"
    );


    shopSideBtn.classList.toggle(
        "active"
    );
}


/* =========================================================
   SEARCH MODAL
========================================================= */

function openSearchModal() {

    const modalElement =
        document.getElementById(
            "searchModal"
        );


    if (!modalElement) {

        console.warn(
            "searchModal was not found."
        );

        return;
    }


    if (
        window.bootstrap &&
        window.bootstrap.Modal
    ) {

        const modal =
            window.bootstrap.Modal
                .getOrCreateInstance(
                    modalElement
                );


        modal.show();


        setTimeout(
            () => {

                searchInput?.focus();

            },
            300
        );

    }

    else {

        console.error(
            "Bootstrap Modal is not available."
        );
    }
}


/* =========================================================
   CART TOAST
========================================================= */

function showCartMessage(productName) {

    console.log(
        `${productName} added to cart.`
    );


    const toast =
        document.getElementById(
            "cartToast"
        );


    if (!toast) {
        return;
    }


    const toastText =
        toast.querySelector(
            ".toast-message"
        );


    if (toastText) {

        toastText.textContent =
            `${productName} added to cart.`;
    }


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );
}


/* =========================================================
   ACCOUNT SYSTEM
========================================================= */

function getLoggedInUser() {

    const possibleKeys = [

        "loggedInUser",
        "currentUser",
        "sheernUser"

    ];


    for (
        const key of possibleKeys
    ) {

        const raw =
            localStorage.getItem(
                key
            );


        if (!raw) {
            continue;
        }


        try {

            return JSON.parse(
                raw
            );

        }

        catch {

            return {
                name: raw
            };
        }
    }


    /*
       Support your existing localStorage
       login system.
    */

    const loggedIn =
        localStorage.getItem(
            "sheernLoggedIn"
        );


    const userName =
        localStorage.getItem(
            "sheernUserName"
        );


    if (
        loggedIn === "true" &&
        userName
    ) {

        return {
            name: userName
        };
    }


    return null;
}


/* =========================================================
   UPDATE ACCOUNT UI
========================================================= */

function updateAccountUI() {

    const user =
        getLoggedInUser();


    if (!user) {

        if (accountButtonName) {

            accountButtonName.textContent =
                "Login";
        }


        if (accountName) {

            accountName.textContent =
                "My Account";
        }


        if (loginDropdownLink) {

            loginDropdownLink.classList.remove(
                "d-none"
            );
        }


        if (registerDropdownLink) {

            registerDropdownLink.classList.remove(
                "d-none"
            );
        }


        if (logoutButton) {

            logoutButton.classList.add(
                "d-none"
            );
        }


        return;
    }


    const userName =
        user.name ||
        user.username ||
        user.fullName ||
        user.email ||
        "Account";


    if (accountButtonName) {

        accountButtonName.textContent =
            userName;
    }


    if (accountName) {

        accountName.textContent =
            userName;
    }


    if (loginDropdownLink) {

        loginDropdownLink.classList.add(
            "d-none"
        );
    }


    if (registerDropdownLink) {

        registerDropdownLink.classList.add(
            "d-none"
        );
    }


    if (logoutButton) {

        logoutButton.classList.remove(
            "d-none"
        );
    }
}


/* =========================================================
   ACCOUNT DROPDOWN
========================================================= */

function toggleAccountDropdown() {

    if (!accountDropdown) {
        return;
    }


    accountDropdown.classList.toggle(
        "show"
    );
}


/* =========================================================
   CLOSE ACCOUNT DROPDOWN
========================================================= */

function closeAccountDropdown() {

    if (!accountDropdown) {
        return;
    }


    accountDropdown.classList.remove(
        "show"
    );
}


/* =========================================================
   LOGOUT
========================================================= */

function logoutUser(event) {

    if (event) {

        event.preventDefault();
    }


    localStorage.removeItem(
        "loggedInUser"
    );


    localStorage.removeItem(
        "currentUser"
    );


    localStorage.removeItem(
        "sheernUser"
    );


    localStorage.removeItem(
        "sheernLoggedIn"
    );


    localStorage.removeItem(
        "sheernUserName"
    );


    updateAccountUI();


    closeAccountDropdown();


    console.log(
        "User logged out successfully."
    );
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    /* =====================================================
       PRODUCT SEARCH
    ===================================================== */

    productSearch?.addEventListener(
        "input",
        () => {

            showingWishlist =
                false;

            applyFilters();

        }
    );


    /* =====================================================
       CATEGORY
    ===================================================== */

    categoryFilter?.addEventListener(
        "change",
        () => {

            showingWishlist =
                false;

            applyFilters();

        }
    );


    /* =====================================================
       SORT
    ===================================================== */

    sortProducts?.addEventListener(
        "change",
        () => {

            showingWishlist =
                false;

            applyFilters();

        }
    );


    /* =====================================================
       RATING FILTER
    ===================================================== */

    ratingFilter?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    ".rating-filter-button"
                );


            if (!button) {
                return;
            }


            selectedRating =
                Number(
                    button.dataset.rating || 0
                );


            ratingFilter
                .querySelectorAll(
                    ".rating-filter-button"
                )
                .forEach(item =>
                    item.classList.remove(
                        "active"
                    )
                );


            button.classList.add(
                "active"
            );


            showingWishlist =
                false;


            applyFilters();

        }
    );


    /* =====================================================
       CLEAR FILTERS
    ===================================================== */

    clearFilters?.addEventListener(
        "click",
        resetFilters
    );


    emptyClearButton?.addEventListener(
        "click",
        resetFilters
    );


    /* =====================================================
       PAGINATION
    ===================================================== */

    previousPage?.addEventListener(
        "click",
        goToPreviousPage
    );


    nextPage?.addEventListener(
        "click",
        goToNextPage
    );


    /* =====================================================
       PRODUCT GRID
    ===================================================== */

    productsGrid?.addEventListener(
        "click",
        event => {

            const wishlistButton =
                event.target.closest(
                    ".wishlist-btn"
                );


            if (wishlistButton) {

                toggleWishlist(
                    wishlistButton.dataset.wishlistId
                );

                return;
            }


            const cartButton =
                event.target.closest(
                    ".add-cart-btn"
                );


            if (cartButton) {

                addToCart(
                    cartButton.dataset.cartId
                );

                return;
            }


            const reviewButton =
                event.target.closest(
                    ".review-btn"
                );


            if (reviewButton) {

                openReviewModal(
                    reviewButton.dataset.reviewId
                );

                return;
            }

        }
    );


    /* =====================================================
       CART ACTIONS
    ===================================================== */

    cartItems?.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-cart-action]"
                );


            if (!button) {
                return;
            }


            const productId =
                button.dataset.cartId;


            const action =
                button.dataset.cartAction;


            if (
                action ===
                "increase"
            ) {

                changeCartQuantity(
                    productId,
                    1
                );

            }


            else if (
                action ===
                "decrease"
            ) {

                changeCartQuantity(
                    productId,
                    -1
                );

            }


            else if (
                action ===
                "remove"
            ) {

                removeFromCart(
                    productId
                );
            }

        }
    );


    /* =====================================================
       PROCEED TO CHECKOUT
    ===================================================== */

    const proceedToCheckoutButton =
        document.getElementById(
            "proceedToCheckout"
        );


    proceedToCheckoutButton?.addEventListener(
        "click",
        proceedToCheckout
    );


    /* =====================================================
       HEADER SEARCH
    ===================================================== */

    searchButton?.addEventListener(
        "click",
        () => {

            setTimeout(
                () => {

                    const modalElement =
                        document.getElementById(
                            "searchModal"
                        );


                    if (
                        modalElement &&
                        modalElement.classList.contains(
                            "show"
                        )
                    ) {

                        searchInput?.focus();
                    }

                },
                300
            );

        }
    );


    /* =====================================================
       SEARCH MODAL INPUT
    ===================================================== */

    searchInput?.addEventListener(
        "input",
        event => {

            searchProducts(
                event.target.value
            );

        }
    );


    /* =====================================================
       HEADER WISHLIST
    ===================================================== */

    headerWishlistButton?.addEventListener(
        "click",
        showWishlist
    );


    /* =====================================================
       REVIEW RATING
    ===================================================== */

    setupReviewRating();


    /* =====================================================
       SUBMIT REVIEW
    ===================================================== */

    const submitReviewButton =
        document.getElementById(
            "submitReview"
        );


    submitReviewButton?.addEventListener(
        "click",
        submitReview
    );


    /* =====================================================
       ACCOUNT BUTTON
    ===================================================== */

    headerLoginButton?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            toggleAccountDropdown();

        }
    );


    /* =====================================================
       LOGOUT BUTTON
    ===================================================== */

    logoutButton?.addEventListener(
        "click",
        logoutUser
    );


    /* =====================================================
       SIDEBAR TOGGLE
    ===================================================== */

    SIDE_toggle?.addEventListener(
        "click",
        () => {

            if (
                sideNavbar?.classList.contains(
                    "open"
                )
            ) {

                closeSidebar();

            }

            else {

                openSidebar();
            }

        }
    );


    /* =====================================================
       SIDEBAR OVERLAY
    ===================================================== */

    sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );


    /* =====================================================
       SIDEBAR CLOSE
    ===================================================== */

    setupSidebarCloseButton();


    /* =====================================================
       SHOP SUBMENU
    ===================================================== */

    shopSideBtn?.addEventListener(
        "click",
        toggleShopSubmenu
    );


    /* =====================================================
       SIDEBAR LINKS
    ===================================================== */

    sideNavbar
        ?.querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    if (
                        window.innerWidth <=
                        991
                    ) {

                        closeSidebar();
                    }

                }
            );

        });


    /* =====================================================
       CLICK OUTSIDE ACCOUNT DROPDOWN
    ===================================================== */

    document.addEventListener(
        "click",
        event => {

            if (
                !accountDropdown ||
                !headerLoginButton
            ) {

                return;
            }


            const clickedInsideButton =
                headerLoginButton.contains(
                    event.target
                );


            const clickedInsideDropdown =
                accountDropdown.contains(
                    event.target
                );


            if (
                !clickedInsideButton &&
                !clickedInsideDropdown
            ) {

                closeAccountDropdown();
            }

        }
    );


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key ===
                "Escape"
            ) {

                closeSidebar();

                closeAccountDropdown();
            }

        }
    );
}


/* =========================================================
   RESIZE HANDLER
========================================================= */

function setupResizeHandler() {

    window.addEventListener(
        "resize",
        () => {

            if (
                window.innerWidth >
                991
            ) {

                closeSidebar();
            }

        }
    );
}


/* =========================================================
   START APPLICATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const checkoutButton = document.getElementById("checkoutButton");

        if (checkoutButton) {
            checkoutButton.addEventListener("click", function () {

            
                const cart = JSON.parse(localStorage.getItem("sheernCart")) || [];

                if (cart.length === 0) {
                    alert("Your cart is empty. Please add some products first.");
                    return;
                }

                window.location.href = "CheckOut.html";
            });
        }

        console.log(
            "DOM loaded. Initializing Sheern All Products..."
        );


        initializeDOM();


        console.log(
            "productsGrid:",
            productsGrid
        );


        setupEventListeners();


        setupResizeHandler();


        updateCart();


        updateWishlistCount();


        updateAccountUI();


        loadProducts();

    }
);