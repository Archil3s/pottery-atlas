"use strict";

const $ = (selector, root = document) => root.querySelector(selector);
const formatMoney = new Intl.NumberFormat("en-NZ", { style: "currency", currency: "NZD" });
const formatNumber = new Intl.NumberFormat("en-NZ", { maximumFractionDigits: 1 });
const STORE_NAME = "pieces";
const DATABASE_NAME = "pottery-atlas-local-v1";
const state = { pieces: [], editingId: null, viewingId: null, image: null, imageRemoved: false, search: "", sort: "newest" };
let database;

function announce(message, isError = false) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.dataset.type = isError ? "error" : "success";
  toast.hidden = false;
  clearTimeout(announce.timeout);
  announce.timeout = setTimeout(() => { toast.hidden = true; }, 4200);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("IndexedDB is unavailable"));
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open local catalogue"));
  });
}

function databaseAction(mode, action) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    let result;
    const request = action(store);
    request.onsuccess = () => { result = request.result; };
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error || new Error("Storage failed"));
    transaction.onabort = () => reject(transaction.error || new Error("Storage cancelled"));
  });
}

const readPieces = () => databaseAction("readonly", store => store.getAll());
const savePiece = piece => databaseAction("readwrite", store => store.put(piece));
const removePiece = id => databaseAction("readwrite", store => store.delete(id));

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content !== undefined) node.textContent = content;
  return node;
}

function potIllustration(className = "") {
  const illustration = element("div", "pot-illustration " + className);
  illustration.setAttribute("aria-hidden", "true");
  illustration.innerHTML = '<svg viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg"><ellipse cx="119" cy="206" rx="69" ry="8" fill="currentColor" opacity=".10"/><path d="M72 55C73 67 80 77 84 82C62 101 58 124 65 150C73 180 90 193 119 193C148 193 168 175 174 148C180 123 175 101 154 83C161 72 166 62 166 55" fill="currentColor" opacity=".16"/><path d="M72 55C73 67 80 77 84 82C62 101 58 124 65 150C73 180 90 193 119 193C148 193 168 175 174 148C180 123 175 101 154 83C161 72 166 62 166 55M72 55C72 49 94 45 119 45C145 45 166 49 166 55C166 61 145 65 119 65C94 65 72 61 72 55Z" stroke="currentColor" stroke-width="2.8"/><path d="M84 82C106 95 134 95 154 83M66 132C99 149 145 150 172 132" stroke="currentColor" stroke-width="1.7" opacity=".42"/></svg>';
  return illustration;
}

// Older v1 records may contain clay blends. Keep them separately instead
// of silently mislabelling them as glaze recipes.
function glazesFor(piece) {
  return Array.isArray(piece.glazes) ? piece.glazes : [];
}

function legacyClaysFor(piece) {
  return Array.isArray(piece.legacyClays) ? piece.legacyClays : (Array.isArray(piece.clays) ? piece.clays : []);
}

function visiblePieces() {
  const query = state.search.trim().toLocaleLowerCase();
  const items = state.pieces.filter(piece => {
    const haystack = [piece.title, piece.purpose, piece.notes, ...glazesFor(piece).map(g => g.name + " " + g.application), ...legacyClaysFor(piece).map(c => c.name)].join(" ").toLocaleLowerCase();
    return !query || haystack.includes(query);
  });
  items.sort((a, b) => {
    if (state.sort === "price-low") return a.price - b.price || b.createdAt.localeCompare(a.createdAt);
    if (state.sort === "price-high") return b.price - a.price || b.createdAt.localeCompare(a.createdAt);
    if (state.sort === "oldest") return a.createdAt.localeCompare(b.createdAt);
    return b.createdAt.localeCompare(a.createdAt);
  });
  return items;
}

function renderFeatured() {
  // A user's own photographs become the editorial hero. Never fetch or
  // display another ceramicist's work as though it belonged to this studio.
  const piece = state.pieces
    .filter(item => typeof item.photo === "string" && item.photo.startsWith("data:image/"))
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))[0];
  const photoFrame = $("#heroImageShell");
  const illustration = $("#heroArtwork");
  const image = $("#heroImage");
  photoFrame.hidden = !piece;
  illustration.hidden = Boolean(piece);
  if (piece) {
    image.src = piece.photo;
    image.alt = "Studio photograph: " + piece.title;
    $("#heroArtCaption").textContent = piece.title;
  } else {
    image.removeAttribute("src");
    image.alt = "";
    $("#heroArtCaption").textContent = "A study in clay";
  }
}

