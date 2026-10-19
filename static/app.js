// IPL Cricket Statistics Scraper & Dashboard Controller

const state = {
  year: 2025,
  team: 'all',
  role: 'all',
  search: '',
  sortBy: 'runs_scored',
  order: 'desc',
  page: 1,
  pageSize: 50,
  totalPlayers: 0,
  totalPages: 1,
  viewMode: 'table',
  isScraping: false,
  pollInterval: null
};

// DOM Elements
const seasonSelect = document.getElementById('seasonSelect');
const modalYearSelect = document.getElementById('modalYearSelect');
const teamFilters = document.getElementById('teamFilters');
const roleTabs = document.getElementById('roleTabs');
const searchInput = document.getElementById('searchInput');
const viewTableBtn = document.getElementById('viewTableBtn');
const viewGridBtn = document.getElementById('viewGridBtn');
const tableView = document.getElementById('tableView');
const gridView = document.getElementById('gridView');
const playersTableBody = document.getElementById('playersTableBody');
const paginationInfo = document.getElementById('paginationInfo');
const prevPageBtn = document.getElementById('prevPageBtn');
const nextPageBtn = document.getElementById('nextPageBtn');
const currentPageNum = document.getElementById('currentPageNum');

// Modals
const scraperModal = document.getElementById('scraperModal');
const openScrapeModalBtn = document.getElementById('openScrapeModalBtn');
const closeScraperModalBtn = document.getElementById('closeScraperModalBtn');
const startScrapeBtn = document.getElementById('startScrapeBtn');
const terminalLogs = document.getElementById('terminalLogs');

const schedulerModal = document.getElementById('schedulerModal');
const openScheduleModalBtn = document.getElementById('openScheduleModalBtn');
const closeSchedulerModalBtn = document.getElementById('closeSchedulerModalBtn');
const saveScheduleBtn = document.getElementById('saveScheduleBtn');
const scheduleEnableCheck = document.getElementById('scheduleEnableCheck');
const scheduleIntervalSelect = document.getElementById('scheduleIntervalSelect');

const playerDetailModal = document.getElementById('playerDetailModal');
const closePlayerModalBtn = document.getElementById('closePlayerModalBtn');
const modalPlayerName = document.getElementById('modalPlayerName');
const modalPlayerContent = document.getElementById('modalPlayerContent');

// Downloads
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');

// Banner
const scrapeBanner = document.getElementById('scrapeBanner');
const scrapeBannerTitle = document.getElementById('scrapeBannerTitle');
const scrapeBannerStep = document.getElementById('scrapeBannerStep');
const viewScrapeLogsBtn = document.getElementById('viewScrapeLogsBtn');

// Metric Elements
const metricTotalPlayers = document.getElementById('metricTotalPlayers');
const metricTotalTeams = document.getElementById('metricTotalTeams');
const metricOrangeCapName = document.getElementById('metricOrangeCapName');
const metricOrangeCapStats = document.getElementById('metricOrangeCapStats');
const metricPurpleCapName = document.getElementById('metricPurpleCapName');
const metricPurpleCapStats = document.getElementById('metricPurpleCapStats');
const metricAllRounders = document.getElementById('metricAllRounders');

// Helper formatting
function formatVal(v, fallback = '<span class="badge-null">-</span>') {
  if (v === null || v === undefined || v === '') return fallback;
  return v;
}

function getTeamBadge(teamCode, teamName) {
  return `<span class="player-team-badge">${teamCode || teamName}</span>`;
}

// 1. Fetch & Render Summary Metrics
async function loadSummary() {
  try {
    const res = await fetch(`/api/summary?year=${state.year}`);
    const data = await res.json();
    if (data.has_data) {
      metricTotalPlayers.textContent = data.total_players;
      metricTotalTeams.textContent = data.total_teams;
      metricAllRounders.textContent = data.all_rounders;

      if (data.orange_cap) {
        metricOrangeCapName.textContent = data.orange_cap.player_name;
        metricOrangeCapStats.textContent = `${data.orange_cap.runs_scored} Runs (Avg: ${data.orange_cap.batting_average || '-'})`;
      } else {
        metricOrangeCapName.textContent = '--';
        metricOrangeCapStats.textContent = '-- Runs';
      }

      if (data.purple_cap) {
        metricPurpleCapName.textContent = data.purple_cap.player_name;
        metricPurpleCapStats.textContent = `${data.purple_cap.wickets_taken} Wkts (Econ: ${data.purple_cap.bowling_economy_rate || '-'})`;
      } else {
        metricPurpleCapName.textContent = '--';
        metricPurpleCapStats.textContent = '-- Wkts';
      }
    } else {
      metricTotalPlayers.textContent = '0';
      metricOrangeCapName.textContent = 'No Data';
      metricOrangeCapStats.textContent = 'Please scrape';
      metricPurpleCapName.textContent = 'No Data';
      metricPurpleCapStats.textContent = 'Please scrape';
      metricAllRounders.textContent = '0';
    }
  } catch (err) {
    console.error('Error loading summary:', err);
  }
}

