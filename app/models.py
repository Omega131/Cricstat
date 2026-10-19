from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class PlayerStat(BaseModel):
    player_id: str
    player_name: str
    team_name: str
    team_code: str
    player_image_url: Optional[str] = None
    profile_url: Optional[str] = None
    matches_played: Optional[int] = None
    batting_innings: Optional[int] = None
    runs_scored: Optional[int] = None
    batting_average: Optional[float] = None
    batting_strike_rate: Optional[float] = None
    fours: Optional[int] = None
    sixes: Optional[int] = None
    bowling_innings: Optional[int] = None
    overs_bowled: Optional[float] = None
    balls_bowled: Optional[int] = None
    wickets_taken: Optional[int] = None
    runs_conceded: Optional[int] = None
    bowling_average: Optional[float] = None
    bowling_economy_rate: Optional[float] = None
    bowling_strike_rate: Optional[float] = None
    year: int

class ScrapeProgress(BaseModel):
    year: int
    series_id: int
    status: str  # "idle", "running", "completed", "failed"
    current_step: str = ""
    teams_processed: int = 0
    total_teams: int = 10
    players_count: int = 0
    error: Optional[str] = None
    logs: List[str] = []
    completed_at: Optional[str] = None

class ScrapeConfig(BaseModel):
    year: int = 2025
    fetch_images: bool = True
    max_workers: int = 4

class ScheduleConfig(BaseModel):
    enabled: bool = False
    interval_hours: int = 12
    year: int = 2025
