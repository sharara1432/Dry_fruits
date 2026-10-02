"use strict";

/* =========================================================
   LOCAL STORAGE KEYS
========================================================= */

const CHECKOUT_CART_KEY = "sheernCart";
const OLD_CHECKOUT_CART_KEY = "cart";
const ORDERS_KEY = "sheernOrders";
const REVIEWS_KEY = "sheernReviews";


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let checkoutCart = [];
let selectedRating = 0;


/* =========================================================
   GET CART FROM STORAGE
========================================================= */

function getCartFromStorage() {

    let savedCart =
        localStorage.getItem(CHECKOUT_CART_KEY);

    if (!savedCart) {

        savedCart =
            localStorage.getItem(
                OLD_CHECKOUT_CART_KEY
            );
    }

    if (!savedCart) {
        return [];
    }

    try {

        const parsedCart =
            JSON.parse(savedCart);

        return Array.isArray(parsedCart)
            ? parsedCart
            : [];

    } catch (error) {

        console.error(
            "Could not read cart:",
            error
        );

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
   FORMAT PRICE
========================================================= */

function formatPrice(price) {

    const number =
        Number(price) || 0;

    return "₹" + number.toFixed(2);
}


/* =========================================================
   GET QUANTITY
========================================================= */

function getItemQuantity(item) {

    const quantity =
        Number(item.quantity) ||
        Number(item.qty) ||
        1;

    return quantity > 0
        ? quantity
        : 1;
}


/* =========================================================
   RENDER CHECKOUT
========================================================= */

function renderCheckout() {

    const checkoutContent =
        document.getElementById(
            "checkoutContent"
        );

    const emptyCart =
        document.getElementById(
            "emptyCart"
        );

    const checkoutItems =
        document.getElementById(
            "checkoutItems"
        );

    if (
        !checkoutContent ||
        !emptyCart ||
        !checkoutItems
    ) {
        return;
    }


    /* =====================================================
       EMPTY CART
    ====================================================== */

    if (checkoutCart.length === 0) {

        checkoutContent.style.display = "none";

        emptyCart.style.display = "block";

        return;
    }


    checkoutContent.style.display = "flex";

    emptyCart.style.display = "none";

    checkoutItems.innerHTML = "";

    let subtotal = 0;


    /* =====================================================
       PRODUCTS
    ====================================================== */

    checkoutCart.forEach(
        (item, index) => {

            const price =
                Number(item.price) || 0;

            const quantity =
                getItemQuantity(item);

            const itemTotal =
                price * quantity;

            subtotal += itemTotal;


            const orderItem =
                document.createElement("div");

            orderItem.className =
                "order-item";


            const image =
                item.image ||
                "Photos/MIX.jpg";


            const name =
                item.name ||
                "Dry Fruit";


            const weight =
                item.weight ||
                "";


            orderItem.innerHTML = `

                <img
                    src="${image}"
                    alt="${name}"
                    class="order-item-image"
                    onerror="this.src='Photos/MIX.jpg'"
                >

                <div class="order-item-info">

                    <div class="order-item-name">
                        ${name}
                    </div>

                    <div class="order-item-weight">
                        ${weight}
                    </div>

                    <div class="order-item-price">
                        ${formatPrice(price)}
                    </div>

                </div>


                <div>

                    <div class="quantity-control">

                        <button
                            type="button"
                            class="quantity-btn"
                            onclick="changeCheckoutQuantity(${index}, -1)"
                        >
                            −
                        </button>


                        <span class="quantity-value">
                            ${quantity}
                        </span>


                        <button
                            type="button"
                            class="quantity-btn"
                            onclick="changeCheckoutQuantity(${index}, 1)"
                        >
                            +
                        </button>

                    </div>


                    <div
                        class="checkout-item-total"
                        style="
                            text-align:right;
                            margin-top:6px;
                            color:#203517;
                            font-size:10px;
                            font-weight:600;
                        "
                    >
                        ${formatPrice(itemTotal)}
                    </div>

                </div>

            `;


            checkoutItems.appendChild(
                orderItem
            );

        }
    );


    /* =====================================================
       TOTALS
    ====================================================== */

    const shipping = 0;

    const total =
        subtotal + shipping;


    const subtotalElement =
        document.getElementById(
            "checkoutSubtotal"
        );

    const shippingElement =
        document.getElementById(
            "checkoutShipping"
        );

    const totalElement =
        document.getElementById(
            "checkoutTotal"
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            formatPrice(subtotal);
    }


    if (shippingElement) {

        shippingElement.textContent =
            "Free";
    }


    if (totalElement) {

        totalElement.textContent =
            formatPrice(total);
    }

}


/* =========================================================
   CHANGE QUANTITY
========================================================= */

function changeCheckoutQuantity(
    index,
    change
) {

    if (!checkoutCart[index]) {
        return;
    }


    let quantity =
        getItemQuantity(
            checkoutCart[index]
        );


    quantity += change;


    if (quantity <= 0) {

        checkoutCart.splice(
            index,
            1
        );

    } else {

        checkoutCart[index].quantity =
            quantity;
    }


    saveCheckoutCart();

    renderCheckout();
}


/* =========================================================
   PAYMENT METHODS
========================================================= */

function setupPaymentMethods() {

    const paymentInputs =
        document.querySelectorAll(
            'input[name="paymentMethod"]'
        );


    paymentInputs.forEach(
        input => {

            input.addEventListener(
                "change",
                function () {

                    const cardDetails =
                        document.getElementById(
                            "cardDetails"
                        );

                    const upiDetails =
                        document.getElementById(
                            "upiDetails"
                        );

                    const cashDetails =
                        document.getElementById(
                            "cashDetails"
                        );


                    if (cardDetails) {

                        cardDetails.classList.remove(
                            "active"
                        );
                    }


                    if (upiDetails) {

                        upiDetails.classList.remove(
                            "active"
                        );
                    }


                    if (cashDetails) {

                        cashDetails.classList.remove(
                            "active"
                        );
                    }


                    if (
                        this.value === "card" &&
                        cardDetails
                    ) {

                        cardDetails.classList.add(
                            "active"
                        );
                    }


                    if (
                        this.value === "upi" &&
                        upiDetails
                    ) {

                        upiDetails.classList.add(
                            "active"
                        );
                    }


                    if (
                        this.value === "cash" &&
                        cashDetails
                    ) {

                        cashDetails.classList.add(
                            "active"
                        );
                    }

                }
            );

        }
    );

}


/* =========================================================
   CARD NUMBER FORMATTING
========================================================= */

function setupCardFormatting() {

    const cardNumber =
        document.getElementById(
            "cardNumber"
        );


    if (cardNumber) {

        cardNumber.addEventListener(
            "input",
            function () {

                let value =
                    this.value.replace(
                        /\D/g,
                        ""
                    );


                value =
                    value.substring(
                        0,
                        16
                    );


                value =
                    value
                        .replace(
                            /(.{4})/g,
                            "$1 "
                        )
                        .trim();


                this.value =
                    value;

            }
        );

    }


    const cardExpiry =
        document.getElementById(
            "cardExpiry"
        );


    if (cardExpiry) {

        cardExpiry.addEventListener(
            "input",
            function () {

                let value =
                    this.value.replace(
                        /\D/g,
                        ""
                    );


                value =
                    value.substring(
                        0,
                        4
                    );


                if (
                    value.length > 2
                ) {

                    value =
                        value.substring(
                            0,
                            2
                        ) +
                        "/" +
                        value.substring(
                            2
                        );
                }


                this.value =
                    value;

            }
        );

    }


    const phone =
        document.getElementById(
            "customerPhone"
        );


    if (phone) {

        phone.addEventListener(
            "input",
            function () {

                this.value =
                    this.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .substring(
                            0,
                            10
                        );

            }
        );

    }


    const pincode =
        document.getElementById(
            "customerPincode"
        );


    if (pincode) {

        pincode.addEventListener(
            "input",
            function () {

                this.value =
                    this.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .substring(
                            0,
                            6
                        );

            }
        );

    }


    const cardCVV =
        document.getElementById(
            "cardCVV"
        );


    if (cardCVV) {

        cardCVV.addEventListener(
            "input",
            function () {

                this.value =
                    this.value
                        .replace(
                            /\D/g,
                            ""
                        )
                        .substring(
                            0,
                            4
                        );

            }
        );

    }

}


/* =========================================================
   UPI OPTIONS
========================================================= */

function setupUPIOptions() {

    const options =
        document.querySelectorAll(
            ".upi-option"
        );


    const upiInput =
        document.getElementById(
            "upiId"
        );


    options.forEach(
        option => {

            option.addEventListener(
                "click",
                function () {

                    const provider =
                        this.dataset.upi;


                    if (!upiInput) {
                        return;
                    }


                    if (
                        provider === "Paytm"
                    ) {

                        upiInput.placeholder =
                            "Enter your Paytm UPI ID";
                    }


                    if (
                        provider === "Google Pay"
                    ) {

                        upiInput.placeholder =
                            "Enter your Google Pay UPI ID";
                    }


                    if (
                        provider === "PhonePe"
                    ) {

                        upiInput.placeholder =
                            "Enter your PhonePe UPI ID";
                    }


                    upiInput.focus();

                }
            );

        }
    );

}


/* =========================================================
   VALIDATE CUSTOMER
========================================================= */

function validateCustomerInformation() {

    const name =
        document.getElementById(
            "customerName"
        );

    const email =
        document.getElementById(
            "customerEmail"
        );

    const phone =
        document.getElementById(
            "customerPhone"
        );

    const address =
        document.getElementById(
            "customerAddress"
        );

    const city =
        document.getElementById(
            "customerCity"
        );

    const state =
        document.getElementById(
            "customerState"
        );

    const pincode =
        document.getElementById(
            "customerPincode"
        );


    if (!name || !name.value.trim()) {

        alert(
            "Please enter your full name."
        );

        if (name) {
            name.focus();
        }

        return false;
    }


    if (!email || !email.value.trim()) {

        alert(
            "Please enter your email address."
        );

        if (email) {
            email.focus();
        }

        return false;
    }


    if (!email.checkValidity()) {

        alert(
            "Please enter a valid email address."
        );

        email.focus();

        return false;
    }


    if (!phone || !phone.value.trim()) {

        alert(
            "Please enter your phone number."
        );

        if (phone) {
            phone.focus();
        }

        return false;
    }


    if (
        !/^\d{10}$/.test(
            phone.value.trim()
        )
    ) {

        alert(
            "Please enter a valid 10-digit phone number."
        );

        phone.focus();

        return false;
    }


    if (!address || !address.value.trim()) {

        alert(
            "Please enter your delivery address."
        );

        if (address) {
            address.focus();
        }

        return false;
    }


    if (!city || !city.value.trim()) {

        alert(
            "Please enter your city."
        );

        if (city) {
            city.focus();
        }

        return false;
    }


    if (!state || !state.value.trim()) {

        alert(
            "Please enter your state."
        );

        if (state) {
            state.focus();
        }

        return false;
    }


    if (
        !pincode ||
        !/^\d{6}$/.test(
            pincode.value.trim()
        )
    ) {

        alert(
            "Please enter a valid 6-digit PIN code."
        );

        if (pincode) {
            pincode.focus();
        }

        return false;
    }


    return true;
}


/* =========================================================
   VALIDATE PAYMENT
========================================================= */

function validatePayment() {

    const selectedPayment =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    const paymentError =
        document.getElementById(
            "paymentError"
        );


    if (paymentError) {

        paymentError.textContent = "";
    }


    if (!selectedPayment) {

        if (paymentError) {

            paymentError.textContent =
                "Please select a payment method.";
        }

        return false;
    }


    /* =====================================================
       CARD
    ====================================================== */

    if (
        selectedPayment.value === "card"
    ) {

        const cardNumber =
            document.getElementById(
                "cardNumber"
            );

        const cardName =
            document.getElementById(
                "cardName"
            );

        const cardExpiry =
            document.getElementById(
                "cardExpiry"
            );

        const cardCVV =
            document.getElementById(
                "cardCVV"
            );


        const cleanCardNumber =
            cardNumber.value.replace(
                /\s/g,
                ""
            );


        if (
            !/^\d{16}$/.test(
                cleanCardNumber
            )
        ) {

            paymentError.textContent =
                "Please enter a valid 16-digit card number.";

            cardNumber.focus();

            return false;
        }


        if (
            !cardName.value.trim()
        ) {

            paymentError.textContent =
                "Please enter the name on the card.";

            cardName.focus();

            return false;
        }


        if (
            !/^\d{2}\/\d{2}$/.test(
                cardExpiry.value
            )
        ) {

            paymentError.textContent =
                "Please enter the card expiry as MM/YY.";

            cardExpiry.focus();

            return false;
        }


        if (
            !/^\d{3,4}$/.test(
                cardCVV.value
            )
        ) {

            paymentError.textContent =
                "Please enter a valid CVV.";

            cardCVV.focus();

            return false;
        }
    }


    /* =====================================================
       UPI
    ====================================================== */

    if (
        selectedPayment.value === "upi"
    ) {

        const upiId =
            document.getElementById(
                "upiId"
            );


        if (
            !upiId.value.trim()
        ) {

            paymentError.textContent =
                "Please enter your UPI ID.";

            upiId.focus();

            return false;
        }


        if (
            !/^[\w.-]+@[\w.-]+$/.test(
                upiId.value.trim()
            )
        ) {

            paymentError.textContent =
                "Please enter a valid UPI ID.";

            upiId.focus();

            return false;
        }
    }


    return true;
}


/* =========================================================
   CREATE ORDER NUMBER
========================================================= */

function createOrderNumber() {

    const randomNumber =
        Math.floor(
            100000 +
            Math.random() * 900000
        );


    return "SHRN-" + randomNumber;
}


/* =========================================================
   PLACE ORDER
========================================================= */

function placeOrder() {

    if (
        checkoutCart.length === 0
    ) {

        alert(
            "Your cart is empty. Please add a product first."
        );

        return;
    }


    if (
        !validateCustomerInformation()
    ) {

        return;
    }


    if (
        !validatePayment()
    ) {

        return;
    }


    const selectedPayment =
        document.querySelector(
            'input[name="paymentMethod"]:checked'
        );


    let paymentName =
        "Cash on Delivery";


    if (
        selectedPayment.value === "card"
    ) {

        paymentName =
            "Debit / Credit Card";
    }


    if (
        selectedPayment.value === "upi"
    ) {

        paymentName =
            "UPI / Paytm";
    }


    /* =====================================================
       CALCULATE TOTAL
    ====================================================== */

    let subtotal = 0;


    checkoutCart.forEach(
        item => {

            const price =
                Number(item.price) || 0;


            const quantity =
                getItemQuantity(item);


            subtotal +=
                price * quantity;
        }
    );


    const shipping = 0;

    const total =
        subtotal + shipping;


    /* =====================================================
       ORDER NUMBER
    ====================================================== */

    const orderNumber =
        createOrderNumber();


    /* =====================================================
       ORDER OBJECT
    ====================================================== */

    const order = {

        orderNumber:
            orderNumber,

        orderDate:
            new Date().toISOString(),


        customer: {

            name:
                document
                    .getElementById(
                        "customerName"
                    )
                    .value
                    .trim(),

            email:
                document
                    .getElementById(
                        "customerEmail"
                    )
                    .value
                    .trim(),

            phone:
                document
                    .getElementById(
                        "customerPhone"
                    )
                    .value
                    .trim(),

            address:
                document
                    .getElementById(
                        "customerAddress"
                    )
                    .value
                    .trim(),

            city:
                document
                    .getElementById(
                        "customerCity"
                    )
                    .value
                    .trim(),

            state:
                document
                    .getElementById(
                        "customerState"
                    )
                    .value
                    .trim(),

            pincode:
                document
                    .getElementById(
                        "customerPincode"
                    )
                    .value
                    .trim(),

            deliveryNote:
                document
                    .getElementById(
                        "deliveryNote"
                    )
                    .value
                    .trim()

        },


        payment: {

            method:
                selectedPayment.value,

            methodName:
                paymentName

        },


        items:
            checkoutCart.map(
                item => ({

                    id:
                        item.id,

                    name:
                        item.name,

                    image:
                        item.image,

                    price:
                        Number(item.price) || 0,

                    weight:
                        item.weight || "",

                    quantity:
                        getItemQuantity(item)

                })
            ),


        subtotal:
            subtotal,

        shipping:
            shipping,

        total:
            total,

        status:
            "Order Placed"

    };


    /* =====================================================
       GET EXISTING ORDERS
    ====================================================== */

    let orders = [];


    try {

        orders =
            JSON.parse(
                localStorage.getItem(
                    ORDERS_KEY
                )
            ) || [];

    } catch (error) {

        orders = [];
    }


    /* =====================================================
       SAVE ORDER
    ====================================================== */

    orders.push(order);


    localStorage.setItem(
        ORDERS_KEY,
        JSON.stringify(orders)
    );


    /* =====================================================
       CLEAR CART
    ====================================================== */

    checkoutCart = [];


    localStorage.removeItem(
        CHECKOUT_CART_KEY
    );


    localStorage.removeItem(
        OLD_CHECKOUT_CART_KEY
    );


    /* =====================================================
       UPDATE CART COUNTERS
    ====================================================== */

    updateHeaderCartCount();


    /* =====================================================
       SUCCESS MODAL
    ====================================================== */

    const orderNumberElement =
        document.getElementById(
            "successOrderNumber"
        );


    if (orderNumberElement) {

        orderNumberElement.textContent =
            orderNumber;
    }


    const modalElement =
        document.getElementById(
            "orderSuccessModal"
        );


    if (
        modalElement &&
        typeof bootstrap !== "undefined"
    ) {

        const successModal =
            bootstrap.Modal.getOrCreateInstance(
                modalElement
            );

        successModal.show();

    } else {

        alert(
            "Order placed successfully!\nOrder Number: " +
            orderNumber
        );

    }


    renderCheckout();

}


/* =========================================================
   UPDATE HEADER CART COUNT
========================================================= */

function updateHeaderCartCount() {

    const cartCount =
        document.getElementById(
            "headerCartCount"
        );


    if (!cartCount) {
        return;
    }


    let totalQuantity = 0;


    checkoutCart.forEach(
        item => {

            totalQuantity +=
                getItemQuantity(item);

        }
    );


    cartCount.textContent =
        totalQuantity;
}


/* =========================================================
   CONTINUE AFTER ORDER
========================================================= */

function continueAfterOrder() {

    window.location.href =
        "AllProduct.html";
}


/* =========================================================
   SET STAR VISUAL
========================================================= */

function updateStars(rating) {

    const stars =
        document.querySelectorAll(
            "#feedbackStars i"
        );


    stars.forEach(
        (star, index) => {

            const starNumber =
                index + 1;


            star.classList.remove(
                "bi-star",
                "bi-star-fill"
            );


            if (
                starNumber <= rating
            ) {

                star.classList.add(
                    "bi-star-fill"
                );

            } else {

                star.classList.add(
                    "bi-star"
                );

            }

        }
    );
}


/* =========================================================
   SETUP STAR REVIEW
========================================================= */

function setupReviewSystem() {

    const stars =
        document.querySelectorAll(
            "#feedbackStars i"
        );


    const reviewMessage =
        document.getElementById(
            "feedbackMessage"
        );


    const reviewText =
        document.getElementById(
            "feedbackText"
        );


    const submitButton =
        document.getElementById(
            "submitFeedbackButton"
        );


    if (!stars.length) {
        return;
    }


    /* =====================================================
       STAR CLICK
    ====================================================== */

    stars.forEach(
        star => {

            star.addEventListener(
                "click",
                function () {

                    selectedRating =
                        Number(
                            this.dataset.value
                        );


                    updateStars(
                        selectedRating
                    );


                    if (reviewMessage) {

                        reviewMessage.textContent =
                            selectedRating +
                            " out of 5 stars selected.";

                        reviewMessage.classList.remove(
                            "error"
                        );

                        reviewMessage.classList.add(
                            "success"
                        );
                    }

                }
            );


            /* =================================================
               STAR HOVER
            ================================================== */

            star.addEventListener(
                "mouseenter",
                function () {

                    const hoverRating =
                        Number(
                            this.dataset.value
                        );


                    updateStars(
                        hoverRating
                    );

                }
            );


            /* =================================================
               MOUSE LEAVE
            ================================================== */

            star.addEventListener(
                "mouseleave",
                function () {

                    updateStars(
                        selectedRating
                    );

                }
            );

        }
    );


    /* =====================================================
       SUBMIT REVIEW
    ====================================================== */

    if (submitButton) {

        submitButton.addEventListener(
            "click",
            submitReview
        );

    }

}


/* =========================================================
   SUBMIT REVIEW
========================================================= */

function submitReview() {

    const reviewText =
        document.getElementById(
            "feedbackText"
        );


    const reviewMessage =
        document.getElementById(
            "feedbackMessage"
        );


    if (!reviewMessage) {
        return;
    }


    /* =====================================================
       CHECK RATING
    ====================================================== */

    if (selectedRating === 0) {

        reviewMessage.textContent =
            "Please select a star rating.";

        reviewMessage.classList.remove(
            "success"
        );

        reviewMessage.classList.add(
            "error"
        );

        return;
    }


    /* =====================================================
       GET TEXT
    ====================================================== */

    const text =
        reviewText
            ? reviewText.value.trim()
            : "";


    /* =====================================================
       CREATE REVIEW
    ====================================================== */

    const review = {

        rating:
            selectedRating,

        comment:
            text,

        date:
            new Date().toISOString()

    };


    /* =====================================================
       GET OLD REVIEWS
    ====================================================== */

    let reviews = [];


    try {

        reviews =
            JSON.parse(
                localStorage.getItem(
                    REVIEWS_KEY
                )
            ) || [];

    } catch (error) {

        reviews = [];
    }


    /* =====================================================
       SAVE REVIEW
    ====================================================== */

    reviews.push(review);


    localStorage.setItem(
        REVIEWS_KEY,
        JSON.stringify(reviews)
    );


    /* =====================================================
       SUCCESS MESSAGE
    ====================================================== */

    reviewMessage.textContent =
        "Thank you! Your review has been submitted successfully.";

    reviewMessage.classList.remove(
        "error"
    );

    reviewMessage.classList.add(
        "success"
    );


    /* =====================================================
       CLEAR FORM
    ====================================================== */

    if (reviewText) {

        reviewText.value = "";
    }


    selectedRating = 0;

    updateStars(0);

}


/* =========================================================
   CHECKOUT PROGRESS BAR
========================================================= */

function setupCheckoutProgress() {

    const progressSteps =
        document.querySelectorAll(
            ".checkout-progress .progress-step"
        );


    if (!progressSteps.length) {
        return;
    }


    progressSteps.forEach(
        (step, index) => {

            step.classList.remove(
                "completed",
                "active"
            );


            if (index < 2) {

                step.classList.add(
                    "completed"
                );

            }


            if (index === 2) {

                step.classList.add(
                    "active"
                );

            }

        }
    );

}


/* =========================================================
   PROGRESS BAR - CLICK SUPPORT
========================================================= */

function setupProgressClick() {

    const progressSteps =
        document.querySelectorAll(
            ".checkout-progress .progress-step"
        );


    progressSteps.forEach(
        step => {

            step.addEventListener(
                "click",
                function () {

                    const target =
                        this.dataset.target;


                    if (!target) {
                        return;
                    }


                    const element =
                        document.getElementById(
                            target
                        );


                    if (element) {

                        element.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });

                    }

                }
            );

        }
    );

}


