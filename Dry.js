/* =========================================================
   SHEERN PREMIUM DRY FRUIT
   PRODUCTS + SEARCH + SHOPPING CART
========================================================= */


/* =========================================================
   PRODUCTS DATA
========================================================= */

const products = [
    {
        id: 1,
        name: "Premium Pistachios",
        image: "Photos/pistacho.jpg",
        price: 499,
        weight: "250g",
        rating: 5,
        reviews: 128,
        description: "Crunchy premium pistachios",
        badge: "BEST SELLER"
    },

    {
        id: 2,
        name: "Premium Almonds",
        image: "Photos/almond.jpg",
        price: 399,
        weight: "250g",
        rating: 5,
        reviews: 96,
        description: "Fresh California almonds",
        badge: "POPULAR"
    },

    {
        id: 3,
        name: "Premium Cashews",
        image: "Photos/cashew.jpg",
        price: 449,
        weight: "250g",
        rating: 5,
        reviews: 112,
        description: "Rich and creamy cashews",
        badge: "BEST SELLER"
    },

    {
        id: 4,
        name: "Premium Walnuts",
        image: "Photos/walnut.jpg",
        price: 549,
        weight: "250g",
        rating: 5,
        reviews: 84,
        description: "Fresh premium walnuts",
        badge: "POPULAR"
    },

    {
        id: 5,
        name: "Premium Anjeer",
        image: "Photos/Anjeer.jpg",
        price: 599,
        weight: "250g",
        rating: 5,
        reviews: 73,
        description: "Soft and naturally sweet",
        badge: "NEW"
    },

    {
        id: 6,
        name: "Premium Apricot",
        image: "Photos/Apricote.jpg",
        price: 449,
        weight: "250g",
        rating: 4,
        reviews: 67,
        description: "Naturally sweet apricots",
        badge: "POPULAR"
    },

    {
        id: 7,
        name: "Premium Raisins",
        image: "Photos/Raisin.jpg",
        price: 299,
        weight: "250g",
        rating: 5,
        reviews: 91,
        description: "Sweet golden raisins",
        badge: "BEST SELLER"
    },

    {
        id: 8,
        name: "Premium Dates",
        image: "Photos/dates.jpg",
        price: 349,
        weight: "500g",
        rating: 5,
        reviews: 105,
        description: "Naturally sweet dates",
        badge: "POPULAR"
    }
];


/* =========================================================
   SHOPPING CART
========================================================= */

let cart = [];


/* =========================================================
   DISPLAY PRODUCTS
========================================================= */