// 2. Fetch & Render Players List
async function loadPlayers() {
  try {
    const params = new URLSearchParams({
      year: state.year,
      team: state.team,
      role: state.role,
      search: state.search,
      sort_by: state.sortBy,
      order: state.order,
      page: state.page,
      page_size: state.pageSize
    });

    const res = await fetch(`/api/players?${params.toString()}`);
    const data = await res.json();

    state.totalPlayers = data.total;
    state.totalPages = data.total_pages;

    renderTable(data.players || []);
    renderCards(data.players || []);
    updatePagination(data.total, data.page, data.page_size);
  } catch (err) {
    console.error('Error loading players:', err);
  }
}

// 3. Render Table View
function renderTable(players) {
  if (!players || players.length === 0) {
    playersTableBody.innerHTML = `
      <tr>
        <td colspan="16" style="text-align: center; padding: 3rem; color: var(--text-muted);">
          No player records found. Try adjusting filters or click <strong>Run Scraper</strong>.
        </td>
      </tr>
    `;
    return;
  }

  let html = '';
  players.forEach(p => {
    const defaultImg = "https://static.cricbuzz.com/a/img/v1/i1/c170677/ms-dhoni.jpg?d=low&p=gthumb";
    const imgUrl = p.player_image_url || defaultImg;
    const isAllRounder = p.runs_scored !== null && p.wickets_taken !== null;

    html += `
      <tr onclick="openPlayerModal('${p.player_id}')">
        <td>
          <div class="player-cell">
            <img src="${imgUrl}" alt="${p.player_name}" class="player-avatar" onerror="this.src='${defaultImg}'" loading="lazy">
            <div class="player-info">
              <span class="player-name">
                ${p.player_name}
                ${isAllRounder ? '<span style="font-size: 0.65rem; background: rgba(0,229,255,0.2); color: #00e5ff; padding: 1px 5px; border-radius: 4px; margin-left: 4px;">ALL-ROUNDER</span>' : ''}
              </span>
              ${getTeamBadge(p.team_code, p.team_name)}
            </div>
          </div>
        </td>
        <td><strong>${p.team_name}</strong></td>
        <td>${formatVal(p.matches_played)}</td>
        
        <!-- Batting Stats -->
        <td>${formatVal(p.batting_innings)}</td>
        <td class="stat-runs">${formatVal(p.runs_scored)}</td>
        <td>${formatVal(p.batting_average)}</td>
        <td>${formatVal(p.batting_strike_rate)}</td>
        <td>${formatVal(p.fours)}</td>
        <td>${formatVal(p.sixes)}</td>
        
        <!-- Bowling Stats -->
        <td>${formatVal(p.bowling_innings)}</td>
        <td>${formatVal(p.overs_bowled)}</td>
        <td class="stat-wkts">${formatVal(p.wickets_taken)}</td>
        <td>${formatVal(p.runs_conceded)}</td>
        <td>${formatVal(p.bowling_average)}</td>
        <td>${formatVal(p.bowling_economy_rate)}</td>
        <td>${formatVal(p.bowling_strike_rate)}</td>
      </tr>
    `;
  });

  playersTableBody.innerHTML = html;
}

