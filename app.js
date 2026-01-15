const STORAGE_KEY = "trade-notes-vault:v1";
const APPWRITE_CONFIG_KEY = "trade-notes-vault:appwrite-config:v1";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const state = {
  notes: [],
  selectedId: null,
  editingId: null,
  imageQueue: [],
  appwrite: {
    config: null,
    client: null,
    account: null,
    databases: null,
    storage: null,
    user: null,
  },
  syncInProgress: false,
};

const elements = {
  form: document.getElementById("note-form"),
  headline: document.getElementById("headline"),
  category: document.getElementById("category"),
  priority: document.getElementById("priority"),
  reminderDate: document.getElementById("reminder-date"),
  tradeDate: document.getElementById("trade-date"),
  symbol: document.getElementById("symbol"),
  direction: document.getElementById("direction"),
  entry: document.getElementById("entry"),
  exit: document.getElementById("exit"),
  outcome: document.getElementById("outcome"),
  pnl: document.getElementById("pnl"),
  strategy: document.getElementById("strategy"),
  notes: document.getElementById("notes"),
  chartNotes: document.getElementById("chart-notes"),
  tags: document.getElementById("tags"),
  imageInput: document.getElementById("chart-images"),
  imagePreview: document.getElementById("image-preview"),
  message: document.getElementById("form-message"),
  saveButton: document.getElementById("save-button"),
  clearButton: document.getElementById("clear-button"),
  notesList: document.getElementById("notes-list"),
  noteDetail: document.getElementById("note-detail"),
  searchInput: document.getElementById("search-input"),
  filterCategory: document.getElementById("filter-category"),
  sortSelect: document.getElementById("sort-select"),
  appwriteEndpoint: document.getElementById("appwrite-endpoint"),
  appwriteProject: document.getElementById("appwrite-project"),
  appwriteDatabase: document.getElementById("appwrite-database"),
  appwriteCollection: document.getElementById("appwrite-collection"),
  appwriteBucket: document.getElementById("appwrite-bucket"),
  saveConfigButton: document.getElementById("save-config"),
  clearConfigButton: document.getElementById("clear-config"),
  authName: document.getElementById("auth-name"),
  authEmail: document.getElementById("auth-email"),
  authPassword: document.getElementById("auth-password"),
  signUpButton: document.getElementById("sign-up"),
  signInButton: document.getElementById("sign-in"),
  signOutButton: document.getElementById("sign-out"),
  syncButton: document.getElementById("sync-now"),
  cloudMessage: document.getElementById("cloud-message"),
  cloudStatus: document.getElementById("cloud-status"),
};

async function init() {
  state.notes = loadNotes();
  bindEvents();
  loadAppwriteConfig();
  await setupAppwriteFromConfig();
  renderNotesList();
  renderNoteDetail();
  refreshCloudStatus();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.clearButton.addEventListener("click", handleClear);
  elements.imageInput.addEventListener("change", handleImageUpload);
  elements.searchInput.addEventListener("input", renderNotesList);
  elements.filterCategory.addEventListener("change", renderNotesList);
  elements.sortSelect.addEventListener("change", renderNotesList);
  elements.saveConfigButton.addEventListener("click", handleSaveConfig);
  elements.clearConfigButton.addEventListener("click", handleClearConfig);
  elements.signUpButton.addEventListener("click", handleSignUp);
  elements.signInButton.addEventListener("click", handleSignIn);
  elements.signOutButton.addEventListener("click", handleSignOut);
  elements.syncButton.addEventListener("click", handleSyncNow);
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map(normalizeNote).filter(Boolean);
  } catch (error) {
    console.error("Failed to load notes", error);
    return [];
  }
}