function displayProducts(productList = products) {

    const productGrid =
        document.getElementById("productGrid");


    if (!productGrid) {

        console.error(
            'Error: Element with id="productGrid" was not found.'
        );

        return;

    }


    productGrid.innerHTML = "";


    /* No products */

    if (!productList || productList.length === 0) {

        productGrid.innerHTML = `

            <div class="col-12 text-center">

                <p style="
                    color: #888;
                    padding: 30px;
                    font-size: 16px;
                ">
                    No products found.
                </p>

            </div>

        `;

        return;

    }


    /* Display Products */

    productList.forEach(product => {

        const stars =
            "★".repeat(product.rating) +
            "☆".repeat(5 - product.rating);


        const productHTML = `

            <div class="col-6 col-md-4 col-lg-3">

                <div class="product-card">


                    <span class="product-badge">

                        ${product.badge}

                    </span>


                    <div class="product-image">

                        <img
                            src="${product.image}"
                            alt="${product.name}"
                            loading="lazy"
                        >

                    </div>


                    <div class="product-info">


                        <h4>

                            ${product.name}

                        </h4>


                        <div class="product-rating">

                            ${stars}

                            <span>

                                (${product.reviews})

                            </span>

                        </div>


                        <p class="product-description">

                            ${product.description}

                        </p>


                        <div class="product-price">

                            ₹${product.price}

                            <small>

                                / ${product.weight}

                            </small>

                        </div>


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

}


/* =========================================================
   DISPLAY BEST SELLERS
========================================================= */

function displayBestSellers() {

    const bestSellers =
        products.filter(
            product => product.badge === "BEST SELLER"
        );


    displayProducts(bestSellers);

}


/* =========================================================
   DISPLAY POPULAR PRODUCTS
========================================================= */

function displayPopularProducts() {

    const popularProducts =
        products.filter(
            product => product.badge === "POPULAR"
        );


    displayProducts(popularProducts);

}


/* =========================================================
   DISPLAY NEW PRODUCTS
========================================================= */

function displayNewProducts() {

    const newProducts =
        products.filter(
            product => product.badge === "NEW"
        );


    displayProducts(newProducts);

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

        console.error(
            'Search input with id="searchInput" not found.'
        );

        return;

    }


    const searchText =
        searchInput.value
            .trim()
            .toLowerCase();


    /* Empty Search */

    if (searchText === "") {

        displayProducts(products);

        if (searchResults) {

            searchResults.innerHTML = "";

        }

        return;

    }


    /* Filter Products */

    const results =
        products.filter(product => {

            return (

                product.name
                    .toLowerCase()
                    .includes(searchText)

                ||

                product.description
                    .toLowerCase()
                    .includes(searchText)

                ||

                product.badge
                    .toLowerCase()
                    .includes(searchText)

                ||

                product.weight
                    .toLowerCase()
                    .includes(searchText)

            );

        });


    /* Display matching products */

    displayProducts(results);


    /* Search result message */

    if (searchResults) {

        if (results.length === 0) {

            searchResults.innerHTML = `

                <p class="search-hint">

                    No products found.

                </p>

            `;

        } else {

            searchResults.innerHTML = `

                <p class="search-result-title">

                    ${results.length} product(s) found

                </p>

            `;

        }

    }

}


/* =========================================================
   LIVE SEARCH
========================================================= */

function liveSearch() {

    searchProducts();

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(productId) {

    const product =
        products.find(
            item => item.id === productId
        );


    if (!product) {

        console.error(
            "Product not found:",
            productId
        );

        return;

    }


    const existingProduct =
        cart.find(
            item => item.id === productId
        );


    /* Product already exists */

    if (existingProduct) {

        existingProduct.quantity += 1;

    }

    /* Add new product */

    else {

        cart.push({

            ...product,

            quantity: 1

        });

    }


    updateCart();

    showAddedMessage(product.name);

}


/* =========================================================
   UPDATE CART
========================================================= */

function updateCart() {

    const cartItems =
        document.getElementById("cartItems");

    const cartCount =
        document.getElementById("cartCount");

    const cartTotal =
        document.getElementById("cartTotal");


    let totalItems = 0;

    let totalPrice = 0;


    cart.forEach(item => {

        totalItems += item.quantity;

        totalPrice +=
            item.price * item.quantity;

    });


    /* Update cart count */

    if (cartCount) {

        cartCount.textContent =
            totalItems;

    }


    /* Update cart total */

    if (cartTotal) {

        cartTotal.textContent =
            "₹" + totalPrice.toFixed(2);

    }


    /* Stop if cart HTML does not exist */

    if (!cartItems) {

        return;

    }


    /* Empty cart */

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


    /* Clear previous items */

    cartItems.innerHTML = "";


    /* Display cart items */

    cart.forEach(item => {

        const cartHTML = `

            <div class="cart-product">


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

                        × ${item.quantity}

                    </p>

                </div>


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


                <button
                    class="remove-cart"
                    type="button"
                    onclick="removeFromCart(${item.id})"
                >

                    <i class="bi bi-trash"></i>

                </button>


            </div>

        `;


        cartItems.insertAdjacentHTML(
            "beforeend",
            cartHTML
        );

    });

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeQuantity(productId, amount) {

    const product =
        cart.find(
            item => item.id === productId
        );


    if (!product) {

        return;

    }


    product.quantity += amount;


    /* Remove product if quantity is zero */

    if (product.quantity <= 0) {

        cart =
            cart.filter(
                item => item.id !== productId
            );

    }


    updateCart();

}


/* =========================================================
   REMOVE FROM CART
========================================================= */

function removeFromCart(productId) {

    cart =
        cart.filter(
            item => item.id !== productId
        );


    updateCart();

}


/* =========================================================
   ADDED TO CART MESSAGE
========================================================= */

function showAddedMessage(productName) {

    const message =
        document.createElement("div");


    message.textContent =
        productName + " added to cart!";


    message.style.position =
        "fixed";

    message.style.bottom =
        "25px";

    message.style.right =
        "25px";

    message.style.background =
        "#283618";

    message.style.color =
        "#ffffff";

    message.style.padding =
        "13px 20px";

    message.style.borderRadius =
        "5px";

    message.style.fontSize =
        "13px";

    message.style.zIndex =
        "9999";

    message.style.boxShadow =
        "0 5px 20px rgba(0,0,0,0.2)";


    document.body.appendChild(message);


    setTimeout(() => {

        message.remove();

    }, 2000);

}


/* =========================================================
   CHECKOUT
========================================================= */

function checkout() {

    if (cart.length === 0) {

        alert("Your cart is empty.");

        return;

    }


    let total = 0;


    cart.forEach(item => {

        total +=
            item.price * item.quantity;

    });


    alert(

        "Thank you for shopping with Sheern!\n\n" +

        "Your order total is ₹" +

        total.toFixed(2) +

        "."

    );

}


/* =========================================================
   SEARCH ENTER KEY
========================================================= */

document.addEventListener(
    "keydown",
    function (event) {

        const searchInput =
            document.getElementById("searchInput");


        if (

            searchInput &&

            event.target === searchInput &&

            event.key === "Enter"

        ) {

            searchProducts();

        }

    }
);


/* =========================================================
   INITIALIZE WEBSITE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Sheern Premium Dry Fruit website loaded."
        );


        /* Show all 8 products */

        displayProducts(products);


        /* Initialize cart */

        updateCart();

    }
);