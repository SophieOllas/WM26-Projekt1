const BOARD_API_URL = 'http://localhost:8301';
const LOGIN_API_URL = 'http://localhost:8300';

const boardEl = document.getElementById('board');
const boardSelect = document.getElementById('boardSelect');
const newNoteBtn = document.getElementById('newNoteBtn');
const loginModal = document.getElementById('loginModal');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

let token = localStorage.getItem('jwt') || '';
let notes = [];
let currentBoardId = Number(boardSelect.value);
let suppressRender = false;

function setToken(newToken) {
  token = newToken;
  localStorage.setItem('jwt', token);
}

function isLoggedIn() {
  return !!token;
}

function toggleLoginModal(show) {
  loginModal.classList.toggle('visible', show);
}

async function login(email, password) {
  try {
    const response = await fetch(`${LOGIN_API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    setToken(data.jwt);
    toggleLoginModal(false);
    loadNotes();
  } catch (error) {
    loginError.textContent = error.message;
  }
}

async function loadNotes() {
  if (!isLoggedIn()) {
    toggleLoginModal(true);
    return;
  }

  try {
    const response = await fetch(`${BOARD_API_URL}/notes?board_id=${currentBoardId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Could not load notes');
    }

    const nextNotes = await response.json();

    if (suppressRender) {
      notes = nextNotes;
      return;
    }

    notes = nextNotes;
    renderNotes();
  } catch (error) {
    console.error(error);
  }
}

function createNoteElement(note) {
  const el = document.createElement('div');
  const className = note.color === '#c9efe1'
    ? 'green'
    : note.color === '#f5cfe1'
      ? 'pink'
      : 'yellow';

  el.className = `note ${className}`;
  el.style.left = `${note.x || 20}px`;
  el.style.top = `${note.y || 20}px`;
  el.dataset.id = note.id;

  const toolbar = document.createElement('div');
  toolbar.className = 'note-header';

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'x';
  deleteBtn.addEventListener('pointerdown', (event) => event.stopPropagation());
  deleteBtn.addEventListener('click', () => deleteNote(note.id));

  toolbar.appendChild(deleteBtn);

  const textarea = document.createElement('textarea');
  textarea.value = note.note;

  textarea.addEventListener('pointerdown', (event) => event.stopPropagation());

  textarea.addEventListener('focus', () => {
    suppressRender = true;
  });

  textarea.addEventListener('blur', async () => {
    suppressRender = false;
    await updateNote(note.id, { note: textarea.value });
  });

  const controls = document.createElement('div');
  controls.className = 'note-controls';

  ['#f5cfe1', '#c9efe1', '#f5f0b1'].forEach((c) => {
    const dot = document.createElement('button');
    dot.className = 'color-dot';
    dot.style.background = c;
    dot.addEventListener('pointerdown', (event) => event.stopPropagation());
    dot.addEventListener('click', () => updateNote(note.id, { color: c }));
    controls.appendChild(dot);
  });

  el.appendChild(toolbar);
  el.appendChild(textarea);
  el.appendChild(controls);

  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;

  el.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('.note-header')) {
      return;
    }

    suppressRender = true;
    dragging = true;

    const rect = el.getBoundingClientRect();
    const boardRect = boardEl.getBoundingClientRect();

    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;

    el.setPointerCapture(event.pointerId);
    el.style.zIndex = '10';
    el.dataset.dragging = 'true';

    const x = rect.left - boardRect.left;
    const y = rect.top - boardRect.top;
    note.x = x;
    note.y = y;
  });

  el.addEventListener('pointermove', (event) => {
    if (!dragging) return;

    const boardRect = boardEl.getBoundingClientRect();
    const x = event.clientX - boardRect.left - offsetX;
    const y = event.clientY - boardRect.top - offsetY;

    el.style.left = `${Math.max(0, x)}px`;
    el.style.top = `${Math.max(0, y)}px`;
  });

  el.addEventListener('pointerup', async () => {
    if (!dragging) return;

    dragging = false;
    suppressRender = false;
    el.style.zIndex = '1';

    const x = Number.parseFloat(el.style.left || '0');
    const y = Number.parseFloat(el.style.top || '0');

    await updateNote(note.id, { x, y });
  });

  return el;
}

function renderNotes() {
  boardEl.innerHTML = '';

  notes.forEach((note) => {
    boardEl.appendChild(createNoteElement(note));
  });
}

async function createNewNote() {
  if (!isLoggedIn()) {
    toggleLoginModal(true);
    return;
  }

  const newNote = {
    board_id: currentBoardId,
    note: 'New note',
    x: 40,
    y: 40,
    color: '#f5f0b1'
  };

  try {
    const response = await fetch(`${BOARD_API_URL}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newNote)
    });

    if (!response.ok) {
      throw new Error('Could not create note');
    }

    await loadNotes();
  } catch (error) {
    console.error(error);
  }
}

async function updateNote(id, updates) {
  const note = notes.find((item) => item.id === id);
  if (!note) return;

  const payload = {
    board_id: currentBoardId,
    note: note.note,
    x: note.x,
    y: note.y,
    color: note.color,
    ...updates
  };

  if (updates.note !== undefined) {
    payload.note = updates.note;
  }

  if (updates.x !== undefined) {
    payload.x = updates.x;
    note.x = updates.x;
  }

  if (updates.y !== undefined) {
    payload.y = updates.y;
    note.y = updates.y;
  }

  if (updates.color !== undefined) {
    payload.color = updates.color;
    note.color = updates.color;
  }

  try {
    await fetch(`${BOARD_API_URL}/notes/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!suppressRender) {
      await loadNotes();
    }
  } catch (error) {
    console.error(error);
  }
}

async function deleteNote(id) {
  try {
    await fetch(`${BOARD_API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ board_id: currentBoardId })
    });

    await loadNotes();
  } catch (error) {
    console.error(error);
  }
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  login(email, password);
});

newNoteBtn.addEventListener('click', createNewNote);
boardSelect.addEventListener('change', (event) => {
  currentBoardId = Number(event.target.value);
  loadNotes();
});

if (token) {
  toggleLoginModal(false);
  loadNotes();
}

setInterval(() => {
  if (isLoggedIn() && !suppressRender) {
    loadNotes();
  }
}, 3000);
