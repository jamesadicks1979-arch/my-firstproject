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

const DEFAULT_DISTANCES = {
  Driver: 240,
  "3 Wood": 220,
  "5 Wood": 205,
  "3 Hybrid": 195,
  "4 Iron": 185,
  "5 Iron": 175,
  "6 Iron": 165,
  "7 Iron": 155,
  "8 Iron": 145,
  "9 Iron": 135,
  "Pitching Wedge": 120,
  "Gap Wedge": 105,
  "Sand Wedge": 90,
  "Lob Wedge": 75,
};

const WENTWORTH_WEST = {
  name: "Wentworth West Course",
  holes: [
    { hole: 1, par: 4, yardage: 473, fairwayMiss: "Favor right-center miss.", greenMiss: "Short-right is safest for up-and-down.", note: "Strong opener with bunkers left; keep tee ball on the right half." },
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
const aggressiveBtn = document.getElementById("aggressiveBtn");
const safeBtn = document.getElementById("safeBtn");
const holeStoryBtn = document.getElementById("holeStoryBtn");
const holeStoryPanel = document.getElementById("holeStoryPanel");
const holeStoryText = document.getElementById("holeStoryText");
const planSummaryEl = document.getElementById("planSummary");
const shotMapEl = document.getElementById("shotMap");

let savedProfile = null;
let currentHoleIndex = 0;
let selectedPlan = "aggressive";
let isStoryOpen = false;

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

aggressiveBtn.addEventListener("click", () => {
  selectedPlan = "aggressive";
  renderHolePage();
});

safeBtn.addEventListener("click", () => {
  selectedPlan = "safe";
  renderHolePage();
});

holeStoryBtn.addEventListener("click", () => {
  isStoryOpen = !isStoryOpen;
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
    const aggressivePlan = getPlanForHole(hole, "aggressive");

    row.innerHTML = `
      <td>${hole.hole}</td>
      <td>${hole.par}</td>
      <td>${hole.yardage}</td>
      <td>${hole.fairwayMiss}</td>
      <td>${hole.greenMiss}</td>
      <td>${aggressivePlan.approachClubLabel}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderHolePage() {
  const hole = WENTWORTH_WEST.holes[currentHoleIndex];
  const plan = getPlanForHole(hole, selectedPlan);
  const planName = selectedPlan === "aggressive" ? "Aggressive" : "Safe";

  holePositionEl.textContent = `Hole ${hole.hole} of ${WENTWORTH_WEST.holes.length}`;
  holeTitleEl.textContent = `Hole ${hole.hole}`;
  holeSummaryEl.textContent = `Par ${hole.par} | ${hole.yardage} yards`;
  fairwayMissTipEl.textContent = hole.fairwayMiss;
  greenMissTipEl.textContent = hole.greenMiss;
  teeClubTipEl.textContent = `${planName}: ${plan.teeClubLabel} to ${plan.landingDistance}y`;
  approachClubTipEl.textContent = `${plan.approachClubLabel} from ${plan.remainingDistance}y`;
  planSummaryEl.textContent = `${planName} line: ${plan.teeClubLabel} to ${plan.landingDistance}y, then ${plan.approachClubLabel} into the green.`;
  holeNoteEl.textContent = hole.note;
  renderShotMap(hole, plan);
  updatePlanButtons();
  renderHoleStory(hole, plan);
}

function getBestClubForYardage(targetYardage) {
  const bestEntry = getBestClubEntry(targetYardage);
  if (!bestEntry) {
    return "No club distances set";
  }
  const estimateLabel = savedProfile ? "" : " est.";
  return `${bestEntry.club} (${bestEntry.distance}y${estimateLabel})`;
}

function getBestClubEntry(targetYardage) {
  const entries = getDistanceEntries();
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

function getPlanForHole(hole, mode) {
  if (hole.par === 3) {
    const par3Target = mode === "safe" ? hole.yardage + 8 : hole.yardage;
    const par3Club = getBestClubForYardage(par3Target);
    return {
      teeClubLabel: par3Club,
      approachClubLabel: "No approach shot (par 3)",
      landingDistance: hole.yardage,
      remainingDistance: 0,
    };
  }

  const teeClubName = mode === "safe" ? "4 Iron" : "Driver";
  const teeDistanceRaw = getClubDistanceValue(teeClubName);
  const minimumLeave = hole.par === 5 ? 70 : 20;
  const landingDistance = Math.round(clamp(teeDistanceRaw, 90, hole.yardage - minimumLeave));
  const remainingDistance = Math.max(hole.yardage - landingDistance, 0);
  const approachClubLabel = getBestClubForYardage(remainingDistance);

  return {
    teeClubLabel: `${teeClubName} (${Math.round(teeDistanceRaw)}y${savedProfile ? "" : " est."})`,
    approachClubLabel,
    landingDistance,
    remainingDistance: Math.round(remainingDistance),
  };
}

function getClubDistanceValue(clubName) {
  if (savedProfile && savedProfile.distances && savedProfile.distances[clubName] > 0) {
    return savedProfile.distances[clubName];
  }
  return DEFAULT_DISTANCES[clubName] || 0;
}

function getDistanceEntries() {
  if (savedProfile && savedProfile.distances) {
    const userEntries = Object.entries(savedProfile.distances).filter(([, value]) => value > 0);
    if (userEntries.length) {
      return userEntries;
    }
  }
  return Object.entries(DEFAULT_DISTANCES);
}

function renderShotMap(hole, plan) {
  const teeX = 70;
  const teeY = 110;
  const greenX = 580;
  const greenY = 110;
  const fairwayOffset = parseFairwayOffset(hole.fairwayMiss, selectedPlan);
  const landingRatio = hole.par === 3 ? 1 : clamp(plan.landingDistance / hole.yardage, 0.12, 0.95);
  const landingX = Math.round(teeX + (greenX - teeX) * landingRatio);
  const landingY = hole.par === 3 ? greenY : teeY + fairwayOffset;
  const lineColor = selectedPlan === "aggressive" ? "#ffffff" : "#b8f6d4";
  const fairwaySide = getFairwaySide(hole.fairwayMiss);
  const missMarkers = getMissMarkers(fairwaySide, hole, teeX, teeY, greenX, greenY);

  const firstLabelY = landingY - 14;
  const secondLabelY = greenY - 14;
  const secondSegment = hole.par === 3
    ? ""
    : `<line x1="${landingX}" y1="${landingY}" x2="${greenX}" y2="${greenY}" stroke="${lineColor}" stroke-width="4" />
       <circle cx="${landingX}" cy="${landingY}" r="7" fill="${lineColor}" />
       <text x="${landingX - 36}" y="${firstLabelY}" fill="#ffffff" font-size="13">${escapeXml(plan.teeClubLabel)}</text>`;

  shotMapEl.innerHTML = `
    <rect x="20" y="20" width="600" height="180" rx="16" ry="16" fill="#1c5e43"></rect>
    <path d="M35 35 L285 35 L330 185 L35 185 Z" fill="#1f8db7" opacity="0.7"></path>
    <path d="M80 170 C180 105, 270 125, 360 120 C455 115, 520 100, 595 95" stroke="#8dd08d" stroke-width="60" fill="none" stroke-linecap="round"></path>
    <path d="M80 170 C180 105, 270 125, 360 120 C455 115, 520 100, 595 95" stroke="#b7e9ae" stroke-width="34" fill="none" stroke-linecap="round"></path>
    <circle cx="${missMarkers.bestX}" cy="${missMarkers.bestY}" r="10" fill="#11aa55" stroke="#0e7b3f" stroke-width="3"></circle>
    <circle cx="${missMarkers.noGoX}" cy="${missMarkers.noGoY}" r="10" fill="#d92d20" stroke="#a12318" stroke-width="3"></circle>
    <text x="${missMarkers.bestX + 12}" y="${missMarkers.bestY + 4}" fill="#f8fff8" font-size="12">Best miss</text>
    <text x="${missMarkers.noGoX + 12}" y="${missMarkers.noGoY + 4}" fill="#ffe9e6" font-size="12">No-go</text>
    <rect x="545" y="70" width="68" height="50" rx="20" ry="20" fill="#7fcf87"></rect>
    <line x1="${teeX}" y1="${teeY}" x2="${hole.par === 3 ? greenX : landingX}" y2="${hole.par === 3 ? greenY : landingY}" stroke="${lineColor}" stroke-width="4" />
    ${secondSegment}
    <circle cx="${teeX}" cy="${teeY}" r="7" fill="#132a3a" />
    <circle cx="${greenX}" cy="${greenY}" r="8" fill="#027a48" />
    <text x="${teeX - 18}" y="${teeY - 14}" fill="#ffffff" font-size="13">Tee</text>
    <text x="${greenX - 20}" y="${secondLabelY}" fill="#ffffff" font-size="13">${escapeXml(plan.approachClubLabel)}</text>
    <text x="24" y="208" fill="#ffffff" font-size="12">${selectedPlan === "aggressive" ? "Aggressive line" : "Safe line"} for Hole ${hole.hole}</text>
  `;
}

function parseFairwayOffset(fairwayMissText, mode) {
  if (fairwayMissText.toLowerCase().includes("right")) {
    return mode === "aggressive" ? -22 : -10;
  }
  if (fairwayMissText.toLowerCase().includes("left")) {
    return mode === "aggressive" ? 22 : 10;
  }
  return mode === "aggressive" ? -14 : 14;
}

function getFairwaySide(fairwayMissText) {
  const text = fairwayMissText.toLowerCase();
  if (text.includes("right")) {
    return "right";
  }
  if (text.includes("left")) {
    return "left";
  }
  return "center";
}

function getMissMarkers(fairwaySide, hole, teeX, teeY, greenX, greenY) {
  const markerX = hole.par === 3 ? greenX - 48 : teeX + Math.round((greenX - teeX) * 0.54);
  if (fairwaySide === "right") {
    return {
      bestX: markerX,
      bestY: teeY - 26,
      noGoX: markerX - 12,
      noGoY: teeY + 28,
    };
  }

  if (fairwaySide === "left") {
    return {
      bestX: markerX - 12,
      bestY: teeY + 28,
      noGoX: markerX,
      noGoY: teeY - 26,
    };
  }

  if (hole.par === 3) {
    return {
      bestX: markerX - 10,
      bestY: greenY + 28,
      noGoX: markerX,
      noGoY: greenY - 28,
    };
  }

  return {
    bestX: markerX - 8,
    bestY: teeY - 12,
    noGoX: markerX + 8,
    noGoY: teeY + 30,
  };
}

function updatePlanButtons() {
  const isAggressive = selectedPlan === "aggressive";
  aggressiveBtn.classList.toggle("plan-button-active", isAggressive);
  safeBtn.classList.toggle("plan-button-active", !isAggressive);
}

function renderHoleStory(hole, plan) {
  holeStoryText.innerHTML = getHoleStoryMarkup(hole, plan);
  holeStoryPanel.classList.toggle("is-hidden", !isStoryOpen);
  holeStoryBtn.textContent = isStoryOpen ? "Hide Hole Story" : "Show Hole Story";
  holeStoryBtn.classList.toggle("plan-button-active", isStoryOpen);
}

function getHoleStoryMarkup(hole, plan) {
  if (hole.hole === 1) {
    const profilePlan = getHoleOneProfileStrategy(hole.yardage);
    return `
      <p><strong>Wentworth Club West Course - Hole 1 Yardage-Book Style View</strong></p>
      <p class="story-title">Hole 1 Overview</p>
      <ul>
        <li><strong>Par:</strong> 4 (Tour) / often Par 5 for members</li>
        <li><strong>Length:</strong> about 473 yards (433 m) from championship tees</li>
        <li><strong>Stroke index:</strong> around 16 on the card</li>
      </ul>

      <p class="story-title">Yardage Book Style Breakdown</p>
      <p class="story-title">Tee Shot</p>
      <ul>
        <li>Elevated tee looking down the fairway</li>
        <li>Fairway moves slightly left to right</li>
        <li>Right fairway bunker around 280-290 yards from the back tee</li>
        <li>Most tour players hit 3-wood or controlled driver to stay short of the bunker</li>
      </ul>

      <p class="story-title">Typical landing numbers</p>
      <ul>
        <li><strong>250y</strong> - start of fairway narrowing</li>
        <li><strong>280y</strong> - bunker carry area</li>
        <li><strong>300y</strong> - slope can kick ball right toward rough</li>
      </ul>

      <p class="story-title">Second Shot</p>
      <ul>
        <li>Uphill approach into a slightly raised green</li>
        <li>Often mid-iron (5-7 iron) for tour players</li>
        <li>Lies can be uneven due to the fairway slope</li>
      </ul>

      <p class="story-title">Green Complex</p>
      <ul>
        <li>Four bunkers guard the green complex making long approaches risky</li>
        <li>Slightly elevated surface</li>
        <li>Missing short often leaves a tricky bunker shot</li>
      </ul>

      <p class="story-title">Typical Tour Strategy</p>
      <ol>
        <li>3-wood to around 275-285y</li>
        <li>Mid-iron approach to center of green</li>
        <li>Avoid short-side bunkers and take par</li>
      </ol>

      <p class="story-title">Your Profile Caddie Call</p>
      <ul>
        <li>${escapeXml(profilePlan.driverCall)}</li>
        <li>${escapeXml(profilePlan.layupCall)}</li>
        <li>${escapeXml(profilePlan.thirdShotCall)}</li>
      </ul>
      <p><strong>Current selected plan:</strong> ${escapeXml(selectedPlan)} | Tee: ${escapeXml(plan.teeClubLabel)} | Approach: ${escapeXml(plan.approachClubLabel)}</p>
    `;
  }

  if (hole.par === 4 && hole.yardage >= 450) {
    return `
      <p>Long par 4. Most of the trouble is down the left.</p>
      <p>If you miss short-right from the tee, you still have a shot into the green.</p>
      <p>You need a drive up the right side to give yourself the best chance to hit this green.</p>
      <p>With the ${escapeXml(selectedPlan)} plan, take ${escapeXml(plan.teeClubLabel)} from the tee.</p>
      <p>For the approach, use ${escapeXml(plan.approachClubLabel)}, or one club less to miss short-right and leave an uphill chip or putt.</p>
      <p>Long is a hard up-and-down.</p>
      <p>Par is a very good score on this hole, so take it and move on.</p>
      <p>Bogey is not too bad because the next few holes can give you a chance to win the shot back.</p>
      <p>This hole can catch you out - do not get greedy.</p>
    `;
  }

  if (hole.par === 3) {
    return `
      <p>Par 3 strategy: ${escapeXml(hole.greenMiss)}</p>
      <p>Commit to ${escapeXml(plan.teeClubLabel)} and favor the center of the green if pin is tucked.</p>
      <p>Par is always a strong result here. Avoid short-siding yourself.</p>
    `;
  }

  return `
    <p>${escapeXml(hole.note)}</p>
    <p>Trouble pattern: ${escapeXml(hole.fairwayMiss)}</p>
    <p>Recovery pattern: ${escapeXml(hole.greenMiss)}</p>
    <p>Current ${escapeXml(selectedPlan)} plan: ${escapeXml(plan.teeClubLabel)} from tee, then ${escapeXml(plan.approachClubLabel)} from ${plan.remainingDistance}y.</p>
    <p>If the number is awkward, take one less and leave a simple chip or putt rather than chasing a perfect shot.</p>
  `;
}

function getHoleOneProfileStrategy(holeYardage) {
  const driver = Math.round(getClubDistanceValue("Driver"));
  const fiveWood = Math.round(getClubDistanceValue("5 Wood"));
  const sixIron = Math.round(getClubDistanceValue("6 Iron"));
  const twoShotTotal = driver + fiveWood;
  const canReachInTwo = twoShotTotal >= holeYardage;
  const layupRemainder = Math.max(holeYardage - (fiveWood + sixIron), 0);

  const driverCall = canReachInTwo
    ? `Driver ${driver}y gives you a realistic two-shot chance, but only if the tee ball is in the right side of fairway.`
    : `Driver ${driver}y means this is usually not a reliable two-shot hole for your profile.`;

  const layupCall = `Safer pattern: 5-wood ${fiveWood}y then 6-iron ${sixIron}y to position the ball short-right.`;

  const thirdShotCall = `That leaves about ${layupRemainder}y for a controlled third shot (example target is around 89y when 5-wood is 220y and 6-iron is 165y).`;

  return { driverCall, layupCall, thirdShotCall };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function escapeXml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
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
