const gameTableBody = document.getElementById('game-table-body');
const form = document.getElementById('add-game-form');
const messageEl = document.getElementById('form-message');
const filterInput = document.getElementById('filter-input');
const clearFilterBtn = document.getElementById('clear-filter-btn');
const toggleAddBtn = document.getElementById('toggle-add-game');
const addCollapse = document.getElementById('add-game-collapse');

let gamesData = [];
let sortKey = 'id'; // 'id' | 'name' | 'platform' | 'category' | 'notable_features'
let sortDir = 'asc'; // 'asc' | 'desc'
let filterText = '';

async function fetchGames() {
  gameTableBody.innerHTML = '<tr><td colspan="5">Loading games...</td></tr>';
  const { data, error } = await supabase
    .from('games')
    .select('id, name, platform, category, notable_features')
    .order('id', { ascending: true });

  if (error) {
    gameTableBody.innerHTML = `<tr><td colspan="5">Error loading games: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    gameTableBody.innerHTML = '<tr><td colspan="5">No games found. Be the first to add one!</td></tr>';
    return;
  }

  gamesData = data;
  renderTable();
}

// Sanitize text to prevent injection (basic)
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  messageEl.classList.add('hidden');
  messageEl.textContent = '';

  const name = form['name'].value.trim();
  const platform = form['platform'].value.trim();
  const category = form['category'].value.trim();
  const notable_features = form['notable_features'].value.trim();

  if (!name || !platform || !category || !notable_features) {
    showMessage('Please fill in all fields.', true);
    return;
  }

  // Insert into Supabase
  const { error } = await supabase
    .from('games')
    .insert([{ name, platform, category, notable_features }]);

  if (error) {
    showMessage('Error adding game: ' + error.message, true);
    return;
  }

  showMessage(`"${name}" added successfully! Thank you!`, false);
  form.reset();
  fetchGames();
});

function showMessage(msg, isError) {
  messageEl.textContent = msg;
  messageEl.style.color = isError ? 'red' : 'green';
  messageEl.classList.remove('hidden');
}

// Load the list on page load
fetchGames();

// Render helpers
function renderTable() {
  // Filter
  const q = filterText.trim().toLowerCase();
  let rows = !q
    ? [...gamesData]
    : gamesData.filter(g =>
        (g.name || '').toLowerCase().includes(q) ||
        (g.platform || '').toLowerCase().includes(q) ||
        (g.category || '').toLowerCase().includes(q) ||
        (g.notable_features || '').toLowerCase().includes(q)
      );

  // Sort
  rows.sort((a, b) => compareBy(a, b, sortKey, sortDir));

  // Paint
  gameTableBody.innerHTML = '';
  rows.forEach((game, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${idx + 1}</td>
      <td>${escapeHtml(game.name)}</td>
      <td>${escapeHtml(game.platform)}</td>
      <td>${escapeHtml(game.category)}</td>
      <td>${escapeHtml(game.notable_features)}</td>
    `;
    gameTableBody.appendChild(row);
  });

  if (rows.length === 0) {
    gameTableBody.innerHTML = '<tr><td colspan="5">No results.</td></tr>';
  }

  updateSortIndicators();
}

function compareBy(a, b, key, dir) {
  let cmp = 0;
  if (key === 'id') {
    cmp = (a.id || 0) - (b.id || 0);
  } else {
    const av = (a[key] || '').toString().toLowerCase();
    const bv = (b[key] || '').toString().toLowerCase();
    cmp = av.localeCompare(bv);
  }
  return dir === 'asc' ? cmp : -cmp;
}

// Sorting interactions
document.querySelectorAll('th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sortKey;
    if (!key) return;
    if (sortKey === key) {
      sortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey = key;
      sortDir = 'asc';
    }
    renderTable();
  });
});

// Filter interactions (debounced)
if (filterInput) {
  const debounced = debounce((val) => {
    filterText = val;
    renderTable();
  }, 200);

  filterInput.addEventListener('input', (e) => debounced(e.target.value));
}

if (clearFilterBtn && filterInput) {
  clearFilterBtn.addEventListener('click', () => {
    filterInput.value = '';
    filterText = '';
    renderTable();
  });
}

function debounce(fn, wait) {
  let t;
  return function (...args) {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}

function updateSortIndicators() {
  const headers = document.querySelectorAll('th.sortable');
  headers.forEach(h => {
    if (h.dataset.sortKey === sortKey) {
      h.setAttribute('aria-sort', sortDir === 'asc' ? 'ascending' : 'descending');
    } else {
      h.removeAttribute('aria-sort');
    }
  });
}

// Collapsible: Add Game form
if (toggleAddBtn && addCollapse) {
  // Restore state from session (optional nice touch)
  const saved = sessionStorage.getItem('addFormOpen');
  const isOpen = saved === '1';
  setCollapse(isOpen);

  toggleAddBtn.addEventListener('click', () => {
    const next = !(toggleAddBtn.getAttribute('aria-expanded') === 'true');
    setCollapse(next);
    sessionStorage.setItem('addFormOpen', next ? '1' : '0');
  });
}

function setCollapse(open) {
  toggleAddBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  if (open) {
    addCollapse.hidden = false;
    addCollapse.setAttribute('data-open', 'true');
  } else {
    addCollapse.removeAttribute('data-open');
    // Delay hiding until transition ends for smoother UX
    const onEnd = () => {
      addCollapse.hidden = true;
      addCollapse.removeEventListener('transitionend', onEnd);
    };
    addCollapse.addEventListener('transitionend', onEnd);
  }
}
