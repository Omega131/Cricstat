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
  pollInterval: null,
  chartsVisible: true
};

let chartInstances = {};
let allSeasonPlayers = [];

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

// Compare Modal
const playerCompareModal = document.getElementById('playerCompareModal');
const openCompareModalBtn = document.getElementById('openCompareModalBtn');
const closeCompareModalBtn = document.getElementById('closeCompareModalBtn');
const comparePlayer1Select = document.getElementById('comparePlayer1Select');
const comparePlayer2Select = document.getElementById('comparePlayer2Select');
const compareResultContainer = document.getElementById('compareResultContainer');

// Downloads
const downloadCsvBtn = document.getElementById('downloadCsvBtn');
const downloadFilteredCsvBtn = document.getElementById('downloadFilteredCsvBtn');
const downloadJsonBtn = document.getElementById('downloadJsonBtn');

// Banner & Charts Toggle
const scrapeBanner = document.getElementById('scrapeBanner');
const scrapeBannerTitle = document.getElementById('scrapeBannerTitle');
const scrapeBannerStep = document.getElementById('scrapeBannerStep');
const viewScrapeLogsBtn = document.getElementById('viewScrapeLogsBtn');
const toggleChartsBtn = document.getElementById('toggleChartsBtn');
const chartsContainer = document.getElementById('chartsContainer');
const chartsToggleText = document.getElementById('chartsToggleText');
const chartsToggleIcon = document.getElementById('chartsToggleIcon');

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

    // Also populate allSeasonPlayers cache for comparison
    loadAllPlayersForComparison(false);
  } catch (err) {
    console.error('Error loading players:', err);
  }
}

