document.addEventListener("DOMContentLoaded", () => {

    /* ---------------------------------------------------
       DATA (edit freely)
       cat: heart | brain | energy | bones | skin | digestion
    --------------------------------------------------- */
    const benefits = [
        { cat: "heart", icon: "bi-heart-pulse", title: "Supports a healthy heart", text: "Almonds and walnuts are rich in unsaturated fats that help support healthy cholesterol levels.", from: "Almonds, walnuts" },
        { cat: "heart", icon: "bi-droplet-half", title: "Good for blood pressure", text: "Potassium and magnesium in raisins, apricots and cashews support healthy blood pressure.", from: "Raisins, apricots, cashews" },
        { cat: "brain", icon: "bi-lightbulb", title: "Sharper focus", text: "Walnuts provide omega-3 fats and antioxidants that support memory and concentration.", from: "Walnuts" },
        { cat: "brain", icon: "bi-emoji-smile", title: "Better mood", text: "Magnesium and zinc in cashews and almonds support a calm, balanced mind.", from: "Cashews, almonds" },
        { cat: "energy", icon: "bi-lightning-charge", title: "Quick natural energy", text: "Raisins and dates give natural sugars for a fast boost without refined sugar.", from: "Raisins, dates" },
        { cat: "energy", icon: "bi-trophy", title: "Plant protein", text: "Nuts are a good source of protein for muscle repair and an active day.", from: "Pistachios, almonds" },
        { cat: "bones", icon: "bi-shield-check", title: "Stronger bones", text: "Almonds and apricots supply calcium, magnesium and other minerals that bones need.", from: "Almonds, apricots" },
        { cat: "bones", icon: "bi-bricks", title: "Mineral support", text: "Phosphorus and manganese in nuts help maintain strong bones and joints.", from: "Cashews, walnuts" },
        { cat: "skin", icon: "bi-stars", title: "Glowing skin", text: "Vitamin E in almonds is a natural antioxidant that supports healthy skin.", from: "Almonds" },
        { cat: "skin", icon: "bi-brightness-high", title: "Healthier hair", text: "Vitamin A in apricots and zinc in nuts support healthy hair and scalp.", from: "Apricots, cashews" },
        { cat: "digestion", icon: "bi-flower1", title: "Regular digestion", text: "Fibre from figs, raisins and apricots keeps digestion comfortable and regular.", from: "Figs, raisins, apricots" },
        { cat: "digestion", icon: "bi-cup-hot", title: "Feel fuller for longer", text: "Fibre and protein in pistachios and almonds help you stay full between meals.", from: "Pistachios, almonds" }
    ];

    const fruits = [
        { name: "Almonds", tag: "Best for skin and bones", text: "Rich in vitamin E, calcium and magnesium. Soak them overnight and peel for easier digestion.", nutrients: ["Vitamin E", "Calcium", "Magnesium", "Protein"], serving: "5–8 pieces a day" },
        { name: "Walnuts", tag: "Best for brain and heart", text: "One of the best plant sources of omega-3 fats, with plenty of antioxidants.", nutrients: ["Omega-3", "Antioxidants", "Manganese", "Fibre"], serving: "2–3 pieces a day" },
        { name: "Cashews", tag: "Best for energy", text: "Creamy and satisfying, with magnesium, zinc and protein to keep you going.", nutrients: ["Magnesium", "Zinc", "Iron", "Protein"], serving: "4–5 pieces a day" },
        { name: "Pistachios", tag: "Best light snack", text: "Protein-rich and lower in calories than many other nuts. Shelling them slows you down, so you eat less.", nutrients: ["Protein", "Fibre", "Vitamin B6", "Potassium"], serving: "10–15 pieces a day" },
        { name: "Raisins", tag: "Best for quick energy", text: "Naturally sweet, with iron and potassium. A good swap for sugary snacks.", nutrients: ["Iron", "Potassium", "Natural sugars", "Fibre"], serving: "1 tbsp a day" },
        { name: "Apricots", tag: "Best for eyes and skin", text: "Packed with vitamin A and fibre. Soft, tangy and easy to snack on.", nutrients: ["Vitamin A", "Fibre", "Potassium", "Iron"], serving: "2–3 pieces a day" }
    ];

    const vitamins = [
        { name: "Vitamin E", from: "Almonds" },
        { name: "Vitamin A", from: "Apricots" },
        { name: "Iron", from: "Raisins, cashews" },
        { name: "Magnesium", from: "Cashews, almonds" },
        { name: "Potassium", from: "Raisins, apricots" },
        { name: "Omega-3", from: "Walnuts" },
        { name: "Calcium", from: "Almonds" },
        { name: "Fibre", from: "Figs, apricots" }
    ];

    // IMPORTANT: only keep certificates Sheern really holds.
    // Remove any line you do not have, and add the licence number to "note" if you want it shown.
    const certs = [
        { icon: "bi-patch-check", name: "FSSAI", note: "Food safety licence" },
        { icon: "bi-award", name: "ISO", note: "Quality management" },
        { icon: "bi-shield-check", name: "HACCP", note: "Food hygiene standard" }
    ];

    // Picture shown next to the cards for each filter.
    // Write the file name WITHOUT the extension. The code tries png, jpg, jpeg and webp.
    // Letter case must match your file name exactly (important on GitHub Pages).
    // "all" has no picture, so the cards use the full width.
    const sideImages = {
        heart:     { src: "Photos/Heart",     alt: "Sheern dry fruits for a healthy heart" },
        brain:     { src: "Photos/barin",     alt: "Sheern walnuts for brain health" },
        energy:    { src: "Photos/Energy",    alt: "Sheern raisins and cashews for energy" },
        bones:     { src: "Photos/Bones",     alt: "Sheern almonds and apricots for strong bones" },
        skin:      { src: "Photos/hairSkin",  alt: "Sheern almonds for skin and hair" },
        digestion: { src: "Photos/Digestion", alt: "Sheern figs and raisins for digestion" }
    };

    // Picture for each dry fruit tab (picture only, no prices).
    // File name WITHOUT extension. Change to the names in your Photos folder.
    const fruitImages = {
        "Almonds":    "Photos/almond",
        "Walnuts":    "Photos/walnut",
        "Cashews":    "Photos/cashew",
        "Pistachios": "Photos/pistacho",
        "Raisins":    "Photos/Raisin",
        "Apricots":   "Photos/Apricots"
    };

    // Extensions to try, in order
    const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp"];

    // Loads base + extension into <img>, trying each extension until one works.
    // If none works, onFail() is called.
    function loadImage(img, base, onFail) {
        let i = 0;
        img.onerror = () => {
            i++;
            if (i < IMAGE_EXTS.length) {
                img.src = base + "." + IMAGE_EXTS[i];
            } else {
                img.onerror = null;
                if (onFail) onFail();
            }
        };
        img.src = base + "." + IMAGE_EXTS[0];
    }

    /* ---------------------------------------------------
       HELPERS
    --------------------------------------------------- */
    const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));

    /* ---------------------------------------------------
       BENEFIT CARDS + FILTER CHIPS
    --------------------------------------------------- */
    const grid = document.getElementById("benefitGrid");
    const chips = document.querySelectorAll("#filters .bn-chip");

    const showcase = document.getElementById("benefitShowcase");
    const side = document.getElementById("benefitSide");
    const sideImg = document.getElementById("benefitSideImg");

    function updateSide(filter) {
        if (!showcase || !side || !sideImg) return;
        const pic = sideImages[filter];

        if (!pic) {
            side.hidden = true;
            showcase.classList.remove("has-side");
            return;
        }

        side.hidden = false;
        showcase.classList.add("has-side");
        sideImg.alt = pic.alt;
        loadImage(sideImg, pic.src, () => {
            // No image found in any format: hide the panel
            side.hidden = true;
            showcase.classList.remove("has-side");
        });
        return;
    }

    function renderBenefits(filter) {
        if (!grid) return;
        updateSide(filter);
        const list = benefits.filter((b) => filter === "all" || b.cat === filter);

        if (!list.length) {
            grid.innerHTML = '<p class="bn-note">Nothing to show here yet.</p>';
            return;
        }

        grid.innerHTML = list.map((b) => `
            <article class="bn-card">
                <div class="bn-card-icon"><i class="bi ${esc(b.icon)}"></i></div>
                <h3>${esc(b.title)}</h3>
                <p>${esc(b.text)}</p>
                <span class="bn-card-tag">${esc(b.from)}</span>
            </article>`).join("");
    }

    chips.forEach((chip) => {
        chip.addEventListener("click", () => {
            chips.forEach((c) => {
                c.classList.remove("active");
                c.setAttribute("aria-pressed", "false");
            });
            chip.classList.add("active");
            chip.setAttribute("aria-pressed", "true");
            renderBenefits(chip.dataset.filter);
        });
    });

    renderBenefits("all");

    /* ---------------------------------------------------
       DRY FRUIT TABS
    --------------------------------------------------- */
    const tabs = document.getElementById("tabs");
    const panel = document.getElementById("tabPanel");

    function showFruit(i) {
        const f = fruits[i];
        if (!f || !panel) return;

        const imgSrc = fruitImages[f.name];

        panel.classList.remove("no-img");
        panel.innerHTML = `
            ${imgSrc ? `<figure class="bn-fruit-pic"><img alt="${esc(f.name)}"></figure>` : ""}
            <div>
                <h3>${esc(f.name)}</h3>
                <span class="bn-panel-tag">${esc(f.tag)}</span>
                <p>${esc(f.text)}</p>
                <p class="bn-serving"><strong>Daily serving:</strong> ${esc(f.serving)}</p>
            </div>
            <div>
                <h4>Key nutrients</h4>
                <ul class="bn-pills">
                    ${f.nutrients.map((n) => `<li>${esc(n)}</li>`).join("")}
                </ul>
            </div>`;

        const pic = panel.querySelector(".bn-fruit-pic img");
        if (pic) {
            loadImage(pic, imgSrc, () => {
                pic.parentElement.remove();
                panel.classList.add("no-img");
            });
        } else {
            panel.classList.add("no-img");
        }

        tabs.querySelectorAll(".bn-tab").forEach((t, n) => {
            const active = n === i;
            t.classList.toggle("active", active);
            t.setAttribute("aria-selected", active ? "true" : "false");
            t.tabIndex = active ? 0 : -1;
        });
    }

    if (tabs && panel) {
        tabs.innerHTML = fruits.map((f, i) =>
            `<button type="button" class="bn-tab" role="tab" data-i="${i}">${esc(f.name)}</button>`).join("");

        tabs.addEventListener("click", (e) => {
            const btn = e.target.closest(".bn-tab");
            if (btn) showFruit(Number(btn.dataset.i));
        });

        // Arrow keys move between tabs
        tabs.addEventListener("keydown", (e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            const all = [...tabs.querySelectorAll(".bn-tab")];
            const current = all.findIndex((t) => t.classList.contains("active"));
            const next = (current + (e.key === "ArrowRight" ? 1 : -1) + all.length) % all.length;
            showFruit(next);
            all[next].focus();
        });

        showFruit(0);
    }

    /* ---------------------------------------------------
       VITAMINS + CERTIFICATES
    --------------------------------------------------- */
    const vit = document.getElementById("vitamins");
    if (vit) {
        vit.innerHTML = vitamins.map((v) => `
            <div class="bn-vitamin">
                <strong>${esc(v.name)}</strong>
                <small>From ${esc(v.from)}</small>
            </div>`).join("");
    }

    const cert = document.getElementById("certs");
    if (cert) {
        cert.innerHTML = certs.map((c) => `
            <div class="bn-cert">
                <i class="bi ${esc(c.icon)}"></i>
                <strong>${esc(c.name)}</strong>
                <small>${esc(c.note)}</small>
            </div>`).join("");
    }

    /* ---------------------------------------------------
       COUNT-UP NUMBERS (starts when they scroll into view)
    --------------------------------------------------- */
    const counters = document.querySelectorAll("[data-count]");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function countUp(el) {
        const target = Number(el.dataset.count);
        if (reduceMotion) {
            el.textContent = target.toLocaleString("en-IN");
            return;
        }
        const duration = 1400;
        const start = performance.now();

        function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.floor(eased * target).toLocaleString("en-IN");
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    countUp(entry.target);
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });
        counters.forEach((c) => io.observe(c));
    } else {
        counters.forEach(countUp);
    }

    /* ---------------------------------------------------
       FOOTER YEAR
    --------------------------------------------------- */
    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
});