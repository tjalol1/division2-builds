
const state = {
  view: 'builds',
  builds: [],
  items: null,
  filteredBuilds: [],
  saved: new Set(JSON.parse(localStorage.getItem('div2builds:saved') || '[]')),
  explorerType: 'weapons'
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const [builds, items] = await Promise.all([
    fetch('data/builds.json').then(r => r.json()),
    fetch('data/items.json').then(r => r.json())
  ]);

  state.builds = builds;
  state.items = items;

  hydrateControls();
  renderHero();
  renderMiniStats();
  applyBuildFilters();
  renderExplorer();
  wireEvents();
  updateSavedCount();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

function wireEvents() {
  $$('#mainNav .nav-link').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
  $$('[data-view-jump]').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.viewJump)));

  $('#searchInput').addEventListener('input', applyBuildFilters);
  $('#specFilter').addEventListener('change', applyBuildFilters);
  $('#playstyleFilter').addEventListener('change', applyBuildFilters);
  $('#activityFilter').addEventListener('change', applyBuildFilters);
  $('#sourceFilter').addEventListener('change', applyBuildFilters);

  $('#explorerType').addEventListener('change', e => {
    state.explorerType = e.target.value;
    renderExplorer();
  });
  $('#explorerSearch').addEventListener('input', renderExplorer);

  $('#generateAiBtn').addEventListener('click', generateAiBuild);

  $('#inspectBtn').addEventListener('click', inspectBuild);
  $('#loadSampleInspector').addEventListener('click', () => {
    $('#inspectorInput').value = JSON.stringify(state.builds[0], null, 2);
  });

  $('#savedBtn').addEventListener('click', () => {
    const savedBuilds = state.builds.filter(build => state.saved.has(build.id));
    setView('builds');
    renderBuildGrid(savedBuilds);
    toggleEmpty(savedBuilds.length === 0, 'No saved builds yet', 'Open a build and save it.');
  });

  $('#mobileFilterToggle').addEventListener('click', () => $('#sidebar').classList.add('is-open'));
  $('#closeSidebar').addEventListener('click', () => $('#sidebar').classList.remove('is-open'));

  document.addEventListener('click', (e) => {
    if (e.target.matches('.dialog-close')) {
      $('#detailDialog').close();
    }
    if (e.target === $('#detailDialog')) {
      $('#detailDialog').close();
    }
  });

  $('#detailDialog').addEventListener('click', e => {
    if (e.target === $('#detailDialog')) $('#detailDialog').close();
  });
}

function hydrateControls() {
  const specializations = unique(state.builds.map(b => b.specialization));
  const playstyles = unique(state.builds.map(b => b.playstyle));
  const activities = unique(state.builds.flatMap(b => b.activityType));

  fillSelect($('#specFilter'), ['all', ...specializations], prettyLabel);
  fillSelect($('#playstyleFilter'), ['all', ...playstyles], prettyLabel);
  fillSelect($('#activityFilter'), ['all', ...activities], prettyLabel);

  fillSelect($('#aiSpec'), specializations, prettyLabel);
  fillSelect($('#aiPlaystyle'), playstyles, prettyLabel);
  fillSelect($('#aiActivity'), activities, prettyLabel);
  fillSelect($('#aiWeapon'), unique(state.items.weapons.map(w => w.family)), prettyLabel);

  const explorerOptions = [
    ['weapons', 'Weapons'],
    ['weaponTalents', 'Weapon talents'],
    ['chestTalents', 'Chest talents'],
    ['backpackTalents', 'Backpack talents'],
    ['gearSets', 'Gear sets'],
    ['brandSets', 'Brand sets'],
    ['exotics', 'Exotics'],
    ['skills', 'Skills'],
    ['gearItems', 'Gear pieces']
  ];
  $('#explorerType').innerHTML = explorerOptions.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
}

function fillSelect(select, values, formatter) {
  select.innerHTML = values.map(v => `<option value="${v}">${formatter(v)}</option>`).join('');
}

