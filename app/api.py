from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import FileResponse, JSONResponse
from typing import Optional, List, Dict, Any
import json
import threading
from datetime import datetime
from pathlib import Path
import pandas as pd

from .config import DATA_DIR, SERIES_YEAR_MAP, IPL_TEAMS, DEFAULT_YEAR
from .models import ScrapeProgress, ScrapeConfig, ScheduleConfig
from .scraper import CricbuzzScraper
from .scheduler import scheduler_instance

router = APIRouter(prefix="/api")

# In-memory scrape state tracker
active_scrape: Dict[str, Any] = {
    "year": DEFAULT_YEAR,
    "series_id": SERIES_YEAR_MAP[DEFAULT_YEAR],
    "status": "idle",
    "current_step": "Ready",
    "teams_processed": 0,
    "total_teams": 10,
    "players_count": 0,
    "error": None,
    "logs": [],
    "completed_at": None
}
scrape_lock = threading.Lock()

def get_data_filepath(year: int, ext: str) -> Path:
    return DATA_DIR / f"ipl_{year}_players.{ext}"

def load_players(year: int) -> List[Dict[str, Any]]:
    json_path = get_data_filepath(year, "json")
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    csv_path = get_data_filepath(year, "csv")
    if csv_path.exists():
        try:
            df = pd.read_csv(csv_path)
            # Replace NaNs with None
            return df.where(pd.notnull(df), None).to_dict(orient="records")
        except Exception:
            pass
    return []

@router.get("/years")
def get_available_years():
    years = []
    for y, sid in sorted(SERIES_YEAR_MAP.items(), reverse=True):
        csv_exists = get_data_filepath(y, "csv").exists()
        years.append({
            "year": y,
            "series_id": sid,
            "has_data": csv_exists,
            "is_default": y == DEFAULT_YEAR
        })
    return {"years": years, "default_year": DEFAULT_YEAR}

@router.get("/teams")
def get_teams():
    return {"teams": IPL_TEAMS}

@router.get("/summary")
def get_summary(year: int = DEFAULT_YEAR):
    players = load_players(year)
    if not players:
        return {
            "year": year,
            "total_players": 0,
            "total_teams": 0,
            "all_rounders": 0,
            "orange_cap": None,
            "purple_cap": None,
            "has_data": False
        }

    teams = set()
    total_runs = 0
    total_wickets = 0
    all_rounders = 0
    orange_cap = None
    purple_cap = None

    for p in players:
        teams.add(p.get("team_name"))
        runs = p.get("runs_scored")
        wkts = p.get("wickets_taken")
        if runs is not None:
            total_runs += runs
            if orange_cap is None or runs > (orange_cap.get("runs_scored") or 0):
                orange_cap = p
        if wkts is not None:
            total_wickets += wkts
            if purple_cap is None or wkts > (purple_cap.get("wickets_taken") or 0):
                purple_cap = p
        if runs is not None and wkts is not None:
            all_rounders += 1

    return {
        "year": year,
        "total_players": len(players),
        "total_teams": len(teams),
        "total_runs": total_runs,
        "total_wickets": total_wickets,
        "all_rounders": all_rounders,
        "orange_cap": orange_cap,
        "purple_cap": purple_cap,
        "has_data": True
    }