/* =========================================================
   REVIEW BOX POSITION
========================================================= */

function setupReviewBox() {

    const reviewBox =
        document.getElementById(
            "orderFeedbackBox"
        );


    if (!reviewBox) {
        return;
    }

    reviewBox.classList.add(
        "checkout-review-section"
    );

}


/* =========================================================
   PREVENT ENTER FROM SUBMITTING
========================================================= */

function setupFormSafety() {

    const inputs =
        document.querySelectorAll(
            "input"
        );


    inputs.forEach(
        input => {

            input.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter" &&
                        this.type !== "button"
                    ) {

                        event.preventDefault();

                    }

                }
            );

        }
    );

}


/* =========================================================
   HEADER ACCOUNT
========================================================= */

function setupAccountDropdown() {

    const button =
        document.getElementById(
            "headerLoginButton"
        );


    const dropdown =
        document.getElementById(
            "accountDropdown"
        );


    if (
        !button ||
        !dropdown
    ) {
        return;
    }


    button.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();

            dropdown.classList.toggle(
                "show"
            );

        }
    );


    document.addEventListener(
        "click",
        function () {

            dropdown.classList.remove(
                "show"
            );

        }
    );

}


/* =========================================================
   WISHLIST COUNT SAFETY
========================================================= */

function setupWishlistCount() {

    const count =
        document.getElementById(
            "headerWishlistCount"
        );


    if (!count) {
        return;
    }


    const wishlist =
        localStorage.getItem(
            "sheernWishlist"
        );


    if (!wishlist) {

        count.textContent = "0";

        return;
    }


    try {

        const parsed =
            JSON.parse(wishlist);


        if (Array.isArray(parsed)) {

            count.textContent =
                parsed.length;

        }

    } catch (error) {

        count.textContent = "0";

    }

}


