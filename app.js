const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const MEAL_IMAGES = {
  pre:
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80",
  snack:
    "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80",
  recovery:
    "https://images.unsplash.com/photo-1608032364895-0da67af36cd2?auto=format&fit=crop&w=1200&q=80",
  dinner:
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80",
};

const accountForm = document.getElementById("accountForm");
const scheduleTableBody = document.getElementById("scheduleTableBody");
const generateBtn = document.getElementById("generateBtn");
const accountStatus = document.getElementById("accountStatus");
const generationStatus = document.getElementById("generationStatus");
const highlightsSection = document.getElementById("weeklyHighlights");
const highlightsGrid = document.getElementById("highlightsGrid");
const ebookSection = document.getElementById("ebook-preview");
const ebookPages = document.getElementById("ebookPages");
const previewLink = document.getElementById("previewLink");
const copyPreviewBtn = document.getElementById("copyPreviewBtn");
const printBtn = document.getElementById("printBtn");
const copyAdBtn = document.getElementById("copyAdBtn");

let activeAccount = null;

function init() {
  buildScheduleTable();
  loadSavedAccount();
  hydrateShareLinks();

  accountForm.addEventListener("submit", handleAccountSubmit);
  scheduleTableBody.addEventListener("input", handleScheduleInput);
  generateBtn.addEventListener("click", generateEbook);
  ebookPages.addEventListener("click", handleRecipeLinkClick);
  copyPreviewBtn.addEventListener("click", copyPreviewLink);
  printBtn.addEventListener("click", () => window.print());
  copyAdBtn.addEventListener("click", copyAdText);
  runPresetIfRequested();
}

function buildScheduleTable() {
  scheduleTableBody.innerHTML = DAYS.map(
    (day) => `
      <tr data-day="${day}">
        <td><strong>${day}</strong></td>
        <td><input type="time" data-type="trainingStart" data-day="${day}" /></td>
        <td><input type="time" data-type="trainingEnd" data-day="${day}" /></td>
        <td><input type="time" data-type="matchTime" data-day="${day}" /></td>
      </tr>
    `
  ).join("");
}

function handleScheduleInput(event) {
  if (!(event.target instanceof HTMLInputElement)) return;
  const day = event.target.getAttribute("data-day");
  if (!day) return;
  paintRow(day);
}

function paintRow(day) {
  const row = scheduleTableBody.querySelector(`tr[data-day="${day}"]`);
  if (!row) return;

  const trainingStart = row.querySelector('input[data-type="trainingStart"]').value;
  const matchTime = row.querySelector('input[data-type="matchTime"]').value;
  row.classList.remove("day-training", "day-match");

  if (matchTime) {
    row.classList.add("day-match");
  } else if (trainingStart) {
    row.classList.add("day-training");
  }
}

function handleAccountSubmit(event) {
  event.preventDefault();
  const parentName = document.getElementById("parentName").value.trim();
  const childName = document.getElementById("childName").value.trim();
  const childAge = Number(document.getElementById("childAge").value);
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value;

  if (!parentName || !childName || !email || password.length < 6 || !childAge) {
    accountStatus.textContent = "Please complete all account fields correctly.";
    return;
  }

  if (childAge < 6 || childAge > 18) {
    accountStatus.textContent = "Child age should be between 6 and 18.";
    return;
  }

  const accounts = readAccounts();
  const account = {
    parentName,
    childName,
    childAge,
    email,
    // This is only a browser demo and not production-grade auth.
    password,
    createdAt: new Date().toISOString(),
  };
  const existingIndex = accounts.findIndex((item) => item.email === email);
  if (existingIndex >= 0) {
    accounts[existingIndex] = account;
  } else {
    accounts.push(account);
  }
  localStorage.setItem("footballFuelAccounts", JSON.stringify(accounts));
  activeAccount = account;
  accountStatus.textContent = `Account ready for ${childName}. You can generate the e-book now.`;
}