// 4. Render Cards View
function renderCards(players) {
  if (!players || players.length === 0) {
    gridView.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
        No player records found.
      </div>
    `;
    return;
  }

  let html = '';
  players.forEach(p => {
    const defaultImg = "https://static.cricbuzz.com/a/img/v1/i1/c170677/ms-dhoni.jpg?d=low&p=gthumb";
    const imgUrl = p.player_image_url || defaultImg;
    const isAllRounder = p.runs_scored !== null && p.wickets_taken !== null;

    html += `
      <div class="player-card" onclick="openPlayerModal('${p.player_id}')">
        <div class="player-card-header">
          <img src="${imgUrl}" alt="${p.player_name}" class="player-card-avatar" onerror="this.src='${defaultImg}'" loading="lazy">
          <div class="player-card-title">
            <h3>${p.player_name}</h3>
            <div class="player-card-team">${p.team_name} (${p.team_code || ''})</div>
            ${isAllRounder ? '<span style="font-size: 0.65rem; background: rgba(0,229,255,0.2); color: #00e5ff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">★ ALL-ROUNDER</span>' : ''}
          </div>
        </div>

        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.75rem;">
          Matches Played: <strong>${formatVal(p.matches_played, '0')}</strong>
        </div>

        <div class="player-stats-split">
          <!-- Batting Box -->
          <div>
            <div class="stat-box-title">🏏 Batting</div>
            <div class="stat-box-num stat-runs">${formatVal(p.runs_scored, '-')}</div>
            <div class="stat-box-detail">Avg: ${formatVal(p.batting_average, '-')}</div>
            <div class="stat-box-detail">SR: ${formatVal(p.batting_strike_rate, '-')}</div>
            <div class="stat-box-detail">4s/6s: ${formatVal(p.fours, '0')}/${formatVal(p.sixes, '0')}</div>
          </div>

          <!-- Bowling Box -->
          <div>
            <div class="stat-box-title">🎯 Bowling</div>
            <div class="stat-box-num stat-wkts">${formatVal(p.wickets_taken, '-')}</div>
            <div class="stat-box-detail">Econ: ${formatVal(p.bowling_economy_rate, '-')}</div>
            <div class="stat-box-detail">Avg: ${formatVal(p.bowling_average, '-')}</div>
            <div class="stat-box-detail">Overs: ${formatVal(p.overs_bowled, '-')}</div>
          </div>
        </div>
      </div>
    `;
  });

  gridView.innerHTML = html;
}

// 5. Update Pagination Bar
function updatePagination(total, page, pageSize) {
  if (total === 0) {
    paginationInfo.textContent = 'No records';
    prevPageBtn.disabled = true;
    nextPageBtn.disabled = true;
    currentPageNum.textContent = 'Page 1';
    return;
  }

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  paginationInfo.textContent = `Showing ${start}-${end} of ${total} players`;
  currentPageNum.textContent = `Page ${page} of ${state.totalPages || 1}`;

  prevPageBtn.disabled = (page <= 1);
  nextPageBtn.disabled = (page >= state.totalPages);
}

// 6. Player Detail Modal
async function openPlayerModal(playerId) {
  try {
    const res = await fetch(`/api/players/${playerId}?year=${state.year}`);
    if (!res.ok) return;
    const p = await res.json();

    modalPlayerName.textContent = p.player_name;
    const defaultImg = "https://static.cricbuzz.com/a/img/v1/i1/c170677/ms-dhoni.jpg?d=low&p=gthumb";
    const imgUrl = p.player_image_url || defaultImg;

    modalPlayerContent.innerHTML = `
      <div style="display: flex; gap: 1.25rem; align-items: center; margin-bottom: 1.5rem;">
        <img src="${imgUrl}" alt="${p.player_name}" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--accent-cyan); background: #192336;">
        <div>
          <h2 style="font-size: 1.3rem; font-weight: 800;">${p.player_name}</h2>
          <div style="font-size: 0.9rem; color: var(--accent-gold); font-weight: 700;">${p.team_name}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">Season: IPL ${p.year} &bull; Matches: ${formatVal(p.matches_played)}</div>
          ${p.profile_url ? `<a href="${p.profile_url}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: var(--accent-cyan); text-decoration: none;">View Cricbuzz Profile ↗</a>` : ''}
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
        <div style="background: rgba(0, 180, 219, 0.08); border: 1px solid rgba(0, 180, 219, 0.2); padding: 1rem; border-radius: var(--radius-md);">
          <h4 style="color: #40c4ff; margin-bottom: 0.75rem; font-size: 0.85rem; text-transform: uppercase;">Batting Record</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.82rem;">
            <div>Innings: <strong>${formatVal(p.batting_innings)}</strong></div>
            <div>Runs: <strong class="stat-runs">${formatVal(p.runs_scored)}</strong></div>
            <div>Average: <strong>${formatVal(p.batting_average)}</strong></div>
            <div>Strike Rate: <strong>${formatVal(p.batting_strike_rate)}</strong></div>
            <div>Fours (4s): <strong>${formatVal(p.fours)}</strong></div>
            <div>Sixes (6s): <strong>${formatVal(p.sixes)}</strong></div>
          </div>
        </div>

        <div style="background: rgba(179, 136, 255, 0.08); border: 1px solid rgba(179, 136, 255, 0.2); padding: 1rem; border-radius: var(--radius-md);">
          <h4 style="color: #b388ff; margin-bottom: 0.75rem; font-size: 0.85rem; text-transform: uppercase;">Bowling Record</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.82rem;">
            <div>Innings: <strong>${formatVal(p.bowling_innings)}</strong></div>
            <div>Overs: <strong>${formatVal(p.overs_bowled)}</strong></div>
            <div>Wickets: <strong class="stat-wkts">${formatVal(p.wickets_taken)}</strong></div>
            <div>Runs Conceded: <strong>${formatVal(p.runs_conceded)}</strong></div>
            <div>Economy: <strong>${formatVal(p.bowling_economy_rate)}</strong></div>
            <div>Bowling SR: <strong>${formatVal(p.bowling_strike_rate)}</strong></div>
          </div>
        </div>
      </div>
    `;

    playerDetailModal.classList.add('active');
  } catch (err) {
    console.error('Error opening player details:', err);
  }
}

// 7. Scrape Monitoring & Polling
async function checkScrapeStatus() {
  try {
    const res = await fetch('/api/scrape/status');
    const data = await res.json();

    if (data.status === 'running') {
      state.isScraping = true;
      scrapeBanner.style.display = 'flex';
      scrapeBannerTitle.textContent = `Scraping IPL ${data.year}...`;
      scrapeBannerStep.textContent = data.current_step || 'Processing statistics tables...';

      // Update terminal logs in modal if open
      if (data.logs && data.logs.length > 0) {
        terminalLogs.innerHTML = data.logs.join('<br>');
        terminalLogs.scrollTop = terminalLogs.scrollHeight;
      }

      if (!state.pollInterval) {
        state.pollInterval = setInterval(checkScrapeStatus, 2000);
      }
    } else if (state.isScraping && (data.status === 'completed' || data.status === 'failed')) {
      state.isScraping = false;
      if (state.pollInterval) {
        clearInterval(state.pollInterval);
        state.pollInterval = null;
      }

      scrapeBanner.style.display = 'none';
      if (data.status === 'completed') {
        terminalLogs.innerHTML += `<br>[System] Scrape completed! Scraped ${data.players_count} players.`;
        terminalLogs.scrollTop = terminalLogs.scrollHeight;
        loadSummary();
        loadPlayers();
      } else {
        terminalLogs.innerHTML += `<br>[System] ERROR: ${data.error}`;
        terminalLogs.scrollTop = terminalLogs.scrollHeight;
      }
    }
  } catch (err) {
    console.error('Error polling scrape status:', err);
  }
}

// 8. Trigger Scrape
async function startScrape() {
  const year = parseInt(modalYearSelect.value);
  const fetchImages = document.getElementById('modalFetchImagesCheck').checked;

  startScrapeBtn.disabled = true;
  startScrapeBtn.textContent = '⏳ Starting Scraper...';
  terminalLogs.innerHTML = `[System] Initiating scrape job for IPL ${year}...`;

  try {
    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, fetch_images: fetchImages, max_workers: 4 })
    });

    if (res.ok) {
      checkScrapeStatus();
    } else {
      const err = await res.json();
      terminalLogs.innerHTML += `<br>[System] Error: ${err.message || 'Could not start'}`;
    }
  } catch (err) {
    terminalLogs.innerHTML += `<br>[System] Network error: ${err.message}`;
  } finally {
    startScrapeBtn.disabled = false;
    startScrapeBtn.textContent = '🚀 Start Full Scrape Now';
  }
}

// 9. Scheduler Settings
async function loadSchedulerStatus() {
  try {
    const res = await fetch('/api/schedule');
    const data = await res.json();
    scheduleEnableCheck.checked = data.enabled;
    scheduleIntervalSelect.value = data.interval_hours || 12;
    document.getElementById('schedStatusText').textContent = data.enabled ? 'Enabled' : 'Disabled';
    document.getElementById('schedStatusText').style.color = data.enabled ? 'var(--accent-green)' : 'var(--text-muted)';
    document.getElementById('schedLastRun').textContent = data.last_run || 'Never';
    document.getElementById('schedNextRun').textContent = data.next_run || (data.enabled ? 'Calculating...' : '--');
  } catch (err) {
    console.error('Error loading scheduler:', err);
  }
}

async function saveSchedulerSettings() {
  const enabled = scheduleEnableCheck.checked;
  const interval = parseInt(scheduleIntervalSelect.value);
  try {
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, interval_hours: interval, year: state.year })
    });
    if (res.ok) {
      loadSchedulerStatus();
      schedulerModal.classList.remove('active');
    }
  } catch (err) {
    alert('Error saving scheduler configuration: ' + err.message);
  }
}

// Event Listeners Initialization
function initEventListeners() {
  // Season change
  seasonSelect.addEventListener('change', (e) => {
    state.year = parseInt(e.target.value);
    modalYearSelect.value = state.year;
    state.page = 1;
    loadSummary();
    loadPlayers();
  });

  // Team Filter Pills
  teamFilters.addEventListener('click', (e) => {
    const pill = e.target.closest('.team-pill');
    if (!pill) return;
    teamFilters.querySelectorAll('.team-pill').forEach(el => el.classList.remove('active'));
    pill.classList.add('active');
    state.team = pill.dataset.team;
    state.page = 1;
    loadPlayers();
  });

  // Role Filter Tabs
  roleTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.role-tab');
    if (!tab) return;
    roleTabs.querySelectorAll('.role-tab').forEach(el => el.classList.remove('active'));
    tab.classList.add('active');
    state.role = tab.dataset.role;
    state.page = 1;
    loadPlayers();
  });

  // Search input debounce
  let searchTimeout = null;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page = 1;
      loadPlayers();
    }, 250);
  });

  // Table header sorting
  document.querySelectorAll('.stats-table th').forEach(th => {
    th.addEventListener('click', () => {
      const sortKey = th.dataset.sort;
      if (!sortKey) return;
      if (state.sortBy === sortKey) {
        state.order = (state.order === 'desc') ? 'asc' : 'desc';
      } else {
        state.sortBy = sortKey;
        state.order = (sortKey === 'bowling_economy_rate' || sortKey === 'bowling_average') ? 'asc' : 'desc';
      }
      loadPlayers();
    });
  });

  // View mode toggling
  viewTableBtn.addEventListener('click', () => {
    viewTableBtn.classList.add('active');
    viewGridBtn.classList.remove('active');
    tableView.style.display = 'block';
    gridView.style.display = 'none';
    state.viewMode = 'table';
  });

  viewGridBtn.addEventListener('click', () => {
    viewGridBtn.classList.add('active');
    viewTableBtn.classList.remove('active');
    tableView.style.display = 'none';
    gridView.style.display = 'grid';
    state.viewMode = 'grid';
  });

  // Pagination buttons
  prevPageBtn.addEventListener('click', () => {
    if (state.page > 1) {
      state.page--;
      loadPlayers();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    if (state.page < state.totalPages) {
      state.page++;
      loadPlayers();
    }
  });

  // Download buttons
  downloadCsvBtn.addEventListener('click', () => {
    window.location.href = `/api/download/csv?year=${state.year}`;
  });

  downloadJsonBtn.addEventListener('click', () => {
    window.location.href = `/api/download/json?year=${state.year}`;
  });

  // Modal open / close handlers
  openScrapeModalBtn.addEventListener('click', () => {
    scraperModal.classList.add('active');
  });

  closeScraperModalBtn.addEventListener('click', () => {
    scraperModal.classList.remove('active');
  });

  startScrapeBtn.addEventListener('click', startScrape);

  openScheduleModalBtn.addEventListener('click', () => {
    loadSchedulerStatus();
    schedulerModal.classList.add('active');
  });

  closeSchedulerModalBtn.addEventListener('click', () => {
    schedulerModal.classList.remove('active');
  });

  saveScheduleBtn.addEventListener('click', saveSchedulerSettings);

  closePlayerModalBtn.addEventListener('click', () => {
    playerDetailModal.classList.remove('active');
  });

  // Close modals on clicking overlay backdrop
  [scraperModal, schedulerModal, playerDetailModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Scrape banner button
  viewScrapeLogsBtn.addEventListener('click', () => {
    scraperModal.classList.add('active');
  });
}

// Application Entrypoint
document.addEventListener('DOMContentLoaded', () => {
  initEventListeners();
  loadSummary();
  loadPlayers();
  checkScrapeStatus();
});