function render() {
  renderFeatured();
  const total = state.pieces.length;
  $("#statPieces").textContent = formatNumber.format(total);
  $("#statWeight").textContent = total ? formatNumber.format(state.pieces.reduce((sum, piece) => sum + piece.weightGrams, 0) / 1000) + " kg" : "—";
  $("#statValue").textContent = total ? formatMoney.format(state.pieces.reduce((sum, piece) => sum + piece.price, 0)) : "—";
  $("#collectionCount").textContent = total + (total === 1 ? " piece recorded" : " pieces recorded");

  const items = visiblePieces();
  const grid = $("#pieceGrid");
  grid.replaceChildren();
  $("#emptyState").hidden = items.length > 0;
  if (!items.length) {
    $("#emptyTitle").textContent = total ? "No pieces match your search." : "Your collection begins here.";
    $("#emptyDescription").textContent = total ? "Try another search to find a piece in your collection." : "Add your first piece to keep its glazes, purpose, clay weight and price together.";
    $("#emptyAdd").hidden = total > 0;
  }

  items.forEach(piece => {
    const card = element("button", "piece-card");
    card.type = "button";
    card.setAttribute("aria-label", "View " + piece.title);
    const media = element("div", "piece-card-media");
    if (piece.photo) {
      const image = element("img", "piece-card-image");
      image.src = piece.photo;
      image.alt = "Photograph of " + piece.title;
      image.loading = "lazy";
      image.decoding = "async";
      media.append(image);
    } else {
      media.append(potIllustration("card-pot"));
    }
    const body = element("div", "piece-card-body");
    const eyebrow = element("p", "piece-card-purpose", piece.purpose);
    const title = element("h3", "piece-card-title", piece.title);
    const base = element("div", "piece-card-bottom");
    base.append(element("span", "piece-card-weight", formatNumber.format(piece.weightGrams) + " g of clay"));
    base.append(element("span", "piece-card-price", formatMoney.format(piece.price)));
    body.append(eyebrow, title, base);
    const glazes = glazesFor(piece);
    if (glazes.length) {
      const glazeInfo = element("span", "piece-card-glazes", glazes.map(glaze => glaze.name).join(" / "));
      body.append(glazeInfo);
    }
    card.append(media, body);
    card.addEventListener("click", () => openDetail(piece.id));
    grid.append(card);
  });
}

async function refresh() {
  state.pieces = await readPieces();
  render();
}

function makeGlazeRow(name = "", application = "") {
  const row = element("div", "glaze-row");
  const nameField = element("input", "glaze-name");
  nameField.type = "text";
  nameField.placeholder = "e.g. Celadon";
  nameField.maxLength = 100;
  nameField.value = name;
  nameField.setAttribute("aria-label", "Glaze name");
  const applicationField = element("input", "glaze-application");
  applicationField.type = "text";
  applicationField.placeholder = "e.g. over base";
  applicationField.maxLength = 120;
  applicationField.value = application;
  applicationField.setAttribute("aria-label", "Where or how this glaze is applied");
  const remove = element("button", "remove-glaze", "Remove");
  remove.type = "button";
  remove.setAttribute("aria-label", "Remove glaze from combination");
  remove.addEventListener("click", () => {
    if ($("#glazeRows").children.length === 1) {
      nameField.value = "";
      applicationField.value = "";
      nameField.focus();
    } else {
      row.remove();
    }
  });
  row.append(nameField, applicationField, remove);
  $("#glazeRows").append(row);
  return row;
}

function readGlazes() {
  return [...$("#glazeRows").children].map(row => ({
    name: $(".glaze-name", row).value.trim(),
    application: $(".glaze-application", row).value.trim()
  }));
}