/* =========================================================
   HEADER CART COUNT INITIALIZATION
========================================================= */

function initializeHeaderCounts() {

    updateHeaderCartCount();

    setupWishlistCount();

}


/* =========================================================
   INITIALIZE CHECKOUT
========================================================= */

function initializeCheckout() {

    /* =====================================================
       GET CART
    ====================================================== */

    checkoutCart =
        getCartFromStorage();


    /* =====================================================
       RENDER
    ====================================================== */

    renderCheckout();


    /* =====================================================
       PAYMENT
    ====================================================== */

    setupPaymentMethods();

    setupCardFormatting();

    setupUPIOptions();


    /* =====================================================
       REVIEW
    ====================================================== */

    setupReviewSystem();

    setupReviewBox();

    setupCheckoutProgress();

    setupProgressClick();


    /* =====================================================
       SAFETY
    ====================================================== */

    setupFormSafety();


    /* =====================================================
       HEADER
    ====================================================== */

    initializeHeaderCounts();

    setupAccountDropdown();


    /* =====================================================
       PLACE ORDER BUTTON
    ====================================================== */

    const placeOrderButton =
        document.getElementById(
            "placeOrderButton"
        );


    if (placeOrderButton) {

        placeOrderButton.addEventListener(
            "click",
            placeOrder
        );

    }


    /* =====================================================
       SUCCESS BUTTON
    ====================================================== */

    const continueButton =
        document.getElementById(
            "continueAfterOrder"
        );


    if (continueButton) {

        continueButton.addEventListener(
            "click",
            continueAfterOrder
        );

    }

}


/* =========================================================
   START CHECKOUT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeCheckout
);