function prettyLabel(value) {
  if (!value) return '';
  if (value === 'all') return 'All';
  return String(value).replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function renderHero() {
  const metrics = [
    ['Builds', state.builds.length],
    ['Weapons', state.items.weapons.length],
    ['Talent entries', state.items.weaponTalents.length + state.items.chestTalents.length + state.items.backpackTalents.length],
    ['Explorer categories', 9]
  ];
  $('#heroMetrics').innerHTML = metrics.map(([label, value]) => `
    <div class="metric">
      <strong>${value}</strong>
      <span>${label}</span>
    </div>
  `).join('');
}

function renderMiniStats() {
  const curated = state.builds.filter(b => b.sourceType === 'curated').length;
  const ai = state.builds.filter(b => b.sourceType === 'ai-generated').length;
  const stats = [
    ['Curated builds', curated],
    ['AI builds', ai],
    ['Saved locally', state.saved.size]
  ];
  $('#miniStats').innerHTML = stats.map(([label, value]) => `
    <div class="mini-stat">
      <strong>${value}</strong>
      <span>${label}</span>
    </div>
  `).join('');
}

function applyBuildFilters() {
  const q = $('#searchInput').value.trim().toLowerCase();
  const spec = $('#specFilter').value;
  const playstyle = $('#playstyleFilter').value;
  const activity = $('#activityFilter').value;
  const source = $('#sourceFilter').value;

  state.filteredBuilds = state.builds.filter(build => {
    const haystack = [
      build.buildName,
      build.shortSummary,
      build.description,
      build.author,
      ...build.tags,
      build.weapons.primary.weaponName,
      build.weapons.secondary.weaponName
    ].join(' ').toLowerCase();

    return (q ? haystack.includes(q) : true)
      && (spec === 'all' ? true : build.specialization === spec)
      && (playstyle === 'all' ? true : build.playstyle === playstyle)
      && (activity === 'all' ? true : build.activityType.includes(activity))
      && (source === 'all' ? true : build.sourceType === source);
  });

  renderBuildGrid(state.filteredBuilds);
  toggleEmpty(state.filteredBuilds.length === 0, 'No builds match', 'Change a filter or clear your search.');
}

function renderBuildGrid(builds) {
  $('#buildGrid').innerHTML = builds.map(renderBuildCard).join('');
  $$('.open-build').forEach(btn => btn.addEventListener('click', () => openBuild(btn.dataset.id)));
  $$('.save-build').forEach(btn => btn.addEventListener('click', () => toggleSave(btn.dataset.id)));
}

function renderBuildCard(build) {
  const badges = [
    `<span class="badge ${build.sourceType}">${build.sourceType === 'curated' ? 'Curated' : 'AI generated'}</span>`,
    build.qualityLabel === 'verified' ? `<span class="badge verified">Verified</span>` : '',
    `<span class="badge activity">${prettyLabel(build.difficulty)}</span>`
  ].join('');

  const cores = build.coreBalance || { red: 0, blue: 0, yellow: 0 };
  const saved = state.saved.has(build.id);
  return `
    <article class="card">
      <div class="card-head">
        <div class="badge-row">${badges}</div>
        <div class="card-title">
          <h3>${escapeHtml(build.buildName)}</h3>
          <strong>${build.rating?.toFixed(1) || '—'}</strong>
        </div>
        <p class="card-copy">${escapeHtml(build.shortSummary)}</p>
      </div>
      <div class="card-body">
        <div class="kv-grid">
          <div class="kv"><span>Spec</span><strong>${prettyLabel(build.specialization)}</strong></div>
          <div class="kv"><span>Playstyle</span><strong>${prettyLabel(build.playstyle)}</strong></div>
          <div class="kv"><span>Main mode</span><strong>${prettyLabel(build.activityType[0])}</strong></div>
        </div>
        <div class="loadout-chip"><span>Primary</span><strong>${escapeHtml(build.weapons.primary.weaponName)}</strong></div>
        <div class="loadout-chip"><span>Identity</span><strong>${escapeHtml(mainIdentity(build))}</strong></div>
        <div class="loadout-chip"><span>Cores</span><strong>${cores.red} red / ${cores.blue} blue / ${cores.yellow} yellow</strong></div>
        <div class="card-actions">
          <button class="ghost-btn open-build" data-id="${build.id}">View</button>
          <button class="ghost-btn save-build" data-id="${build.id}">${saved ? 'Saved' : 'Save'}</button>
        </div>
      </div>
    </article>
  `;
}

function mainIdentity(build) {
  const sets = Object.values(build.gear)
    .map(slot => slot.gearSetId ? getItemById('gearSets', slot.gearSetId)?.name : slot.brand || slot.itemName)
    .filter(Boolean);

  return sets[0] || build.tags[0] || 'General';
}

function toggleEmpty(show, title, copy) {
  const empty = $('#buildEmpty');
  empty.classList.toggle('hidden', !show);
  if (show) {
    empty.innerHTML = `<h3>${title}</h3><p>${copy}</p>`;
  }
}

function updateSavedCount() {
  $('#savedCount').textContent = state.saved.size;
  localStorage.setItem('div2builds:saved', JSON.stringify([...state.saved]));
  renderMiniStats();
}

function toggleSave(id) {
  if (state.saved.has(id)) state.saved.delete(id);
  else state.saved.add(id);
  updateSavedCount();
  applyBuildFilters();
}

function openBuild(id) {
  const build = state.builds.find(b => b.id === id);
  if (!build) return;

  const cores = build.coreBalance || { red: 0, blue: 0, yellow: 0 };
  const gearRows = Object.entries(build.gear).map(([slot, piece]) => `
    <div class="detail-row">
      <span>${prettyLabel(slot)}</span>
      <div>
        <strong>${escapeHtml(piece.itemName)}</strong>
        <div>${escapeHtml(piece.brand || piece.brandOrSet || '')}</div>
        <small>${escapeHtml([piece.core, piece.attr1, piece.attr2].filter(Boolean).join(' · '))}</small>
      </div>
    </div>
  `).join('');

  const weaponRows = Object.values(build.weapons).map(weapon => `
    <div class="detail-row">
      <span>${escapeHtml(weapon.weaponType || 'Weapon')}</span>
      <div>
        <strong>${escapeHtml(weapon.weaponName)}</strong>
        <div>${escapeHtml(weapon.talentName || '')}</div>
        <small>${escapeHtml(weapon.notes || '')}</small>
      </div>
    </div>
  `).join('');

  $('#detailContent').innerHTML = `
    <article class="detail-sheet">
      <div class="detail-top">
        <div class="badge-row">
          <span class="badge ${build.sourceType}">${build.sourceType === 'curated' ? 'Curated' : 'AI generated'}</span>
          <span class="badge activity">${prettyLabel(build.specialization)}</span>
          <span class="badge activity">${prettyLabel(build.difficulty)}</span>
        </div>
        <div style="display:flex; gap:12px; align-items:start;">
          <div style="flex:1; min-width:0;">
            <h2>${escapeHtml(build.buildName)}</h2>
            <p>${escapeHtml(build.description)}</p>
          </div>
          <button class="dialog-close" aria-label="Close">✕</button>
        </div>
        <div class="actions-row">
          <button class="primary-btn" onclick="window.toggleSave('${build.id}')">${state.saved.has(build.id) ? 'Saved locally' : 'Save build'}</button>
          <button class="ghost-btn" onclick="window.copyBuildJson('${build.id}')">Copy JSON</button>
        </div>
      </div>
      <div class="detail-content">
        <div class="stack">
          <section class="info-panel">
            <h3>Gear setup</h3>
            <div class="detail-table">${gearRows}</div>
          </section>
          <section class="info-panel">
            <h3>Weapons & skills</h3>
            <div class="detail-table">${weaponRows}</div>
            <div class="detail-row">
              <span>Skill 1</span>
              <div><strong>${escapeHtml(build.skills.skill1.skillName)}</strong><small>${escapeHtml(build.skills.skill1.notes || '')}</small></div>
            </div>
            <div class="detail-row">
              <span>Skill 2</span>
              <div><strong>${escapeHtml(build.skills.skill2.skillName)}</strong><small>${escapeHtml(build.skills.skill2.notes || '')}</small></div>
            </div>
          </section>
          <section class="info-panel">
            <h3>How it plays</h3>
            <p style="color:var(--muted); margin:0 0 14px;">${escapeHtml(build.howToPlay)}</p>
            <div class="note-grid">
              <div class="note-box">
                <h4>Strengths</h4>
                <ul>${build.strengths.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
              </div>
              <div class="note-box">
                <h4>Weaknesses</h4>
                <ul>${build.weaknesses.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
              </div>
            </div>
          </section>
        </div>
        <aside class="stack">
          <section class="info-panel">
            <h3>Core balance</h3>
            <div class="kv-grid">
              <div class="kv"><span>Red</span><strong>${cores.red}</strong></div>
              <div class="kv"><span>Blue</span><strong>${cores.blue}</strong></div>
              <div class="kv"><span>Yellow</span><strong>${cores.yellow}</strong></div>
            </div>
          </section>
          <section class="info-panel">
            <h3>Use cases</h3>
            <ul class="list-clean">${build.activityType.map(x => `<li>${prettyLabel(x)}</li>`).join('')}</ul>
          </section>
          <section class="info-panel">
            <h3>Substitutions</h3>
            <ul class="list-clean">${build.substitutions.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          </section>
          <section class="info-panel">
            <h3>Tips</h3>
            <ul class="list-clean">${build.tips.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
          </section>
        </aside>
      </div>
    </article>
  `;
  $('#detailDialog').showModal();
}

window.toggleSave = function(id) {
  toggleSave(id);
  openBuild(id);
};

window.copyBuildJson = async function(id) {
  const build = state.builds.find(b => b.id === id);
  if (!build) return;
  await navigator.clipboard.writeText(JSON.stringify(build, null, 2));
};

function renderExplorer() {
  const type = state.explorerType;
  const search = ($('#explorerSearch').value || '').trim().toLowerCase();
  const entries = (state.items[type] || []).filter(entry => JSON.stringify(entry).toLowerCase().includes(search));

  $('#explorerGrid').innerHTML = entries.map(entry => {
    const title = entry.name || entry.id;
    const body = entry.description || entry.identity || entry.uniqueEffect || entry.shortNote || entry.primaryDrop || entry.bonus4pc || '';
    const chips = explorerMeta(type, entry).map(text => `<span class="badge activity">${escapeHtml(text)}</span>`).join('');
    return `
      <article class="explorer-card">
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
        <div class="explorer-meta">${chips}</div>
      </article>
    `;
  }).join('') || `<div class="empty-state"><h3>No entries</h3><p>Try a different search.</p></div>`;
}

function explorerMeta(type, entry) {
  switch (type) {
    case 'weapons': return [prettyLabel(entry.family), entry.rarity, entry.attr3Default].filter(Boolean);
    case 'gearSets': return [entry.playstyle, entry.bonus2pc, entry.bonus4pc].filter(Boolean);
    case 'brandSets': return [entry.bonus1pc, entry.bonus2pc, entry.bonus3pc].filter(Boolean);
    case 'exotics': return [entry.slot, ...(entry.playstyle || [])].filter(Boolean);
    case 'skills': return [entry.parentSkill, entry.role].filter(Boolean);
    case 'gearItems': return [entry.slot, entry.brandOrSet, entry.rarity].filter(Boolean);
    default: return [entry.category].filter(Boolean);
  }
}

function generateAiBuild() {
  const spec = $('#aiSpec').value;
  const playstyle = $('#aiPlaystyle').value;
  const activity = $('#aiActivity').value;
  const weaponFamily = $('#aiWeapon').value;

  let candidate = state.builds.find(build =>
    build.sourceType === 'ai-generated'
    && build.specialization === spec
    && build.playstyle === playstyle
    && build.activityType.includes(activity)
    && weaponFamilyMatches(build, weaponFamily)
  );

  if (!candidate) {
    candidate = state.builds.find(build => build.sourceType === 'ai-generated' && weaponFamilyMatches(build, weaponFamily))
      || state.builds.find(build => build.sourceType === 'ai-generated')
      || state.builds[0];
  }

  $('#aiOutput').innerHTML = `
    <div class="output-stack">
      <div class="panel">
        <div class="badge-row">
          <span class="badge ai-generated">AI generated</span>
          <span class="badge activity">Heuristic template</span>
        </div>
        <h3 style="margin:0 0 8px;font-family:'Barlow Condensed',sans-serif;font-size:2rem">${escapeHtml(candidate.buildName)}</h3>
        <p style="margin:0;color:var(--muted)">${escapeHtml(candidate.shortSummary)}</p>
        <div class="actions-row">
          <button class="primary-btn" onclick="openBuild('${candidate.id}')">Open full build</button>
          <button class="ghost-btn" onclick="toggleSave('${candidate.id}')">Save</button>
        </div>
      </div>
      <div class="score-grid">
        <div class="score-card"><strong>${candidate.coreBalance.red}</strong><span>Red cores</span></div>
        <div class="score-card"><strong>${candidate.coreBalance.blue}</strong><span>Blue cores</span></div>
        <div class="score-card"><strong>${candidate.coreBalance.yellow}</strong><span>Yellow cores</span></div>
        <div class="score-card"><strong>${candidate.rating.toFixed(1)}</strong><span>Quality label</span></div>
      </div>
      <div class="note-grid">
        <div class="note-box">
          <h4>Strengths</h4>
          <ul>${candidate.strengths.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>
        <div class="note-box">
          <h4>Warnings</h4>
          <ul>
            <li>This output is generated from local templates, not live patch telemetry.</li>
            <li>It is useful as a starting point, not as a fake verified meta claim.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function weaponFamilyMatches(build, family) {
  return [build.weapons.primary.weaponType, build.weapons.secondary.weaponType]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(String(family).toLowerCase());
}

function inspectBuild() {
  const raw = $('#inspectorInput').value.trim();
  if (!raw) return;

  const build = parseInspectionInput(raw);
  const result = scoreBuild(build);

  $('#inspectorOutput').innerHTML = `
    <div class="output-stack">
      <div class="score-grid">
        <div class="score-card"><strong>${result.damage}</strong><span>Damage</span></div>
        <div class="score-card"><strong>${result.survivability}</strong><span>Survivability</span></div>
        <div class="score-card"><strong>${result.utility}</strong><span>Utility</span></div>
        <div class="score-card"><strong>${result.group}</strong><span>Group value</span></div>
      </div>
      <div class="note-grid">
        <div class="note-box">
          <h4>Likely strengths</h4>
          <ul>${result.strengths.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>
        <div class="note-box">
          <h4>Likely issues</h4>
          <ul>${result.issues.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>
      </div>
      <div class="panel">
        <h3 style="margin-top:0">Honest note</h3>
        <p style="margin:0;color:var(--muted)">This is heuristic analysis. It is not pretending to calculate exact DPS, uptime or armor breakpoints. It is reading patterns from your text or JSON and summarizing what the build probably does well.</p>
      </div>
    </div>
  `;
}

function parseInspectionInput(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return { raw: raw.toLowerCase() };
  }
}

function scoreBuild(build) {
  const text = JSON.stringify(build).toLowerCase();
  let damage = 5;
  let survivability = 4;
  let utility = 4;
  let group = 4;

  const notes = { strengths: [], issues: [] };

  const red = build.coreBalance?.red ?? (text.includes('6 red') ? 6 : 0);
  const blue = build.coreBalance?.blue ?? (text.includes('armor') ? 2 : 0);
  const yellow = build.coreBalance?.yellow ?? ((text.includes('skill tier') || text.includes('yellow')) ? 3 : 0);

  damage += Math.min(4, red);
  survivability += Math.min(4, blue);
  utility += Math.min(4, yellow);

  if (text.includes('striker') || text.includes("st. elmo") || text.includes('kingbreaker')) {
    damage += 2;
    notes.strengths.push('Strong weapon pressure and good uptime if you keep shooting.');
  }
  if (text.includes('eclipse') || text.includes('vile') || text.includes('scorpio')) {
    utility += 3;
    group += 2;
    notes.strengths.push('Looks strong for room control and team value.');
  }
  if (text.includes('memento') || text.includes('armor regen') || text.includes('reviver')) {
    survivability += 2;
    notes.strengths.push('Has some built-in safety and recovery.');
  }
  if (red >= 5 && blue === 0 && yellow === 0) {
    notes.issues.push('Very offense-heavy. Great when clean, less forgiving when you get pushed.');
  }
  if (yellow >= 5 && text.includes('solo')) {
    notes.issues.push('Heavy skill focus can feel slow solo unless the skill loop is very clean.');
  }
  if (!text.includes('reviver') && !text.includes('armor') && blue === 0) {
    survivability -= 1;
    notes.issues.push('I do not see much safety net here.');
  }
  if (text.includes('group') || text.includes('ally') || text.includes('coyote')) {
    group += 2;
  }
  if (text.includes('beginner')) {
    survivability += 1;
  }

  if (!notes.strengths.length) notes.strengths.push('The build reads balanced enough to function, even if the ceiling is unclear.');
  if (!notes.issues.length) notes.issues.push('Nothing alarming jumps out, but testing still matters more than theory.');

  return {
    damage: clampScore(damage),
    survivability: clampScore(survivability),
    utility: clampScore(utility),
    group: clampScore(group),
    strengths: notes.strengths,
    issues: notes.issues
  };
}

function clampScore(value) {
  return Math.max(1, Math.min(10, value));
}

function getItemById(collection, id) {
  return (state.items[collection] || []).find(item => item.id === id);
}

function setView(view) {
  state.view = view;
  $$('.view').forEach(el => el.classList.toggle('is-active', el.id === `view-${view}`));
  $$('#mainNav .nav-link').forEach(btn => btn.classList.toggle('is-active', btn.dataset.view === view));
  $('#sidebar').classList.toggle('hidden', view !== 'builds' && window.innerWidth > 860 ? true : false);
  if (view === 'builds') $('#sidebar').classList.remove('hidden');
  $('#sidebar').classList.remove('is-open');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