function validGlazes(glazes) {
  // Unglazed or not-yet-glazed pieces are allowed. A filled application
  // note must always have a glaze name.
  return glazes.every(glaze => glaze.name || !glaze.application);
}

function setPhotoPreview(photo) {
  const preview = $("#photoPreview");
  preview.replaceChildren();
  if (photo) {
    const image = element("img", "photo-preview-image");
    image.src = photo;
    image.alt = "Selected pottery photograph";
    preview.append(image);
    $("#photoRemove").hidden = false;
  } else {
    preview.append(potIllustration("preview-pot"));
    const label = element("span", "photo-placeholder-text", "No photograph selected");
    preview.append(label);
    $("#photoRemove").hidden = true;
  }
}

function openEditor(id = null) {
  const piece = state.pieces.find(item => item.id === id);
  state.editingId = piece ? piece.id : null;
  state.image = piece ? piece.photo : null;
  state.imageRemoved = false;
  $("#editorForm").reset();
  $("#glazeRows").replaceChildren();
  $("#editorHeading").textContent = piece ? "Edit this piece" : "Add a piece";
  $("#savePiece").textContent = piece ? "Save changes" : "Add to collection";
  $("#pieceTitle").value = piece ? piece.title : "";
  $("#piecePurpose").value = piece ? piece.purpose : "";
  $("#pieceWeight").value = piece ? piece.weightGrams : "";
  $("#piecePrice").value = piece ? piece.price : "";
  $("#pieceNotes").value = piece ? piece.notes : "";
  const glazes = glazesFor(piece || {});
  (glazes.length ? glazes : [{ name: "", application: "" }]).forEach(glaze => makeGlazeRow(glaze.name, glaze.application));
  setPhotoPreview(state.image);
  $("#formError").textContent = "";
  $("#editorDialog").showModal();
  $("#pieceTitle").focus();
}

function closeEditor() {
  $("#editorDialog").close();
  state.editingId = null;
  state.image = null;
}

async function processPhoto(file) {
  if (file.size > 15 * 1024 * 1024) throw new Error("Choose a photograph smaller than 15 MB.");
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)) throw new Error("Use a JPG, PNG, WebP or supported HEIC photograph.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("This image could not be opened. Try JPG or PNG."));
      image.src = url;
    });
    const scale = Math.min(1, 1500 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Photo processing is unavailable.");
    context.fillStyle = "#f7f3eb";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.83);
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function handlePhoto(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    $("#photoPreview").setAttribute("aria-busy", "true");
    state.image = await processPhoto(file);
    state.imageRemoved = false;
    setPhotoPreview(state.image);
    announce("Photo added to this piece.");
  } catch (error) {
    announce(error.message, true);
    event.target.value = "";
  } finally {
    $("#photoPreview").removeAttribute("aria-busy");
  }
}

async function handleSave(event) {
  event.preventDefault();
  const glazeRows = readGlazes();
  if (!validGlazes(glazeRows)) {
    $("#formError").textContent = "Give each glaze an actual name before adding application details.";
    return;
  }
  const glazes = glazeRows.filter(glaze => glaze.name);
  const title = $("#pieceTitle").value.trim();
  const purpose = $("#piecePurpose").value.trim();
  const weightGrams = Number($("#pieceWeight").value);
  const price = Number($("#piecePrice").value);
  if (!title || !purpose || !(weightGrams > 0) || !(price >= 0) || !Number.isFinite(price)) {
    $("#formError").textContent = "Complete the title, purpose, clay weight and price.";
    return;
  }
  const previous = state.pieces.find(piece => piece.id === state.editingId);
  const piece = {
    id: previous?.id || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random()),
    title, purpose, weightGrams, price, glazes,
    legacyClays: previous ? legacyClaysFor(previous) : [],
    photo: state.imageRemoved ? null : state.image,
    notes: $("#pieceNotes").value.trim(),
    createdAt: previous?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const button = $("#savePiece");
  button.disabled = true;
  $("#formError").textContent = "";
  try {
    await savePiece(piece);
    closeEditor();
    await refresh();
    announce(previous ? "Changes saved on this device." : "Piece added on this device.");
  } catch (error) {
    $("#formError").textContent = "This piece could not be saved. Check your browser storage and export a backup of your existing pieces.";
  } finally {
    button.disabled = false;
  }
}