function loadSavedAccount() {
  const accounts = readAccounts();
  if (!accounts.length) return;
  activeAccount = accounts[accounts.length - 1];
  const { parentName, childName, childAge, email, password } = activeAccount;
  document.getElementById("parentName").value = parentName || "";
  document.getElementById("childName").value = childName || "";
  document.getElementById("childAge").value = childAge || "";
  document.getElementById("email").value = email || "";
  document.getElementById("password").value = password || "";
  accountStatus.textContent = `Loaded saved account for ${childName}.`;
}

function readAccounts() {
  try {
    return JSON.parse(localStorage.getItem("footballFuelAccounts") || "[]");
  } catch {
    return [];
  }
}

function collectSchedule() {
  return DAYS.map((day) => {
    const row = scheduleTableBody.querySelector(`tr[data-day="${day}"]`);
    return {
      day,
      trainingStart: row.querySelector('input[data-type="trainingStart"]').value,
      trainingEnd: row.querySelector('input[data-type="trainingEnd"]').value,
      matchTime: row.querySelector('input[data-type="matchTime"]').value,
    };
  });
}

function getDayType(entry) {
  if (entry.matchTime) return "match";
  if (entry.trainingStart) return "training";
  return "rest";
}

function hydrateShareLinks() {
  const adCopy = document.getElementById("adCopy").textContent.trim();
  const url = `${window.location.origin}${window.location.pathname}#ebook-preview`;

  const encodedText = encodeURIComponent(adCopy);
  const encodedUrl = encodeURIComponent(url);

  document.getElementById("shareX").href =
    `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  document.getElementById("shareFacebook").href =
    `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  document.getElementById("shareLinkedIn").href =
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  document.getElementById("shareWhatsApp").href =
    `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
}

function copyAdText() {
  const adCopy = document.getElementById("adCopy").textContent.trim();
  navigator.clipboard
    .writeText(adCopy)
    .then(() => {
      generationStatus.textContent = "Ad text copied.";
    })
    .catch(() => {
      generationStatus.textContent = "Could not copy ad text automatically.";
    });
}

function generateEbook() {
  if (!activeAccount) {
    generationStatus.textContent = "Please create an account first.";
    return;
  }

  const schedule = collectSchedule();
  const hasSession = schedule.some((entry) => entry.trainingStart || entry.matchTime);
  if (!hasSession) {
    generationStatus.textContent = "Add at least one training or match time.";
    return;
  }

  renderHighlights(schedule);
  renderMealPages(schedule, activeAccount);
  generationStatus.textContent = "Your personalized football nutrition e-book is ready.";
  highlightsSection.classList.remove("hidden");
  ebookSection.classList.remove("hidden");

  const previewUrl = `${window.location.origin}${window.location.pathname}#ebook-preview`;
  previewLink.href = previewUrl;
  previewLink.textContent = previewUrl;
  window.location.hash = "ebook-preview";
}

function renderHighlights(schedule) {
  highlightsGrid.innerHTML = schedule
    .map((entry) => {
      const type = getDayType(entry);
      const label =
        type === "match"
          ? "MATCH DAY (PRIORITY)"
          : type === "training"
            ? "TRAINING DAY"
            : "RECOVERY / REST";
      const timeSummary =
        type === "match"
          ? `Match: ${entry.matchTime}`
          : type === "training"
            ? `Training: ${entry.trainingStart}${entry.trainingEnd ? `-${entry.trainingEnd}` : ""}`
            : "Focus on hydration, quality meals, and sleep";

      return `
        <article class="day-badge ${type}">
          <h4>${entry.day}</h4>
          <p>${label}</p>
          <p>${timeSummary}</p>
        </article>
      `;
    })
    .join("");
}

