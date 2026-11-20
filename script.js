
/* =========================================
   NOCTURNE NOTES 2.0
   APPLICATION FUNCTIONALITY
========================================= */

// 1. GET HTML ELEMENTS

const newNoteBtn = document.getElementById("newNoteBtn");
const panelNewNoteBtn = document.getElementById("panelNewNoteBtn");
const emptyNewNoteBtn = document.getElementById("emptyNewNoteBtn");
const startWritingBtn = document.getElementById("startWritingBtn");

const notesList = document.getElementById("notesList");
const emptyNotes = document.getElementById("emptyNotes");
const editorEmpty = document.getElementById("editorEmpty");
const editorContent = document.getElementById("editorContent");

const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");

const saveNoteBtn = document.getElementById("saveNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");
const pinNoteBtn = document.getElementById("pinNoteBtn");

const saveStatus = document.getElementById("saveStatus");
const wordCount = document.getElementById("wordCount");
const characterCount = document.getElementById("characterCount");
const notesCount = document.getElementById("notesCount");
const lastEdited = document.getElementById("lastEdited");

const searchInput = document.getElementById("searchInput");

const folderList = document.getElementById("folderList");
const categoryList = document.getElementById("categoryList");

const addFolderBtn = document.getElementById("addFolderBtn");
const addCategoryBtn = document.getElementById("addCategoryBtn");

const noteFolder = document.getElementById("noteFolder");
const noteCategory = document.getElementById("noteCategory");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

const themeOptions = document.querySelectorAll(".theme-option");

const viewTitle = document.getElementById("viewTitle");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");


// 2. APPLICATION DATA

const STORAGE_KEY = "nocturneNotes_v2";

let notes = [];
let folders = [];
let categories = [];

let activeNoteId = null;
let currentDraft = null;

let currentView = "all";
let currentFilterId = null;
let searchQuery = "";

let saveTimer = null;


// 3. LOAD SAVED DATA

function loadData() {
    try {
        const savedData = JSON.parse(
            localStorage.getItem(STORAGE_KEY)
        ) || {};

        notes = Array.isArray(savedData.notes)
            ? savedData.notes
            : [];

        folders = Array.isArray(savedData.folders)
            ? savedData.folders
            : [];

        categories = Array.isArray(savedData.categories)
            ? savedData.categories
            : [];

        notes = notes.filter(note =>
            note &&
            typeof note.id === "string" &&
            typeof note.title === "string" &&
            typeof note.content === "string"
        );

    } catch (error) {
        console.error("Could not load notes:", error);

        notes = [];
        folders = [];
        categories = [];
    }
}


// 4. SAVE DATA

function saveData() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                notes,
                folders,
                categories
            })
        );

        saveStatus.textContent = "✓ Saved";
        return true;

    } catch (error) {
        console.error("Could not save notes:", error);

        saveStatus.textContent = "Save failed";
        alert("Your notes could not be saved. Check your browser storage.");

        return false;
    }
}


// 5. HELPER FUNCTIONS

function generateId() {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString() + Math.random().toString(36).slice(2);
}

function getActiveNote() {
    return notes.find(note => note.id === activeNoteId) || null;
}

function getNoteTitle(title, content) {
    const cleanTitle = title.trim();

    if (cleanTitle) return cleanTitle;

    const firstLine = content
        .split("\n")
        .find(line => line.trim());

    return firstLine
        ? firstLine.trim().slice(0, 45)
        : "New note";
}

