# 🎥 IPL Cricket Player Statistics Scraper & Dashboard — Video Walkthrough Script

Use this comprehensive, timestamped walkthrough script to record a professional 4-to-5 minute video demonstration of the **Cricstat** project.

---

## ⏱️ Video Outline & Timestamps (Target Length: ~4 to 5 Minutes)

| Timestamp | Segment | On-Screen Action | Key Talking Points |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:40** | **1. Introduction & Task Overview** | Show `README.md` in browser / IDE | Introduce Cricstat: automated Cricbuzz scraping engine, schema unification, 10 franchise rosters, null preservation, and full-stack telemetry. |
| **0:40 – 1:35** | **2. Architecture & Scraping Engine** | Open `app/scraper.py` & `app/config.py` in editor | Dynamic series mapping, multi-table scraping (`mostRuns`, `mostWickets`, `lowestEcon`), unique player ID merging, null preservation (`clean_val`), concurrent image pool. |
| **1:35 – 2:20** | **3. CLI Execution & Data Dumps** | Terminal: run `python run_scraper.py --year 2025` | Live terminal logs, 190 players extracted, inspect `data/ipl_2025_players.csv`, `ipl_2025_players.json`, and SQLite `data/cricstat.db`. |
| **2:20 – 3:35** | **4. Interactive Web Dashboard & Visual Analytics** | Browser: `http://localhost:8000` | KPI cards (Orange/Purple Cap, 65 All-Rounders, 100% images), 4 interactive Chart.js analytics (Runs, Wickets, MVP, Economy scatter), franchise pills, role filters, Table vs. Card Grid view. |
| **3:35 – 4:25** | **5. Advanced Features & Bonuses** | Click Compare, Run Scraper modal, Scheduler, Export | Side-by-side Player Comparison modal, In-App Live Scraper with live terminal log stream, Background Scheduler daemon (6h/12h/24h), dynamic filtered view CSV export. |
| **4:25 – 4:55** | **6. Automated Tests & Docker Deployment** | Terminal: `python test_scraper.py`, show `Dockerfile` | Run all 7 unit tests passing, show multi-stage `Dockerfile` and `docker-compose.yml`, highlight 1-click cloud readiness on Render/Railway. |

---

## 🎙️ Spoken Script (Word-for-Word Voiceover)

### Segment 1: Introduction & Task Overview (0:00 – 0:40)
*(Screen: Show the newly styled `README.md` or repository root in VS Code / GitHub)*

> *"Hello everyone! Welcome to this demonstration of **Cricstat** — a full-stack IPL Cricket Player Statistics Scraper, ETL Data Pipeline, and Real-Time Telemetry Dashboard.*
>
> *Our objective in this project is to scrape complete batting and bowling statistics for all players across all 10 IPL franchises from Cricbuzz, resolve entity identities so that all-rounders have unified records, strictly preserve missing values without falsely converting them to zero, and deliver complete CSV, JSON, and SQLite data dumps alongside an interactive analytics web application.*
>
> *Let’s dive into how the architecture works."*

---

### Segment 2: Architecture & Scraping Engine (0:40 – 1:35)
*(Screen: Switch to code editor: open `app/scraper.py` and `app/config.py` side-by-side)*

> *"Let’s inspect the core engine in `app/scraper.py`.*
>
> *1. **Dynamic Series Mapping**: In `config.py`, we map IPL seasons dynamically to their official Cricbuzz Series ID — for instance, IPL 2025 maps to series `9237` and 2024 maps to `7607`. It supports historical editions back to 2008.*
>
> *2. **Multi-Table Extraction**: Cricbuzz splits tournament statistics across distinct endpoints: `mostRuns` for batting, `mostWickets` for bowling, and `lowestEcon` for economy rate. Rather than scraping only the top 5 or 10 players, our scraper iterates through all 10 franchise team IDs, extracting every single player.*
>
> *3. **Player Merging Pipeline**: Records are merged using the unique Cricbuzz Player ID. When an all-rounder like Hardik Pandya or Sunil Narine is processed, their batting runs, average, and strike rate are seamlessly joined with their bowling overs, wickets, and economy rate into one cohesive record.*
>
> *4. **Missing Value Integrity**: In `clean_val()`, unrecorded or dashed entries like `'-'` or `'N/A'` are strictly preserved as Python `None` and exported as empty values in CSV and `null` in JSON. Pure bowlers never receive a misleading `0.00` batting average, and pure batters never receive zeroed bowling statistics.*
>
> *5. **Advanced Metrics & Concurrent Images**: We compute advanced metrics including the **Boundary Percentage** and a weighted **IPL MVP Impact Score**. Furthermore, official player portraits are extracted concurrently using a `ThreadPoolExecutor` worker pool and cached in `data/image_cache.json` to eliminate redundant network traffic."*

---

### Segment 3: CLI Execution & Data Dumps (1:35 – 2:20)
*(Screen: Switch to terminal)*

> *"Now let’s execute the standalone CLI scraper for IPL 2025:"*

```bash
python run_scraper.py --year 2025
```

