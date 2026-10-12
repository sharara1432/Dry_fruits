"use strict";

/* =========================================================
   SHEERN - CHECKOUT
   - needs a logged-in user (session from auth.js)
   - saves the order in localStorage "sheernOrders" with the
     customer's email, so it shows on the My Orders page

   Load order on checkout.html:
   <script src="JS/auth.js"></script>
   <script src="JS/Dry.js"></script>
   <script src="JS/checkout.js"></script>
========================================================= */


/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const CHECKOUT_CART_KEY = "sheernCart";
const OLD_CHECKOUT_CART_KEY = "cart";
const ORDERS_KEY = "sheernOrders";
const REVIEWS_KEY = "sheernReviews";

const LOGIN_PAGE = "Login.html";
const ORDERS_PAGE = "myorders.html";


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let checkoutCart = [];
let selectedRating = 0;
let checkoutUser = null;
let orderIsPlacing = false;


/* =========================================================
   HELPERS
========================================================= */

function checkoutEscape(value) {

    return String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatPrice(price) {

    const number = Number(price) || 0;

    return "₹" + number.toFixed(2);
}

function getItemQuantity(item) {

    const quantity =
        Number(item.quantity) ||
        Number(item.qty) ||
        1;

    return quantity > 0 ? quantity : 1;
}

function fieldValue(id) {

    const element = document.getElementById(id);

    return element ? String(element.value || "").trim() : "";
}


/* =========================================================
   LOGGED IN USER
   (looks in sessionStorage and localStorage)
========================================================= */

function getCheckoutUser() {

    function asUser(value) {

        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return null;
        }

        if (value.email || value.name || value.fullName ||
            value.username || value.firstName) {
            return value;
        }

        const keys = Object.keys(value);

        for (let i = 0; i < keys.length; i++) {

            const inner = value[keys[i]];

            if (inner && typeof inner === "object" && !Array.isArray(inner) &&
                (inner.email || inner.name || inner.fullName || inner.username)) {
                return inner;
            }
        }

        return null;
    }

    function read(storage, key) {

        try {
            return JSON.parse(storage.getItem(key));
        } catch (error) {
            return null;
        }
    }

    const skip = [
        "sheernUsers", CHECKOUT_CART_KEY, OLD_CHECKOUT_CART_KEY,
        ORDERS_KEY, "orders", REVIEWS_KEY, "wishlist", "sheernWishlist"
    ];

    const preferred = [
        "sheernUser", "sheernSession", "sheernCurrentUser",
        "loggedInUser", "currentUser", "user", "userData"
    ];

    const stores = [sessionStorage, localStorage];


    /* known key names first */

    for (let s = 0; s < stores.length; s++) {

        for (let i = 0; i < preferred.length; i++) {

            const found = asUser(read(stores[s], preferred[i]));

            if (found) return found;
        }
    }


    /* then every other key */

    for (let s = 0; s < stores.length; s++) {

        for (let k = 0; k < stores[s].length; k++) {

            const key = stores[s].key(k);

            if (skip.indexOf(key) !== -1) continue;

            const found = asUser(read(stores[s], key));

            if (found) return found;
        }
    }


    /* session may only hold an email or an id */

    const users = read(localStorage, "sheernUsers");

    if (Array.isArray(users)) {

        for (let s = 0; s < stores.length; s++) {

            for (let k = 0; k < stores[s].length; k++) {

                const key = stores[s].key(k);

                if (skip.indexOf(key) !== -1) continue;

                const raw = String(stores[s].getItem(key) || "")
                    .replace(/^"|"$/g, "")
                    .trim()
                    .toLowerCase();

                if (!raw) continue;

                for (let u = 0; u < users.length; u++) {

                    if (String(users[u].email || "").toLowerCase() === raw ||
                        String(users[u].id) === raw) {
                        return users[u];
                    }
                }
            }
        }
    }

    return null;
}

function getCheckoutUserName(user) {

    return user.name || user.fullName || user.username || user.firstName || "";
}


/* =========================================================
   GET CART FROM STORAGE
========================================================= */

