(async () => {
  let allGames = [], activeCategory = 'All', searchQuery = '';

  const grid        = document.getElementById('game-grid');
  const filterBar   = document.getElementById('filter-bar');
  const searchInput = document.getElementById('search-input');
  const emptyState  = document.getElementById('empty-state');
  const emptyQuery  = document.getElementById('empty-query');
  const gameCount   = document.getElementById('game-count');
  const resultsBar  = document.getElementById('results-bar');
  const overlay     = document.getElementById('modal-overlay');
  const mClose      = document.getElementById('modal-close');
  const mTitle      = document.getElementById('modal-title');
  const mEmoji      = document.getElementById('modal-emoji');
  const mCat        = document.getElementById('modal-category');
  const mExt        = document.getElementById('modal-external');
  const iframe      = document.getElementById('game-iframe');
  const blocker     = document.getElementById('iframe-blocker');
  const blockerLink = document.getElementById('iframe-external-link');

  try {
    const res = await fetch('games.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    allGames = await res.json();
  } catch (e) {
    grid.innerHTML = `<p style="color:var(--danger);padding:24px;grid-column:1/-1">Failed to load games.json: ${e.message}</p>`;
    return;
  }

  if (gameCount) gameCount.textContent = allGames.length;

  // Build category pills
  const cats = ['All', ...new Set(allGames.map(g => g.category).sort())];
  cats.forEach(cat => {
    if (cat === 'All') {
      filterBar.querySelector('[data-category="All"]').addEventListener('click', () => setCategory('All'));
      return;
    }
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.category = cat;
    btn.textContent = cat;
    btn.addEventListener('click', () => setCategory(cat));
    filterBar.appendChild(btn);
  });

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function render() {
    const q = searchQuery.toLowerCase().trim();
    const filtered = allGames.filter(g => {
      const cat = activeCategory === 'All' || g.category === activeCategory;
      const search = !q || g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || g.category.toLowerCase().includes(q);
      return cat && search;
    });

    grid.innerHTML = '';
    if (filtered.length === 0) {
      emptyQuery.textContent = searchQuery || activeCategory;
      emptyState.classList.remove('hidden');
      if (resultsBar) resultsBar.textContent = '0 games';
      return;
    }
    emptyState.classList.add('hidden');
    if (resultsBar) {
      resultsBar.textContent = filtered.length === allGames.length
        ? `${allGames.length} games`
        : `${filtered.length} of ${allGames.length} games`;
    }
    filtered.forEach(game => {
      const card = document.createElement('article');
      card.className = 'game-card';
      card.innerHTML = `
        <span class="card-emoji">${game.thumbnail}</span>
        <h3 class="card-title">${esc(game.title)}</h3>
        <p class="card-desc">${esc(game.description)}</p>
        <span class="card-badge">${esc(game.category)}</span>
        <button class="card-play-btn">▶ Play</button>`;
      card.addEventListener('click', () => openGame(game));
      grid.appendChild(card);
    });
  }

  function setCategory(cat) {
    activeCategory = cat;
    filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.category === cat));
    render();
  }

  searchInput.addEventListener('input', e => { searchQuery = e.target.value; render(); });

  function openGame(game) {
    mTitle.textContent = game.title;
    mEmoji.textContent = game.thumbnail;
    mCat.textContent   = game.category;
    mExt.href          = game.url;
    blockerLink.href   = game.url;
    blocker.classList.add('hidden');
    iframe.classList.remove('hidden');
    iframe.src = '';
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { iframe.src = game.url; });
    iframe.addEventListener('load', function check() {
      iframe.removeEventListener('load', check);
      try {
        const doc = iframe.contentDocument;
        if (doc && doc.body && doc.body.innerHTML === '') showBlocker();
      } catch { /* cross-origin = loaded fine */ }
    });
  }

  function showBlocker() {
    iframe.classList.add('hidden');
    blocker.classList.remove('hidden');
  }

  function closeModal() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    iframe.src = '';
  }

  mClose.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  render();
})();
