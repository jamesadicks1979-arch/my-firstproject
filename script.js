const CLUBS = [
  "Driver",
  "3 Wood",
  "5 Wood",
  "3 Hybrid",
  "4 Iron",
  "5 Iron",
  "6 Iron",
  "7 Iron",
  "8 Iron",
  "9 Iron",
  "Pitching Wedge",
  "Gap Wedge",
  "Sand Wedge",
  "Lob Wedge",
];

const STORAGE_KEYS = {
  profile: "pocketCaddyProfile",
  course: "pocketCaddyCourse",
};

const profileForm = document.getElementById("profileForm");
const courseForm = document.getElementById("courseForm");
const clubDistanceGrid = document.getElementById("clubDistanceGrid");
const holeGrid = document.getElementById("holeGrid");
const holeCountSelect = document.getElementById("holeCount");
const tableBody = document.querySelector("#yardageTable tbody");
const totalYardageEl = document.getElementById("totalYardage");
const profileMessageEl = document.getElementById("profileMessage");
const courseMessageEl = document.getElementById("courseMessage");
const remainingYardageInput = document.getElementById("remainingYardage");
const recommendationEl = document.getElementById("clubRecommendation");
const clearProfileBtn = document.getElementById("clearProfileBtn");

let savedProfile = null;
let savedCourse = null;

buildClubInputs();
buildHoleInputs(Number(holeCountSelect.value));
loadSavedData();

holeCountSelect.addEventListener("change", () => {
  buildHoleInputs(Number(holeCountSelect.value));
});

profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearMessage(profileMessageEl);

  const name = getTrimmedValue("playerName");
  const handicap = Number(getTrimmedValue("handicap"));
  const strengths = getTrimmedValue("strengths");
  const weaknesses = getTrimmedValue("weaknesses");
  const distances = getClubDistances();

  if (!name || Number.isNaN(handicap) || !strengths || !weaknesses) {
    showMessage(profileMessageEl, "Please complete all player profile fields.", true);
    return;
  }

  if (handicap < 0 || handicap > 54) {
    showMessage(profileMessageEl, "Handicap must be between 0 and 54.", true);
    return;
  }

  const hasDistance = Object.values(distances).some((value) => value > 0);
  if (!hasDistance) {
    showMessage(profileMessageEl, "Please enter at least one club distance.", true);
    return;
  }

  savedProfile = { name, handicap, strengths, weaknesses, distances };
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(savedProfile));

  showMessage(profileMessageEl, "Profile saved. Pocket Caddy is ready to help.", false);
  refreshRecommendation();
  if (savedCourse) {
    renderYardageTable(savedCourse.holeYardages);
  }
});

courseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearMessage(courseMessageEl);

  const courseName = getTrimmedValue("courseName");
  const teeColor = getTrimmedValue("teeColor");
  const holeCount = Number(holeCountSelect.value);
  const holeYardages = [];

  for (let i = 1; i <= holeCount; i += 1) {
    const value = Number(getTrimmedValue(`hole-${i}`));
    if (Number.isNaN(value) || value <= 0) {
      showMessage(courseMessageEl, `Enter a valid yardage for hole ${i}.`, true);
      return;
    }
    holeYardages.push(value);
  }

  if (!courseName || !teeColor) {
    showMessage(courseMessageEl, "Please add course name and tee color.", true);
    return;
  }

  savedCourse = { courseName, teeColor, holeCount, holeYardages };
  localStorage.setItem(STORAGE_KEYS.course, JSON.stringify(savedCourse));

  renderYardageTable(holeYardages);
  showMessage(courseMessageEl, "Yardage chart updated for this round.", false);
});

remainingYardageInput.addEventListener("input", refreshRecommendation);

clearProfileBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.profile);
  savedProfile = null;
  profileForm.reset();
  buildClubInputs();
  clearMessage(profileMessageEl);
  recommendationEl.textContent = "Profile cleared. Add distances to get club recommendations.";
});

