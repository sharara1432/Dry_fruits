/* =========================================================
   Contact.js  -  Sheern Premium Dry Fruit
   Checks the contact form, then opens WhatsApp with the
   message already written. No server needed.
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    // Number that receives the messages (country code + number, digits only)
    const WHATSAPP_NUMBER = "919953827976";

    const form = document.getElementById("contactForm");
    if (!form) return;

    const fields = {
        name: document.getElementById("cName"),
        phone: document.getElementById("cPhone"),
        email: document.getElementById("cEmail"),
        message: document.getElementById("cMessage")
    };
    const errors = {
        name: document.getElementById("errName"),
        phone: document.getElementById("errPhone"),
        email: document.getElementById("errEmail"),
        message: document.getElementById("errMessage")
    };
    const topic = document.getElementById("cTopic");
    const status = document.getElementById("formStatus");
    const counter = document.getElementById("msgCount");

    function setError(key, text) {
        errors[key].textContent = text;
        fields[key].closest(".ct-field").classList.toggle("invalid", Boolean(text));
        fields[key].setAttribute("aria-invalid", text ? "true" : "false");
    }

    // Each check returns an error text, or "" when the value is fine
    const checks = {
        name: (v) => (v.trim().length < 2 ? "Please enter your name." : ""),
        phone: (v) => {
            const digits = v.replace(/\D/g, "").replace(/^(91|0)(?=\d{10}$)/, "");
            return /^[6-9]\d{9}$/.test(digits) ? "" : "Enter a valid 10-digit mobile number.";
        },
        email: (v) => (v.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())
            ? "Enter a valid email address." : ""),
        message: (v) => (v.trim().length < 10 ? "Please write at least 10 characters." : "")
    };

    function validate(key) {
        const text = checks[key](fields[key].value);
        setError(key, text);
        return !text;
    }

    // Check a field when the person leaves it, and clear its error while typing
    Object.keys(fields).forEach((key) => {
        fields[key].addEventListener("blur", () => validate(key));
        fields[key].addEventListener("input", () => {
            if (errors[key].textContent) validate(key);
        });
    });

    fields.message.addEventListener("input", () => {
        counter.textContent = fields.message.value.length;
    });

    form.addEventListener("submit", (e) => {
        e.preventDefault();
        status.textContent = "";

        const results = Object.keys(fields).map(validate);
        if (results.includes(false)) {
            const firstBad = Object.keys(fields).find((k) => errors[k].textContent);
            if (firstBad) fields[firstBad].focus();
            return;
        }

        const lines = [
            "Hello Sheern, I have a question.",
            "",
            "Name: " + fields.name.value.trim(),
            "Phone: " + fields.phone.value.trim(),
            fields.email.value.trim() ? "Email: " + fields.email.value.trim() : null,
            "About: " + topic.value,
            "",
            fields.message.value.trim()
        ].filter((line) => line !== null);

        const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(lines.join("\n"));
        window.open(url, "_blank", "noopener");

        status.textContent = "WhatsApp is opening. Press send there to deliver your message.";
        form.reset();
        counter.textContent = "0";
    });
});