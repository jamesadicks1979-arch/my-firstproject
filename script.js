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
  const teeX = 332;
  const teeY = 676;
  const greenX = 208;
  const greenY = 95;
  const landingRatio = hole.par === 3 ? 0.98 : clamp(plan.landingDistance / hole.yardage, 0.25, 0.9);
  const landingX = Math.round(teeX + (greenX - teeX) * landingRatio);
  const landingY = Math.round(teeY + (greenY - teeY) * landingRatio);
  const lineColor = selectedPlan === "aggressive" ? "#2c6bf2" : "#3f88ff";
  const fairwaySide = getFairwaySide(hole.fairwayMiss);
  const missMarkers = getMissMarkers(fairwaySide, hole, {
    teeX,
    teeY,
    greenX,
    greenY,
    landingX,
    landingY,
  });
  const treeMarkup = getTreeMarkup();

  const firstLabelY = landingY - 16;
  const secondLabelY = greenY - 16;
  const secondSegment = hole.par === 3
    ? ""
    : `<line x1="${landingX}" y1="${landingY}" x2="${greenX}" y2="${greenY}" stroke="${lineColor}" stroke-width="5" />
       <circle cx="${landingX}" cy="${landingY}" r="7" fill="${lineColor}" />
       <text x="${landingX - 42}" y="${firstLabelY}" fill="#214987" font-size="12" font-weight="700">${escapeXml(plan.teeClubLabel)}</text>`;

  shotMapEl.innerHTML = `
    <rect x="0" y="0" width="420" height="760" fill="#ededed"></rect>
    <path d="M335 690 C310 615, 262 490, 238 370 C214 248, 208 176, 206 98" stroke="#688749" stroke-width="148" fill="none" stroke-linecap="round"></path>
    <path d="M332 686 C305 610, 260 486, 236 368 C214 253, 210 180, 208 102" stroke="#8fb86a" stroke-width="118" fill="none" stroke-linecap="round"></path>
    <path d="M327 680 C303 610, 258 487, 236 368 C216 256, 212 184, 210 108" stroke="#bfdc95" stroke-width="80" fill="none" stroke-linecap="round"></path>
    <ellipse cx="${greenX}" cy="${greenY}" rx="48" ry="38" fill="#c9e7a9" stroke="#87a868" stroke-width="2"></ellipse>
    <ellipse cx="${greenX}" cy="${greenY}" rx="22" ry="15" fill="#b7d88e" stroke="#88a768" stroke-width="1.5"></ellipse>
    <ellipse cx="162" cy="110" rx="13" ry="28" fill="#e8ddc7" stroke="#ccbea5" stroke-width="2"></ellipse>
    <ellipse cx="258" cy="114" rx="13" ry="28" fill="#e8ddc7" stroke="#ccbea5" stroke-width="2"></ellipse>
    <ellipse cx="278" cy="338" rx="20" ry="10" fill="#e8ddc7" stroke="#ccbea5" stroke-width="2"></ellipse>
    <ellipse cx="152" cy="554" rx="10" ry="14" fill="#e8ddc7" stroke="#ccbea5" stroke-width="2"></ellipse>
    <ellipse cx="177" cy="523" rx="9" ry="12" fill="#e8ddc7" stroke="#ccbea5" stroke-width="2"></ellipse>
    ${treeMarkup}
    <circle cx="${missMarkers.bestX}" cy="${missMarkers.bestY}" r="11" fill="#11aa55" stroke="#0e7b3f" stroke-width="3"></circle>
    <circle cx="${missMarkers.noGoX}" cy="${missMarkers.noGoY}" r="11" fill="#d92d20" stroke="#a12318" stroke-width="3"></circle>
    <rect x="${missMarkers.bestX + 12}" y="${missMarkers.bestY - 12}" width="84" height="20" rx="8" fill="#0e7b3f" opacity="0.95"></rect>
    <text x="${missMarkers.bestX + 18}" y="${missMarkers.bestY + 3}" fill="#f8fff8" font-size="11" font-weight="700">SAFE AREA</text>
    <rect x="${missMarkers.noGoX + 12}" y="${missMarkers.noGoY - 12}" width="58" height="20" rx="8" fill="#a12318" opacity="0.95"></rect>
    <text x="${missMarkers.noGoX + 18}" y="${missMarkers.noGoY + 3}" fill="#ffe9e6" font-size="11" font-weight="700">NO GO</text>
    <line x1="${teeX}" y1="${teeY}" x2="${hole.par === 3 ? greenX : landingX}" y2="${hole.par === 3 ? greenY : landingY}" stroke="${lineColor}" stroke-width="5" />
    ${secondSegment}
    <circle cx="${teeX}" cy="${teeY}" r="8" fill="#143b77" />
    <circle cx="${greenX}" cy="${greenY}" r="8" fill="#2f7f3d" />
    <text x="${teeX - 18}" y="${teeY + 23}" fill="#143b77" font-size="13" font-weight="700">TEE</text>
    <text x="${greenX - 25}" y="${secondLabelY}" fill="#244f37" font-size="12" font-weight="700">${escapeXml(plan.approachClubLabel)}</text>
    <text x="22" y="736" fill="#3a3a3a" font-size="12">${selectedPlan === "aggressive" ? "Aggressive line" : "Safe line"} for Hole ${hole.hole}</text>
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

function getMissMarkers(fairwaySide, hole, points) {
  const { teeX, teeY, greenX, greenY, landingX, landingY } = points;
  const dirX = greenX - teeX;
  const dirY = greenY - teeY;
  const length = Math.hypot(dirX, dirY) || 1;
  const rightPerpX = dirY / length;
  const rightPerpY = -dirX / length;
  const baseX = hole.par === 3 ? Math.round(greenX - dirX * 0.14) : landingX;
  const baseY = hole.par === 3 ? Math.round(greenY - dirY * 0.14) : landingY;

  let bestSign = 1;
  if (fairwaySide === "left") {
    bestSign = -1;
  } else if (fairwaySide === "center") {
    bestSign = selectedPlan === "safe" ? 1 : -1;
  }

  const bestX = clamp(Math.round(baseX + rightPerpX * 34 * bestSign), 24, 386);
  const bestY = clamp(Math.round(baseY + rightPerpY * 34 * bestSign), 50, 720);
  const noGoX = clamp(Math.round(baseX - rightPerpX * 34 * bestSign), 24, 386);
  const noGoY = clamp(Math.round(baseY - rightPerpY * 34 * bestSign), 50, 720);

  return { bestX, bestY, noGoX, noGoY };
}

function getTreeMarkup() {
  const trees = [
    [105, 648, 17], [86, 620, 12], [86, 588, 12], [118, 560, 14], [94, 526, 12],
    [130, 500, 13], [106, 462, 12], [132, 430, 13], [114, 395, 12], [146, 364, 12],
    [132, 322, 12], [158, 292, 11], [146, 254, 12], [169, 222, 12], [165, 184, 14],
    [174, 150, 16], [158, 116, 14], [248, 122, 15], [274, 154, 16], [292, 186, 14],
    [302, 218, 12], [318, 250, 14], [306, 286, 12], [324, 326, 14], [316, 365, 12],
    [334, 402, 13], [318, 446, 13], [338, 486, 14], [324, 530, 12], [342, 570, 14],
    [328, 606, 12], [338, 644, 12],
  ];
  return trees
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4c6f37" opacity="0.95"></circle>`)
    .join("");
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
