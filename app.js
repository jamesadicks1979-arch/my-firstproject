const STORAGE_KEY = "trade-notes-vault:v1";
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const state = {
  notes: [],
  selectedId: null,
  editingId: null,
  imageQueue: [],
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
};

function init() {
  state.notes = loadNotes();
  bindEvents();
  renderNotesList();
  renderNoteDetail();
}

function bindEvents() {
  elements.form.addEventListener("submit", handleFormSubmit);
  elements.clearButton.addEventListener("click", handleClear);
  elements.imageInput.addEventListener("change", handleImageUpload);
  elements.searchInput.addEventListener("input", renderNotesList);
  elements.filterCategory.addEventListener("change", renderNotesList);
  elements.sortSelect.addEventListener("change", renderNotesList);
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
    return parsed;
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

function handleFormSubmit(event) {
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

    const img = document.createElement("img");
    img.src = image.dataUrl;
    img.alt = image.name || "Chart image";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "x";
    button.addEventListener("click", () => {
      state.imageQueue = state.imageQueue.filter((_, idx) => idx !== index);
      renderImagePreview();
    });

    wrapper.append(img, button);
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
      const thumbnail = document.createElement("img");
      thumbnail.className = "note-thumbnail";
      thumbnail.src = note.images[0].dataUrl;
      thumbnail.alt = `Chart image for ${note.headline}`;
      card.appendChild(thumbnail);
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
      const link = document.createElement("a");
      link.href = image.dataUrl;
      link.target = "_blank";
      link.rel = "noopener";
      const img = document.createElement("img");
      img.src = image.dataUrl;
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

function handleDelete(noteId) {
  const confirmed = window.confirm("Delete this note? This cannot be undone.");
  if (!confirmed) {
    return;
  }
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

function setMessage(text, status) {
  elements.message.textContent = text;
  elements.message.className = "form-message";
  if (status === "error") {
    elements.message.classList.add("error");
  }
}

init();