function formatDate(date) {
    if (!date) return "";

    return new Date(date).toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

function showStatus(message) {
    saveStatus.textContent = message;
}


// 6. CREATE A NEW NOTE

function createNote() {

    if (currentDraft && !currentDraft.content.trim()
        && !currentDraft.title.trim()) {
        currentDraft = null;
    }

    currentView = "all";
    currentFilterId = null;
    searchQuery = "";
    searchInput.value = "";

    activeNoteId = null;

    currentDraft = {
        id: generateId(),
        title: "",
        content: "",
        folderId: null,
        categoryId: null,
        pinned: false,
        updatedAt: new Date().toISOString()
    };

    viewTitle.textContent = "All Notes";

    renderAll();

    editorEmpty.hidden = true;
    editorContent.hidden = false;

    noteTitle.value = "";
    noteContent.value = "";

    populateDropdowns();

    noteFolder.value = "";
    noteCategory.value = "";

    updateWordCount();

    pinNoteBtn.textContent = "☆";

    lastEdited.textContent = "New note";

    showStatus("Unsaved note");

    noteTitle.focus();
}


// 7. DISPLAY A NOTE

function displayNote(id) {

    const note = notes.find(item => item.id === id);

    if (!note) return;

    activeNoteId = id;
    currentDraft = null;

    editorEmpty.hidden = true;
    editorContent.hidden = false;

    noteTitle.value = note.title;
    noteContent.value = note.content;

    populateDropdowns();

    noteFolder.value = note.folderId || "";
    noteCategory.value = note.categoryId || "";

    pinNoteBtn.textContent = note.pinned ? "★" : "☆";

    lastEdited.textContent = formatDate(note.updatedAt);

    updateWordCount();
    renderNotes();

    showStatus("✓ Saved");
}


// 8. SAVE CURRENT NOTE

function saveCurrentNote(isManual = false) {

    const note = getActiveNote() || currentDraft;

    if (!note) return;

    const title = noteTitle.value.trim();
    const content = noteContent.value;

    if (!title && !content.trim()) {

        if (isManual) {
            alert("Write something before saving your note.");
        }

        return;
    }

    const isNewNote = !notes.some(item => item.id === note.id);

    note.title = getNoteTitle(title, content);
    note.content = content;

    note.folderId = noteFolder.value || null;
    note.categoryId = noteCategory.value || null;

    note.updatedAt = new Date().toISOString();

    if (isNewNote) {
        notes.unshift(note);
    }

    activeNoteId = note.id;
    currentDraft = null;

    if (!saveData()) return;

    lastEdited.textContent = formatDate(note.updatedAt);

    pinNoteBtn.textContent = note.pinned ? "★" : "☆";

    renderAll();

    editorEmpty.hidden = true;
    editorContent.hidden = false;

    if (isManual) {
        showStatus("✓ Saved successfully");
    }
}


// 9. AUTOMATIC SAVING

function scheduleAutoSave() {

    if (!activeNoteId && !currentDraft) return;

    showStatus("Unsaved changes...");

    clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        saveCurrentNote(false);
    }, 700);
}

noteTitle.addEventListener("input", scheduleAutoSave);

noteContent.addEventListener("input", () => {
    updateWordCount();
    scheduleAutoSave();
});


// 10. WORD AND CHARACTER COUNTER

function updateWordCount() {

    const text = noteContent.value.trim();

    const words = text
        ? text.split(/\s+/).length
        : 0;

    const characters = noteContent.value.length;

    wordCount.textContent =
        words + (words === 1 ? " word" : " words");

    characterCount.textContent =
        characters + (characters === 1
            ? " character"
            : " characters");
}


// 11. CREATE FOLDERS

function createFolder() {

    const name = prompt("Enter your new folder name:");

    if (!name || !name.trim()) return;

    folders.push({
        id: generateId(),
        name: name.trim()
    });

    saveData();
    renderAll();
    populateDropdowns();
}

addFolderBtn.addEventListener("click", createFolder);


// 12. CREATE CATEGORIES

function createCategory() {

    const name = prompt("Enter your new category name:");

    if (!name || !name.trim()) return;

    categories.push({
        id: generateId(),
        name: name.trim()
    });

    saveData();
    renderAll();
    populateDropdowns();
}

addCategoryBtn.addEventListener("click", createCategory);


// 13. RENAME OR DELETE FOLDERS AND CATEGORIES

function manageCollection(type, id) {

    const collection = type === "folder"
        ? folders
        : categories;

    const item = collection.find(entry => entry.id === id);

    if (!item) return;

    const action = prompt(
        "Type R to rename or D to delete " + item.name
    );

    if (!action) return;

    if (action.toLowerCase() === "r") {

        const newName = prompt("Enter the new name:", item.name);

        if (!newName || !newName.trim()) return;

        item.name = newName.trim();

    } else if (action.toLowerCase() === "d") {

        if (!confirm("Delete " + item.name + "? Notes will be kept.")) {
            return;
        }

        if (type === "folder") {
            notes.forEach(note => {
                if (note.folderId === id) note.folderId = null;
            });
        } else {
            notes.forEach(note => {
                if (note.categoryId === id) note.categoryId = null;
            });
        }

        const index = collection.findIndex(entry => entry.id === id);

        collection.splice(index, 1);

    } else {
        return;
    }

    saveData();
    renderAll();
    populateDropdowns();

    const activeNote = getActiveNote();

    if (activeNote) {
        noteFolder.value = activeNote.folderId || "";
        noteCategory.value = activeNote.categoryId || "";
    }
}


// 14. RENDER FOLDERS