// 3. Render Table View
function renderTable(players) {
  if (!players || players.length === 0) {
    playersTableBody.innerHTML = `
      <tr>
        <td colspan="19" style="text-align: center; padding: 3rem; color: var(--text-muted);">
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
    const bndStr = p.boundary_percentage ? `${p.boundary_percentage}%` : null;

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
        <td>${formatVal(bndStr)}</td>
        
        <!-- Bowling Stats -->
        <td>${formatVal(p.bowling_innings)}</td>
        <td>${formatVal(p.overs_bowled)}</td>
        <td class="stat-wkts">${formatVal(p.wickets_taken)}</td>
        <td>${formatVal(p.runs_conceded)}</td>
        <td>${formatVal(p.bowling_average)}</td>
        <td>${formatVal(p.bowling_economy_rate)}</td>
        <td>${formatVal(p.bowling_strike_rate)}</td>

        <!-- Advanced Impact Metric -->
        <td class="stat-impact">${formatVal(p.impact_score)}</td>

        <!-- Compare Action Button -->
        <td style="text-align: center;">
          <button class="btn-compare-mini" onclick="event.stopPropagation(); openCompareWithPlayer('${p.player_id}')" title="Compare this player">
            ⚖ Compare
          </button>
        </td>
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
    const bndStr = p.boundary_percentage ? `${p.boundary_percentage}%` : '-';

    html += `
      <div class="player-card" onclick="openPlayerModal('${p.player_id}')">
        <div class="player-card-header">
          <img src="${imgUrl}" alt="${p.player_name}" class="player-card-avatar" onerror="this.src='${defaultImg}'" loading="lazy">
          <div class="player-card-title">
            <h3>${p.player_name}</h3>
            <div class="player-card-team">${p.team_name} (${p.team_code || ''})</div>
            <div style="display: flex; gap: 4px; margin-top: 4px; flex-wrap: wrap;">
              ${isAllRounder ? '<span style="font-size: 0.65rem; background: rgba(0,229,255,0.2); color: #00e5ff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">★ ALL-ROUNDER</span>' : ''}
              ${p.impact_score ? `<span style="font-size: 0.65rem; background: rgba(255,215,0,0.2); color: #ffd700; padding: 2px 6px; border-radius: 4px; font-weight: 700;">MVP: ${p.impact_score}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="font-size: 0.78rem; color: var(--text-muted); margin-bottom: 0.75rem; display: flex; justify-content: space-between;">
          <span>Matches: <strong>${formatVal(p.matches_played, '0')}</strong></span>
          <span>Boundary %: <strong>${bndStr}</strong></span>
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

        <button class="btn-compare-card" onclick="event.stopPropagation(); openCompareWithPlayer('${p.player_id}')">
          ⚖ Compare Player
        </button>
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
          <div style="font-size: 0.9rem; color: var(--accent-gold); font-weight: 700;">${p.team_name} (${p.team_code})</div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">
            Season: IPL ${p.year} &bull; Matches: ${formatVal(p.matches_played)} &bull; 
            MVP Impact: <strong style="color: #ffd700;">${formatVal(p.impact_score)}</strong>
          </div>
          <div style="margin-top: 6px; display: flex; gap: 10px; align-items: center;">
            ${p.profile_url ? `<a href="${p.profile_url}" target="_blank" rel="noopener" style="font-size: 0.75rem; color: var(--accent-cyan); text-decoration: none;">View Cricbuzz Profile ↗</a>` : ''}
            <button class="btn-compare-mini" onclick="playerDetailModal.classList.remove('active'); openCompareWithPlayer('${p.player_id}')">
              ⚖ Compare in Head-to-Head
            </button>
          </div>
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
            <div>Boundary %: <strong>${p.boundary_percentage ? p.boundary_percentage + '%' : '-'}</strong></div>
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

// 7. Interactive Analytics Charts (Chart.js)
let chartRetryCount = 0;
async function loadCharts() {
  if (typeof Chart === 'undefined') {
    if (chartRetryCount < 10) {
      chartRetryCount++;
      setTimeout(loadCharts, 300);
      return;
    }
    console.warn('Chart.js library is not available.');
    return;
  }

  const canvasRuns = document.getElementById('orangeCapChart');
  const canvasWkts = document.getElementById('purpleCapChart');
  const canvasMvp = document.getElementById('mvpChart');
  const canvasEcon = document.getElementById('economyChart');

  if (!canvasRuns || !canvasWkts || !canvasMvp || !canvasEcon) return;

  try {
    const res = await fetch(`/api/analytics/charts?year=${state.year}`);
    if (!res.ok) return;
    const data = await res.json();

    // Chart common styling
    Chart.defaults.color = '#8896ab';
    Chart.defaults.font.family = "'Inter', sans-serif";

    // 1. Orange Cap Chart (Top 10 Runs)
    if (chartInstances.runs) chartInstances.runs.destroy();
    chartInstances.runs = new Chart(canvasRuns.getContext('2d'), {
      type: 'bar',
      data: {
        labels: (data.top_runs || []).map(p => `${p.name} (${p.team})`),
        datasets: [{
          label: 'Runs Scored',
          data: (data.top_runs || []).map(p => p.runs),
          backgroundColor: 'rgba(255, 111, 0, 0.8)',
          borderColor: '#ff6f00',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function(ctx) {
                const p = (data.top_runs || [])[ctx.dataIndex];
                if (!p) return '';
                return `SR: ${p.sr || '-'} | Avg: ${p.avg || '-'} | Bnd: ${p.boundary_pct ? p.boundary_pct + '%' : '-'}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { grid: { display: false } }
        }
      }
    });

    // 2. Purple Cap Chart (Top 10 Wickets)
    if (chartInstances.wickets) chartInstances.wickets.destroy();
    chartInstances.wickets = new Chart(canvasWkts.getContext('2d'), {
      type: 'bar',
      data: {
        labels: (data.top_wickets || []).map(p => `${p.name} (${p.team})`),
        datasets: [{
          label: 'Wickets Taken',
          data: (data.top_wickets || []).map(p => p.wickets),
          backgroundColor: 'rgba(123, 31, 162, 0.8)',
          borderColor: '#7b1fa2',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function(ctx) {
                const p = (data.top_wickets || [])[ctx.dataIndex];
                if (!p) return '';
                return `Econ: ${p.econ || '-'} | Overs: ${p.overs || '-'} | Avg: ${p.avg || '-'}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.06)' } },
          y: { grid: { display: false } }
        }
      }
    });

    // 3. MVP Impact Chart
    if (chartInstances.mvp) chartInstances.mvp.destroy();
    chartInstances.mvp = new Chart(canvasMvp.getContext('2d'), {
      type: 'bar',
      data: {
        labels: (data.top_impact || []).map(p => `${p.name} (${p.team})`),
        datasets: [{
          label: 'Impact Score',
          data: (data.top_impact || []).map(p => p.impact_score),
          backgroundColor: 'rgba(255, 215, 0, 0.8)',
          borderColor: '#ffd700',
          borderWidth: 1,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: function(ctx) {
                const p = (data.top_impact || [])[ctx.dataIndex];
                if (!p) return '';
                return `Runs: ${p.runs || 0} | Wkts: ${p.wickets || 0}`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } },
          y: { grid: { color: 'rgba(255,255,255,0.06)' } }
        }
      }
    });

    // 4. Economy vs Wickets Scatter Plot
    if (chartInstances.economy) chartInstances.economy.destroy();
    chartInstances.economy = new Chart(canvasEcon.getContext('2d'), {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Bowlers (>= 4 Overs)',
          data: (data.econ_vs_wickets || []).map(p => ({ x: p.econ, y: p.wickets, player: p.name, team: p.team, overs: p.overs })),
          backgroundColor: 'rgba(0, 229, 255, 0.75)',
          borderColor: '#00e5ff',
          pointRadius: 6,
          pointHoverRadius: 9
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: function(ctx) {
                const raw = ctx.raw;
                return `${raw.player} (${raw.team}): ${raw.y} Wkts, Econ: ${raw.x}, Overs: ${raw.overs}`;
              }
            }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Economy Rate (Lower is Better)' },
            grid: { color: 'rgba(255,255,255,0.06)' }
          },
          y: {
            title: { display: true, text: 'Wickets Taken' },
            grid: { color: 'rgba(255,255,255,0.06)' }
          }
        }
      }
    });

  } catch (err) {
    console.error('Error loading charts:', err);
  }
}

// 8. Head-to-Head Player Comparison
async function loadAllPlayersForComparison(forceReload = false) {
  if (allSeasonPlayers.length > 0 && !forceReload) {
    populateCompareDropdowns();
    return;
  }

  try {
    const res = await fetch(`/api/players?year=${state.year}&page=1&page_size=200&sort_by=runs_scored`);
    const data = await res.json();
    allSeasonPlayers = data.players || [];
    populateCompareDropdowns();
  } catch (err) {
    console.error('Error loading players for compare:', err);
  }
}

function populateCompareDropdowns() {
  if (!allSeasonPlayers || allSeasonPlayers.length === 0) return;

  const currentVal1 = comparePlayer1Select.value;
  const currentVal2 = comparePlayer2Select.value;

  // Group by team for better usability
  let optionsHtml = '';
  const sorted = [...allSeasonPlayers].sort((a, b) => a.player_name.localeCompare(b.player_name));
  sorted.forEach(p => {
    optionsHtml += `<option value="${p.player_id}">${p.player_name} (${p.team_code || p.team_name})</option>`;
  });

  comparePlayer1Select.innerHTML = optionsHtml;
  comparePlayer2Select.innerHTML = optionsHtml;

  if (currentVal1 && sorted.some(p => p.player_id === currentVal1)) {
    comparePlayer1Select.value = currentVal1;
  } else if (sorted.length >= 1) {
    comparePlayer1Select.selectedIndex = 0;
  }

  if (currentVal2 && sorted.some(p => p.player_id === currentVal2)) {
    comparePlayer2Select.value = currentVal2;
  } else if (sorted.length >= 2) {
    comparePlayer2Select.selectedIndex = 1;
  }

  renderHeadToHead();
}

function openCompareWithPlayer(playerId) {
  loadAllPlayersForComparison(false).then(() => {
    if (playerId) {
      comparePlayer1Select.value = playerId;
    }
    renderHeadToHead();
    playerCompareModal.classList.add('active');
  });
}

function renderHeadToHead() {
  const p1Id = comparePlayer1Select.value;
  const p2Id = comparePlayer2Select.value;
  if (!p1Id || !p2Id) return;

  const p1 = allSeasonPlayers.find(p => String(p.player_id) === String(p1Id));
  const p2 = allSeasonPlayers.find(p => String(p.player_id) === String(p2Id));

  if (!p1 || !p2) {
    // If not in cache, fallback to API
    fetch(`/api/players/compare?player1_id=${p1Id}&player2_id=${p2Id}&year=${state.year}`)
      .then(r => r.json())
      .then(d => {
        if (d.player1 && d.player2) {
          renderComparisonView(d.player1, d.player2);
        }
      })
      .catch(console.error);
    return;
  }

  renderComparisonView(p1, p2);
}

function renderComparisonView(p1, p2) {
  const defaultImg = "https://static.cricbuzz.com/a/img/v1/i1/c170677/ms-dhoni.jpg?d=low&p=gthumb";

  function makeRow(label, v1, v2, higherIsBetter = true) {
    const val1 = (v1 !== null && v1 !== undefined && v1 !== '') ? Number(v1) : null;
    const val2 = (v2 !== null && v2 !== undefined && v2 !== '') ? Number(v2) : null;
    let w1 = false;
    let w2 = false;

    if (val1 !== null && val2 !== null) {
      if (higherIsBetter) {
        if (val1 > val2) w1 = true;
        else if (val2 > val1) w2 = true;
      } else {
        if (val1 < val2) w1 = true;
        else if (val2 < val1) w2 = true;
      }
    }

    const d1 = v1 !== null && v1 !== undefined ? v1 : '-';
    const d2 = v2 !== null && v2 !== undefined ? v2 : '-';

    return `
      <div class="compare-stat-row">
        <div style="flex: 1; text-align: left; ${w1 ? 'color: var(--accent-cyan); font-weight: 800;' : 'color: var(--text-main);'}">
          ${d1} ${w1 ? '★' : ''}
        </div>
        <div style="flex: 1.4; text-align: center; color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">
          ${label}
        </div>
        <div style="flex: 1; text-align: right; ${w2 ? 'color: var(--accent-cyan); font-weight: 800;' : 'color: var(--text-main);'}">
          ${w2 ? '★' : ''} ${d2}
        </div>
      </div>
    `;
  }

  compareResultContainer.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 1rem; align-items: center; margin-bottom: 1.25rem; text-align: center;">
      <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <img src="${p1.player_image_url || defaultImg}" alt="${p1.player_name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 0.5rem; border: 2px solid var(--accent-cyan); background: #192336;">
        <h3 style="font-size: 1.05rem; font-weight: 800;">${p1.player_name}</h3>
        <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700;">${p1.team_name} (${p1.team_code})</div>
      </div>

      <div style="font-weight: 900; font-size: 1.4rem; color: var(--accent-gold);">VS</div>

      <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <img src="${p2.player_image_url || defaultImg}" alt="${p2.player_name}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; margin-bottom: 0.5rem; border: 2px solid var(--accent-purple); background: #192336;">
        <h3 style="font-size: 1.05rem; font-weight: 800;">${p2.player_name}</h3>
        <div style="font-size: 0.8rem; color: var(--accent-gold); font-weight: 700;">${p2.team_name} (${p2.team_code})</div>
      </div>
    </div>

    <div style="background: rgba(0,0,0,0.3); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
      ${makeRow("MVP Impact Score", p1.impact_score, p2.impact_score, true)}
      ${makeRow("Runs Scored", p1.runs_scored, p2.runs_scored, true)}
      ${makeRow("Batting Average", p1.batting_average, p2.batting_average, true)}
      ${makeRow("Strike Rate", p1.batting_strike_rate, p2.batting_strike_rate, true)}
      ${makeRow("Fours (4s)", p1.fours, p2.fours, true)}
      ${makeRow("Sixes (6s)", p1.sixes, p2.sixes, true)}
      ${makeRow("Boundary %", p1.boundary_percentage, p2.boundary_percentage, true)}
      ${makeRow("Wickets Taken", p1.wickets_taken, p2.wickets_taken, true)}
      ${makeRow("Bowling Economy", p1.bowling_economy_rate, p2.bowling_economy_rate, false)}
      ${makeRow("Bowling Average", p1.bowling_average, p2.bowling_average, false)}
      ${makeRow("Matches Played", p1.matches_played, p2.matches_played, true)}
    </div>
  `;
}

// 9. Export Current Filtered View (Blob Download)
async function exportFilteredCsv() {
  const origHtml = downloadFilteredCsvBtn.innerHTML;
  downloadFilteredCsvBtn.disabled = true;
  downloadFilteredCsvBtn.innerHTML = '<span>⏳</span> Exporting...';

  try {
    const params = new URLSearchParams({
      year: state.year,
      team: state.team || 'all',
      role: state.role || 'all',
      search: state.search || '',
      sort_by: state.sortBy || 'runs_scored',
      order: state.order || 'desc'
    });

    const res = await fetch(`/api/download/filtered-csv?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = blobUrl;

    const teamPrefix = (state.team && state.team.toLowerCase() !== 'all') ? `${state.team.toUpperCase()}_` : '';
    const rolePrefix = (state.role && state.role.toLowerCase() !== 'all') ? `${state.role.toUpperCase()}_` : '';
    a.download = `ipl_${state.year}_${teamPrefix}${rolePrefix}players_export.csv`;

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    }, 150);
  } catch (err) {
    console.error('Error during filtered CSV export:', err);
    // Fallback: direct browser navigation
    window.location.href = `/api/download/filtered-csv?year=${state.year}&team=${state.team}&role=${state.role}&search=${encodeURIComponent(state.search)}`;
  } finally {
    downloadFilteredCsvBtn.disabled = false;
    downloadFilteredCsvBtn.innerHTML = origHtml;
  }
}

// 10. Scrape Monitoring & Polling
async function checkScrapeStatus() {
  try {
    const res = await fetch('/api/scrape/status');
    const data = await res.json();

    if (data.status === 'running') {
      state.isScraping = true;
      scrapeBanner.style.display = 'flex';
      scrapeBannerTitle.textContent = `Scraping IPL ${data.year}...`;
      scrapeBannerStep.textContent = data.current_step || 'Processing statistics tables...';

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
        loadCharts();
        loadAllPlayersForComparison(true);
      } else {
        terminalLogs.innerHTML += `<br>[System] ERROR: ${data.error}`;
        terminalLogs.scrollTop = terminalLogs.scrollHeight;
      }
    }
  } catch (err) {
    console.error('Error polling scrape status:', err);
  }
}

// 11. Trigger Scrape
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

// 12. Scheduler Settings
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

// 13. Dynamic Team Filter Update (For Historical Teams Support)
async function updateTeamFilters(year) {
  try {
    const res = await fetch(`/api/teams?year=${year}`);
    const data = await res.json();
    const teams = data.teams || {};

    let html = `<button class="team-pill ${state.team === 'all' ? 'active' : ''}" data-team="all">All Teams</button>`;
    for (const [id, t] of Object.entries(teams)) {
      const isActive = state.team.toUpperCase() === t.code.toUpperCase() ? 'active' : '';
      html += `<button class="team-pill ${isActive}" data-team="${t.code}" style="--team-color: ${t.primary_color};">${t.code}</button>`;
    }
    teamFilters.innerHTML = html;
  } catch (err) {
    console.error('Error updating team filters:', err);
  }
}

// Event Listeners Initialization
function initEventListeners() {
  // Season change
  seasonSelect.addEventListener('change', (e) => {
    state.year = parseInt(e.target.value);
    modalYearSelect.value = state.year;
    state.page = 1;
    state.team = 'all';
    updateTeamFilters(state.year);
    loadSummary();
    loadPlayers();
    loadCharts();
    loadAllPlayersForComparison(true);
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

  // Charts Toggle Button
  toggleChartsBtn.addEventListener('click', () => {
    state.chartsVisible = !state.chartsVisible;
    chartsContainer.style.display = state.chartsVisible ? 'grid' : 'none';
    chartsToggleText.textContent = state.chartsVisible ? 'Hide Charts' : 'Show Charts';
    chartsToggleIcon.textContent = state.chartsVisible ? '📉' : '📊';
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

  // Download complete raw dumps
  downloadCsvBtn.addEventListener('click', () => {
    window.location.href = `/api/download/csv?year=${state.year}`;
  });

  downloadJsonBtn.addEventListener('click', () => {
    window.location.href = `/api/download/json?year=${state.year}`;
  });

  // Download filtered view CSV (Reliable blob download)
  downloadFilteredCsvBtn.addEventListener('click', exportFilteredCsv);

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

  // Compare Modal Handlers
  openCompareModalBtn.addEventListener('click', () => {
    loadAllPlayersForComparison(false).then(() => {
      renderHeadToHead();
      playerCompareModal.classList.add('active');
    });
  });

  closeCompareModalBtn.addEventListener('click', () => {
    playerCompareModal.classList.remove('active');
  });

  comparePlayer1Select.addEventListener('change', renderHeadToHead);
  comparePlayer2Select.addEventListener('change', renderHeadToHead);

  // Close modals on clicking overlay backdrop
  [scraperModal, schedulerModal, playerDetailModal, playerCompareModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      [scraperModal, schedulerModal, playerDetailModal, playerCompareModal].forEach(modal => {
        if (modal) modal.classList.remove('active');
      });
    }
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
  loadCharts();
  checkScrapeStatus();
});