function persistNotes(nextNotes) {
  try {
    const serialized = JSON.stringify(nextNotes);
    localStorage.setItem(STORAGE_KEY, serialized);
    return true;
  } catch (error) {
    console.error("Failed to save notes", error);
    setMessage(
      "Storage limit reached. Remove large images or old notes.",
      "error"
    );
    return false;
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();
  const headline = elements.headline.value.trim();
  if (!headline) {
    setMessage("Headline is required.", "error");
    return;
  }

  const now = new Date().toISOString();
  const baseNote = {
    id: state.editingId ?? createId(),
    headline,
    category: elements.category.value,
    priority: elements.priority.value,
    reminderDate: elements.reminderDate.value,
    tradeDate: elements.tradeDate.value,
    trade: {
      symbol: elements.symbol.value.trim(),
      direction: elements.direction.value,
      entry: elements.entry.value.trim(),
      exit: elements.exit.value.trim(),
      outcome: elements.outcome.value,
      pnl: elements.pnl.value.trim(),
      strategy: elements.strategy.value.trim(),
    },
    notes: elements.notes.value.trim(),
    chartNotes: elements.chartNotes.value.trim(),
    tags: parseTags(elements.tags.value),
    images: [...state.imageQueue],
    updatedAt: now,
  };

  const existingNote = state.notes.find((note) => note.id === baseNote.id);
  const nextNote = {
    ...baseNote,
    createdAt: existingNote?.createdAt ?? now,
  };

  const nextNotes = existingNote
    ? state.notes.map((note) => (note.id === nextNote.id ? nextNote : note))
    : [nextNote, ...state.notes];

  if (!persistNotes(nextNotes)) {
    return;
  }

  state.notes = nextNotes;
  state.selectedId = nextNote.id;
  state.editingId = null;
  resetForm();
  renderNotesList();
  renderNoteDetail(nextNote.id);
  setMessage("Note saved.", "success");
  const syncedNote = await syncLocalNoteToCloud(nextNote);
  if (syncedNote) {
    updateNoteInState(syncedNote);
  }
}

function handleClear() {
  const wasEditing = Boolean(state.editingId);
  if (wasEditing) {
    state.editingId = null;
  }
  resetForm();
  if (wasEditing) {
    setMessage("Edit canceled.", "success");
  }
}

function handleImageUpload(event) {
  const files = Array.from(event.target.files ?? []);
  if (!files.length) {
    return;
  }

  setMessage("Loading images...", "info");
  const validFiles = [];
  const issues = [];

  files.forEach((file) => {
    if (!file.type.startsWith("image/")) {
      issues.push(`${file.name} is not an image.`);
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      issues.push(`${file.name} exceeds 2 MB.`);
      return;
    }
    validFiles.push(file);
  });

  Promise.all(validFiles.map(readFileAsDataUrl))
    .then((images) => {
      state.imageQueue = [...state.imageQueue, ...images];
      renderImagePreview();
      if (issues.length) {
        setMessage(issues.join(" "), "error");
      } else {
        setMessage("Images added.", "success");
      }
    })
    .catch(() => {
      setMessage("Unable to read one of the images.", "error");
    })
    .finally(() => {
      elements.imageInput.value = "";
    });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        size: file.size,
        type: file.type,
        fileId: null,
        dataUrl: reader.result,
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function renderImagePreview() {
  elements.imagePreview.innerHTML = "";
  state.imageQueue.forEach((image, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "image-thumb";

    const src = resolveImageSource(image);
    const img = document.createElement("img");
    img.alt = image.name || "Chart image";
    if (src) {
      img.src = src;
      wrapper.appendChild(img);
    } else {
      const fallback = document.createElement("div");
      fallback.className = "image-fallback";
      fallback.textContent = "Preview unavailable";
      wrapper.appendChild(fallback);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "x";
    button.addEventListener("click", () => {
      state.imageQueue = state.imageQueue.filter((_, idx) => idx !== index);
      renderImagePreview();
    });

    wrapper.appendChild(button);
    elements.imagePreview.appendChild(wrapper);
  });
}

function renderNotesList() {
  elements.notesList.innerHTML = "";
  const filtered = getFilteredNotes();

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No notes yet. Add a trade or reminder to start.";
    elements.notesList.appendChild(empty);
    return;
  }

  filtered.forEach((note) => {
    const category = note.category || "Other";
    const card = document.createElement("button");
    card.type = "button";
    card.className = "note-card";
    if (note.id === state.selectedId) {
      card.classList.add("selected");
    }

    const title = document.createElement("h3");
    title.textContent = note.headline;

    const meta = document.createElement("div");
    meta.className = "note-meta";
    meta.appendChild(createPill(category));
    meta.appendChild(createMetaText(formatDate(note.updatedAt)));
    if (note.trade?.symbol) {
      meta.appendChild(createMetaText(note.trade.symbol.toUpperCase()));
    }

    const snippet = document.createElement("p");
    snippet.className = "note-snippet";
    const snippetText =
      note.notes || note.chartNotes || "No notes yet.";
    snippet.textContent = truncateText(snippetText, 140);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(snippet);

    if (note.images?.length) {
      const src = resolveImageSource(note.images[0]);
      if (src) {
        const thumbnail = document.createElement("img");
        thumbnail.className = "note-thumbnail";
        thumbnail.src = src;
        thumbnail.alt = `Chart image for ${note.headline}`;
        card.appendChild(thumbnail);
      }
    }

    if (note.tags?.length) {
      const tagRow = document.createElement("div");
      tagRow.className = "note-meta";
      note.tags.slice(0, 3).forEach((tag) => {
        tagRow.appendChild(createMetaText(`#${tag}`));
      });
      card.appendChild(tagRow);
    }

    card.addEventListener("click", () => {
      state.selectedId = note.id;
      renderNotesList();
      renderNoteDetail(note.id);
    });

    elements.notesList.appendChild(card);
  });
}

function renderNoteDetail(noteId = state.selectedId) {
  elements.noteDetail.innerHTML = "";
  const note = state.notes.find((item) => item.id === noteId);
  if (!note) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "Select a note to review details.";
    elements.noteDetail.appendChild(empty);
    return;
  }

  const category = note.category || "Other";
  const priority = note.priority || "Normal";
  const heading = document.createElement("h3");
  heading.textContent = note.headline;

  const meta = document.createElement("div");
  meta.className = "detail-meta";
  meta.appendChild(createPill(category));
  meta.appendChild(createMetaText(`Priority: ${priority}`));
  meta.appendChild(createMetaText(`Updated: ${formatDateTime(note.updatedAt)}`));

  if (note.reminderDate) {
    meta.appendChild(createMetaText(`Reminder: ${note.reminderDate}`));
  }
  if (note.tradeDate) {
    meta.appendChild(createMetaText(`Trade date: ${note.tradeDate}`));
  }

  elements.noteDetail.append(heading, meta);

  const tradeSection = document.createElement("div");
  tradeSection.className = "detail-section";
  tradeSection.appendChild(sectionTitle("Trade summary"));
  const tradeSummary = document.createElement("p");
  tradeSummary.textContent = buildTradeSummary(note.trade);
  tradeSection.appendChild(tradeSummary);
  elements.noteDetail.appendChild(tradeSection);

  if (note.notes) {
    elements.noteDetail.appendChild(
      buildDetailSection("Journal notes", note.notes)
    );
  }
  if (note.chartNotes) {
    elements.noteDetail.appendChild(
      buildDetailSection("Chart notes", note.chartNotes)
    );
  }

  if (note.tags?.length) {
    const tags = document.createElement("div");
    tags.className = "detail-section";
    tags.appendChild(sectionTitle("Tags"));
    const tagRow = document.createElement("div");
    tagRow.className = "detail-meta";
    note.tags.forEach((tag) => tagRow.appendChild(createMetaText(`#${tag}`)));
    tags.appendChild(tagRow);
    elements.noteDetail.appendChild(tags);
  }

  if (note.images?.length) {
    const imagesSection = document.createElement("div");
    imagesSection.className = "detail-section";
    imagesSection.appendChild(sectionTitle("Chart images"));
    const grid = document.createElement("div");
    grid.className = "detail-images";
    note.images.forEach((image) => {
      const src = resolveImageSource(image);
      if (!src) {
        return;
      }
      const link = document.createElement("a");
      link.href = getImageLinkUrl(image) || src;
      link.target = "_blank";
      link.rel = "noopener";
      const img = document.createElement("img");
      img.src = src;
      img.alt = image.name || "Chart image";
      link.appendChild(img);
      grid.appendChild(link);
    });
    imagesSection.appendChild(grid);
    elements.noteDetail.appendChild(imagesSection);
  }

  const actions = document.createElement("div");
  actions.className = "detail-actions";
  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "ghost";
  editButton.textContent = "Edit note";
  editButton.addEventListener("click", () => loadNoteForEdit(note));
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete note";
  deleteButton.addEventListener("click", () => handleDelete(note.id));
  actions.append(editButton, deleteButton);
  elements.noteDetail.appendChild(actions);
}

function buildDetailSection(title, text) {
  const section = document.createElement("div");
  section.className = "detail-section";
  section.appendChild(sectionTitle(title));
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  section.appendChild(paragraph);
  return section;
}

function sectionTitle(text) {
  const title = document.createElement("strong");
  title.textContent = text;
  return title;
}

function createMetaText(text) {
  const span = document.createElement("span");
  span.textContent = text;
  return span;
}

function createPill(text) {
  const span = document.createElement("span");
  span.className = "pill";
  span.textContent = text;
  return span;
}

function buildTradeSummary(trade) {
  if (!trade) {
    return "No trade details recorded.";
  }
  const parts = [];
  if (trade.symbol) parts.push(trade.symbol.toUpperCase());
  if (trade.direction) parts.push(trade.direction);
  if (trade.strategy) parts.push(`Setup: ${trade.strategy}`);
  if (trade.entry) parts.push(`Entry: ${trade.entry}`);
  if (trade.exit) parts.push(`Exit: ${trade.exit}`);
  if (trade.outcome) parts.push(`Outcome: ${trade.outcome}`);
  if (trade.pnl) parts.push(`P/L: ${trade.pnl}`);
  return parts.length ? parts.join(" | ") : "No trade details recorded.";
}

function loadNoteForEdit(note) {
  state.editingId = note.id;
  state.selectedId = note.id;
  elements.headline.value = note.headline ?? "";
  elements.category.value = note.category ?? "Daily reminder";
  elements.priority.value = note.priority ?? "Normal";
  elements.reminderDate.value = note.reminderDate ?? "";
  elements.tradeDate.value = note.tradeDate ?? "";
  elements.symbol.value = note.trade?.symbol ?? "";
  elements.direction.value = note.trade?.direction ?? "";
  elements.entry.value = note.trade?.entry ?? "";
  elements.exit.value = note.trade?.exit ?? "";
  elements.outcome.value = note.trade?.outcome ?? "";
  elements.pnl.value = note.trade?.pnl ?? "";
  elements.strategy.value = note.trade?.strategy ?? "";
  elements.notes.value = note.notes ?? "";
  elements.chartNotes.value = note.chartNotes ?? "";
  elements.tags.value = note.tags?.join(", ") ?? "";
  state.imageQueue = note.images ? [...note.images] : [];
  renderImagePreview();
  elements.saveButton.textContent = "Update note";
  elements.clearButton.textContent = "Cancel edit";
  setMessage("Editing note.", "success");
  renderNotesList();
  renderNoteDetail(note.id);
}

async function handleDelete(noteId) {
  const confirmed = window.confirm("Delete this note? This cannot be undone.");
  if (!confirmed) {
    return;
  }
  const noteToDelete = state.notes.find((note) => note.id === noteId);
  const nextNotes = state.notes.filter((note) => note.id !== noteId);
  if (!persistNotes(nextNotes)) {
    return;
  }
  state.notes = nextNotes;
  if (state.selectedId === noteId) {
    state.selectedId = state.notes[0]?.id ?? null;
  }
  state.editingId = null;
  resetForm();
  renderNotesList();
  renderNoteDetail();
  setMessage("Note deleted.", "success");
  if (noteToDelete) {
    await deleteNoteFromCloud(noteToDelete);
  }
}

function resetForm() {
  elements.form.reset();
  state.imageQueue = [];
  renderImagePreview();
  elements.saveButton.textContent = "Save note";
  elements.clearButton.textContent = "Clear";
  elements.message.className = "form-message";
  elements.message.textContent = "";
}

function updateNoteInState(updatedNote) {
  state.notes = state.notes.map((note) =>
    note.id === updatedNote.id ? updatedNote : note
  );
  persistNotes(state.notes);
  renderNotesList();
  renderNoteDetail(updatedNote.id);
}

function normalizeNote(rawNote) {
  if (!rawNote || typeof rawNote !== "object") {
    return null;
  }
  const trade = rawNote.trade ?? {};
  const images = Array.isArray(rawNote.images)
    ? rawNote.images.map(normalizeImage).filter(Boolean)
    : [];
  const createdAt =
    rawNote.createdAt || rawNote.updatedAt || new Date().toISOString();
  const updatedAt =
    rawNote.updatedAt || rawNote.createdAt || new Date().toISOString();

  return {
    id: rawNote.id || createId(),
    appwriteId: rawNote.appwriteId || null,
    headline: rawNote.headline || "",
    category: rawNote.category || "Other",
    priority: rawNote.priority || "Normal",
    reminderDate: rawNote.reminderDate || "",
    tradeDate: rawNote.tradeDate || "",
    trade: {
      symbol: trade.symbol || "",
      direction: trade.direction || "",
      entry: trade.entry || "",
      exit: trade.exit || "",
      outcome: trade.outcome || "",
      pnl: trade.pnl || "",
      strategy: trade.strategy || "",
    },
    notes: rawNote.notes || "",
    chartNotes: rawNote.chartNotes || "",
    tags: Array.isArray(rawNote.tags) ? rawNote.tags : [],
    images,
    createdAt,
    updatedAt,
  };
}

function normalizeImage(image) {
  if (!image || typeof image !== "object") {
    return null;
  }
  return {
    name: image.name || "Chart image",
    size: image.size || 0,
    type: image.type || "image",
    fileId: image.fileId || null,
    dataUrl: image.dataUrl || "",
  };
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index);
}