function getCartFromStorage() {

    let savedCart = localStorage.getItem(CHECKOUT_CART_KEY);

    if (!savedCart) {
        savedCart = localStorage.getItem(OLD_CHECKOUT_CART_KEY);
    }

    if (!savedCart) {
        return [];
    }

    try {

        const parsedCart = JSON.parse(savedCart);

        return Array.isArray(parsedCart) ? parsedCart : [];

    } catch (error) {

        console.error("Could not read cart:", error);

        return [];
    }
}


/* =========================================================
   SAVE CART
========================================================= */

function saveCheckoutCart() {

    localStorage.setItem(
        CHECKOUT_CART_KEY,
        JSON.stringify(checkoutCart)
    );
}


/* =========================================================
   RENDER CHECKOUT
========================================================= */

function renderCheckout() {

    const checkoutContent = document.getElementById("checkoutContent");
    const emptyCart = document.getElementById("emptyCart");
    const checkoutItems = document.getElementById("checkoutItems");

    if (!checkoutContent || !emptyCart || !checkoutItems) {
        return;
    }


    /* empty cart */

    if (checkoutCart.length === 0) {

        checkoutContent.style.display = "none";
        emptyCart.style.display = "block";

        return;
    }


    checkoutContent.style.display = "flex";
    emptyCart.style.display = "none";

    checkoutItems.innerHTML = "";

    let subtotal = 0;


    /* products */

    checkoutCart.forEach(function (item, index) {

        const price = Number(item.price) || 0;
        const quantity = getItemQuantity(item);
        const itemTotal = price * quantity;

        subtotal += itemTotal;

        const image = item.image || "Photos/MIX.jpg";
        const name = item.name || "Dry Fruit";
        const weight = item.weight || "";

        const orderItem = document.createElement("div");

        orderItem.className = "order-item";

        orderItem.innerHTML = `

            <img
                src="${checkoutEscape(image)}"
                alt="${checkoutEscape(name)}"
                class="order-item-image"
                onerror="this.onerror=null;this.src='Photos/MIX.jpg'"
            >

            <div class="order-item-info">

                <div class="order-item-name">${checkoutEscape(name)}</div>

                <div class="order-item-weight">${checkoutEscape(weight)}</div>

                <div class="order-item-price">${formatPrice(price)}</div>

            </div>

            <div>

                <div class="quantity-control">

                    <button type="button" class="quantity-btn"
                        onclick="changeCheckoutQuantity(${index}, -1)">−</button>

                    <span class="quantity-value">${quantity}</span>

                    <button type="button" class="quantity-btn"
                        onclick="changeCheckoutQuantity(${index}, 1)">+</button>

                </div>

                <div
                    class="checkout-item-total"
                    style="text-align:right;margin-top:6px;color:#203517;font-size:10px;font-weight:600;"
                >
                    ${formatPrice(itemTotal)}
                </div>

            </div>

        `;

        checkoutItems.appendChild(orderItem);
    });


    /* totals */

    const shipping = 0;
    const total = subtotal + shipping;

    const subtotalElement = document.getElementById("checkoutSubtotal");
    const shippingElement = document.getElementById("checkoutShipping");
    const totalElement = document.getElementById("checkoutTotal");

    if (subtotalElement) subtotalElement.textContent = formatPrice(subtotal);
    if (shippingElement) shippingElement.textContent = "Free";
    if (totalElement) totalElement.textContent = formatPrice(total);
}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeCheckoutQuantity(index, change) {

    if (!checkoutCart[index]) {
        return;
    }

    let quantity = getItemQuantity(checkoutCart[index]);

    quantity += change;

    if (quantity <= 0) {

        checkoutCart.splice(index, 1);

    } else {

        checkoutCart[index].quantity = quantity;
    }

    saveCheckoutCart();

    renderCheckout();

    updateHeaderCartCount();
}


/* =========================================================
   PAYMENT METHODS
========================================================= */

function setupPaymentMethods() {

    const paymentInputs =
        document.querySelectorAll('input[name="paymentMethod"]');

    paymentInputs.forEach(function (input) {

        input.addEventListener("change", function () {

            const cardDetails = document.getElementById("cardDetails");
            const upiDetails = document.getElementById("upiDetails");
            const cashDetails = document.getElementById("cashDetails");

            [cardDetails, upiDetails, cashDetails].forEach(function (box) {
                if (box) box.classList.remove("active");
            });

            if (this.value === "card" && cardDetails) cardDetails.classList.add("active");
            if (this.value === "upi" && upiDetails) upiDetails.classList.add("active");
            if (this.value === "cash" && cashDetails) cashDetails.classList.add("active");
        });
    });
}


