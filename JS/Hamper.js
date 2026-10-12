/* Sheern - Gift Hampers page */

const CURRENCY = "₹";
const CART_KEY = "sheernCart";          // same localStorage key used by Dry.js
const DATA_URL = "DATA/Hampers.json";   // where the hamper data lives

const OCCASION_NAMES = {
  festival: "Festivals",
  wedding: "Weddings",
  corporate: "Corporate",
  birthday: "Birthdays & Anniversaries",
  housewarming: "Housewarming",
  thankyou: "Thank You & Get Well"
};

const FESTIVAL_NAMES = {
  "nowruz": "Nowruz",
  "eid-fitr": "Eid ul-Fitr",
  "eid-adha": "Eid ul-Adha"
};
const FESTIVAL_NOTES = {
  "all": "Hampers for every festival. Pick one above to narrow them down.",
  "nowruz": "Nowruz is the spring new year. Dried fruits and nuts are traditionally served and shared with visitors.",
  "eid-fitr": "Eid ul-Fitr ends Ramadan. Dates, nuts and dried fruits are shared with family and guests.",
  "eid-adha": "Eid ul-Adha is the festival of sacrifice. Many families gift boxes to relatives and neighbours."
};

// Filled from Hampers.json
let HAMPERS = [];

const occasionGrid = document.getElementById("occasionGrid");
const hamperGrid = document.getElementById("hamperGrid");
const hamperEmpty = document.getElementById("hamperEmpty");
const catCount = document.getElementById("catCount");
const catSort = document.getElementById("catSort");
const resetBtn = document.getElementById("occasionReset");

const festivalPanel = document.getElementById("festivalPanel");
const festivalChips = document.getElementById("festivalChips");
const festivalNote = document.getElementById("festivalNote");

let activeOccasion = "all";
let activeFestival = "all";

const money = n => CURRENCY + Number(n).toLocaleString("en-IN");
const stars = r => "★".repeat(Math.round(r)) + "☆".repeat(5 - Math.round(r));

function getVisible() {
  let list = HAMPERS.filter(h => activeOccasion === "all" || h.occasions.includes(activeOccasion));
  if (activeOccasion === "festival" && activeFestival !== "all") {
    list = list.filter(h => (h.festivals || []).includes(activeFestival));
  }
  if (catSort.value === "low") list.sort((a, b) => a.price - b.price);
  if (catSort.value === "high") list.sort((a, b) => b.price - a.price);
  if (catSort.value === "rating") list.sort((a, b) => b.rating - a.rating);
  return list;
}

function render() {
  const list = getVisible();

  hamperGrid.innerHTML = list.map(h => `
    <article class="hamper-card" data-id="${h.id}">
      <div class="hamper-media">
        <img src="${h.image}" alt="${h.name}" loading="lazy" onerror="this.style.display='none'">
        ${h.badge ? `<span class="hamper-badge">${h.badge}</span>` : ""}
      </div>
      <div class="hamper-body">
        <div class="hamper-tags">
          ${h.occasions.filter(o => OCCASION_NAMES[o]).map(o => `<span>${OCCASION_NAMES[o]}</span>`).join("")}
        </div>
        <h3 class="hamper-title">${h.name}</h3>
        <p class="hamper-desc">${h.desc}</p>
        <p class="hamper-inside"><strong>Inside:</strong> ${h.inside}</p>
        <p class="hamper-rating">${stars(h.rating)}<span>${h.rating} (${h.reviews})</span></p>
        <div class="hamper-foot">
          <span class="hamper-price">${money(h.price)}${h.oldPrice ? `<del>${money(h.oldPrice)}</del>` : ""}</span>
          <button type="button" class="hamper-add" data-add="${h.id}">Add to Cart</button>
        </div>
      </div>
    </article>
  `).join("");

  hamperEmpty.hidden = list.length > 0;
  let where = activeOccasion === "all" ? "" : ` for ${OCCASION_NAMES[activeOccasion]}`;
  if (activeOccasion === "festival" && activeFestival !== "all") {
    where = ` for ${FESTIVAL_NAMES[activeFestival]}`;
  }
  catCount.textContent = `Showing ${list.length} hamper${list.length === 1 ? "" : "s"}${where}`;
  resetBtn.hidden = activeOccasion === "all";

  occasionGrid.querySelectorAll(".occasion-card").forEach(c =>
    c.classList.toggle("active", c.dataset.occasion === activeOccasion));

  festivalPanel.hidden = activeOccasion !== "festival";
  festivalChips.querySelectorAll(".festival-chip").forEach(c =>
    c.classList.toggle("active", c.dataset.festival === activeFestival));
  festivalNote.textContent = FESTIVAL_NOTES[activeFestival] || "";
}

function setOccasion(value, scroll) {
  activeOccasion = value;
  activeFestival = "all";
  render();
  if (scroll) document.getElementById("hamperTop").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ---- Basket ----
function addToBasket(id) {
  const h = HAMPERS.find(x => String(x.id) === String(id));
  if (!h) return;

  const item = { id: h.id, name: h.name, price: h.price, image: h.image, quantity: 1 };

  // Use Dry.js's basket directly (works with the old Dry.js too)
  if (typeof cart !== "undefined" &&
      typeof saveCart === "function" &&
      typeof updateCart === "function") {

    const found = cart.find(i => String(i.id) === String(h.id));
    if (found) found.quantity = (Number(found.quantity) || 0) + 1;
    else cart.push(item);

    saveCart();
    updateCart();
    return;
  }

  // Fallback if Dry.js is not on the page
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { }
  const existing = saved.find(i => String(i.id) === String(h.id));
  if (existing) existing.quantity = (Number(existing.quantity) || 0) + 1;
  else saved.push(item);
  try { localStorage.setItem(CART_KEY, JSON.stringify(saved)); } catch (e) { }

  const countEl = document.getElementById("headerCartCount");
  if (countEl) countEl.textContent = saved.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
}

// ---- Events ----
occasionGrid.addEventListener("click", e => {
  const card = e.target.closest(".occasion-card");
  if (!card) return;
  // Clicking the active card again clears the filter
  setOccasion(card.dataset.occasion === activeOccasion ? "all" : card.dataset.occasion, true);
});

festivalChips.addEventListener("click", e => {
  const chip = e.target.closest(".festival-chip");
  if (!chip) return;
  activeFestival = chip.dataset.festival;
  render();
});

resetBtn.addEventListener("click", () => setOccasion("all", false));
catSort.addEventListener("change", render);

hamperGrid.addEventListener("click", e => {
  const btn = e.target.closest("[data-add]");
  if (btn) addToBasket(btn.dataset.add);
});

// ---- Load data, then start ----
function applyUrlPresets() {
  const params = new URLSearchParams(location.search);

  // Hampers.html?occasion=wedding
  const preset = params.get("occasion");
  if (preset && OCCASION_NAMES[preset]) activeOccasion = preset;

  // Hampers.html?occasion=festival&festival=nowruz
  const presetFestival = params.get("festival");
  if (presetFestival && FESTIVAL_NAMES[presetFestival]) {
    activeOccasion = "festival";
    activeFestival = presetFestival;
  }
}

async function loadHampers() {
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    HAMPERS = await res.json();
  } catch (err) {
    console.error("Could not load Hampers.json:", err);
    hamperGrid.innerHTML = "";
    hamperEmpty.textContent = "Sorry, the hampers could not be loaded. Please try again later.";
    hamperEmpty.hidden = false;
    return;
  }
  applyUrlPresets();
  render();
}

loadHampers();