function getFilteredNotes() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const category = elements.filterCategory.value;
  let result = [...state.notes];

  if (category && category !== "All") {
    result = result.filter(
      (note) => (note.category || "Other") === category
    );
  }
  if (query) {
    result = result.filter((note) => {
      const text = [
        note.headline,
        note.notes,
        note.chartNotes,
        note.trade?.symbol,
        note.trade?.strategy,
        note.trade?.outcome,
        note.tags?.join(" "),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return text.includes(query);
    });
  }

  const sortBy = elements.sortSelect.value;
  if (sortBy === "recent") {
    result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } else if (sortBy === "oldest") {
    result.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
  } else {
    result.sort((a, b) => a.headline.localeCompare(b.headline));
  }

  return result;
}

function createId() {
  return `note_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function formatDate(isoString) {
  if (!isoString) return "No date";
  return new Date(isoString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(isoString) {
  if (!isoString) return "Unknown";
  return new Date(isoString).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function loadAppwriteConfig() {
  const raw = localStorage.getItem(APPWRITE_CONFIG_KEY);
  if (!raw) {
    return;
  }
  try {
    const config = JSON.parse(raw);
    state.appwrite.config = config;
    setAppwriteFormValues(config);
  } catch (error) {
    console.error("Failed to load Appwrite config", error);
  }
}

function setAppwriteFormValues(config) {
  if (!config) {
    return;
  }
  elements.appwriteEndpoint.value = config.endpoint || "";
  elements.appwriteProject.value = config.projectId || "";
  elements.appwriteDatabase.value = config.databaseId || "";
  elements.appwriteCollection.value = config.collectionId || "";
  elements.appwriteBucket.value = config.bucketId || "";
}

function getAppwriteConfigFromInputs() {
  return {
    endpoint: elements.appwriteEndpoint.value.trim(),
    projectId: elements.appwriteProject.value.trim(),
    databaseId: elements.appwriteDatabase.value.trim(),
    collectionId: elements.appwriteCollection.value.trim(),
    bucketId: elements.appwriteBucket.value.trim(),
  };
}

async function handleSaveConfig() {
  const config = getAppwriteConfigFromInputs();
  if (
    !config.endpoint ||
    !config.projectId ||
    !config.databaseId ||
    !config.collectionId
  ) {
    setCloudMessage(
      "Endpoint, project, database, and collection IDs are required.",
      "error"
    );
    return;
  }
  state.appwrite.config = config;
  localStorage.setItem(APPWRITE_CONFIG_KEY, JSON.stringify(config));
  await setupAppwriteFromConfig();
  if (config.bucketId) {
    setCloudMessage("Config saved.", "success");
  } else {
    setCloudMessage("Config saved. Add a bucket ID to sync images.", "success");
  }
}

function handleClearConfig() {
  localStorage.removeItem(APPWRITE_CONFIG_KEY);
  state.appwrite = {
    config: null,
    client: null,
    account: null,
    databases: null,
    storage: null,
    user: null,
  };
  state.syncInProgress = false;
  setAppwriteFormValues({});
  refreshCloudStatus();
  setCloudMessage("Cloud config cleared.", "success");
}

async function setupAppwriteFromConfig() {
  const config = state.appwrite.config;
  if (!config) {
    refreshCloudStatus();
    return;
  }
  if (!window.Appwrite) {
    setCloudMessage("Appwrite SDK not loaded.", "error");
    refreshCloudStatus();
    return;
  }
  const { Client, Account, Databases, Storage } = window.Appwrite;
  const client = new Client();
  client.setEndpoint(config.endpoint).setProject(config.projectId);
  state.appwrite.client = client;
  state.appwrite.account = new Account(client);
  state.appwrite.databases = new Databases(client);
  state.appwrite.storage = new Storage(client);
  await fetchCurrentUser();
  refreshCloudStatus();
}

async function fetchCurrentUser() {
  if (!state.appwrite.account) {
    state.appwrite.user = null;
    return;
  }
  try {
    const user = await state.appwrite.account.get();
    state.appwrite.user = user;
  } catch (error) {
    state.appwrite.user = null;
  }
}

function refreshCloudStatus() {
  const config = state.appwrite.config;
  const user = state.appwrite.user;
  let statusText = "Cloud sync not configured.";

  if (config && !state.appwrite.client) {
    statusText = "Appwrite SDK unavailable.";
  } else if (config && user) {
    statusText = `Signed in as ${user.email}`;
  } else if (config) {
    statusText = "Configured. Sign in to sync.";
  }

  if (state.syncInProgress) {
    statusText = "Syncing...";
  }

  elements.cloudStatus.textContent = statusText;
  const ready = Boolean(config && state.appwrite.client);
  elements.signUpButton.disabled = !ready;
  elements.signInButton.disabled = !ready;
  elements.signOutButton.disabled = !user;
  elements.syncButton.disabled = !user || state.syncInProgress;
}

async function handleSignUp() {
  if (!ensureAppwriteReady()) {
    return;
  }
  const name = elements.authName.value.trim();
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value.trim();

  if (!email || !password) {
    setCloudMessage("Email and password are required.", "error");
    return;
  }

  try {
    const { ID } = window.Appwrite;
    await state.appwrite.account.create(
      ID.unique(),
      email,
      password,
      name || undefined
    );
    await state.appwrite.account.createEmailPasswordSession(email, password);
    await fetchCurrentUser();
    refreshCloudStatus();
    setCloudMessage("Account created and signed in.", "success");
  } catch (error) {
    setCloudMessage(formatAppwriteError(error), "error");
  }
}

async function handleSignIn() {
  if (!ensureAppwriteReady()) {
    return;
  }
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value.trim();

  if (!email || !password) {
    setCloudMessage("Email and password are required.", "error");
    return;
  }

  try {
    await state.appwrite.account.createEmailPasswordSession(email, password);
    await fetchCurrentUser();
    refreshCloudStatus();
    setCloudMessage("Signed in.", "success");
  } catch (error) {
    setCloudMessage(formatAppwriteError(error), "error");
  }
}

async function handleSignOut() {
  if (!ensureAppwriteReady()) {
    return;
  }
  try {
    await state.appwrite.account.deleteSession("current");
  } catch (error) {
    setCloudMessage(formatAppwriteError(error), "error");
  } finally {
    state.appwrite.user = null;
    refreshCloudStatus();
    setCloudMessage("Signed out.", "success");
  }
}

async function handleSyncNow() {
  await syncNotesWithAppwrite();
}

async function syncNotesWithAppwrite() {
  if (!ensureSignedIn()) {
    return;
  }
  if (state.syncInProgress) {
    return;
  }

  state.syncInProgress = true;
  refreshCloudStatus();
  setCloudMessage("Syncing notes...", "info");

  try {
    const remoteDocs = await listAllDocuments();
    const mergedNotes = mergeNotesWithRemote(state.notes, remoteDocs);
    const remoteById = new Map(remoteDocs.map((doc) => [doc.$id, doc]));
    const syncedNotes = [];

    for (const note of mergedNotes) {
      const syncedNote = await syncLocalNoteToCloud(note, remoteById);
      syncedNotes.push(syncedNote || note);
    }

    state.notes = syncedNotes;
    persistNotes(state.notes);
    renderNotesList();
    renderNoteDetail();
    setCloudMessage("Sync complete.", "success");
  } catch (error) {
    setCloudMessage(`Sync failed. ${formatAppwriteError(error)}`, "error");
  } finally {
    state.syncInProgress = false;
    refreshCloudStatus();
  }
}

async function syncLocalNoteToCloud(note, remoteById = null) {
  if (!state.appwrite.user || !state.appwrite.databases) {
    return null;
  }
  const config = state.appwrite.config;
  if (!config) {
    return null;
  }

  let remoteDoc = null;
  if (note.appwriteId) {
    remoteDoc =
      remoteById?.get(note.appwriteId) ||
      (await fetchRemoteDocument(note.appwriteId));
  }
  const noteWithImages = await ensureImagesUploaded(note);
  const imageIds = (noteWithImages.images || [])
    .map((image) => image.fileId)
    .filter(Boolean);
  const payload = buildDocumentPayload(noteWithImages, imageIds);

  if (remoteDoc) {
    const remoteUpdated = getRemoteUpdatedAt(remoteDoc);
    const localUpdated = new Date(noteWithImages.updatedAt).getTime();
    if (localUpdated <= remoteUpdated) {
      return noteWithImages;
    }
    await state.appwrite.databases.updateDocument(
      config.databaseId,
      config.collectionId,
      noteWithImages.appwriteId,
      payload
    );
    return noteWithImages;
  }

  const permissions = buildUserPermissions();
  const { ID } = window.Appwrite;
  const created = await state.appwrite.databases.createDocument(
    config.databaseId,
    config.collectionId,
    ID.unique(),
    payload,
    permissions
  );
  return {
    ...noteWithImages,
    appwriteId: created.$id,
  };
}

async function ensureImagesUploaded(note) {
  const bucketId = getBucketId();
  if (!bucketId || !state.appwrite.storage) {
    if (note.images?.length) {
      setCloudMessage("Bucket ID missing. Images will stay local.", "error");
    }
    return note;
  }
  const permissions = buildUserPermissions();
  const { ID } = window.Appwrite;
  const images = [];

  for (const image of note.images || []) {
    if (image.fileId) {
      images.push(image);
      continue;
    }
    if (!image.dataUrl) {
      continue;
    }
    const file = await dataUrlToFile(image.dataUrl, image.name || "chart.png");
    const created = await state.appwrite.storage.createFile(
      bucketId,
      ID.unique(),
      file,
      permissions
    );
    images.push({
      ...image,
      fileId: created.$id,
    });
  }

  return {
    ...note,
    images,
  };
}

function mergeNotesWithRemote(localNotes, remoteDocs) {
  const merged = new Map();
  const localByAppwriteId = new Map();

  localNotes.forEach((note) => {
    merged.set(note.id, note);
    if (note.appwriteId) {
      localByAppwriteId.set(note.appwriteId, note);
    }
  });

  remoteDocs.forEach((doc) => {
    const remoteNote = mapDocumentToNote(doc);
    const localMatch =
      localByAppwriteId.get(doc.$id) ||
      (doc.noteId ? merged.get(doc.noteId) : null);

    if (!localMatch) {
      merged.set(remoteNote.id, remoteNote);
      return;
    }

    const localUpdated = new Date(localMatch.updatedAt || 0).getTime();
    const remoteUpdated = new Date(remoteNote.updatedAt || 0).getTime();
    if (remoteUpdated > localUpdated) {
      merged.set(localMatch.id, {
        ...remoteNote,
        id: localMatch.id,
        appwriteId: doc.$id,
      });
    } else {
      const updatedLocal = {
        ...localMatch,
        appwriteId: localMatch.appwriteId || doc.$id,
      };
      merged.set(updatedLocal.id, updatedLocal);
    }
  });

  return Array.from(merged.values());
}

function mapDocumentToNote(doc) {
  const images = buildImagesFromDoc(doc);
  return {
    id: doc.noteId || `note_${doc.$id}`,
    appwriteId: doc.$id,
    headline: doc.headline || "",
    category: doc.category || "Other",
    priority: doc.priority || "Normal",
    reminderDate: doc.reminderDate || "",
    tradeDate: doc.tradeDate || "",
    trade: {
      symbol: doc.tradeSymbol || "",
      direction: doc.tradeDirection || "",
      entry: doc.tradeEntry || "",
      exit: doc.tradeExit || "",
      outcome: doc.tradeOutcome || "",
      pnl: doc.tradePnl || "",
      strategy: doc.tradeStrategy || "",
    },
    notes: doc.notes || "",
    chartNotes: doc.chartNotes || "",
    tags: Array.isArray(doc.tags) ? doc.tags : [],
    images,
    createdAt: doc.createdAt || doc.$createdAt,
    updatedAt: doc.updatedAt || doc.$updatedAt,
  };
}

function buildImagesFromDoc(doc) {
  const imageIds = Array.isArray(doc.imageIds) ? doc.imageIds : [];
  return imageIds.map((fileId) => ({
    name: "Chart image",
    size: 0,
    type: "image",
    fileId,
    dataUrl: buildFilePreviewUrl(fileId),
  }));
}

function buildDocumentPayload(note, imageIds) {
  return {
    noteId: note.id,
    headline: note.headline,
    category: note.category || "Other",
    priority: note.priority || "Normal",
    reminderDate: note.reminderDate || "",
    tradeDate: note.tradeDate || "",
    tradeSymbol: note.trade?.symbol || "",
    tradeDirection: note.trade?.direction || "",
    tradeEntry: note.trade?.entry || "",
    tradeExit: note.trade?.exit || "",
    tradeOutcome: note.trade?.outcome || "",
    tradePnl: note.trade?.pnl || "",
    tradeStrategy: note.trade?.strategy || "",
    notes: note.notes || "",
    chartNotes: note.chartNotes || "",
    tags: Array.isArray(note.tags) ? note.tags : [],
    imageIds,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };
}

async function listAllDocuments() {
  const config = state.appwrite.config;
  if (!config) {
    return [];
  }
  const { Query } = window.Appwrite;
  const documents = [];
  let cursor = null;

  while (true) {
    const queries = [Query.limit(100), Query.orderDesc("$updatedAt")];
    if (cursor) {
      queries.push(Query.cursorAfter(cursor));
    }
    const response = await state.appwrite.databases.listDocuments(
      config.databaseId,
      config.collectionId,
      queries
    );
    documents.push(...response.documents);
    if (response.documents.length < 100) {
      break;
    }
    cursor = response.documents[response.documents.length - 1].$id;
  }

  return documents;
}

async function fetchRemoteDocument(documentId) {
  const config = state.appwrite.config;
  if (!config) {
    return null;
  }
  try {
    return await state.appwrite.databases.getDocument(
      config.databaseId,
      config.collectionId,
      documentId
    );
  } catch (error) {
    return null;
  }
}

async function deleteNoteFromCloud(note) {
  if (!state.appwrite.user || !state.appwrite.databases) {
    return;
  }
  const config = state.appwrite.config;
  if (!config || !note.appwriteId) {
    return;
  }
  try {
    await state.appwrite.databases.deleteDocument(
      config.databaseId,
      config.collectionId,
      note.appwriteId
    );
  } catch (error) {
    setCloudMessage(`Cloud delete failed. ${formatAppwriteError(error)}`, "error");
  }

  const bucketId = getBucketId();
  if (!bucketId || !state.appwrite.storage) {
    return;
  }
  for (const image of note.images || []) {
    if (!image.fileId) {
      continue;
    }
    try {
      await state.appwrite.storage.deleteFile(bucketId, image.fileId);
    } catch (error) {
      setCloudMessage(
        `Image delete failed. ${formatAppwriteError(error)}`,
        "error"
      );
    }
  }
}

function buildUserPermissions() {
  const userId = state.appwrite.user?.$id;
  if (!userId || !window.Appwrite) {
    return [];
  }
  const { Permission, Role } = window.Appwrite;
  return [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ];
}

function getRemoteUpdatedAt(doc) {
  const value = doc.updatedAt || doc.$updatedAt || 0;
  return new Date(value).getTime();
}

function getBucketId() {
  return state.appwrite.config?.bucketId?.trim() || "";
}

function buildFilePreviewUrl(fileId) {
  const bucketId = getBucketId();
  if (!bucketId || !state.appwrite.storage) {
    return "";
  }
  try {
    const url = state.appwrite.storage.getFilePreview(bucketId, fileId, 800, 0);
    return typeof url === "string" ? url : url.toString();
  } catch (error) {
    return "";
  }
}

function buildFileViewUrl(fileId) {
  const bucketId = getBucketId();
  if (!bucketId || !state.appwrite.storage) {
    return "";
  }
  try {
    const url = state.appwrite.storage.getFileView(bucketId, fileId);
    return typeof url === "string" ? url : url.toString();
  } catch (error) {
    return "";
  }
}

function resolveImageSource(image) {
  if (!image) {
    return "";
  }
  if (image.dataUrl) {
    return image.dataUrl;
  }
  if (image.fileId) {
    const previewUrl = buildFilePreviewUrl(image.fileId);
    if (previewUrl) {
      image.dataUrl = previewUrl;
      return previewUrl;
    }
  }
  return "";
}

function getImageLinkUrl(image) {
  if (!image) {
    return "";
  }
  if (image.fileId) {
    return buildFileViewUrl(image.fileId);
  }
  return image.dataUrl || "";
}

async function dataUrlToFile(dataUrl, fileName) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/png" });
}

function ensureAppwriteReady() {
  if (!state.appwrite.config) {
    setCloudMessage("Add Appwrite config first.", "error");
    return false;
  }
  if (!state.appwrite.client || !state.appwrite.account) {
    setCloudMessage("Appwrite is not ready. Check the config.", "error");
    return false;
  }
  return true;
}

function ensureSignedIn() {
  if (!ensureAppwriteReady()) {
    return false;
  }
  if (!state.appwrite.user) {
    setCloudMessage("Sign in to sync notes.", "error");
    return false;
  }
  return true;
}

function formatAppwriteError(error) {
  if (!error) {
    return "Unknown error.";
  }
  if (typeof error === "string") {
    return error;
  }
  if (error.message) {
    return error.message;
  }
  if (error.response && error.response.message) {
    return error.response.message;
  }
  return "Unknown error.";
}

function setCloudMessage(text, status) {
  elements.cloudMessage.textContent = text;
  elements.cloudMessage.className = "form-message";
  if (status === "error") {
    elements.cloudMessage.classList.add("error");
  }
}

function setMessage(text, status) {
  elements.message.textContent = text;
  elements.message.className = "form-message";
  if (status === "error") {
    elements.message.classList.add("error");
  }
}

init().catch((error) => {
  console.error("Failed to initialize app", error);
});
