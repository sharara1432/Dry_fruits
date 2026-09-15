/* =========================================================
   SHEERN PREMIUM DRY FRUIT
   PRODUCTS + SEARCH + CART + WISHLIST + SIDEBAR
   + CATEGORY CAROUSEL
========================================================= */

let products = [];
let cart = [];


/* =========================================================
   LOAD PRODUCTS FROM JSON
========================================================= */

async function loadProducts() {

    try {

        const response = await fetch ("DATA/products.json");

        if (!response.ok) {

            throw new Error(
                "Could not load DATA/products.json"
            );

        }

        const data = await response.json();

        console.log("JSON DATA:", data);


        
        products = data;


        if (!Array.isArray(products)) {

            throw new Error(
                "products.json must contain an array."
            );

        }


        console.log(
            "Products successfully loaded:",
            products
        );


        displayCategories();


        displayProducts(products);


        updateCart();

    }

    catch (error) {

        console.error(
            "Error loading products:",
            error
        );

    }

}


/* =========================================================
   DISPLAY CATEGORIES FROM JSON
========================================================= */

function displayCategories() {

    const categorySlider =
        document.getElementById("categorySlider");


    if (!categorySlider || !Array.isArray(products)) {

        console.error(
            "categorySlider not found or products are not an array."
        );

        return;

    }


    
    categorySlider.innerHTML = "";


    const categories = [];


    products.forEach(function (product) {

        const category =
            String(product.category || "")
                .trim()
                .toLowerCase();


        if (
            category &&
            !categories.includes(category)
        ) {

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


        // Makes category readable
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


        // Create category card
        categorySlider.insertAdjacentHTML(
            "beforeend",
            `
            <div
                class="category-card"
                data-category="${category}"
            >

                <div class="category-image">

                    <img
                        src="${product.image}"
                        alt="${categoryName}"
                        loading="lazy"
                        onerror="this.src='Photos/Logo.png'"
                    >

                </div>

                <h5>${categoryName}</h5>

            </div>
            `
        );

    });


    // Add click event to category cards
    document
        .querySelectorAll(".category-card")
        .forEach(function (card) {

            card.addEventListener(
                "click",
                function () {

                    const category =
                        this.dataset.category;


                    filterByCategory(category);

                }

            );

        });

}
/* =========================================================
   HEADER WISHLIST BUTTON
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const headerWishlistButton =
            document.getElementById(
                "headerWishlistButton"
            );


        if (headerWishlistButton) {

            headerWishlistButton.addEventListener(
                "click",
                function () {

                    const wishlist =
                        JSON.parse(
                            localStorage.getItem("wishlist")
                        ) || [];


                    /* EMPTY WISHLIST */

                    if (wishlist.length === 0) {

                        alert(
                            "Your wishlist is empty."
                        );

                        return;

                    }


                    /* GET WISHLIST PRODUCTS */

                    const wishlistProducts =
                        products.filter(
                            function (product) {

                                return wishlist.includes(
                                    String(product.id)
                                );

                            }
                        );



                    displayProducts(
                        wishlistProducts
                    );



                    const productSection =
                        document.getElementById(
                            "products"
                        );


                    if (productSection) {

                        productSection.scrollIntoView({
                            behavior: "smooth"
                        });

                    }

                }
            );

        }

    }
);


/* =========================================================
   LOAD WISHLIST
========================================================= */

function loadWishlist() {

    const wishlist =
        JSON.parse(
            localStorage.getItem("wishlist")
        ) || [];


    document
        .querySelectorAll(".wishlist-btn")
        .forEach(function (btn) {

            const productId =
                String(btn.dataset.id);


            /* CHECK IF PRODUCT IS IN WISHLIST */

            if (wishlist.includes(productId)) {

                btn.classList.add("active");

                btn.innerHTML =
                    '<i class="bi bi-heart-fill"></i>';

            }

            else {

                btn.classList.remove("active");

                btn.innerHTML =
                    '<i class="bi bi-heart"></i>';

            }


            /* ADD WISHLIST ACTION */

            btn.onclick = function () {

                toggleWishlist(productId);

            };

        });


   

    updateWishlistCount(
        wishlist.length
    );

}


/* =========================================================
   ADD / REMOVE WISHLIST
========================================================= */