@router.get("/players")
def get_players(
    year: int = DEFAULT_YEAR,
    team: Optional[str] = None,
    role: Optional[str] = "all",
    search: Optional[str] = None,
    sort_by: Optional[str] = "runs_scored",
    order: Optional[str] = "desc",
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200)
):
    players = load_players(year)
    if not players:
        return {
            "players": [],
            "total": 0,
            "page": page,
            "page_size": page_size,
            "total_pages": 0,
            "message": f"No data found for IPL {year}. Please trigger a scrape first."
        }

    # Filter by team
    if team and team.lower() != "all":
        team_lower = team.lower()
        players = [
            p for p in players
            if p.get("team_code", "").lower() == team_lower
            or p.get("team_name", "").lower() == team_lower
        ]

    # Filter by role
    if role and role.lower() != "all":
        r = role.lower()
        if r in ["batter", "batters", "batting"]:
            players = [p for p in players if p.get("runs_scored") is not None and p.get("wickets_taken") is None]
        elif r in ["bowler", "bowlers", "bowling"]:
            players = [p for p in players if p.get("wickets_taken") is not None and p.get("runs_scored") is None]
        elif r in ["all_rounder", "allrounder", "all-rounder"]:
            players = [p for p in players if p.get("runs_scored") is not None and p.get("wickets_taken") is not None]

    # Search by player name
    if search:
        s = search.lower().strip()
        players = [p for p in players if s in (p.get("player_name") or "").lower()]

    # Sort
    valid_sort_keys = [
        "runs_scored", "wickets_taken", "batting_average", "batting_strike_rate",
        "bowling_economy_rate", "bowling_average", "matches_played", "fours", "sixes", "player_name"
    ]
    key = sort_by if sort_by in valid_sort_keys else "runs_scored"
    reverse = (order.lower() == "desc")

    def sort_key_func(item):
        val = item.get(key)
        if val is None:
            # For economy rate or bowling avg, lower is better, but nulls should be at the end
            return float('-inf') if reverse else float('inf')
        if isinstance(val, str):
            return val.lower()
        return val

    players.sort(key=sort_key_func, reverse=reverse)

    total = len(players)
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0
    start = (page - 1) * page_size
    end = start + page_size
    paged_players = players[start:end]

    return {
        "players": paged_players,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/players/{player_id}")
def get_player_details(player_id: str, year: int = DEFAULT_YEAR):
    players = load_players(year)
    for p in players:
        if str(p.get("player_id")) == str(player_id):
            return p
    raise HTTPException(status_code=404, detail="Player not found in this IPL season")

def _background_scraper_task(year: int, fetch_images: bool, max_workers: int):
    global active_scrape
    try:
        def on_log(msg: str):
            with scrape_lock:
                active_scrape["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] {msg}")
                if len(active_scrape["logs"]) > 200:
                    active_scrape["logs"].pop(0)
                active_scrape["current_step"] = msg

        scraper = CricbuzzScraper(year=year, on_log=on_log)
        with scrape_lock:
            active_scrape["status"] = "running"
            active_scrape["current_step"] = f"Scraping IPL {year} player stats..."
            active_scrape["error"] = None

        players = scraper.scrape(fetch_images=fetch_images, max_workers=max_workers)
        csv_path = scraper.export_csv(players)
        json_path = scraper.export_json(players)

        with scrape_lock:
            active_scrape["status"] = "completed"
            active_scrape["current_step"] = f"Finished successfully. Scraped {len(players)} players."
            active_scrape["players_count"] = len(players)
            active_scrape["completed_at"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            active_scrape["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Exported CSV: {csv_path.name}")
            active_scrape["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] Exported JSON: {json_path.name}")

    except Exception as e:
        with scrape_lock:
            active_scrape["status"] = "failed"
            active_scrape["error"] = str(e)
            active_scrape["current_step"] = f"Error: {e}"
            active_scrape["logs"].append(f"[{datetime.now().strftime('%H:%M:%S')}] ERROR: {e}")

@router.post("/scrape")
def trigger_scrape(config: ScrapeConfig, background_tasks: BackgroundTasks):
    global active_scrape
    with scrape_lock:
        if active_scrape["status"] == "running":
            return JSONResponse(
                status_code=409,
                content={"message": "A scrape is already in progress.", "status": active_scrape}
            )

        if config.year not in SERIES_YEAR_MAP:
            raise HTTPException(status_code=400, detail=f"Unsupported year {config.year}")

        active_scrape = {
            "year": config.year,
            "series_id": SERIES_YEAR_MAP[config.year],
            "status": "running",
            "current_step": "Initializing scraper...",
            "teams_processed": 0,
            "total_teams": 10,
            "players_count": 0,
            "error": None,
            "logs": [f"[{datetime.now().strftime('%H:%M:%S')}] Triggered scrape for IPL {config.year}"],
            "completed_at": None
        }

    background_tasks.add_task(_background_scraper_task, config.year, config.fetch_images, config.max_workers)
    return {"message": f"Scrape initiated for IPL {config.year}", "status": active_scrape}

@router.get("/scrape/status")
def get_scrape_status():
    with scrape_lock:
        return active_scrape

@router.get("/download/csv")
def download_csv(year: int = DEFAULT_YEAR):
    csv_path = get_data_filepath(year, "csv")
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail=f"CSV dump for IPL {year} does not exist yet. Please run scraper first.")
    return FileResponse(
        path=csv_path,
        media_type="text/csv",
        filename=f"ipl_{year}_players.csv"
    )

@router.get("/download/json")
def download_json(year: int = DEFAULT_YEAR):
    json_path = get_data_filepath(year, "json")
    if not json_path.exists():
        raise HTTPException(status_code=404, detail=f"JSON dump for IPL {year} does not exist yet. Please run scraper first.")
    return FileResponse(
        path=json_path,
        media_type="application/json",
        filename=f"ipl_{year}_players.json"
    )

@router.get("/schedule")
def get_schedule():
    return scheduler_instance.get_status()

@router.post("/schedule")
def configure_schedule(config: ScheduleConfig):
    if config.enabled:
        scheduler_instance.start(year=config.year, interval_hours=config.interval_hours)
    else:
        scheduler_instance.stop()
    return {"message": "Schedule updated", "status": scheduler_instance.get_status()}