/* =========================================================
   INPUT FORMATTING
========================================================= */

function setupCardFormatting() {

    const cardNumber = document.getElementById("cardNumber");

    if (cardNumber) {

        cardNumber.addEventListener("input", function () {

            let value = this.value.replace(/\D/g, "").substring(0, 16);

            this.value = value.replace(/(.{4})/g, "$1 ").trim();
        });
    }


    const cardExpiry = document.getElementById("cardExpiry");

    if (cardExpiry) {

        cardExpiry.addEventListener("input", function () {

            let value = this.value.replace(/\D/g, "").substring(0, 4);

            if (value.length > 2) {
                value = value.substring(0, 2) + "/" + value.substring(2);
            }

            this.value = value;
        });
    }


    const phone = document.getElementById("customerPhone");

    if (phone) {

        phone.addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, "").substring(0, 10);
        });
    }


    const pincode = document.getElementById("customerPincode");

    if (pincode) {

        pincode.addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, "").substring(0, 6);
        });
    }


    const cardCVV = document.getElementById("cardCVV");

    if (cardCVV) {

        cardCVV.addEventListener("input", function () {
            this.value = this.value.replace(/\D/g, "").substring(0, 4);
        });
    }
}


/* =========================================================
   UPI OPTIONS
========================================================= */

function setupUPIOptions() {

    const options = document.querySelectorAll(".upi-option");
    const upiInput = document.getElementById("upiId");

    options.forEach(function (option) {

        option.addEventListener("click", function () {

            const provider = this.dataset.upi;

            if (!upiInput) {
                return;
            }

            if (provider === "Paytm") {
                upiInput.placeholder = "Enter your Paytm UPI ID";
            }

            if (provider === "Google Pay") {
                upiInput.placeholder = "Enter your Google Pay UPI ID";
            }

            if (provider === "PhonePe") {
                upiInput.placeholder = "Enter your PhonePe UPI ID";
            }

            upiInput.focus();
        });
    });
}


/* =========================================================
   VALIDATE CUSTOMER
========================================================= */

function validateCustomerInformation() {

    const name = document.getElementById("customerName");
    const email = document.getElementById("customerEmail");
    const phone = document.getElementById("customerPhone");
    const address = document.getElementById("customerAddress");
    const city = document.getElementById("customerCity");
    const state = document.getElementById("customerState");
    const pincode = document.getElementById("customerPincode");

    if (!name || !name.value.trim()) {
        alert("Please enter your full name.");
        if (name) name.focus();
        return false;
    }

    if (!email || !email.value.trim()) {
        alert("Please enter your email address.");
        if (email) email.focus();
        return false;
    }

    if (!email.checkValidity()) {
        alert("Please enter a valid email address.");
        email.focus();
        return false;
    }

    if (!phone || !phone.value.trim()) {
        alert("Please enter your phone number.");
        if (phone) phone.focus();
        return false;
    }

    if (!/^\d{10}$/.test(phone.value.trim())) {
        alert("Please enter a valid 10-digit phone number.");
        phone.focus();
        return false;
    }

    if (!address || !address.value.trim()) {
        alert("Please enter your delivery address.");
        if (address) address.focus();
        return false;
    }

    if (!city || !city.value.trim()) {
        alert("Please enter your city.");
        if (city) city.focus();
        return false;
    }

    if (!state || !state.value.trim()) {
        alert("Please enter your state.");
        if (state) state.focus();
        return false;
    }

    if (!pincode || !/^\d{6}$/.test(pincode.value.trim())) {
        alert("Please enter a valid 6-digit PIN code.");
        if (pincode) pincode.focus();
        return false;
    }

    return true;
}


/* =========================================================
   VALIDATE PAYMENT
========================================================= */