function renderFolders() {

    folderList.innerHTML = "";

    folders.forEach(folder => {

        const button = document.createElement("button");

        button.className = "folder-item";

        if (currentView === "folder" &&
            currentFilterId === folder.id) {
            button.classList.add("active");
        }

        button.textContent = "▰ " + folder.name;

        button.addEventListener("click", () => {

            currentView = "folder";
            currentFilterId = folder.id;
            searchQuery = "";
            searchInput.value = "";

            viewTitle.textContent = folder.name;

            renderAll();
        });

        button.addEventListener("contextmenu", event => {
            event.preventDefault();
            manageCollection("folder", folder.id);
        });

        folderList.appendChild(button);
    });
}


// 15. RENDER CATEGORIES

function renderCategories() {

    categoryList.innerHTML = "";

    categories.forEach(category => {

        const button = document.createElement("button");

        button.className = "category-item";

        if (currentView === "category" &&
            currentFilterId === category.id) {
            button.classList.add("active");
        }

        button.textContent = "● " + category.name;

        button.addEventListener("click", () => {

            currentView = "category";
            currentFilterId = category.id;
            searchQuery = "";
            searchInput.value = "";

            viewTitle.textContent = category.name;

            renderAll();
        });

        button.addEventListener("contextmenu", event => {
            event.preventDefault();
            manageCollection("category", category.id);
        });

        categoryList.appendChild(button);
    });
}


// 16. POPULATE FOLDER AND CATEGORY SELECTORS

function populateDropdowns() {

    const selectedFolder = noteFolder.value;
    const selectedCategory = noteCategory.value;

    noteFolder.innerHTML = '<option value="">No folder</option>';

    folders.forEach(folder => {

        const option = document.createElement("option");

        option.value = folder.id;
        option.textContent = folder.name;

        noteFolder.appendChild(option);
    });

    noteCategory.innerHTML =
        '<option value="">No category</option>';

    categories.forEach(category => {

        const option = document.createElement("option");

        option.value = category.id;
        option.textContent = category.name;

        noteCategory.appendChild(option);
    });

    noteFolder.value = selectedFolder;
    noteCategory.value = selectedCategory;
}


// 17. CHANGE NOTE FOLDER OR CATEGORY

noteFolder.addEventListener("change", scheduleAutoSave);

noteCategory.addEventListener("change", scheduleAutoSave);


// 18. FILTER NOTES

function getFilteredNotes() {

    let filtered = [...notes];

    if (currentView === "pinned") {
        filtered = filtered.filter(note => note.pinned);
    }

    if (currentView === "recent") {
        filtered.sort(
            (a, b) =>
                new Date(b.updatedAt) - new Date(a.updatedAt)
        );
    }

    if (currentView === "folder") {
        filtered = filtered.filter(
            note => note.folderId === currentFilterId
        );
    }

    if (currentView === "category") {
        filtered = filtered.filter(
            note => note.categoryId === currentFilterId
        );
    }

    if (searchQuery) {

        const query = searchQuery.toLowerCase();

        filtered = filtered.filter(note =>
            note.title.toLowerCase().includes(query) ||
            note.content.toLowerCase().includes(query)
        );
    }

    return filtered;
}


// 19. RENDER NOTES LIST

function renderNotes() {

    notesList.innerHTML = "";

    const filteredNotes = getFilteredNotes();

    notesCount.textContent =
        filteredNotes.length +
        (filteredNotes.length === 1 ? " note" : " notes");

    emptyNotes.hidden = filteredNotes.length !== 0;

    filteredNotes.forEach(note => {

        const card = document.createElement("div");

        card.className = "note-card";

        if (note.id === activeNoteId) {
            card.classList.add("active");
        }

        const title = document.createElement("h4");

        title.textContent = note.title;

        if (note.pinned) {

            const pin = document.createElement("span");

            pin.className = "pin-indicator";
            pin.textContent = "★";

            title.appendChild(pin);
        }

        const preview = document.createElement("p");

        preview.textContent = note.content
            .replace(/\s+/g, " ")
            .slice(0, 75) || "No preview available";

        const date = document.createElement("small");

        date.textContent = formatDate(note.updatedAt);

        card.append(title, preview, date);

        card.addEventListener("click", () => {
            clearTimeout(saveTimer);

            if (currentDraft &&
                (currentDraft.title.trim() ||
                 currentDraft.content.trim())) {
                saveCurrentNote(false);
            }

            displayNote(note.id);
        });

        notesList.appendChild(card);
    });
}


// 20. RENDER EVERYTHING

function renderAll() {

    renderFolders();
    renderCategories();
    renderNotes();
}


// 21. NAVIGATION