function toggleWishlist(productId) {

    let wishlist =
        JSON.parse(
            localStorage.getItem("wishlist")
        ) || [];


    productId =
        String(productId);


    const index =
        wishlist.indexOf(productId);


    /* ADD */

    if (index === -1) {

        wishlist.push(productId);

        localStorage.setItem(
            "wishlist",
            JSON.stringify(wishlist)
        );


        alert(
            "Product added to your wishlist."
        );

    }

    /* REMOVE */

    else {

        wishlist.splice(
            index,
            1
        );

        localStorage.setItem(
            "wishlist",
            JSON.stringify(wishlist)
        );


        alert(
            "Product removed from your wishlist."
        );

    }


    /* REFRESH HEARTS + COUNT */

    loadWishlist();

}


/* =========================================================
   UPDATE NAVBAR WISHLIST COUNT
========================================================= */

function updateWishlistCount(count) {

    const headerWishlistCount =
        document.getElementById(
            "headerWishlistCount"
        );


    if (headerWishlistCount) {

        headerWishlistCount.textContent =
            count;

    }

}


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(productList = products) {

    const productGrid =
        document.getElementById("productGrid");

    if (!productGrid) {

        console.error(
            "productGrid not found"
        );

        return;
    }

    productGrid.innerHTML = "";

    /* NO PRODUCTS FOUND */

    if (
        !productList ||
        productList.length === 0
    ) {

        productGrid.innerHTML = `
            <div class="col-12 text-center">
                <p>No products found.</p>
            </div>
        `;

        return;
    }


    /* CREATE PRODUCT CARDS */

    productList.forEach(function (product) {

        const rating =
            Number(product.rating) || 0;


        const stars =
            "★".repeat(rating) +
            "☆".repeat(5 - rating);


        const productHTML = `

            <div class="col-6 col-md-4 col-lg-3">

                <div
                    class="product-card"
                    data-category="${product.category}"
                >

                    <!-- PRODUCT BADGE -->

                    <span class="product-badge">

                        ${product.badge || "Premium"}

                    </span>


                    <!-- WISHLIST -->

                    <button
                        class="wishlist-btn"
                        data-id="${product.id}"
                        type="button"
                        aria-label="Add to Wishlist"
                    >

                        <i class="bi bi-heart"></i>

                    </button>


                    <!-- PRODUCT IMAGE -->

                    <div class="product-image">

                        <img
                            src="${product.image}"
                            alt="${product.name}"
                            loading="lazy"
                            onerror="this.src='Photos/Logo.png'"
                        >

                    </div>


                    <!-- PRODUCT INFORMATION -->

                    <div class="product-info">

                        <!-- PRODUCT NAME -->

                        <h4>

                            ${product.name}

                        </h4>


                        <!-- RATING -->

                        <div class="product-rating">

                            ${stars}

                            <span>

                                (${product.reviews || 0})

                            </span>

                        </div>


                        <!-- DESCRIPTION -->

                        <p class="product-description">

                            ${product.description || ""}

                        </p>


                        <!-- PRICE -->

                        <div class="product-price">

                            ₹${product.price}

                            <small>

                                / ${product.weight || ""}

                            </small>

                        </div>


                        <!-- ADD TO CART -->

                        <button
                            class="add-cart-btn"
                            type="button"
                            onclick="addToCart(${product.id})"
                        >

                            <i class="bi bi-cart-plus"></i>

                            ADD TO CART

                        </button>

                    </div>

                </div>

            </div>

        `;


        productGrid.insertAdjacentHTML(
            "beforeend",
            productHTML
        );

    });


    

    loadWishlist();

}

/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(productId) {

    const product =
        products.find(function (item) {

            return item.id == productId;

        });


    if (!product) {

        console.error(
            "Product not found:",
            productId
        );

        return;

    }


    // Check if already in cart
    const existingProduct =
        cart.find(function (item) {

            return item.id == productId;

        });


    if (existingProduct) {

        existingProduct.quantity += 1;

    }

    else {

        cart.push({

            ...product,

            quantity: 1

        });

    }


    updateCart();


    showAddedMessage(
        product.name
    );

}


/* =========================================================
   UPDATE CART
========================================================= */

