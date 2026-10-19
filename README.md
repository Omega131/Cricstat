# 🏏 IPL Cricket Player Statistics Web Scraper & Analytics Dashboard

A robust, full-stack backend application and real-time dashboard that scrapes IPL cricket player statistics from **Cricbuzz**, handles complex cricket data schemas, unifies batting and bowling records for all players, and generates complete **CSV and JSON data dumps**.

---

## 🚀 Key Features & Requirements Matrix

| Requirement | Implementation Details | Status |
| :--- | :--- | :---: |
| **Complete Player Coverage** | Scrapes every player across all tournament tables; not restricted to top 5 or 10. | ✅ **190 Players** |
| **All 10 IPL Franchises** | Full rosters across CSK, RCB, MI, KKR, RR, PBKS, SRH, LSG, GT, and DC. | ✅ **10/10 Teams** |
| **Unified Player Records** | Automatically combines batting and bowling records by player ID into a single unified record. | ✅ **65 All-Rounders** |
| **Player Info Fields** | Player name, team name, team code, Cricbuzz portrait image URL, matches played, batting & bowling innings. | ✅ **100% Extracted** |
| **Batting Statistics** | Runs scored, batting average, batting strike rate, 4s, and 6s. | ✅ **All Fields** |
| **Bowling Statistics** | Wickets taken, runs conceded, overs bowled, balls bowled, bowling average, economy rate, bowling strike rate. | ✅ **All Fields** |
| **Data Integrity & Nulls** | Missing / unrecorded values are properly preserved as `None` / `null` (or empty strings in CSV), **never coerced to zero**. | ✅ **Verified** |
| **Data Dumps** | Complete CSV and JSON dumps exported to [`data/ipl_2025_players.csv`](data/ipl_2025_players.csv) and [`data/ipl_2025_players.json`](data/ipl_2025_players.json). | ✅ **Generated** |
| **Bonus: Configurable Year** | Dynamically configurable to any IPL edition (IPL 2008 – 2026) via CLI `--year` or web UI dropdown. | ✅ **Supported** |
| **Bonus: Scheduled Scraping** | Background scheduler worker allowing periodic auto-scraping intervals (e.g. 6h, 12h, 24h). | ✅ **Integrated** |
| **Bonus: Web App & REST API** | FastAPI backend + responsive dark-mode telemetry dashboard served on `http://127.0.0.1:8000`. | ✅ **Running** |

---

## 📊 Summary of Collected Data (IPL 2025)

- **Total Players Scraped**: `190`
- **Franchise Breakdown**:
  - Mumbai Indians (MI): `21`
  - Punjab Kings (PBKS): `21`
  - Chennai Super Kings (CSK): `21`
  - Royal Challengers Bengaluru (RCB): `19`
  - Lucknow Super Giants (LSG): `19`
  - Sunrisers Hyderabad (SRH): `19`
  - Delhi Capitals (DC): `18`
  - Kolkata Knight Riders (KKR): `18`
  - Gujarat Titans (GT): `17`
  - Rajasthan Royals (RR): `17`
- **Orange Cap Leader**: **Sai Sudharsan** (Gujarat Titans) — `759 Runs`, Average: `54.21`, Strike Rate: `156.17`
- **Purple Cap Leader**: **Prasidh Krishna** (Gujarat Titans) — `25 Wickets`, Economy: `8.27`, Average: `19.52`
- **All-Rounders Identified**: `65` players with both batting and bowling records unified.
- **Image Coverage**: `100%` of players matched with official portrait thumbnails on Cricbuzz CDN (`https://static.cricbuzz.com/a/img/v1/...`).

---

## 📁 Repository Structure

```
d:\Projects\Cricstat\
├── app/
│   ├── __init__.py
│   ├── config.py           # IPL seasons map, team branding, and file paths
│   ├── scraper.py          # CricbuzzScraper engine with concurrency & image cache
│   ├── scheduler.py        # Background thread scheduler for periodic automated scraping
│   ├── api.py              # FastAPI REST endpoints for stats, filters, and downloads
│   ├── main.py             # FastAPI entrypoint with static files mounting and CORS
│   └── models.py           # Pydantic schemas for data validation
├── data/
│   ├── ipl_2025_players.csv # Complete CSV dump of all 190 players
│   ├── ipl_2025_players.json# Complete JSON dump with proper null representations
│   └── image_cache.json    # Local image cache to eliminate redundant HTTP calls
├── static/
│   ├── index.html          # Interactive telemetry dashboard with team filters
│   ├── styles.css          # Modern dark-mode styling with glassmorphism & badges
│   ├── app.js              # Vanilla JS frontend with table/grid toggle & modal views
│   └── favicon.svg         # Crisp cricket ball SVG icon
├── run_scraper.py          # Standalone CLI runner script
├── test_scraper.py         # Unit & integration test suite
├── requirements.txt        # Python dependency manifest
└── README.md               # Detailed system documentation
```

---

## 📋 Data Dictionary (CSV & JSON Fields)

