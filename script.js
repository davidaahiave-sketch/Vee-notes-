
// NOCTURNE NOTES - JAVASCRIPT

// GET HTML ELEMENTS
const newNoteBtn = document.getElementById("newNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");
const notesList = document.getElementById("notesList");
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const wordCount = document.getElementById("wordCount");
const saveStatus = document.getElementById("saveStatus");

// LOAD SAVED NOTES
let notes = JSON.parse(localStorage.getItem("nocturneNotes")) || [];
let activeNoteId = null;

// SAVE NOTES TO BROWSER STORAGE
function saveNotes() {
    localStorage.setItem("nocturneNotes", JSON.stringify(notes));
    saveStatus.textContent = "All changes saved";
}

// CREATE A NEW NOTE
function createNote() {
    const note = {
        id: Date.now().toString(),
        title: "Untitled Note",
        content: "",
        updatedAt: new Date().toISOString()
    };

    notes.unshift(note);
    activeNoteId = note.id;

    saveNotes();
    renderNotes();
    displayNote();
}

// DISPLAY SELECTED NOTE
function displayNote() {
    const note = notes.find(n => n.id === activeNoteId);

    if (!note) {
        noteTitle.value = "";
        noteContent.value = "";
        wordCount.textContent = "0 words";
        return;
    }

    noteTitle.value = note.title;
    noteContent.value = note.content;

    updateWordCount();
    renderNotes();
}

// UPDATE NOTE CONTENT
function updateNote() {
    const note = notes.find(n => n.id === activeNoteId);

    if (!note) return;

    note.title = noteTitle.value.trim() || "Untitled Note";
    note.content = noteContent.value;
    note.updatedAt = new Date().toISOString();

    saveStatus.textContent = "Saving...";

    saveNotes();
    renderNotes();
    updateWordCount();
}

// UPDATE WORD COUNT
function updateWordCount() {
    const text = noteContent.value.trim();

    const words = text
        ? text.split(/\s+/).length
        : 0;

    wordCount.textContent =
        words + (words === 1 ? " word" : " words");
}

// SHOW ALL NOTES IN SIDEBAR
function renderNotes() {
    notesList.innerHTML = "";

    notes.forEach(note => {
        const item = document.createElement("div");

        item.className = "note-item";
        item.textContent = note.title;

        if (note.id === activeNoteId) {
            item.classList.add("active");
        }

        item.addEventListener("click", () => {
            activeNoteId = note.id;
            displayNote();
        });

        notesList.appendChild(item);
    });
}

// DELETE CURRENT NOTE
function deleteNote() {
    if (!activeNoteId) return;

    const confirmed = confirm(
        "Are you sure you want to delete this note?"
    );

    if (!confirmed) return;

    notes = notes.filter(n => n.id !== activeNoteId);

    activeNoteId = notes.length
        ? notes[0].id
        : null;

    saveNotes();
    renderNotes();
    displayNote();
}

// BUTTON EVENTS
newNoteBtn.addEventListener("click", createNote);

deleteNoteBtn.addEventListener("click", deleteNote);

noteTitle.addEventListener("input", updateNote);

noteContent.addEventListener("input", () => {
    updateNote();
    updateWordCount();
});

// INITIALIZE APPLICATION
if (notes.length > 0) {
    activeNoteId = notes[0].id;
    renderNotes();
    displayNote();
} else {
    createNote();
}
  
