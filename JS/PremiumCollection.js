(function () {
  "use strict";

  /* ---------- CONFIG: edit these paths and rules ---------- */
  const PRODUCTS_URL = "DATA/products.json";
  const HAMPERS_URL = "DATA/Hampers.json"; // change to your hampers file name

  // Which products.json items are premium (by id)
  const PREMIUM_PRODUCT_IDS = [1,4, 10, 15, 7, 17, 18];

  // Which hampers are premium (by badge text, case-insensitive)
  const PREMIUM_HAMPER_BADGE = "premium";

  // Discounts for products.json items (percent off, by id).
  // Hampers use their own oldPrice instead.
  const DISCOUNTS = {
    // 4: 10,
    // 10: 15,
  };

  const WISHLIST_KEY = "sheernWishlist"; // change if Dry.js uses other keys
  const CART_KEY = "sheernCart";

  const grid = document.getElementById("catGrid");
  const countEl = document.getElementById("catCount");
  const sortEl = document.getElementById("catSort");
  if (!grid) return;

  let items = [];

  /* ---------- helpers ---------- */
  const read = (key) => {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch (e) { return []; }
  };
  const write = (key, val) => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  };
  const money = (n) => "₹" + Number(n).toFixed(2);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => (
      { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));

  function stars(rating) {
    const r = Math.round(Number(rating) || 0);
    let out = "";
    for (let i = 1; i <= 5; i++) {
      out += `<i class="bi ${i <= r ? "bi-star-fill" : "bi-star"}"></i>`;
    }
    return out;
  }

  /* ---------- normalise both lists into one shape ---------- */
  function fromProduct(p) {
    const off = DISCOUNTS[p.id];
    const price = off
      ? Math.round(p.price * (1 - off / 100) * 100) / 100
      : Number(p.price);
    return {
      id: String(p.id),
      name: String(p.name || "").trim(),
      image: p.image,
      price: price,
      oldPrice: price < p.price ? Number(p.price) : null,
      weight: p.weight || "",
      rating: Number(p.rating) || 0,
      reviews: p.reviews || 0,
      description: p.description || "",
      type: "product",
    };
  }

  function fromHamper(h) {
    return {
      id: String(h.id),
      name: h.name,
      image: h.image,
      price: Number(h.price),
      oldPrice: h.oldPrice ? Number(h.oldPrice) : null,
      weight: "Gift Box",
      rating: Number(h.rating) || 0,
      reviews: h.reviews || 0,
      description: h.inside ? `Inside: ${h.inside}` : h.desc || "",
      type: "hamper",
    };
  }

  /* ---------- sort ---------- */
  function getVisible() {
    const list = items.slice();
    switch (sortEl ? sortEl.value : "default") {
      case "low":    return list.sort((a, b) => a.price - b.price);
      case "high":   return list.sort((a, b) => b.price - a.price);
      case "rating": return list.sort((a, b) => b.rating - a.rating);
      default:       return list;
    }
  }

  /* ---------- counters ---------- */
  function updateCounts() {
    const wish = read(WISHLIST_KEY).length;
    const cart = read(CART_KEY).reduce((sum, i) => sum + (i.qty || 1), 0);
    ["headerWishlistCount", "sidebarWishlistCount"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = wish;
    });
    const cartEl = document.getElementById("headerCartCount");
    if (cartEl) cartEl.textContent = cart;
  }

  /* ---------- render ---------- */
  function cardHTML(p, wished) {
    return `
      <article class="cat-card" data-id="${esc(p.id)}">
        <div class="cat-img">
          <span class="cat-badge">PREMIUM</span>
          <button type="button" class="cat-wish ${wished ? "active" : ""}"
                  data-id="${esc(p.id)}" aria-label="Add to wishlist">
            <i class="bi ${wished ? "bi-heart-fill" : "bi-heart"}"></i>
          </button>
          <img src="${esc(encodeURI(p.image || ""))}" alt="${esc(p.name)}" loading="lazy">
        </div>
        <div class="cat-body">
          <h3>${esc(p.name)}</h3>
          <p class="cat-desc">${esc(p.description)}</p>
          <div class="cat-rating">${stars(p.rating)}<small>(${esc(p.reviews)})</small></div>
          <div class="cat-meta">
            <span class="cat-price">
              ${money(p.price)}
              ${p.oldPrice ? `<small style="text-decoration:line-through;color:#7a7066;font-size:.8rem;margin-left:6px">${money(p.oldPrice)}</small>` : ""}
            </span>
            <span class="cat-weight">${esc(p.weight)}</span>
          </div>
          <button type="button" class="cat-add" data-id="${esc(p.id)}">Add to Card</button>
        </div>
      </article>`;
  }

  function render() {
    const list = getVisible();
    const wishlist = read(WISHLIST_KEY).map(String);

    if (countEl) {
      countEl.textContent = `${list.length} product${list.length === 1 ? "" : "s"}`;
    }
    if (!list.length) {
      grid.innerHTML = `<p class="cat-empty">No premium products found yet.</p>`;
      return;
    }
    grid.innerHTML = list.map((p) => cardHTML(p, wishlist.includes(p.id))).join("");
  }

  /* ---------- actions ---------- */
  function toggleWish(id) {
    let wishlist = read(WISHLIST_KEY).map(String);
    wishlist = wishlist.includes(id) ? wishlist.filter((x) => x !== id) : [...wishlist, id];
    write(WISHLIST_KEY, wishlist);
    updateCounts();
    render();
  }

  function addToCart(id, btn) {
    const p = items.find((x) => x.id === id);
    if (!p) return;
    const cart = read(CART_KEY);
    const found = cart.find((i) => String(i.id) === p.id);
    if (found) {
      found.qty = (found.qty || 1) + 1;
    } else {
      cart.push({
        id: p.id, name: p.name, image: p.image,
        price: p.price, weight: p.weight, qty: 1,
      });
    }
    write(CART_KEY, cart);
    updateCounts();

    btn.classList.add("added");
    btn.textContent = "Added ✓";
    setTimeout(() => {
      btn.classList.remove("added");
      btn.textContent = "Add to Basket";
    }, 1200);
  }

  grid.addEventListener("click", (e) => {
    const wish = e.target.closest(".cat-wish");
    if (wish) { toggleWish(wish.dataset.id); return; }
    const add = e.target.closest(".cat-add");
    if (add) addToCart(add.dataset.id, add);
  });

  if (sortEl) sortEl.addEventListener("change", render);

  /* ---------- load both lists ---------- */
  const load = (url) =>
    fetch(url).then((res) => {
      if (!res.ok) throw new Error(url + " -> HTTP " + res.status);
      return res.json();
    });

  Promise.allSettled([load(PRODUCTS_URL), load(HAMPERS_URL)]).then(([prod, hamp]) => {
    if (prod.status === "rejected") console.error(prod.reason);
    if (hamp.status === "rejected") console.error(hamp.reason);

    const products = prod.status === "fulfilled"
      ? (Array.isArray(prod.value) ? prod.value : prod.value.products || [])
      : [];
    const hampers = hamp.status === "fulfilled"
      ? (Array.isArray(hamp.value) ? hamp.value : hamp.value.hampers || [])
      : [];

    const premiumProducts = products
      .filter((p) => PREMIUM_PRODUCT_IDS.includes(Number(p.id)))
      .map(fromProduct);

    const premiumHampers = hampers
      .filter((h) => String(h.badge || "").trim().toLowerCase() === PREMIUM_HAMPER_BADGE)
      .map(fromHamper);

    // Hampers first (gift boxes), then premium products
    items = [...premiumHampers, ...premiumProducts];

    updateCounts();
    render();
  });
})();