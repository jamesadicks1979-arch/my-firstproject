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

const WENTWORTH_WEST = {
  name: "Wentworth West Course",
  holes: [
    { hole: 1, par: 4, yardage: 421, fairwayMiss: "Favor right-center miss.", greenMiss: "Short-right is safest for up-and-down.", note: "Strong opener with bunkers left; keep tee ball on the right half." },
    { hole: 2, par: 4, yardage: 430, fairwayMiss: "Miss slightly left to avoid right trouble.", greenMiss: "Short is better than long here.", note: "Play for center of green and trust a two-putt par." },
    { hole: 3, par: 4, yardage: 442, fairwayMiss: "Right miss leaves a clearer angle.", greenMiss: "Right of green leaves a simpler chip.", note: "Long approach; commit to your line and avoid front bunkers." },
    { hole: 4, par: 5, yardage: 561, fairwayMiss: "Left-center miss keeps second shot open.", greenMiss: "Short-left gives best chance to save par.", note: "Three-shot hole for most players; position over power." },
    { hole: 5, par: 3, yardage: 236, fairwayMiss: "N/A (par 3).", greenMiss: "Short-right is preferred.", note: "Club up and hit to the fat side of the green." },
    { hole: 6, par: 4, yardage: 368, fairwayMiss: "Right miss avoids left bunkers.", greenMiss: "Short is safest miss.", note: "Good birdie chance with a precise wedge approach." },
    { hole: 7, par: 5, yardage: 567, fairwayMiss: "Left-center miss is playable.", greenMiss: "Right side leaves an easier pitch.", note: "Lay up to your favorite number rather than forcing a hero shot." },
    { hole: 8, par: 3, yardage: 187, fairwayMiss: "N/A (par 3).", greenMiss: "Miss short-right for best up-and-down look.", note: "Center of green is an excellent result." },
    { hole: 9, par: 4, yardage: 460, fairwayMiss: "Right miss is better than left.", greenMiss: "Short-left is safer than long.", note: "Demanding closing hole on the front nine; avoid chasing tucked pins." },
    { hole: 10, par: 4, yardage: 476, fairwayMiss: "Left-center keeps angle to green.", greenMiss: "Short-right gives easiest chip.", note: "Long par 4; prioritize fairway first." },
    { hole: 11, par: 3, yardage: 225, fairwayMiss: "N/A (par 3).", greenMiss: "Short is the smart miss.", note: "Take enough club and accept a putt from distance." },
    { hole: 12, par: 5, yardage: 554, fairwayMiss: "Miss right-center to stay out of left rough.", greenMiss: "Short-right is preferred.", note: "Good scoring chance with smart layup distance." },
    { hole: 13, par: 4, yardage: 456, fairwayMiss: "Left miss keeps approach simpler.", greenMiss: "Short-left is best bailout.", note: "Approach plays firm; landing short can be a good play." },
    { hole: 14, par: 3, yardage: 168, fairwayMiss: "N/A (par 3).", greenMiss: "Right side leaves easiest recovery.", note: "Attack middle of green and avoid short-side misses." },
    { hole: 15, par: 4, yardage: 417, fairwayMiss: "Right-center miss preferred.", greenMiss: "Short is better than long.", note: "Tight driving corridor; commit to target and tempo." },
    { hole: 16, par: 5, yardage: 558, fairwayMiss: "Left-center miss keeps layup lane.", greenMiss: "Short-left gives better up-and-down.", note: "Play as a three-shotter unless conditions are perfect." },
    { hole: 17, par: 4, yardage: 462, fairwayMiss: "Favor right side off tee.", greenMiss: "Short-right avoids difficult bunker recovery.", note: "Tough late-hole approach; don't flirt with back edge." },
    { hole: 18, par: 5, yardage: 538, fairwayMiss: "Left-center miss opens the hole.", greenMiss: "Short is safest to finish with a chance.", note: "Risk-reward finisher. Pick a conservative line if protecting score." },
  ],
};

const STORAGE_KEYS = {
  profile: "pocketCaddyProfile",
};

const profileForm = document.getElementById("profileForm");
const clubDistanceGrid = document.getElementById("clubDistanceGrid");
const tableBody = document.querySelector("#yardageTable tbody");
const totalYardageEl = document.getElementById("totalYardage");
const profileMessageEl = document.getElementById("profileMessage");
const remainingYardageInput = document.getElementById("remainingYardage");
const recommendationEl = document.getElementById("clubRecommendation");
const clearProfileBtn = document.getElementById("clearProfileBtn");
const courseSummaryEl = document.getElementById("courseSummary");
const prevHoleBtn = document.getElementById("prevHoleBtn");
const nextHoleBtn = document.getElementById("nextHoleBtn");
const holePositionEl = document.getElementById("holePosition");
const holeTitleEl = document.getElementById("holeTitle");
const holeSummaryEl = document.getElementById("holeSummary");
const fairwayMissTipEl = document.getElementById("fairwayMissTip");
const greenMissTipEl = document.getElementById("greenMissTip");
const teeClubTipEl = document.getElementById("teeClubTip");
const approachClubTipEl = document.getElementById("approachClubTip");
const holeNoteEl = document.getElementById("holeNote");

let savedProfile = null;
let currentHoleIndex = 0;