function validatePayment() {

    const selectedPayment =
        document.querySelector('input[name="paymentMethod"]:checked');

    const paymentError = document.getElementById("paymentError");

    function fail(message, field) {

        if (paymentError) {
            paymentError.textContent = message;
        } else {
            alert(message);
        }

        if (field) field.focus();

        return false;
    }

    if (paymentError) {
        paymentError.textContent = "";
    }

    if (!selectedPayment) {
        return fail("Please select a payment method.", null);
    }


    /* card */

    if (selectedPayment.value === "card") {

        const cardNumber = document.getElementById("cardNumber");
        const cardName = document.getElementById("cardName");
        const cardExpiry = document.getElementById("cardExpiry");
        const cardCVV = document.getElementById("cardCVV");

        const cleanCardNumber = cardNumber.value.replace(/\s/g, "");

        if (!/^\d{16}$/.test(cleanCardNumber)) {
            return fail("Please enter a valid 16-digit card number.", cardNumber);
        }

        if (!cardName.value.trim()) {
            return fail("Please enter the name on the card.", cardName);
        }

        if (!/^\d{2}\/\d{2}$/.test(cardExpiry.value)) {
            return fail("Please enter the card expiry as MM/YY.", cardExpiry);
        }

        if (!/^\d{3,4}$/.test(cardCVV.value)) {
            return fail("Please enter a valid CVV.", cardCVV);
        }
    }


    /* upi */

    if (selectedPayment.value === "upi") {

        const upiId = document.getElementById("upiId");

        if (!upiId.value.trim()) {
            return fail("Please enter your UPI ID.", upiId);
        }

        if (!/^[\w.-]+@[\w.-]+$/.test(upiId.value.trim())) {
            return fail("Please enter a valid UPI ID.", upiId);
        }
    }

    return true;
}


/* =========================================================
   CREATE ORDER NUMBER
========================================================= */

function createOrderNumber() {

    const randomNumber = Math.floor(100000 + Math.random() * 900000);

    return "SHRN-" + randomNumber;
}


/* =========================================================
   PLACE ORDER
========================================================= */

function placeOrder() {

    if (orderIsPlacing) {
        return;
    }


    /* login */

    const user = checkoutUser || getCheckoutUser();

    if (!user) {

        alert("Please login before placing your order.");

        window.location.href = LOGIN_PAGE;

        return;
    }


    /* cart */

    if (checkoutCart.length === 0) {

        alert("Your cart is empty. Please add a product first.");

        return;
    }


    /* validation */

    if (!validateCustomerInformation()) {
        return;
    }

    if (!validatePayment()) {
        return;
    }


    const selectedPayment =
        document.querySelector('input[name="paymentMethod"]:checked');

    let paymentName = "Cash on Delivery";

    if (selectedPayment.value === "card") {
        paymentName = "Debit / Credit Card";
    }

    if (selectedPayment.value === "upi") {
        paymentName = "UPI / Paytm";
    }


    /* total */

    let subtotal = 0;

    checkoutCart.forEach(function (item) {

        subtotal += (Number(item.price) || 0) * getItemQuantity(item);
    });

    const shipping = 0;
    const total = subtotal + shipping;


    /* order */

    const orderNumber = createOrderNumber();

    const addressLine = fieldValue("customerAddress");
    const city = fieldValue("customerCity");
    const state = fieldValue("customerState");
    const pincode = fieldValue("customerPincode");

    const order = {

        /* fields read by the My Orders page */

        id: orderNumber,
        orderNumber: orderNumber,
        date: new Date().toISOString(),
        orderDate: new Date().toISOString(),
        status: "Pending",

        customerId: user.id !== undefined ? user.id : "",
        customerEmail: user.email || fieldValue("customerEmail"),
        customerName: fieldValue("customerName"),
        phone: fieldValue("customerPhone"),
        address: [addressLine, city, state, pincode].filter(Boolean).join(", "),
        payment: paymentName,
        note: fieldValue("deliveryNote"),


        /* extra details */

        customer: {
            name: fieldValue("customerName"),
            email: user.email || fieldValue("customerEmail"),
            phone: fieldValue("customerPhone"),
            address: addressLine,
            city: city,
            state: state,
            pincode: pincode,
            deliveryNote: fieldValue("deliveryNote")
        },

        paymentInfo: {
            method: selectedPayment.value,
            methodName: paymentName
        },

        items: checkoutCart.map(function (item) {

            return {
                id: item.id,
                name: item.name,
                image: item.image,
                price: Number(item.price) || 0,
                weight: item.weight || "",
                quantity: getItemQuantity(item)
            };
        }),

        subtotal: subtotal,
        shipping: shipping,
        total: total
    };


    /* save */

    let orders = [];

    try {

        orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];

        if (!Array.isArray(orders)) orders = [];

    } catch (error) {

        orders = [];
    }

    orders.push(order);

    try {

        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

    } catch (error) {

        console.error("Could not save order:", error);

        alert("Sorry, your order could not be saved. Please try again.");

        return;
    }

    orderIsPlacing = true;


    /* clear cart (only after the order is saved) */

    checkoutCart = [];

    localStorage.removeItem(CHECKOUT_CART_KEY);
    localStorage.removeItem(OLD_CHECKOUT_CART_KEY);

    updateHeaderCartCount();


    /* success */

    const orderNumberElement = document.getElementById("successOrderNumber");

    if (orderNumberElement) {
        orderNumberElement.textContent = orderNumber;
    }

    const modalElement = document.getElementById("orderSuccessModal");

    if (modalElement && typeof bootstrap !== "undefined") {

        bootstrap.Modal.getOrCreateInstance(modalElement).show();

    } else {

        alert("Order placed successfully!\nOrder Number: " + orderNumber);

        window.location.href = ORDERS_PAGE;
    }

    renderCheckout();
}