| Field Name | Type | Description | Handling of Missing / NA Values |
| :--- | :--- | :--- | :--- |
| `player_id` | `string` | Cricbuzz unique identifier (e.g. `13866`) | Required |
| `player_name` | `string` | Full player name (e.g. `Sai Sudharsan`) | Required |
| `team_name` | `string` | Full franchise name (e.g. `Gujarat Titans`) | Required |
| `team_code` | `string` | Short franchise code (e.g. `GT`, `CSK`) | Required |
| `player_image_url` | `string` | High-res portrait on Cricbuzz CDN | Empty / `null` if unavailable |
| `matches_played` | `integer` | Matches played in the season | Empty / `null` if unrecorded |
| `batting_innings` | `integer` | Innings in which the player batted | Empty / `null` if did not bat |
| `runs_scored` | `integer` | Total runs scored | Empty / `null` if did not bat |
| `batting_average` | `float` | Batting average (`runs / dismissals`) | Empty / `null` if did not bat or not out |
| `batting_strike_rate` | `float` | Batting strike rate (`runs / balls * 100`) | Empty / `null` if did not bat |
| `fours` | `integer` | Number of boundaries (4s) hit | Empty / `null` if did not bat |
| `sixes` | `integer` | Number of maximums (6s) hit | Empty / `null` if did not bat |
| `bowling_innings` | `integer` | Innings in which the player bowled | Empty / `null` if did not bowl |
| `overs_bowled` | `float` | Overs bowled (e.g. `59.0`) | Empty / `null` if did not bowl |
| `balls_bowled` | `integer` | Legal balls bowled (e.g. `354`) | Empty / `null` if did not bowl |
| `wickets_taken` | `integer` | Total wickets taken | Empty / `null` if did not bowl |
| `runs_conceded` | `integer` | Total runs conceded while bowling | Empty / `null` if did not bowl |
| `bowling_average` | `float` | Bowling average (`runs / wickets`) | Empty / `null` if 0 wickets or did not bowl |
| `bowling_economy_rate` | `float` | Economy rate (`runs / overs`) | Empty / `null` if did not bowl |
| `bowling_strike_rate` | `float` | Bowling strike rate (`balls / wickets`) | Empty / `null` if 0 wickets or did not bowl |
| `year` | `integer` | IPL Season edition (e.g. `2025`) | Required |
| `profile_url` | `string` | Official Cricbuzz profile URL | Link to player profile |

---

## 🛠️ Installation & Quickstart

### 1. Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Dependencies installed:
```bash
pip install -r requirements.txt
```

### 2. Standalone CLI Scraper
To scrape any IPL season directly to CSV and JSON:
```bash
# Scrape IPL 2025 (Default)
python run_scraper.py --year 2025

# Scrape IPL 2024
python run_scraper.py --year 2024

# Fast scrape without re-fetching profile images
python run_scraper.py --year 2025 --no-images
```

### 3. Launching the Web Application
Start the FastAPI backend with live dashboard:
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Open your browser and navigate to:
```
http://127.0.0.1:8000
```

---

## 📡 REST API Reference

| Endpoint | Method | Description | Parameters |
| :--- | :---: | :--- | :--- |
| `/api/summary` | `GET` | Season metrics (Total runs, wickets, Orange & Purple Cap) | `year` (int, default: 2025) |
| `/api/players` | `GET` | Paginated, filterable player statistics | `year`, `team`, `role`, `search`, `sort_by`, `order`, `page`, `page_size` |
| `/api/players/{id}` | `GET` | Detailed single player profile with combined stats | `player_id`, `year` |
| `/api/teams` | `GET` | List of all 10 franchises with codes & colors | None |
| `/api/years` | `GET` | List of supported IPL editions and data availability | None |
| `/api/scrape` | `POST` | Trigger asynchronous on-demand scrape job | JSON: `{"year": 2025, "fetch_images": true}` |
| `/api/scrape/status` | `GET` | Real-time progress, percentage, step, and live logs | None |
| `/api/download/csv` | `GET` | Download raw CSV dump file as attachment | `year` (int, default: 2025) |
| `/api/download/json` | `GET` | Download raw JSON dump file as attachment | `year` (int, default: 2025) |
| `/api/schedule` | `GET` / `POST` | Check or update background automated scraping schedule | JSON: `{"enabled": true, "interval_hours": 12}` |

---

## 🧪 Running Automated Tests

Run the built-in test suite to verify data cleaning, series mapping, schema validation, and missing value retention:
```bash
python test_scraper.py
```
Expected output:
```
....
Ran 4 tests in 0.021s
OK
```

---

## 🎥 Walkthrough & Explanation

### How the Scraper Works:
1. **Dynamic Series Mapping**: Resolves the Cricbuzz Series ID based on the requested IPL year (e.g. `2025` -> `9237`, `2024` -> `7607`).
2. **Multi-Table Extraction**: Cricbuzz divides statistics into distinct leaderboard categories (`mostRuns`, `mostWickets`, `lowestEcon`, etc.) and filters them by franchise team IDs (`58` for CSK, `971` for GT, etc.). The scraper queries each team's batting, bowling, and economy endpoints.
3. **Player Merging Pipeline**: Records are merged by Cricbuzz unique player ID. When a player participates in both disciplines (such as Hardik Pandya, Ravindra Jadeja, or Sunil Narine), their batting innings, runs, average, and strike rate are seamlessly joined with their bowling overs, wickets, runs conceded, and economy rate into one unified record.
4. **Missing Value Preservation**: If a player is a pure bowler who never batted (e.g. Prasidh Krishna, Jasprit Bumrah), batting fields are preserved as `None` / empty values in the CSV dump rather than falsely displaying `0.00` average or `0` runs.
5. **Concurrent Image Caching**: Official player portraits are extracted from Cricbuzz profile pages via a multi-threaded worker pool with an exponential backoff retry mechanism and persisted into [`data/image_cache.json`](data/image_cache.json) to eliminate redundant network traffic.
6. **Background Scheduling**: A daemon thread periodically checks if the configured interval has elapsed, automatically pulling updated stats from Cricbuzz and refreshing the CSV/JSON dumps.