*(Point out the terminal output and open `data/ipl_2025_players.csv`)*

> *"Notice the clean console output and rapid extraction. The scraper has extracted 190 unified players across all 10 franchises.*
>
> *Let's inspect the generated CSV dump in `data/ipl_2025_players.csv`: all 10 teams are present, all player columns are populated, and non-batters or non-bowlers properly retain empty null values. We also generate the matching JSON dump with clean `null` primitives in `data/ipl_2025_players.json`, as well as a relational SQLite database in `data/cricstat.db`."*

---

### Segment 4: Interactive Web Dashboard & Visual Analytics (2:20 – 3:35)
*(Screen: Switch to browser at `http://127.0.0.1:8000`)*

> *"Now let's explore the real-time web application built with FastAPI and modern dark-mode CSS.*
>
> *At the top, we see our season KPI metrics:*
> - *190 Total Players across all 10 franchises.*
> - *Orange Cap Leader: **Sai Sudharsan** with 759 runs at a strike rate of 156.*
> - *Purple Cap Leader: **Prasidh Krishna** with 25 wickets at an economy of 8.27.*
> - *65 Unified All-Rounders identified.*
> - *100% Image Coverage from Cricbuzz CDN.*
>
> *Below the metrics, we have our interactive Chart.js analytics:*
> 1. *The **Orange Cap Race** horizontal bar chart showing top run-scorers.*
> 2. *The **Purple Cap Race** horizontal bar chart showing top wicket-takers.*
> 3. *The **IPL MVP Impact Score** leaderboard evaluating overall match impact.*
> 4. *The **Bowling Efficiency** scatter plot mapping Economy Rate against Wickets.*
>
> *We can toggle or collapse these charts with one click.*
>
> *Next, look at the interactive controls:*
> - *We can filter by franchise using the 10 team pills — clicking **CSK**, **MI**, or **RCB** instantly filters the squad.*
> - *We can switch between **Batters**, **Bowlers**, and **All-Rounders**.*
> - *We can type into the instant search bar to find any player in real time.*
> - *We can sort any column in the table — runs, strike rate, boundary %, wickets, economy, or MVP score.*
> - *And we can toggle between the **Data Table View** and the visual **Player Card Grid View** with one click."*

---

### Segment 5: Advanced Features & Bonuses (3:35 – 4:25)
*(Screen: Demonstrate Modals, Detail Views, and Exports)*

> *"Let’s examine the advanced features and bonuses:*
>
> *1. **Player Detail Modal**: Clicking on any player row or card opens a dedicated profile card displaying their high-res portrait, batting stats, bowling stats, boundary breakdown, and tournament impact rating.*
>
> *2. **Head-to-Head Player Comparison**: Clicking 'Compare' opens our comparison tool. Let’s select two players — for example, **Sai Sudharsan** and **Suryakumar Yadav**. The tool generates side-by-side metric bars comparing runs, strike rates, boundaries, and impact scores.*
>
> *3. **In-App Live Scraper**: Clicking 'Run Scraper' opens an interactive modal. Users can trigger an on-demand async scrape for any season — like 2025 or 2024 — toggle portrait downloads, and watch live execution logs stream directly inside the modal terminal.*
>
> *4. **Background Scheduler**: Clicking 'Scheduler' allows configuring a background daemon worker to automatically re-scrape Cricbuzz every 6, 12, or 24 hours, displaying current status, last run, and next scheduled run.*
>
> *5. **Dynamic Filtered View Export**: In addition to downloading the full raw season CSV or JSON, clicking 'Export View' downloads a CSV containing only the currently filtered or searched players."*

---

### Segment 6: Testing, Docker & Conclusion (4:25 – 4:55)
*(Screen: Switch back to terminal)*

> *"Finally, let’s run our automated test suite:"*

```bash
python test_scraper.py
```

*(Point out the 7 passing tests)*

> *"All 7 unit tests pass cleanly in under 0.05 seconds, verifying series mapping, data cleaning, schema compliance, and null preservation.*
>
> *For containerized deployment, a multi-stage `Dockerfile` and `docker-compose.yml` are included — running `docker compose up` spins up the entire backend and UI with automated health checks.*
>
> *In summary, Cricstat provides a production-grade data scraping pipeline, strict cricket data integrity, and an intuitive telemetry analytics interface. Thank you for watching!"*

---

## 🛠️ Pre-Recording Checklist

- [ ] FastAPI local server running in background (`python -m uvicorn app.main:app --port 8000`)
- [ ] Browser window open to `http://127.0.0.1:8000` (ensure charts and data are loaded)
- [ ] Terminal split ready:
  - Left pane: Workspace directory (`d:\Projects\Cricstat`)
  - Ready command 1: `python run_scraper.py --year 2025`
  - Ready command 2: `python test_scraper.py`
- [ ] Open `app/scraper.py` and `app/config.py` in your code editor
- [ ] Display resolution set to 1920x1080 (100% scale) for optimal text sharpness
- [ ] Test audio input and ensure microphone volume is balanced
