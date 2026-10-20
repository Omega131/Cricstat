# 🎥 IPL Cricket Player Statistics Scraper — Video Walkthrough Script

Use this comprehensive guide and timestamped script to record your project demonstration video.

---

## ⏱️ Video Outline & Timestamps (Target Length: ~3.5 to 5 minutes)

| Timestamp | Segment | On-Screen Action | Key Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:35** | **Introduction & Problem Context** | Show `README.md` and repository layout | Introduce the project: an automated Cricbuzz web scraper and telemetry dashboard unifying IPL batting & bowling statistics. |
| **0:35 – 1:30** | **Scraper Architecture & Data Pipeline** | Open `app/scraper.py` in editor | Explain series mapping, multi-table scraping, unique player ID merging, and missing-value preservation (no zeroes). |
| **1:30 – 2:15** | **CLI Scraper Execution & Data Inspection** | Run `python run_scraper.py --year 2025` in terminal, open CSV | Show CLI output, live logging, CSV & JSON dumps in `data/`, verify 190 players across all 10 franchises. |
| **2:15 – 3:30** | **Web Application & Interactive Dashboard** | Open `http://localhost:8000` in browser | Showcase metrics cards, interactive Chart.js analytics (Top Runs, Wickets, MVP), franchise tabs, and role filtering. |
| **3:30 – 4:15** | **Advanced Features & Bonuses** | Click "Compare", download filtered CSV, show Scheduler modal | Demonstrate player head-to-head comparison, dynamic filtered CSV export, background automated scraping scheduler, and SQLite export. |
| **4:15 – 4:45** | **Automated Tests & Container Deployment** | Run `python test_scraper.py` and mention `docker-compose.yml` | Run 4 unit tests passing, mention Docker readiness, summarize deliverables. |

---

## 🎙️ Spoken Script (Word-for-Word Voiceover)

### Segment 1: Introduction (0:00 - 0:35)
> *"Hello everyone! In this video, I will demonstrate the IPL Cricket Player Statistics Web Scraper and Analytics Dashboard.*
>
> *The goal of this project is to scrape complete batting and bowling statistics for all players across all 10 IPL franchises from Cricbuzz, unify their records by player ID into a clean data schema, preserve missing values without falsely coercing them to zero, and provide complete CSV, JSON, and SQLite dumps alongside an interactive analytics web application."*

---

### Segment 2: Scraper Architecture & Code Walkthrough (0:35 - 1:30)
*(Switch to code editor: open `app/scraper.py`)*

> *"Let’s look at the core scraper in `app/scraper.py`.*
> 
> *1. **Dynamic Series Mapping**: In `config.py`, we map IPL seasons to their official Cricbuzz Series ID—for example, 2025 maps to series 9237 and 2024 maps to 7607. It even supports historical franchises like Deccan Chargers or Gujarat Lions.*
>
> *2. **Multi-Table Extraction**: Cricbuzz splits stats into separate endpoints: `mostRuns` for batting, `mostWickets` for bowling, and `lowestEcon` for economy rate. The scraper queries all 10 franchise team IDs and also validates against the tournament-wide leaderboard.*
>
> *3. **Player Merging Pipeline**: Records are merged using the unique Cricbuzz Player ID. When an all-rounder like Hardik Pandya or Sunil Narine is processed, their runs, average, and strike rate are merged with their bowling overs, wickets, and economy rate into one record.*
>
> *4. **Missing Value Integrity**: In `clean_val`, any missing, unrecorded, or dashed values (`'-'`, `'--'`, `'N/A'`) are preserved as Python `None` and exported as empty strings in CSV. Non-batters never get a misleading 0.00 average, and non-bowlers never get false bowling stats.*
>
> *5. **Advanced Cricket Metrics**: We compute the **Boundary Percentage** (`(4s*4 + 6s*6) / runs`) and an **IPL MVP Impact Score** based on runs, wickets, boundaries, and economy rates."*

---

### Segment 3: CLI Execution & Data Dumps (1:30 - 2:15)
*(Switch to terminal)*

> *"Let’s run the standalone CLI scraper for IPL 2025:"*
```bash
python run_scraper.py --year 2025
```
*(Point out the terminal output)*
> *"Notice the concurrent image pool and clean output. We have extracted 190 unified players.*
>
> *Let's inspect the generated CSV dump in `data/ipl_2025_players.csv`: all 10 teams are present, all player columns are populated, and non-batters or non-bowlers properly retain empty null values. We also generate the matching JSON dump and SQLite database in `data/cricstat.db`."*

---

### Segment 4: Interactive Web Dashboard & Analytics (2:15 - 3:30)
*(Switch to browser: `http://localhost:8000`)*

> *"Now let's look at the web dashboard built with FastAPI and modern Vanilla CSS.*
>
> *At the top, we see real-time season metrics: 190 total players, 10 franchises, Orange Cap leader Sai Sudharsan with 759 runs, Purple Cap leader Prasidh Krishna with 25 wickets, and 65 all-rounders.*
>
> *Below, we have interactive Chart.js analytics:
> 1. Top 10 Run Scorers horizontal bar chart with strike rate badges.
> 2. Top 10 Wicket Takers horizontal bar chart.
> 3. An Economy Rate vs. Wickets scatter plot showing bowling efficiency.*
>
> *We can filter by franchise using the 10 team pills—clicking CSK, MI, or RCB instantly filters the roster. We can switch between Batters, Bowlers, and All-Rounders, search dynamically, and toggle between Table View and Player Card Grid View."*

---

### Segment 5: Advanced Features & Bonuses (3:30 - 4:15)
*(Showcase Modals & Download Buttons)*

> *"Let’s test the bonus features:*
>
> *1. **Player Comparison Tool**: Click 'Compare Players' to select two players—like Sai Sudharsan and Suryakumar Yadav—to compare their runs, strike rates, wickets, and impact scores side-by-side.*
>
> *2. **Dynamic Filtered CSV Export**: Besides downloading the complete raw season CSV, clicking 'Export View' downloads a CSV containing only the currently filtered or searched players.*
>
> *3. **Scheduled Automated Scraping**: Opening the Scheduler modal allows setting up a background daemon worker to automatically re-scrape Cricbuzz every 6, 12, or 24 hours.*
>
> *4. **Dynamic Season Switcher**: We can switch the dropdown to IPL 2024 or earlier seasons instantly."*

---

### Segment 6: Testing, Docker & Conclusion (4:15 - 4:45)
*(Switch to terminal)*

> *"Finally, let’s run our automated test suite:"*
```bash
python test_scraper.py
```
> *"All tests pass cleanly in under a second, verifying schema validation, franchise counts, and null value handling.*
>
> *For instant production deployment, a `Dockerfile` and `docker-compose.yml` are included—running `docker compose up` spins up the entire backend and UI.*
>
> *Thank you for watching!"*

---

## 🛠️ Pre-Recording Checklist

- [ ] Python dev server running: `python -m uvicorn app.main:app --port 8000`
- [ ] Browser window open to `http://localhost:8000`
- [ ] Terminal split ready to execute `python test_scraper.py`
- [ ] Screen resolution set to 1920x1080 for optimal readability
- [ ] Audio microphone checked and clear