function updateCart() {

    const cartItems =
        document.getElementById("cartItems");


    const cartCount =
        document.getElementById("headerCartCount");


    const cartTotal =
        document.getElementById("cartTotal");


    let totalItems = 0;

    let totalPrice = 0;


    // Calculate totals
    cart.forEach(function (item) {

        totalItems += item.quantity;


        totalPrice +=
            Number(item.price) *
            item.quantity;

    });


    /* CART COUNT */

    if (cartCount) {

        cartCount.textContent =
            totalItems;

    }


    /* CART TOTAL */

    if (cartTotal) {

        cartTotal.textContent =
            "₹" +
            totalPrice.toFixed(2);

    }


    if (!cartItems) return;


    /* EMPTY CART */

    if (cart.length === 0) {

        cartItems.innerHTML = `

            < div class="empty-cart" >

                <i class="bi bi-cart-x"></i>

                <p>

                    Your cart is empty.

                </p>

            </div >

            `;

        return;

    }


    cartItems.innerHTML = "";


    /* CART PRODUCTS */

    cart.forEach(function (item) {

        cartItems.insertAdjacentHTML(
            "beforeend",
            `

            < div class="cart-product" >


                <img
                    src="${item.image}"
                    alt="${item.name}"
                >


                    <div class="cart-product-info">

                        <h6>

                            ${item.name}

                        </h6>


                        <p>

                            ₹${item.price}

                            ×

                            ${item.quantity}

                        </p>

                    </div>


                    <!-- QUANTITY -->

                    <div class="cart-quantity">


                        <button
                            class="btn btn-sm btn-light"
                            type="button"
                            onclick="changeQuantity(${item.id}, -1)"
                        >

                            −

                        </button>


                        <span class="mx-2">

                            ${item.quantity}

                        </span>


                        <button
                            class="btn btn-sm btn-light"
                            type="button"
                            onclick="changeQuantity(${item.id}, 1)"
                        >

                            +

                        </button>


                    </div>


                    <!-- REMOVE -->

                    <button
                        class="remove-cart"
                        type="button"
                        onclick="removeFromCart(${item.id})"
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

            return item.id == productId;

        });


    if (!product) return;


    product.quantity += change;


    // Remove when quantity becomes zero
    if (product.quantity <= 0) {

        cart =
            cart.filter(function (item) {

                return item.id != productId;

            });

    }


    updateCart();

}


/* =========================================================
   REMOVE FROM CART
========================================================= */

function removeFromCart(productId) {

    cart =
        cart.filter(function (item) {

            return item.id != productId;

        });


    updateCart();

}


/* =========================================================
   ADDED TO CART MESSAGE
========================================================= */

function showAddedMessage(productName) {

    alert(
        productName +
        " has been added to your cart."
    );

}


/* =========================================================
   SEARCH PRODUCTS
========================================================= */

function searchProducts() {

    const searchInput =
        document.getElementById("searchInput");


    const searchResults =
        document.getElementById("searchResults");


    if (!searchInput) {

        return;

    }


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    /* EMPTY SEARCH */

    if (searchText === "") {

        displayProducts(products);


        if (searchResults) {

            searchResults.innerHTML = `

            < p class="search-hint" >

                <i class="bi bi-info-circle"></i>

                    Search for your favorite dry fruits.

                </p >

            `;

        }

        return;

    }


    /* FILTER PRODUCTS */

    const results =
        products.filter(function (product) {

            return (

                String(product.name || "")
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(product.description || "")
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(product.badge || "")
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(product.weight || "")
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(product.category || "")
                    .toLowerCase()
                    .includes(searchText)

            );

        });


    /* DISPLAY SEARCH RESULTS */

    displayProducts(results);


    /* SEARCH MESSAGE */

    if (searchResults) {

        if (results.length === 0) {

            searchResults.innerHTML = `

            < p class="search-hint" >

                No products found.

                </p >

            `;

        }

        else {

            searchResults.innerHTML = `

            < p class="search-result-title" >

                ${results.length}

        product(s) found.

                </p >

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

                String(product.category || "")
                    .trim()
                    .toLowerCase()

                ===

                String(category || "")
                    .trim()
                    .toLowerCase()

            );

        });


    displayProducts(results);


    const productSection =
        document.getElementById("products");


    if (productSection) {

        productSection.scrollIntoView({

            behavior: "smooth"

        });

    }

}


