const menuToggle = document.getElementById("menuToggle");
const siteNav = document.getElementById("siteNav");
const navLinks = siteNav
  ? Array.from(siteNav.querySelectorAll("a[href^='#']"))
  : [];
const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");
const yearEl = document.getElementById("year");

const quoteTabs = Array.from(document.querySelectorAll("[data-quote-tab]"));
const quotePriceEl = document.getElementById("quotePrice");
const quoteVatEl = document.getElementById("quoteVat");
const quoteGoBtn = document.getElementById("quoteGoBtn");
const partitionTypeEl = document.getElementById("partitionType");
const heightInputEl = document.getElementById("heightInput");
const widthInputEl = document.getElementById("widthInput");
const layoutButtons = Array.from(document.querySelectorAll(".config-icon"));
const dimensionStepButtons = Array.from(
  document.querySelectorAll("[data-step-target]")
);

const quoteBasePrices = {
  single: 2342.03,
  acoustic: 2786.45,
  double: 3198.62,
  tbar: 2154.9,
};

const partitionTypeMultipliers = {
  inline: 1,
  corner: 1.08,
  "three-sided": 1.16,
  "full-room": 1.25,
  switchable: 1.34,
};

const layoutMultipliers = {
  inline: 1,
  offset: 1.04,
  corner: 1.08,
  tshape: 1.12,
  "u-shape": 1.14,
  zigzag: 1.1,
  "double-room": 1.2,
  lobby: 1.18,
};

let activeQuoteTab = quoteTabs.find((tab) => tab.classList.contains("is-active"))
  ?.dataset.quoteTab;
if (!activeQuoteTab) {
  activeQuoteTab = "single";
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPounds(value) {
  return currencyFormatter.format(value);
}

function clamp(value, min, max, fallback) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(Math.max(value, min), max);
}

function parseDimensionValue(rawValue, fallback) {
  const cleaned = String(rawValue).replace(/,/g, "").trim();
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function currentSelectedLayout() {
  const selected = layoutButtons.find((button) =>
    button.classList.contains("is-selected")
  );
  return selected?.dataset.layout || "inline";
}

function updateQuotePrice() {
  if (!quotePriceEl || !quoteVatEl) {
    return;
  }

  const basePrice = quoteBasePrices[activeQuoteTab] || quoteBasePrices.single;
  const height = clamp(
    parseDimensionValue(heightInputEl?.value, 2400),
    1200,
    3500,
    2400
  );
  const width = clamp(
    parseDimensionValue(widthInputEl?.value, 3200),
    1000,
    9000,
    3200
  );
  const areaMultiplier = (height * width) / (2400 * 3200);
  const partitionMultiplier =
    partitionTypeMultipliers[partitionTypeEl?.value] || 1;
  const layoutMultiplier = layoutMultipliers[currentSelectedLayout()] || 1;

  const subtotal = Math.max(
    750,
    basePrice * areaMultiplier * partitionMultiplier * layoutMultiplier
  );
  const vatTotal = subtotal * 1.2;

  quotePriceEl.textContent = formatPounds(subtotal);
  quoteVatEl.textContent = `${formatPounds(vatTotal)} inc VAT`;

  if (heightInputEl) {
    heightInputEl.value = String(height);
  }
  if (widthInputEl) {
    widthInputEl.value = String(width);
  }
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const expanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!expanded));
    siteNav.classList.toggle("open");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("open");
    });
  });

  document.addEventListener("click", (event) => {
    const clickedInside =
      siteNav.contains(event.target) || menuToggle.contains(event.target);
    if (!clickedInside) {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      menuToggle.setAttribute("aria-expanded", "false");
      siteNav.classList.remove("open");
    }
  });
}

quoteTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeQuoteTab = tab.dataset.quoteTab || "single";
    quoteTabs.forEach((tabButton) =>
      tabButton.classList.toggle("is-active", tabButton === tab)
    );
    updateQuotePrice();
  });
});

layoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    layoutButtons.forEach((tile) =>
      tile.classList.toggle("is-selected", tile === button)
    );
    updateQuotePrice();
  });
});

if (partitionTypeEl) {
  partitionTypeEl.addEventListener("change", updateQuotePrice);
}
if (heightInputEl) {
  ["input", "change", "keyup", "blur"].forEach((eventName) => {
    heightInputEl.addEventListener(eventName, updateQuotePrice);
  });
}
if (widthInputEl) {
  ["input", "change", "keyup", "blur"].forEach((eventName) => {
    widthInputEl.addEventListener(eventName, updateQuotePrice);
  });
}

dimensionStepButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.getAttribute("data-step-target");
    const stepValue = Number(button.getAttribute("data-step-value"));
    const targetInput = targetId ? document.getElementById(targetId) : null;
    if (!targetInput || !Number.isFinite(stepValue)) {
      return;
    }

    const currentValue = parseDimensionValue(targetInput.value, Number(targetInput.min) || 0);
    const min = Number(targetInput.min) || currentValue;
    const max = Number(targetInput.max) || currentValue;
    const nextValue = clamp(currentValue + stepValue, min, max, currentValue);
    targetInput.value = String(nextValue);
    updateQuotePrice();
  });
});
if (quoteGoBtn) {
  quoteGoBtn.addEventListener("click", () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  });
}

const sectionIds = navLinks
  .map((link) => link.getAttribute("href"))
  .filter((href) => href && href.startsWith("#") && href !== "#top")
  .map((href) => href.slice(1));

const sections = sectionIds
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if (sections.length > 0 && "IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${id}`;
          link.classList.toggle("active", isActive);
        });
      });
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}

if (contactForm && formMessage) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    formMessage.textContent =
      "Thank you. Your request has been received and our team will reach out shortly.";
    contactForm.reset();
  });
}

updateQuotePrice();