function renderMealPages(schedule, account) {
  const pages = [];
  const sunday = schedule.find((entry) => entry.day === "Sunday");
  const sundayMorningMatch = Boolean(
    sunday?.matchTime && isMorningKickoff(sunday.matchTime)
  );

  schedule.forEach((entry) => {
    const dayType = getDayType(entry);
    const sessionTime = entry.matchTime || entry.trainingStart || "";
    const meals = buildMeals(dayType, sessionTime, account.childAge, {
      day: entry.day,
      isSaturdayBeforeSundayMorningMatch:
        entry.day === "Saturday" && sundayMorningMatch,
      sundayMatchTime: sunday?.matchTime || "",
    });

    meals.forEach((meal, mealIndex) => {
      const topTitle = buildTopTitle(entry.day, dayType);
      const subtitle = `${account.childName} (${account.childAge}) | ${meal.timeLabel}`;
      const recipeId = slugify(`${entry.day}-${mealIndex}-${meal.title}`);
      pages.push(`
        <article class="meal-page">
          <header class="meal-page__top ${dayType}">
            <strong>${topTitle}</strong>
            <span>${subtitle}</span>
          </header>
          <div class="meal-page__body">
            <img src="${meal.image}" alt="${meal.title}" loading="lazy" />
            <div class="meal-details">
              <h3>${meal.title}</h3>
              <p><strong>Eat at:</strong> ${meal.time}</p>
              ${meal.isMainMeal ? '<p class="main-meal-label">Main Meal Priority</p>' : ""}
              <p><strong>What to eat/drink:</strong></p>
              <ul>${meal.items.map((item) => `<li>${item}</li>`).join("")}</ul>
              <p><strong>Quick prep:</strong> ${meal.prep}</p>
              ${
                meal.recipe
                  ? `
                    <p>
                      <a href="#" class="recipe-link" data-recipe-id="${recipeId}">
                        Open ingredients & cooking method
                      </a>
                    </p>
                    <section id="${recipeId}" class="recipe-panel hidden">
                      <h4>${meal.recipe.name}</h4>
                      <p><strong>Ingredients</strong></p>
                      <ul>${meal.recipe.ingredients
                        .map((ingredient) => `<li>${ingredient}</li>`)
                        .join("")}</ul>
                      <p><strong>How to cook</strong></p>
                      <ol>${meal.recipe.method.map((step) => `<li>${step}</li>`).join("")}</ol>
                    </section>
                  `
                  : ""
              }
              <div class="why">
                <strong>Why this timing works:</strong>
                <p>${meal.why}</p>
              </div>
            </div>
          </div>
        </article>
      `);
    });
  });
  ebookPages.innerHTML = pages.join("");
}

function buildTopTitle(day, dayType) {
  if (day === "Saturday" && dayType === "match") {
    return "SATURDAY MATCH DAY";
  }
  if (dayType === "match") return `${day} MATCH DAY`;
  if (dayType === "training") return `${day} TRAINING DAY`;
  return `${day} REST & RECOVERY`;
}