/* =========================================================
   CATEGORY CAROUSEL ARROWS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {


        const categorySlider =
            document.getElementById(
                "categorySlider"
            );


        const categoryPrev =
            document.getElementById(
                "categoryPrev"
            );


        const categoryNext =
            document.getElementById(
                "categoryNext"
            );


        if (!categorySlider) {

            console.error(
                "categorySlider not found"
            );

            return;

        }


        /* LEFT ARROW */

        if (categoryPrev) {

            categoryPrev.addEventListener(
                "click",
                function () {

                    categorySlider.scrollBy({

                        left: -450,

                        behavior: "smooth"

                    });

                }
            );

        }


        /* RIGHT ARROW */

        if (categoryNext) {

            categoryNext.addEventListener(
                "click",
                function () {

                    categorySlider.scrollBy({

                        left: 450,

                        behavior: "smooth"

                    });

                }
            );

        }

    }
);


/* =========================================================
   SIDEBAR TOGGLE
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const SIDE_toggle = document.getElementById("SIDE_toggle");
    const sideNavbar = document.getElementById("sideNavbar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (!SIDE_toggle || !sideNavbar) {
        console.error("Sidebar elements not found.");
        return;
    }

    /* OPEN / CLOSE SIDEBAR */
    SIDE_toggle.addEventListener("click", function () {

        const isOpen = sideNavbar.classList.toggle("open");

        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle("show", isOpen);
        }

        SIDE_toggle.classList.toggle("menu-open", isOpen);

    });


    /* CLOSE WHEN CLICKING OUTSIDE */
    if (sidebarOverlay) {

        sidebarOverlay.addEventListener("click", function () {

            sideNavbar.classList.remove("open");
            sidebarOverlay.classList.remove("show");
            SIDE_toggle.classList.remove("menu-open");

        });

    }

});


/* =========================================================
   CATEGORY CARD CLICK
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const categoryCards =
            document.querySelectorAll(
                ".category-card"
            );


        categoryCards.forEach(
            function (card) {

                card.addEventListener(
                    "click",
                    function () {

                        const category =
                            this.getAttribute(
                                "data-category"
                            );


                        if (category) {

                            filterByCategory(
                                category
                            );

                        }

                    }
                );

            }
        );

    }
);


/* =========================================================
   SEARCH BUTTON
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchButton =
            document.getElementById(
                "searchSubmitButton"
            );


        if (searchButton) {

            searchButton.addEventListener(
                "click",
                function () {

                    searchProducts();

                }
            );

        }

    }
);


/* =========================================================
   SEARCH ENTER KEY + LIVE SEARCH
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const searchInput =
            document.getElementById(
                "searchInput"
            );


        if (!searchInput) return;


        /* ENTER KEY */

        searchInput.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    searchProducts();

                }

            }
        );


        /* LIVE SEARCH */

        searchInput.addEventListener(
            "input",
            function () {

                if (
                    this.value.trim().length >= 2
                ) {

                    searchProducts();

                }

                else if (
                    this.value.trim() === ""
                ) {

                    displayProducts(products);

                }

            }
        );

    }
);


/* =========================================================
   CHECKOUT
========================================================= */

function checkout() {

    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    let total = 0;


    cart.forEach(function (item) {

        total +=
            Number(item.price) *
            item.quantity;

    });


    alert(

        "Thank you for shopping with Sheern!\n\n" +

        "Your order total is ₹" +

        total.toFixed(2) +

        ".\n\n" +

        "Your order has been received."

    );

}

/* =========================================================
   CHECKOUT BUTTON
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const CHEACKOUTBUTTON =
            document.getElementById(
                "CHEACKOUTBUTTON"
            );

        if (CHEACKOUTBUTTON) {

            CHEACKOUTBUTTON.addEventListener(
                "click",
                checkout
            );

        }

    }
);
/* =========================================================
   ACCOUNT BUTTON
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const headerACCOUNTBUTTON =
            document.getElementById(
                "headerACCOUNTBUTTON"
            );


        if (headerACCOUNTBUTTON) {

            headerACCOUNTBUTTON.addEventListener(
                "click",
                function () {

                    alert(
                        "Welcome to Sheern Premium Dry Fruit!"
                    );

                }
            );

        }

    }
);
/* =========================================================
   DROPDOWN SIDEBAR MENU - SHOP
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const shopSideBtn = document.getElementById("shopSideBtn");
    const shopSubmenu = document.getElementById("shopSubmenu");

    if (shopSideBtn && shopSubmenu) {

        shopSideBtn.addEventListener("click", function () {

            shopSubmenu.classList.toggle("active");
            shopSideBtn.classList.toggle("active");

        });

    }

});
/* =========================================================
   LOAD PRODUCTS WHEN PAGE IS READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadProducts();

    }
);