function detailLine(label, value) {
  const row = element("div", "detail-line");
  row.append(element("dt", "", label), element("dd", "", value));
  return row;
}

function openDetail(id) {
  const piece = state.pieces.find(item => item.id === id);
  if (!piece) return;
  state.viewingId = id;
  const root = $("#detailBody");
  root.replaceChildren();
  const media = element("div", "detail-media");
  if (piece.photo) {
    const img = element("img", "");
    img.src = piece.photo;
    img.alt = "Photograph of " + piece.title;
    media.append(img);
  } else {
    media.append(potIllustration("detail-pot"));
  }
  const content = element("div", "detail-copy");
  content.append(element("p", "eyebrow", "Collection record"));
  content.append(element("h2", "detail-title", piece.title));
  content.append(element("p", "detail-purpose", piece.purpose));
  const details = element("dl", "detail-list");
  details.append(detailLine("Clay weight", formatNumber.format(piece.weightGrams) + " g"));
  details.append(detailLine("Asking price", formatMoney.format(piece.price)));
  const glazes = glazesFor(piece);
  const glazeDescription = glazes.length ? glazes.map((glaze, i) => (i + 1) + ". " + glaze.name + (glaze.application ? " (" + glaze.application + ")" : "")).join(" / ") : "No glaze recorded";
  details.append(detailLine("Glazes (in order)", glazeDescription));
  const oldClays = legacyClaysFor(piece);
  if (oldClays.length) {
    details.append(detailLine("Earlier clay entry", oldClays.map(clay => clay.name + (Number.isFinite(Number(clay.percentage)) ? " · " + formatNumber.format(Number(clay.percentage)) + "%" : "")).join(" / ")));
  }
  content.append(details);
  if (piece.notes) {
    content.append(element("h3", "detail-notes-title", "Studio notes"));
    content.append(element("p", "detail-notes", piece.notes));
  }
  root.append(media, content);
  $("#detailDialog").showModal();
}