document.querySelectorAll(".nav-item").forEach(button => {

    button.addEventListener("click", () => {

        clearTimeout(saveTimer);

        if (currentDraft &&
            (currentDraft.title.trim() ||
             currentDraft.content.trim())) {
            saveCurrentNote(false);
        }

        currentView = button.dataset.view;
        currentFilterId = null;

        const headings = {
            all: "All Notes",
            pinned: "Pinned Notes",
            recent: "Recently Edited"
        };

        viewTitle.textContent = headings[currentView];

        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        renderAll();
    });
});


// 22. SEARCH NOTES

searchInput.addEventListener("input", () => {

    searchQuery = searchInput.value.trim();

    renderNotes();
});


// 23. PIN AND UNPIN NOTES

pinNoteBtn.addEventListener("click", () => {

    const note = getActiveNote();

    if (!note) {

        if (currentDraft) {
            currentDraft.pinned = !currentDraft.pinned;

            pinNoteBtn.textContent =
                currentDraft.pinned ? "★" : "☆";
        }

        return;
    }

    note.pinned = !note.pinned;

    pinNoteBtn.textContent = note.pinned ? "★" : "☆";

    saveData();
    renderNotes();
});


// 24. DELETE NOTES

deleteNoteBtn.addEventListener("click", () => {

    const note = getActiveNote();

    if (!note && !currentDraft) return;

    if (!confirm("Are you sure you want to delete this note?")) {
        return;
    }

    clearTimeout(saveTimer);

    if (note) {
        notes = notes.filter(item => item.id !== note.id);
    }

    currentDraft = null;
    activeNoteId = null;

    saveData();
    renderAll();

    editorContent.hidden = true;
    editorEmpty.hidden = false;

    showStatus("Note deleted");
});


// 25. MANUAL SAVE BUTTON

saveNoteBtn.addEventListener("click", () => {

    clearTimeout(saveTimer);

    if (!activeNoteId && !currentDraft) return;

    saveCurrentNote(true);
});


// 26. EXPORT NOTES

function exportNote() {

    const note = getActiveNote();

    if (!note) return;

    const text = [
        note.title,
        "",
        note.content,
        "",
        "Last edited: " + formatDate(note.updatedAt)
    ].join("\n");

    const blob = new Blob(
        [text],
        { type: "text/plain;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = note.title.replace(/[<>:"/\\|?*]/g, "_") + ".txt";

    link.click();

    URL.revokeObjectURL(url);
}


// 27. ADD EXPORT BUTTON

const exportBtn = document.createElement("button");

exportBtn.textContent = "Export";
exportBtn.className = "export-btn";
exportBtn.title = "Download this note";

deleteNoteBtn.insertAdjacentElement("beforebegin", exportBtn);

exportBtn.addEventListener("click", exportNote);


// 28. THEME SETTINGS

function applyTheme(theme) {

    const validThemes = [
        "dark",
        "light",
        "midnight",
        "lavender"
    ];

    if (!validThemes.includes(theme)) {
        theme = "dark";
    }

    document.body.dataset.theme = theme;

    localStorage.setItem("nocturneTheme", theme);

    themeOptions.forEach(button => {

        button.classList.toggle(
            "active",
            button.dataset.theme === theme
        );
    });
}

themeOptions.forEach(button => {

    button.addEventListener("click", () => {
        applyTheme(button.dataset.theme);
    });
});


// 29. OPEN AND CLOSE SETTINGS

settingsBtn.addEventListener("click", () => {
    settingsModal.hidden = false;
});

closeSettingsBtn.addEventListener("click", () => {
    settingsModal.hidden = true;
});

settingsModal.addEventListener("click", event => {

    if (event.target === settingsModal) {
        settingsModal.hidden = true;
    }
});


// 30. MOBILE MENU

menuBtn.addEventListener("click", () => {

    sidebar.style.display =
        sidebar.style.display === "none"
            ? "flex"
            : "none";
});


// 31. NEW NOTE BUTTONS

newNoteBtn.addEventListener("click", createNote);
panelNewNoteBtn.addEventListener("click", createNote);
emptyNewNoteBtn.addEventListener("click", createNote);
startWritingBtn.addEventListener("click", createNote);


// 32. INITIALIZE APPLICATION

function initializeApp() {

    loadData();

    const savedTheme = localStorage.getItem("nocturneTheme") || "dark";

    applyTheme(savedTheme);

    populateDropdowns();

    renderAll();

    editorContent.hidden = true;
    editorEmpty.hidden = false;

    showStatus("Ready");
}

initializeApp();