/* =========================================================
   UPDATE HEADER CART COUNT
========================================================= */

function updateHeaderCartCount() {

    const cartCount = document.getElementById("headerCartCount");

    if (!cartCount) {
        return;
    }

    let totalQuantity = 0;

    checkoutCart.forEach(function (item) {
        totalQuantity += getItemQuantity(item);
    });

    cartCount.textContent = totalQuantity;
}


/* =========================================================
   CONTINUE AFTER ORDER
========================================================= */

function continueAfterOrder() {

    window.location.href = ORDERS_PAGE;
}


/* =========================================================
   STAR REVIEW
========================================================= */

function updateStars(rating) {

    const stars = document.querySelectorAll("#feedbackStars i");

    stars.forEach(function (star, index) {

        star.classList.remove("bi-star", "bi-star-fill");

        star.classList.add(index + 1 <= rating ? "bi-star-fill" : "bi-star");
    });
}

function setupReviewSystem() {

    const stars = document.querySelectorAll("#feedbackStars i");
    const reviewMessage = document.getElementById("feedbackMessage");
    const submitButton = document.getElementById("submitFeedbackButton");

    if (!stars.length) {
        return;
    }

    stars.forEach(function (star) {

        star.addEventListener("click", function () {

            selectedRating = Number(this.dataset.value);

            updateStars(selectedRating);

            if (reviewMessage) {

                reviewMessage.textContent =
                    selectedRating + " out of 5 stars selected.";

                reviewMessage.classList.remove("error");
                reviewMessage.classList.add("success");
            }
        });

        star.addEventListener("mouseenter", function () {
            updateStars(Number(this.dataset.value));
        });

        star.addEventListener("mouseleave", function () {
            updateStars(selectedRating);
        });
    });

    if (submitButton) {
        submitButton.addEventListener("click", submitReview);
    }
}

function submitReview() {

    const reviewText = document.getElementById("feedbackText");
    const reviewMessage = document.getElementById("feedbackMessage");

    if (!reviewMessage) {
        return;
    }

    if (selectedRating === 0) {

        reviewMessage.textContent = "Please select a star rating.";

        reviewMessage.classList.remove("success");
        reviewMessage.classList.add("error");

        return;
    }

    const user = checkoutUser || getCheckoutUser() || {};

    const review = {
        rating: selectedRating,
        comment: reviewText ? reviewText.value.trim() : "",
        customerEmail: user.email || "",
        date: new Date().toISOString()
    };

    let reviews = [];

    try {

        reviews = JSON.parse(localStorage.getItem(REVIEWS_KEY)) || [];

        if (!Array.isArray(reviews)) reviews = [];

    } catch (error) {

        reviews = [];
    }

    reviews.push(review);

    localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));

    reviewMessage.textContent =
        "Thank you! Your review has been submitted successfully.";

    reviewMessage.classList.remove("error");
    reviewMessage.classList.add("success");

    if (reviewText) {
        reviewText.value = "";
    }

    selectedRating = 0;

    updateStars(0);
}