function buildMeals(dayType, sessionTime, age, context = {}) {
  const portionGuide = getPortionGuide(age);
  const matchIsEarly = isMorningKickoff(sessionTime);
  const saturdayBigMeal = context.isSaturdayBeforeSundayMorningMatch;

  if (dayType === "match") {
    if (matchIsEarly) {
      return [
        {
          title: "Match-Day Breakfast (Light Main Meal)",
          time: safeOffset(sessionTime, -150, "07:00"),
          timeLabel: "Light main meal 2-3h before kick-off",
          image: MEAL_IMAGES.pre,
          isMainMeal: true,
          recipe: {
            name: "Overnight Oats + Banana + Yogurt Bowl",
            ingredients: [
              "60-80 g oats",
              "200 ml milk",
              "1 banana, sliced",
              "150 g low-fat Greek yogurt",
              "1 tsp honey",
              "Small pinch of cinnamon",
            ],
            method: [
              "Mix oats and milk in a bowl or jar and chill overnight.",
              "In the morning, top with banana, yogurt, honey, and cinnamon.",
              "Serve with 300-500 ml water.",
            ],
          },
          items: [
            "Oats + banana + low-fat yogurt",
            "Small toast with honey if extra energy needed",
            "300-500 ml water",
          ],
          prep:
            "Prepare overnight oats the night before for a simple early match morning meal.",
          why:
            "For a 9:00-9:30 kick-off, this avoids a very early heavy meal while still providing digestible carbohydrates and some protein.",
        },
        {
          title: "Pre-Match Top-Up Snack",
          time: safeOffset(sessionTime, -45, "08:45"),
          timeLabel: "Optional top-up 30-45 mins before",
          image: MEAL_IMAGES.snack,
          items: [
            "Half banana, applesauce, or a few chews",
            "150-250 ml water",
          ],
          prep: "Keep this very light and familiar.",
          why:
            "A small top-up close to kick-off can maintain blood glucose without causing stomach heaviness.",
        },
        {
          title: "Post-Match Recovery Meal",
          time: safeOffset(sessionTime, 60, "11:00"),
          timeLabel: "Recovery window within 30-60 mins",
          image: MEAL_IMAGES.recovery,
          items: [
            "Fruit smoothie + yogurt or milk",
            "Bagel, wrap, or rice bowl",
            "20-30 g protein target",
            "Water + electrolytes",
          ],
          prep:
            "Blend milk/yogurt, banana, berries, and oats. Add a simple wrap for extra carbohydrates.",
          why:
            "Early refueling helps restore glycogen and supports muscle repair after repeated sprinting and high-intensity effort.",
        },
        {
          title: "Sunday Recovery Lunch / Dinner",
          time: safeOffset(sessionTime, 210, "13:00"),
          timeLabel: "Balanced main recovery meal",
          image: MEAL_IMAGES.dinner,
          items: [
            "Lean protein (chicken, fish, or beans)",
            "Large carb portion (rice, pasta, potatoes)",
            "Vegetables + fruit",
            "Water",
          ],
          prep: "Cook a full plate meal to complete recovery from the morning match.",
          why:
            "The biggest meal before this should be Saturday evening; this post-match meal continues refueling and recovery.",
        },
      ];
    }

    return [
      {
        title: "Pre-Match Main Meal",
        time: safeOffset(sessionTime, -240, "11:00"),
        timeLabel: "Main fuel 3-4h before kick-off",
        image: MEAL_IMAGES.pre,
        isMainMeal: true,
        recipe: {
          name: "Chicken Rice Performance Bowl",
          ingredients: [
            "120-150 g chicken breast (or tofu)",
            "1.5 cups cooked rice",
            "1 cup carrots/courgettes (cooked)",
            "1 tbsp olive oil",
            "Pinch of salt and pepper",
          ],
          method: [
            "Cook rice until soft and fluffy.",
            "Season and grill chicken (or pan-cook tofu) until done.",
            "Steam or lightly saute vegetables.",
            "Assemble bowl with rice, protein, vegetables, and olive oil.",
          ],
        },
        items: [
          `${portionGuide} of low-fiber carbs: rice, pasta, or potatoes`,
          "Lean protein: chicken, turkey, eggs, or tofu",
          "Low-fat sauce or olive oil drizzle",
          "500-700 ml water",
        ],
        prep:
          "Cook rice/pasta in bulk, add grilled chicken or tofu, and include a light cooked veg side.",
        why:
          "A larger meal 3-4 hours before kick-off gives enough time to digest, tops up glycogen, and lowers risk of stomach discomfort during sprinting.",
      },
      {
        title: "Pre-Match Top-Up Snack",
        time: safeOffset(sessionTime, -90, "13:30"),
        timeLabel: "Top-up 60-90 mins before",
        image: MEAL_IMAGES.snack,
        items: [
          "Banana or applesauce pouch",
          "Low-fat yogurt or toast with honey",
          "300-500 ml water (plus electrolytes in hot weather)",
        ],
        prep: "Keep this snack simple and portable in the kit bag.",
        why:
          "A small carbohydrate snack keeps blood glucose stable without heavy digestion load before the match starts.",
      },
      {
        title: "Post-Match Recovery Meal",
        time: safeOffset(sessionTime, 120, "18:00"),
        timeLabel: "Recovery window within 30-60 mins",
        image: MEAL_IMAGES.recovery,
        items: [
          "Chocolate milk or fruit smoothie + whey/yogurt",
          "Carbohydrate source: wraps, rice bowl, or potatoes",
          "Protein target: 20-30 g for youth development/repair",
          "Rehydrate with water + electrolytes",
        ],
        prep:
          "Blend milk, yogurt, banana, berries, and oats; serve with a turkey wrap or rice bowl.",
        why:
          "Fast carbs and protein soon after the match accelerate glycogen restoration and muscle repair, improving readiness for the next session.",
      },
      {
        title: "Evening Recovery Dinner",
        time: safeOffset(sessionTime, 240, "20:00"),
        timeLabel: "Balanced dinner",
        image: MEAL_IMAGES.dinner,
        items: [
          "Salmon/chicken/beans for protein",
          "Whole-grain carbs (quinoa, brown rice, or whole-wheat pasta)",
          "Colorful vegetables and fruit",
          "Water and optional milk before bed",
        ],
        prep:
          "Bake protein and tray-roast vegetables while cooking grains for a complete plate.",
        why:
          "A full balanced dinner supports overnight recovery and replenishes energy after the immediate post-match window.",
      },
    ];
  }

  if (dayType === "training") {
    return [
      {
        title: "Pre-Training Main Meal",
        time: safeOffset(sessionTime, -180, "14:00"),
        timeLabel: "Main fuel 2-3h before training",
        image: MEAL_IMAGES.pre,
        isMainMeal: true,
        recipe: {
          name: "Chicken Pasta Performance Plate",
          ingredients: [
            "100-140 g whole-wheat pasta (dry weight for older teens)",
            "120 g chicken breast (or lentils/tofu)",
            "1 cup tomato sauce",
            "1 tsp olive oil",
            "1 side fruit (banana or orange)",
          ],
          method: [
            "Cook pasta and drain.",
            "Pan-cook chicken (or plant protein) with olive oil.",
            "Warm tomato sauce and combine with pasta.",
            "Serve with fruit and water.",
          ],
        },
        items: [
          `${portionGuide} of carbohydrate-rich foods`,
          "Moderate lean protein",
          "Low-fiber vegetables if sensitive stomach",
          "500 ml water",
        ],
        prep: "Example: chicken pasta with light tomato sauce and fruit.",
        why:
          "Eating 2-3 hours before training allows digestion to progress and provides stable energy for high-intensity drills.",
      },
      {
        title: "Pre-Training Snack",
        time: safeOffset(sessionTime, -75, "16:15"),
        timeLabel: "Quick energy 60-90 mins before",
        image: MEAL_IMAGES.snack,
        items: [
          "Toast + jam, banana, or cereal bar",
          "250-400 ml water",
        ],
        prep: "Choose low-fat, low-fiber snacks for easier digestion.",
        why:
          "A light snack tops up available carbohydrate and helps prevent dips in concentration late in training.",
      },
      {
        title: "Post-Training Recovery",
        time: safeOffset(sessionTime, 60, "19:30"),
        timeLabel: "Recovery start within 30-60 mins",
        image: MEAL_IMAGES.recovery,
        items: [
          "Protein smoothie or yogurt + fruit",
          "Rice cakes, granola, or sandwich",
          "Fluids and electrolytes when sweat losses are high",
        ],
        prep: "Pack recovery snack ahead of time to eat immediately after training.",
        why:
          "Early recovery feeding helps muscle repair and replenishes glycogen so the athlete can adapt and recover better.",
      },
      {
        title: saturdayBigMeal
          ? "Saturday Big Pre-Match Dinner"
          : "Evening Performance Dinner",
        time: safeOffset(sessionTime, 180, "21:00"),
        timeLabel: saturdayBigMeal
          ? "Main pre-match fuel the evening before"
          : "Balanced evening meal",
        image: MEAL_IMAGES.dinner,
        isMainMeal: saturdayBigMeal,
        recipe: saturdayBigMeal
          ? {
              name: "Saturday Carb-Loading Pasta Bowl",
              ingredients: [
                "150-180 g pasta (dry weight for older youth)",
                "120-150 g lean chicken/turkey or tofu",
                "1 cup light tomato sauce",
                "1 bread roll",
                "1 banana",
                "500-700 ml water",
              ],
              method: [
                "Cook pasta and keep sauce low-fat for easier digestion.",
                "Cook protein source simply (grill, bake, or pan-cook).",
                "Combine pasta, sauce, and protein.",
                "Serve with bread roll and banana for added carbs.",
              ],
            }
          : undefined,
        items: [
          saturdayBigMeal
            ? "Higher-carb plate: pasta/rice/potatoes + bread"
            : "Lean protein + whole-grain carbs + vegetables",
          saturdayBigMeal
            ? "Moderate lean protein (avoid very fatty/heavy foods)"
            : "Healthy fats from olive oil, nuts, or avocado",
          saturdayBigMeal
            ? "Water + electrolytes if weather is warm"
            : "Water; milk can support additional protein/calcium",
        ],
        prep:
          saturdayBigMeal
            ? "Keep this the biggest carbohydrate meal before Sunday morning kick-off."
            : "Build a plate: half vegetables, quarter protein, quarter carbohydrates.",
        why:
          saturdayBigMeal
            ? "When Sunday kick-off is early, a substantial Saturday dinner is the key fuel window so the player does not need an unrealistic very-early breakfast."
            : "A complete dinner closes remaining nutrient gaps and supports overnight restoration before the next day.",
      },
    ];
  }

  const restMeals = [
    {
      title: "Rest Day Breakfast",
      time: "08:00",
      timeLabel: "Start the day hydrated",
      image: MEAL_IMAGES.pre,
      items: [
        "Porridge/oats with milk and berries",
        "Eggs or Greek yogurt",
        "Water + optional milk",
      ],
      prep: "Make overnight oats for convenience.",
      why:
        "Rest-day breakfast maintains routine fueling and supports growth, school focus, and overall recovery.",
    },
    {
      title: "Rest Day Lunch",
      time: "12:30",
      timeLabel: "Balanced midday meal",
      image: MEAL_IMAGES.snack,
      items: [
        "Whole-grain sandwich/wrap with chicken, tuna, or hummus",
        "Fruit + raw vegetables",
        "Water",
      ],
      prep: "Batch cook proteins and build wraps quickly.",
      why:
        "Consistent intake across the day supports steady energy and avoids overeating late at night.",
    },
    {
      title: "Rest Day Snack",
      time: "16:00",
      timeLabel: "Support recovery and growth",
      image: MEAL_IMAGES.recovery,
      items: [
        "Yogurt + granola + fruit",
        "Handful of nuts/seeds (if tolerated)",
        "Hydration check (pale yellow urine target)",
      ],
      prep: "Prepare snack containers in advance.",
      why:
        "A protein-carb snack supports growth and keeps appetite and mood stable between meals.",
    },
    {
      title: saturdayBigMeal
        ? "Saturday Big Pre-Match Dinner"
        : "Rest Day Dinner",
      time: "19:00",
      timeLabel: saturdayBigMeal
        ? "Main pre-match fuel the evening before"
        : "Recovery-focused evening meal",
      image: MEAL_IMAGES.dinner,
      isMainMeal: saturdayBigMeal,
      recipe: saturdayBigMeal
        ? {
            name: "Saturday Pre-Match Rice + Chicken Plate",
            ingredients: [
              "2 cups cooked rice",
              "140 g chicken breast (or tofu)",
              "1 small serving cooked vegetables",
              "1 dinner roll",
              "1 fruit yogurt",
              "500-700 ml water",
            ],
            method: [
              "Cook rice and lightly season.",
              "Grill or bake chicken/tofu with minimal oil.",
              "Steam vegetables until soft.",
              "Serve rice with protein, vegetables, roll, and yogurt.",
            ],
          }
        : undefined,
      items: [
        saturdayBigMeal
          ? "Bigger portion of carbohydrates: rice, pasta, or potatoes"
          : "Fish/chicken/beans + potatoes/rice + vegetables",
        saturdayBigMeal
          ? "Lean protein and low-fat cooking methods"
          : "Fruit for dessert",
        saturdayBigMeal
          ? "Hydration focus: water in the evening"
          : "Water and optional milk",
      ],
      prep: saturdayBigMeal
        ? "Make this the biggest meal before Sunday morning kick-off."
        : "One-pan sheet meal with protein, potatoes, and vegetables.",
      why:
        saturdayBigMeal
          ? `A larger Saturday dinner helps fully top up energy stores before Sunday ${context.sundayMatchTime || "morning"} kick-off, so breakfast can stay light and digestible.`
          : "Rest days still require quality nutrition to replenish nutrients and prepare the body for upcoming training.",
    },
  ];

  return restMeals;
}