buildClubInputs();
loadSavedProfile();
renderCourseSummary();
renderYardageTable();
renderHolePage();

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

  showMessage(profileMessageEl, "Profile saved. Strategy and club advice updated.", false);
  refreshRecommendation();
  renderYardageTable();
  renderHolePage();
});

remainingYardageInput.addEventListener("input", refreshRecommendation);

clearProfileBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEYS.profile);
  savedProfile = null;
  profileForm.reset();
  buildClubInputs();
  clearMessage(profileMessageEl);
  recommendationEl.textContent = "Profile cleared. Add distances to get club recommendations.";
  renderYardageTable();
  renderHolePage();
});

prevHoleBtn.addEventListener("click", () => {
  currentHoleIndex = (currentHoleIndex - 1 + WENTWORTH_WEST.holes.length) % WENTWORTH_WEST.holes.length;
  renderHolePage();
});

nextHoleBtn.addEventListener("click", () => {
  currentHoleIndex = (currentHoleIndex + 1) % WENTWORTH_WEST.holes.length;
  renderHolePage();
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

function getClubDistances() {
  return CLUBS.reduce((acc, club) => {
    const value = Number(getTrimmedValue(`club-${club}`));
    acc[club] = Number.isNaN(value) ? 0 : value;
    return acc;
  }, {});
}

function renderCourseSummary() {
  const totalYardage = WENTWORTH_WEST.holes.reduce((sum, hole) => sum + hole.yardage, 0);
  const totalPar = WENTWORTH_WEST.holes.reduce((sum, hole) => sum + hole.par, 0);
  courseSummaryEl.textContent = `${WENTWORTH_WEST.name} | Holes: ${WENTWORTH_WEST.holes.length} | Par ${totalPar} | ${totalYardage} yards`;
}

function renderYardageTable() {
  tableBody.innerHTML = "";
  const total = WENTWORTH_WEST.holes.reduce((sum, hole) => sum + hole.yardage, 0);
  totalYardageEl.textContent = String(total);

  WENTWORTH_WEST.holes.forEach((hole) => {
    const row = document.createElement("tr");
    const approachDistance = getApproachDistance(hole);
    const approachClub = getBestClubForYardage(approachDistance);

    row.innerHTML = `
      <td>${hole.hole}</td>
      <td>${hole.par}</td>
      <td>${hole.yardage}</td>
      <td>${hole.fairwayMiss}</td>
      <td>${hole.greenMiss}</td>
      <td>${approachClub}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderHolePage() {
  const hole = WENTWORTH_WEST.holes[currentHoleIndex];
  const teeClub = getTeeShotClub(hole);
  const approachClub = getBestClubForYardage(getApproachDistance(hole));

  holePositionEl.textContent = `Hole ${hole.hole} of ${WENTWORTH_WEST.holes.length}`;
  holeTitleEl.textContent = `Hole ${hole.hole}`;
  holeSummaryEl.textContent = `Par ${hole.par} | ${hole.yardage} yards`;
  fairwayMissTipEl.textContent = hole.fairwayMiss;
  greenMissTipEl.textContent = hole.greenMiss;
  teeClubTipEl.textContent = teeClub;
  approachClubTipEl.textContent = approachClub;
  holeNoteEl.textContent = hole.note;
}

function getTeeShotClub(hole) {
  if (hole.par === 3) {
    return getBestClubForYardage(hole.yardage);
  }

  if (hole.par === 5) {
    return `Primary: ${getBestClubForYardage(240)} (aim to set up a layup)`;
  }

  const targetTeeDistance = Math.max(190, hole.yardage - 155);
  return `Primary: ${getBestClubForYardage(targetTeeDistance)}`;
}

function getApproachDistance(hole) {
  if (hole.par === 3) {
    return hole.yardage;
  }
  if (hole.par === 5) {
    return 100;
  }
  return 150;
}

function getBestClubForYardage(targetYardage) {
  if (!savedProfile) {
    return "Save profile first";
  }

  const bestEntry = getBestClubEntry(targetYardage);
  if (!bestEntry) {
    return "No club distances set";
  }
  return `${bestEntry.club} (${bestEntry.distance}y)`;
}

function getBestClubEntry(targetYardage) {
  if (!savedProfile || !savedProfile.distances) {
    return null;
  }
  const entries = Object.entries(savedProfile.distances).filter(([, value]) => value > 0);
  if (!entries.length) {
    return null;
  }

  let best = { club: entries[0][0], distance: entries[0][1] };
  let smallestGap = Math.abs(entries[0][1] - targetYardage);

  entries.forEach(([club, distance]) => {
    const gap = Math.abs(distance - targetYardage);
    if (gap < smallestGap) {
      smallestGap = gap;
      best = { club, distance };
    }
  });

  return best;
}

function refreshRecommendation() {
  const value = Number(remainingYardageInput.value);
  if (Number.isNaN(value) || value <= 0) {
    recommendationEl.textContent = "Enter remaining yardage to see your best club.";
    return;
  }

  recommendationEl.textContent = `Recommended: ${getBestClubForYardage(value)}`;
}

function loadSavedProfile() {
  const rawProfile = localStorage.getItem(STORAGE_KEYS.profile);
  if (!rawProfile) {
    return;
  }

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