function normalizeImport(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.pieces) || ![1, 2].includes(raw.version)) {
    throw new Error("This is not a supported Pottery Atlas backup (version 1 or 2).");
  }
  if (raw.pieces.length > 10000) throw new Error("Backup contains too many records.");
  return raw.pieces.map(piece => {
    if (!piece || typeof piece.title !== "string" || typeof piece.purpose !== "string") {
      throw new Error("A piece in the backup is missing required fields.");
    }
    const weightGrams = Number(piece.weightGrams);
    const price = Number(piece.price);
    if (!(weightGrams > 0) || !(price >= 0) || !Number.isFinite(price)) {
      throw new Error("A piece in the backup has invalid weight or price.");
    }
    if (raw.version === 1 && !Array.isArray(piece.clays)) {
      throw new Error("A version 1 piece is missing its previous clay entry.");
    }
    if (raw.version === 2 && !Array.isArray(piece.glazes)) {
      throw new Error("A version 2 piece is missing its glaze list.");
    }
    const glazes = raw.version === 2 ? piece.glazes.map(glaze => ({
      name: String(glaze?.name || "").trim().slice(0, 100),
      application: String(glaze?.application || "").trim().slice(0, 120)
    })) : [];
    if (glazes.length > 30 || glazes.some(glaze => !glaze.name)) {
      throw new Error("A piece in the backup contains an invalid glaze combination.");
    }
    // Preserve all v1 clay data separately; clay names cannot be inferred to be glazes.
    const legacySource = raw.version === 1 ? piece.clays : (Array.isArray(piece.legacyClays) ? piece.legacyClays : []);
    const legacyClays = legacySource.map(clay => ({
      name: String(clay?.name || "").trim().slice(0, 100),
      percentage: Number(clay?.percentage)
    }));
    if (legacyClays.length > 30 || legacyClays.some(clay => !clay.name || !(clay.percentage > 0))) {
      throw new Error("An older clay entry in the backup is invalid.");
    }
    return {
      id: typeof piece.id === "string" && piece.id.length < 150 ? piece.id : crypto.randomUUID(),
      title: piece.title.slice(0, 160),
      purpose: piece.purpose.slice(0, 160),
      weightGrams, price, glazes, legacyClays,
      notes: String(piece.notes || "").slice(0, 5000),
      photo: typeof piece.photo === "string" && /^data:image\/(jpeg|png|webp);base64,/i.test(piece.photo) ? piece.photo : null,
      createdAt: !Number.isNaN(Date.parse(piece.createdAt)) ? piece.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function exportCollection() {
  if (!state.pieces.length) {
    announce("Add a piece before exporting a backup.", true);
    return;
  }
  const backup = {
    app: "pottery-atlas",
    version: 2,
    exportedAt: new Date().toISOString(),
    pieces: state.pieces.map(piece => {
      const { clays: obsoleteClays, ...rest } = piece;
      return { ...rest, glazes: glazesFor(piece), legacyClays: legacyClaysFor(piece) };
    })
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "pottery-atlas-backup-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce("Backup downloaded, including your photographs.");
}

async function importCollection(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    if (file.size > 100 * 1024 * 1024) throw new Error("Backup exceeds the 100 MB import limit.");
    const pieces = normalizeImport(JSON.parse(await file.text()));
    if (!pieces.length) throw new Error("This backup has no pieces.");
    if (!window.confirm("Import " + pieces.length + " pieces into this browser? Records with matching IDs will be replaced.")) return;
    for (const piece of pieces) await savePiece(piece);
    await refresh();
    announce("Imported " + pieces.length + " pieces into this browser.");
  } catch (error) {
    announce(error.message || "Import failed.", true);
  } finally {
    event.target.value = "";
  }
}

async function deleteViewingPiece() {
  const piece = state.pieces.find(item => item.id === state.viewingId);
  if (!piece) return;
  if (!window.confirm('Delete "' + piece.title + '" from this browser? This cannot be undone unless you have a backup.')) return;
  try {
    await removePiece(piece.id);
    $("#detailDialog").close();
    state.viewingId = null;
    await refresh();
    announce("Piece removed from this browser.");
  } catch (error) {
    announce("Could not delete this piece.", true);
  }
}

async function init() {
  $("#newPiece").addEventListener("click", () => openEditor());
  $("#emptyAdd").addEventListener("click", () => openEditor());
  $("#editorClose").addEventListener("click", closeEditor);
  $("#editorCancel").addEventListener("click", closeEditor);
  $("#editorForm").addEventListener("submit", handleSave);
  $("#addGlaze").addEventListener("click", () => {
    const row = makeGlazeRow("", "");
    $(".glaze-name", row).focus();
  });
  $("#photoInput").addEventListener("change", handlePhoto);
  $("#photoRemove").addEventListener("click", () => {
    state.image = null;
    state.imageRemoved = true;
    $("#photoInput").value = "";
    setPhotoPreview(null);
  });
  $("#searchInput").addEventListener("input", event => { state.search = event.target.value; render(); });
  $("#sortSelect").addEventListener("change", event => { state.sort = event.target.value; render(); });
  $("#detailClose").addEventListener("click", () => $("#detailDialog").close());
  $("#detailEdit").addEventListener("click", () => {
    const id = state.viewingId;
    $("#detailDialog").close();
    openEditor(id);
  });
  $("#detailDelete").addEventListener("click", deleteViewingPiece);
  $("#exportButton").addEventListener("click", exportCollection);
  $("#importButton").addEventListener("click", () => $("#importFile").click());
  $("#importFile").addEventListener("change", importCollection);
  for (const dialog of [$("#editorDialog"), $("#detailDialog")]) {
    dialog.addEventListener("click", event => {
      if (event.target === dialog) dialog.close();
    });
  }
  try {
    database = await openDatabase();
    await refresh();
    $("#loadingCollection").hidden = true;
    $("#collectionPanel").hidden = false;
  } catch (error) {
    $("#loadingCollection").hidden = true;
    $("#storageFailure").hidden = false;
    $("#newPiece").disabled = true;
    $("#emptyAdd").disabled = true;
    announce("Local browser storage could not be opened.", true);
  }
}

document.addEventListener("DOMContentLoaded", init);