function buildClubInputs() {
  clubDistanceGrid.innerHTML = "";
  CLUBS.forEach((club) => {
    const label = document.createElement("label");
    label.textContent = club;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.step = "1";
    input.name = `club-${club}`;
    input.id = `club-${club}`;
    input.placeholder = "yards";

    label.appendChild(input);
    clubDistanceGrid.appendChild(label);
  });
}

function buildHoleInputs(holeCount) {
  holeGrid.innerHTML = "";
  for (let i = 1; i <= holeCount; i += 1) {
    const label = document.createElement("label");
    label.textContent = `Hole ${i}`;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.step = "1";
    input.id = `hole-${i}`;
    input.name = `hole-${i}`;
    input.placeholder = "yards";

    if (savedCourse && savedCourse.holeYardages[i - 1]) {
      input.value = String(savedCourse.holeYardages[i - 1]);
    }

    label.appendChild(input);
    holeGrid.appendChild(label);
  }
}

function getClubDistances() {
  return CLUBS.reduce((acc, club) => {
    const value = Number(getTrimmedValue(`club-${club}`));
    acc[club] = Number.isNaN(value) ? 0 : value;
    return acc;
  }, {});
}

function renderYardageTable(holeYardages) {
  tableBody.innerHTML = "";
  const total = holeYardages.reduce((sum, yards) => sum + yards, 0);
  totalYardageEl.textContent = String(total);

  holeYardages.forEach((yards, index) => {
    const row = document.createElement("tr");
    const bestClub = getBestClubForYardage(Math.round(yards * 0.3));

    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${yards}</td>
      <td>${bestClub}</td>
    `;
    tableBody.appendChild(row);
  });
}

function getBestClubForYardage(targetYardage) {
  if (!savedProfile) {
    return "Save profile first";
  }

  const entries = Object.entries(savedProfile.distances).filter(([, value]) => value > 0);
  if (!entries.length) {
    return "No club distances set";
  }

  let bestClub = entries[0][0];
  let smallestGap = Math.abs(entries[0][1] - targetYardage);

  entries.forEach(([club, distance]) => {
    const gap = Math.abs(distance - targetYardage);
    if (gap < smallestGap) {
      smallestGap = gap;
      bestClub = club;
    }
  });

  return `${bestClub} (${savedProfile.distances[bestClub]}y)`;
}

function refreshRecommendation() {
  const value = Number(remainingYardageInput.value);
  if (Number.isNaN(value) || value <= 0) {
    recommendationEl.textContent = "Enter remaining yardage to see your best club.";
    return;
  }

  recommendationEl.textContent = `Recommended: ${getBestClubForYardage(value)}`;
}

function loadSavedData() {
  const rawProfile = localStorage.getItem(STORAGE_KEYS.profile);
  const rawCourse = localStorage.getItem(STORAGE_KEYS.course);

  if (rawProfile) {
    savedProfile = JSON.parse(rawProfile);
    document.getElementById("playerName").value = savedProfile.name || "";
    document.getElementById("handicap").value = savedProfile.handicap ?? "";
    document.getElementById("strengths").value = savedProfile.strengths || "";
    document.getElementById("weaknesses").value = savedProfile.weaknesses || "";

    CLUBS.forEach((club) => {
      const input = document.getElementById(`club-${club}`);
      if (input && savedProfile.distances && savedProfile.distances[club]) {
        input.value = String(savedProfile.distances[club]);
      }
    });
  }

  if (rawCourse) {
    savedCourse = JSON.parse(rawCourse);
    document.getElementById("courseName").value = savedCourse.courseName || "";
    document.getElementById("teeColor").value = savedCourse.teeColor || "";
    holeCountSelect.value = String(savedCourse.holeCount || 18);
    buildHoleInputs(Number(holeCountSelect.value));
    renderYardageTable(savedCourse.holeYardages || []);
  }
}

function getTrimmedValue(id) {
  return document.getElementById(id).value.trim();
}

function showMessage(element, text, isError) {
  element.textContent = text;
  element.classList.toggle("error", isError);
  element.classList.toggle("success", !isError);
}

function clearMessage(element) {
  element.textContent = "";
  element.classList.remove("error", "success");
}