function getPortionGuide(age) {
  if (age <= 10) return "1 palm-size";
  if (age <= 14) return "1-2 palm-size";
  return "2 palm-size";
}

function safeOffset(time, offsetMinutes, fallback) {
  if (!time) return fallback;
  const parts = time.split(":").map(Number);
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) {
    return fallback;
  }
  const total = parts[0] * 60 + parts[1] + offsetMinutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hh = String(Math.floor(wrapped / 60)).padStart(2, "0");
  const mm = String(wrapped % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

function parseTimeToMinutes(time) {
  if (!time) return null;
  const [hh, mm] = time.split(":").map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function isMorningKickoff(time) {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return false;
  return minutes <= 10 * 60;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function handleRecipeLinkClick(event) {
  const link = event.target.closest(".recipe-link");
  if (!link) return;
  event.preventDefault();
  const panelId = link.getAttribute("data-recipe-id");
  if (!panelId) return;
  const panel = document.getElementById(panelId);
  if (!panel) return;
  panel.classList.toggle("hidden");
  const isOpen = !panel.classList.contains("hidden");
  link.textContent = isOpen
    ? "Hide ingredients & cooking method"
    : "Open ingredients & cooking method";
}

function copyPreviewLink() {
  const value = previewLink.textContent;
  if (!value) return;
  navigator.clipboard
    .writeText(value)
    .then(() => {
      generationStatus.textContent = "Preview link copied.";
    })
    .catch(() => {
      generationStatus.textContent = "Could not copy preview link automatically.";
    });
}

function runPresetIfRequested() {
  const params = new URLSearchParams(window.location.search);
  const preset = params.get("preview");
  if (preset !== "u15-tue-thu-sun0930") return;

  const presetAccount = {
    parentName: "Preview Parent",
    childName: "Demo Player",
    childAge: 15,
    email: "preview@example.com",
    password: "preview123",
    createdAt: new Date().toISOString(),
  };

  activeAccount = presetAccount;
  document.getElementById("parentName").value = presetAccount.parentName;
  document.getElementById("childName").value = presetAccount.childName;
  document.getElementById("childAge").value = String(presetAccount.childAge);
  document.getElementById("email").value = presetAccount.email;
  document.getElementById("password").value = presetAccount.password;
  accountStatus.textContent = "Loaded preset preview account (U15 example).";

  setScheduleInput("Tuesday", "trainingStart", "18:00");
  setScheduleInput("Tuesday", "trainingEnd", "19:30");
  setScheduleInput("Thursday", "trainingStart", "18:00");
  setScheduleInput("Thursday", "trainingEnd", "19:30");
  setScheduleInput("Sunday", "matchTime", "09:30");

  paintRow("Tuesday");
  paintRow("Thursday");
  paintRow("Sunday");
  generateEbook();
}

function setScheduleInput(day, type, value) {
  const row = scheduleTableBody.querySelector(`tr[data-day="${day}"]`);
  if (!row) return;
  const input = row.querySelector(`input[data-type="${type}"]`);
  if (!input) return;
  input.value = value;
}

init();