/* =========================================================
   PROGRESS BAR
========================================================= */

function setupCheckoutProgress() {

    const progressSteps =
        document.querySelectorAll(".checkout-progress .progress-step");

    if (!progressSteps.length) {
        return;
    }

    progressSteps.forEach(function (step, index) {

        step.classList.remove("completed", "active");

        if (index < 2) step.classList.add("completed");
        if (index === 2) step.classList.add("active");
    });
}

function setupProgressClick() {

    const progressSteps =
        document.querySelectorAll(".checkout-progress .progress-step");

    progressSteps.forEach(function (step) {

        step.addEventListener("click", function () {

            const target = this.dataset.target;

            if (!target) {
                return;
            }

            const element = document.getElementById(target);

            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        });
    });
}

function setupReviewBox() {

    const reviewBox = document.getElementById("orderFeedbackBox");

    if (!reviewBox) {
        return;
    }

    reviewBox.classList.add("checkout-review-section");
}


/* =========================================================
   PREVENT ENTER FROM SUBMITTING
========================================================= */

function setupFormSafety() {

    const inputs = document.querySelectorAll("input");

    inputs.forEach(function (input) {

        input.addEventListener("keydown", function (event) {

            if (event.key === "Enter" && this.type !== "button") {
                event.preventDefault();
            }
        });
    });
}


/* =========================================================
   WISHLIST COUNT
   (Dry.js stores the wishlist under "wishlist")
========================================================= */

function setupWishlistCount() {

    const count = document.getElementById("headerWishlistCount");

    if (!count) {
        return;
    }

    const saved =
        localStorage.getItem("wishlist") ||
        localStorage.getItem("sheernWishlist");

    if (!saved) {
        count.textContent = "0";
        return;
    }

    try {

        const parsed = JSON.parse(saved);

        count.textContent = Array.isArray(parsed) ? parsed.length : 0;

    } catch (error) {

        count.textContent = "0";
    }
}

function initializeHeaderCounts() {

    updateHeaderCartCount();

    setupWishlistCount();
}


/* =========================================================
   FILL FORM FROM ACCOUNT
========================================================= */

function fillCustomerFromAccount(user) {

    const emailInput = document.getElementById("customerEmail");
    const nameInput = document.getElementById("customerName");

    if (emailInput) {

        emailInput.value = user.email || "";

        /* the order is linked to this account's email */
        emailInput.readOnly = true;
    }

    if (nameInput && !nameInput.value) {
        nameInput.value = getCheckoutUserName(user);
    }
}


/* =========================================================
   INITIALIZE CHECKOUT
========================================================= */

function initializeCheckout() {

    /* login is required */

    checkoutUser = getCheckoutUser();

    if (!checkoutUser) {

        console.warn(
            "Checkout: no logged-in user found.",
            "sessionStorage keys:", Object.keys(sessionStorage),
            "localStorage keys:", Object.keys(localStorage)
        );

        alert("Please login to continue to checkout.");

        window.location.href = LOGIN_PAGE;

        return;
    }


    /* cart */

    checkoutCart = getCartFromStorage();

    renderCheckout();

    fillCustomerFromAccount(checkoutUser);


    /* payment */

    setupPaymentMethods();
    setupCardFormatting();
    setupUPIOptions();


    /* review */

    setupReviewSystem();
    setupReviewBox();
    setupCheckoutProgress();
    setupProgressClick();


    /* safety + header counts
       (the account dropdown is handled by Dry.js) */

    setupFormSafety();
    initializeHeaderCounts();


    /* place order button */

    const placeOrderButton = document.getElementById("placeOrderButton");

    if (placeOrderButton) {
        placeOrderButton.addEventListener("click", placeOrder);
    }


    /* success button */

    const continueButton = document.getElementById("continueAfterOrder");

    if (continueButton) {
        continueButton.addEventListener("click", continueAfterOrder);
    }
}


/* =========================================================
   START CHECKOUT
========================================================= */

document.addEventListener("DOMContentLoaded", initializeCheckout);