(function () {
    "use strict";

    /* =====================================================
       SETTINGS
    ===================================================== */
    const PER_PAGE = 6;                 // offers per page (pagination appears above this)
    const CARD_SELECTOR = ".offer-card";
    const IGNORE_SELECTOR = "button, a, input, select, textarea";
    const OFFERS = [
        {
            id: 1,
            items: [
                {
                    image: "Photos/gift.1.jpg",
                    name: "Afghani Dry Fruit Box",
                    description: "A premium selection of Afghani dry fruits, perfect for gifting.",
                    mrp: 999,
                    discount: 20            // = ₹799
                },
                {
                    image: "Photos/gift2.jpg",
                    name: "Pink Floral Gift Hamper",
                    description: "Mixed nuts in glass jars, decorated with fresh-style flowers.",
                    mrp: 1000,
                    discount: 15            // = ₹850
                },
                {
                    image: "Photos/gift3.jpg",
                    name: "Mixed Nuts Gift Box",
                    description: "Almonds, cashews and raisins packed in a neat gift box.",
                    mrp: 899,
                    discount: 10            // = ₹809
                },
                {
                    image: "Photos/rap6.jpg",
                    name: "Festive Dry Fruit Tray",
                    description: "A colourful tray of assorted dry fruits for celebrations.",
                    mrp: 1199,
                    discount: 25            // = ₹899
                }
            ]
        },
        {
            id: 2,
            items: [
                {
                    image: "Photos/mulberries.jpg",
                    name: "Premium Mulberries 350g",
                    description: "Fresh, crunchy and packed with natural goodness.",
                    weight: "350g",
                    mrp: 899,
                    discount: 15            // = ₹764
                },
                {
                    image: "Photos/Macadamia.jpg",
                    name: "Macadamia Nuts 350g",
                    description: "Rich, buttery and creamy macadamia nuts.",
                    weight: "350g",
                    mrp: 750,
                    discount: 10            // = ₹675
                },
                {
                    image: "Photos/first.png",
                    name: "Premium Mixed Dry Fruits 350g",
                    description: "A balanced mix of nuts and dried fruits.",
                    weight: "350g",
                    mrp: 650,
                    discount: 12            // = ₹572
                },
                {
                    image: "Photos/Pine Nut.jpg",
                    name: "Pine Nuts 350g",
                    description: "Soft, sweet pine nuts, hand selected.",
                    weight: "350g",
                    mrp: 1400,
                    discount: 20            // = ₹1,120
                }
            ]
        },
        {
            id: 3,
            items: [
                {
                    image: "Photos/rap.jpg",
                    name: "Festive Gift Hamper",
                    description: "Buy any two hampers and get a third one free.",
                    badge: "BUY 2 GET 1",
                    mrp: 1599,
                    price: 1299
                },
                {
                    image: "Photos/rap3.jpg",
                    name: "Rose Gift Hamper",
                    description: "A rose-decorated hamper. Buy any two and get a third free.",
                    badge: "BUY 2 GET 1",
                    mrp: 1899,
                    price: 1499
                },
                {
                    image: "Photos/rap7.jpg",
                    name: "Classic Dry Fruit Hamper",
                    description: "A classic hamper of our best sellers. Buy 2, get 1 free.",
                    badge: "BUY 2 GET 1",
                    mrp: 1399,
                    price: 1099
                },
                {
                    image: "Photos/rap56.jpg",
                    name: "Royal Festive Hamper",
                    description: "Our largest hamper, made for gifting. Buy 2, get 1 free.",
                    badge: "BUY 2 GET 1",
                    mrp: 2499,
                    price: 1999
                }
            ]
        }
    ];

    /* =====================================================
       ELEMENTS
    ===================================================== */
    let grid = null;
    let currentPage = 1;

    /* =====================================================
       HELPERS
    ===================================================== */
    function escapeHTML(value) {
        const div = document.createElement("div");
        div.textContent = value == null ? "" : String(value);
        return div.innerHTML;
    }

    function formatPrice(n) {
        return "₹" + Number(n || 0).toLocaleString("en-IN", {
            maximumFractionDigits: 0
        });
    }

    function findOffer(id) {
        return OFFERS.find(function (o) { return String(o.id) === String(id); });
    }

    /* Price, old price and badge for ONE item */
    function getPricing(item) {
        const mrp = Number(item.mrp) || 0;
        let price;

        if (item.price != null) {
            price = Number(item.price);
        } else {
            price = Math.round(mrp * (1 - (Number(item.discount) || 0) / 100));
        }

        const percent = mrp > price ? Math.round((mrp - price) / mrp * 100) : 0;
        const badge = item.badge || (percent ? percent + "% OFF" : "");

        return { price: price, mrp: mrp, badge: badge };
    }

    /* =====================================================
       CARD / DECK CONTENT  (one item = one product)
    ===================================================== */
    function itemHTML(offer, index, withThumbs) {
        const item = offer.items[index];
        const p = getPricing(item);

        const thumbs = withThumbs
            ? '<div class="offer-thumbs">' + offer.items.map(function (it, i) {
                return `<button type="button" class="offer-thumb ${i === index ? "active" : ""}"
                                data-action="thumb" data-index="${i}"
                                aria-label="Show ${escapeHTML(it.name)}">
                            <img src="${escapeHTML(it.image)}" alt="">
                        </button>`;
            }).join("") + "</div>"
            : "";

        return `
            <div class="offer-image">
                <img class="offer-main-image"
                     src="${escapeHTML(item.image)}"
                     alt="${escapeHTML(item.name)}">
                ${p.badge ? `<span class="offer-badge">${escapeHTML(p.badge)}</span>` : ""}
            </div>

            ${thumbs}

            <div class="offer-body">
                <h3>${escapeHTML(item.name)}</h3>
                <p>${escapeHTML(item.description)}</p>

                <div class="offer-price">
                    <strong>${formatPrice(p.price)}</strong>
                    ${p.mrp > p.price ? `<del>${formatPrice(p.mrp)}</del>` : ""}
                </div>

                <div class="offer-actions">
                    <button type="button" class="offer-cart-btn" data-action="cart">
                        <i class="bi bi-bag"></i> Add to Cart
                    </button>
                    <button type="button" class="offer-buy-btn" data-action="buy">
                        <i class="bi bi-lightning-charge-fill"></i> Buy Now
                    </button>
                </div>
            </div>`;
    }

    function cardHTML(o) {
        return `<article class="offer-card" data-id="${escapeHTML(o.id)}" data-active="0">`
            + itemHTML(o, 0, true)
            + `</article>`;
    }

    /* Show another item inside a real page card (thumbnail click) */
    function setActive(card, index) {
        const offer = findOffer(card.dataset.id);
        if (!offer || !offer.items[index]) return;

        card.dataset.active = String(index);
        card.innerHTML = itemHTML(offer, index, true);
    }

    function renderPage() {
        const total = Math.max(1, Math.ceil(OFFERS.length / PER_PAGE));
        if (currentPage > total) currentPage = total;

        const start = (currentPage - 1) * PER_PAGE;
        const end = Math.min(start + PER_PAGE, OFFERS.length);

        grid.innerHTML = OFFERS.slice(start, end).map(cardHTML).join("");
        buildNav(total, start, end);
    }

    /* =====================================================
       PAGINATION
    ===================================================== */
    function getNav() {
        let nav = document.getElementById("offersPagination");

        if (!nav) {
            nav = document.createElement("nav");
            nav.id = "offersPagination";
            nav.className = "offers-pagination";
            nav.setAttribute("aria-label", "Offer pages");
            grid.insertAdjacentElement("afterend", nav);
        }

        return nav;
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

    function goToPage(page) {
        currentPage = page;
        renderPage();
        grid.scrollIntoView({ behavior: "smooth", block: "start" });
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
        list.className = "offers-pagination-list";

        function addButton(label, page, active, disabled, aria) {
            const li = document.createElement("li");
            const btn = document.createElement("button");

            btn.type = "button";
            btn.className = "offers-page-btn" + (active ? " active" : "");
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
                li.className = "offers-page-dots";
                li.textContent = "...";
                list.appendChild(li);
            } else {
                addButton(String(p), p, p === currentPage, false, "Page " + p);
            }
        });

        addButton('<i class="bi bi-chevron-right"></i>', currentPage + 1, false, currentPage === total, "Next page");

        const info = document.createElement("p");
        info.className = "offers-pagination-info";
        info.textContent = "Showing " + (start + 1) + "-" + end + " of " + OFFERS.length + " offers";

        nav.appendChild(list);
        nav.appendChild(info);
    }

    /* =====================================================
       CART  (uses the cart from Dry.js)
       Each ITEM is added with its OWN name and price.
    ===================================================== */
    function addToCart(offer, index) {
        if (typeof cart === "undefined" || typeof updateCart !== "function") {
            console.error("Dry.js cart not available. Is Dry.js loaded before this file?");
            return false;
        }

        const item = offer.items[index];
        if (!item) return false;

        const p = getPricing(item);
        const key = "offer-" + offer.id + "-" + index;

        const existing = cart.find(function (c) {
            return String(c.id) === key;
        });

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                id: key,
                name: item.name,
                price: p.price,
                image: item.image,
                weight: item.weight || "",
                category: "special offer",
                quantity: 1
            });
        }

        if (typeof saveCart === "function") saveCart();
        updateCart();
        return true;
    }

    function openCart() {
        if (window.bootstrap) {
            bootstrap.Offcanvas.getOrCreateInstance("#cartCanvas").show();
        }
    }

    function buyNow(offer, index) {
        if (typeof cart === "undefined" || typeof updateCart !== "function") {
            console.error("Dry.js cart not available. Is Dry.js loaded before this file?");
            return;
        }

        const key = "offer-" + offer.id + "-" + index;

        const inCart = cart.some(function (c) {
            return String(c.id) === key;
        });

        if (!inCart) addToCart(offer, index);

        if (typeof checkout === "function") {
            checkout();
        } else {
            openCart();
        }
    }

    /* =====================================================
       PAGE CARD EVENTS (thumbnails, Add to Cart, Buy Now)
    ===================================================== */
    function bindCardEvents() {
        grid.addEventListener("click", function (e) {
            const btn = e.target.closest("[data-action]");
            if (!btn) return;

            const card = btn.closest(CARD_SELECTOR);
            if (!card) return;

            const offer = findOffer(card.dataset.id);
            if (!offer) return;

            const index = Number(card.dataset.active) || 0;

            switch (btn.dataset.action) {
                case "thumb":
                    setActive(card, Number(btn.dataset.index));
                    break;
                case "cart":
                    if (addToCart(offer, index)) openCart();
                    break;
                case "buy":
                    buyNow(offer, index);
                    break;
            }
        });
    }

    /* =====================================================
       ZOOM + SHUFFLE DECK
       The deck holds the 4 products of the clicked offer.
       No thumbnail strip: use the arrows or tap a card behind.
    ===================================================== */
    let overlay = null;
    let stage = null;
    let items = [];          // the deck pieces (one per product)
    let order = [];          // piece indexes, front first
    let busy = false;
    let deckOffer = null;    // offer shown in the deck
    let deckCard = null;     // the real page card it opened from

    function buildPieces() {
        stage.innerHTML = "";

        items = deckOffer.items.map(function (item, i) {
            const el = document.createElement("div");
            el.className = "deck-piece offer-card";
            el.innerHTML = itemHTML(deckOffer, i, false);

            el.addEventListener("click", function (e) {
                // A card behind the front one: shuffle it to the front
                if (order[0] !== i) {
                    e.preventDefault();
                    e.stopPropagation();
                    bringToFront(i, 1);
                    return;
                }

                // Front card: Add to Cart / Buy Now for THIS product
                const btn = e.target.closest("[data-action]");
                if (!btn) return;

                if (btn.dataset.action === "cart") {
                    if (addToCart(deckOffer, i)) {
                        closeDeck();
                        openCart();
                    }
                } else if (btn.dataset.action === "buy") {
                    const offer = deckOffer;
                    closeDeck();
                    buyNow(offer, i);
                }
            });

            stage.appendChild(el);
            return el;
        });
    }

    function layout() {
        const spread = window.innerWidth < 576 ? 24 : 48;

        order.forEach(function (idx, pos) {
            const el = items[idx];
            const p = Math.min(pos, 4);
            const dir = pos % 2 ? 1 : -1;
            const x = pos === 0 ? 0 : dir * p * spread;
            const y = pos === 0 ? 0 : p * -4;
            const rot = pos === 0 ? 0 : dir * p * 6;
            const s = 1 - p * 0.06;

            el.style.transform =
                "translate(-50%, -50%) translate(" + x + "px," + y + "px) rotate(" + rot + "deg) scale(" + s + ")";
            el.style.opacity = pos > 4 ? 0 : 1;
            el.style.zIndex = 100 - pos;
            el.style.pointerEvents = pos > 4 ? "none" : "auto";
            el.classList.toggle("is-front", pos === 0);
        });
    }

    function bringToFront(target, dirOut) {
        if (busy || order[0] === target) return;
        busy = true;

        const oldFront = items[order[0]];
        oldFront.style.transform =
            "translate(-50%, -50%) translate(" + (-dirOut * 70) + "vw, 0) rotate(" + (-dirOut * 16) + "deg)";

        setTimeout(function () {
            const old = order[0];
            order = [target].concat(
                order.filter(function (n) { return n !== target && n !== old; }),
                [old]
            );
            layout();
            setTimeout(function () { busy = false; }, 500);
        }, 260);
    }

    function nextCard() { if (order.length > 1) bringToFront(order[1], 1); }
    function prevCard() { if (order.length > 1) bringToFront(order[order.length - 1], -1); }

    function openDeck(card) {
        deckOffer = findOffer(card.dataset.id);
        if (!deckOffer) return;

        deckCard = card;

        const startIndex = Number(card.dataset.active) || 0;

        buildPieces();

        order = [startIndex].concat(
            deckOffer.items.map(function (_, i) { return i; }).filter(function (i) { return i !== startIndex; })
        );

        items.forEach(function (el) { el.classList.add("no-anim"); });
        layout();

        // Start the zoom exactly on top of the clicked card
        const front = items[startIndex];
        const rect = card.getBoundingClientRect();
        const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
        const dy = rect.top + rect.height / 2 - window.innerHeight * 0.46;
        const sx = rect.width / front.offsetWidth;
        front.style.transform =
            "translate(-50%, -50%) translate(" + dx + "px," + dy + "px) scale(" + sx + ")";
        front.style.opacity = 1;
        card.style.visibility = "hidden";
        void front.offsetWidth;

        items.forEach(function (el) { el.classList.remove("no-anim"); });
        overlay.classList.add("open");
        document.body.classList.add("deck-lock");
        layout();
        busy = false;
    }

    function closeDeck() {
        if (!overlay || !overlay.classList.contains("open")) return;

        overlay.classList.remove("open");
        document.body.classList.remove("deck-lock");

        // The page card now shows the product that was in front
        if (deckCard && deckCard.isConnected && order.length) {
            setActive(deckCard, order[0]);
            deckCard.style.visibility = "";
        }

        deckCard = null;
        busy = false;
    }

    function bindDeck() {
        overlay = document.createElement("div");
        overlay.className = "deck-overlay";
        overlay.innerHTML =
            '<button type="button" class="deck-close" aria-label="Close">&times;</button>' +
            '<button type="button" class="deck-nav deck-prev" aria-label="Previous">&#8249;</button>' +
            '<button type="button" class="deck-nav deck-next" aria-label="Next">&#8250;</button>' +
            '<div class="deck-stage"></div>' +
            '<div class="deck-hint">Tap a card behind, or use the arrows, to see the next product</div>';
        document.body.appendChild(overlay);

        stage = overlay.querySelector(".deck-stage");

        // Click on a real offer card (not on its buttons) opens the zoom view
        document.addEventListener("click", function (e) {
            if (overlay.contains(e.target)) return;

            const card = e.target.closest(CARD_SELECTOR);
            if (!card) return;
            if (e.target.closest(IGNORE_SELECTOR)) return;

            openDeck(card);
        });

        overlay.querySelector(".deck-close").addEventListener("click", closeDeck);
        overlay.querySelector(".deck-next").addEventListener("click", nextCard);
        overlay.querySelector(".deck-prev").addEventListener("click", prevCard);

        overlay.addEventListener("click", function (e) {
            if (e.target === overlay || e.target === stage) closeDeck();
        });

        document.addEventListener("keydown", function (e) {
            if (!overlay.classList.contains("open")) return;
            if (e.key === "Escape") closeDeck();
            if (e.key === "ArrowRight") nextCard();
            if (e.key === "ArrowLeft") prevCard();
        });
    }

    /* =====================================================
       START
    ===================================================== */
    function init() {
        grid = document.getElementById("offersGrid") || document.querySelector(".offers-grid");

        if (!grid) {
            console.warn("SpecialOffer.js: no element with id=\"offersGrid\" or class=\"offers-grid\" found.");
            return;
        }

        renderPage();
        bindCardEvents();
        bindDeck();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();