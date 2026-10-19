import requests
from bs4 import BeautifulSoup
import re
import json
import time
import os
import random
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, List, Optional, Any, Callable
import pandas as pd

from .config import BASE_DIR, DATA_DIR, SERIES_YEAR_MAP, IPL_TEAMS, SCRAPER_USER_AGENTS, DEFAULT_YEAR
from .models import PlayerStat

class CricbuzzScraper:
    def __init__(self, year: int = DEFAULT_YEAR, on_log: Optional[Callable[[str], None]] = None):
        self.year = int(year)
        if self.year not in SERIES_YEAR_MAP:
            raise ValueError(f"Year {self.year} is not in configured series map. Supported years: {sorted(list(SERIES_YEAR_MAP.keys()))}")
        self.series_id = SERIES_YEAR_MAP[self.year]
        self.on_log = on_log or (lambda msg: None)
        self.session = requests.Session()
        self.headers = {
            'User-Agent': random.choice(SCRAPER_USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive'
        }
        self.cache_file = DATA_DIR / "image_cache.json"
        self.image_cache = self._load_image_cache()

    def log(self, message: str):
        print(f"[{self.year} Scraper] {message}")
        self.on_log(message)

    def _load_image_cache(self) -> Dict[str, str]:
        if self.cache_file.exists():
            try:
                with open(self.cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

    def _save_image_cache(self):
        try:
            with open(self.cache_file, "w", encoding="utf-8") as f:
                json.dump(self.image_cache, f, indent=2)
        except Exception as e:
            self.log(f"Warning: Could not save image cache: {e}")

    @staticmethod
    def clean_val(v: Any) -> Optional[str]:
        if v is None:
            return None
        v = str(v).strip()
        if v in ['', '-', '--', 'N/A', 'NA', 'null', 'None']:
            return None
        return v

    @staticmethod
    def clean_int(v: Any) -> Optional[int]:
        val = CricbuzzScraper.clean_val(v)
        if val is None:
            return None
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return None

    @staticmethod
    def clean_float(v: Any) -> Optional[float]:
        val = CricbuzzScraper.clean_val(v)
        if val is None:
            return None
        try:
            return round(float(val), 2)
        except (ValueError, TypeError):
            return None

    def fetch_url(self, url: str, max_retries: int = 3, timeout: int = 12) -> Optional[str]:
        for attempt in range(max_retries):
            try:
                resp = self.session.get(url, headers=self.headers, timeout=timeout)
                if resp.status_code == 200:
                    return resp.text
                elif resp.status_code == 429:
                    wait_time = (attempt + 1) * 2
                    self.log(f"Rate limited (429) on {url}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    self.log(f"HTTP {resp.status_code} for {url}")
            except Exception as e:
                wait_time = (attempt + 1) * 1.5
                self.log(f"Network error on {url} (attempt {attempt+1}/{max_retries}): {e}")
                time.sleep(wait_time)
        return None

    def _scrape_batting_table(self, html: str, team_id: str, team_name: str, team_code: str, players: Dict[str, Dict[str, Any]]):
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table')
        if not table:
            return

        for row in table.find_all('tr')[1:]:
            cells = row.find_all('td')
            if len(cells) < 8:
                continue

            a_tag = cells[0].find('a')
            name = a_tag.text.strip() if a_tag else cells[0].text.strip()
            href = a_tag['href'] if a_tag and a_tag.has_attr('href') else ''
            
            pid_match = re.search(r'/profiles/(\d+)', href)
            player_id = pid_match.group(1) if pid_match else name.lower().replace(' ', '-')
            
            row_vals = [c.text.strip() for c in cells]
            
            # Headers: ['PLAYER', 'MATCHES', 'INNS', 'RUNS', 'AVG', 'SR', '4s', '6s']
            if player_id not in players:
                players[player_id] = {
                    'player_id': player_id,
                    'player_name': name,
                    'team_name': team_name,
                    'team_code': team_code,
                    'profile_url': f"https://www.cricbuzz.com{href}" if href.startswith('/') else href,
                    'player_image_url': self.image_cache.get(player_id),
                    'matches_played': self.clean_int(row_vals[1]),
                    'batting_innings': self.clean_int(row_vals[2]),
                    'runs_scored': self.clean_int(row_vals[3]),
                    'batting_average': self.clean_float(row_vals[4]),
                    'batting_strike_rate': self.clean_float(row_vals[5]),
                    'fours': self.clean_int(row_vals[6]),
                    'sixes': self.clean_int(row_vals[7]),
                    'bowling_innings': None,
                    'overs_bowled': None,
                    'balls_bowled': None,
                    'wickets_taken': None,
                    'runs_conceded': None,
                    'bowling_average': None,
                    'bowling_economy_rate': None,
                    'bowling_strike_rate': None,
                    'year': self.year
                }
            else:
                p = players[player_id]
                if p['matches_played'] is None:
                    p['matches_played'] = self.clean_int(row_vals[1])
                p['batting_innings'] = self.clean_int(row_vals[2])
                p['runs_scored'] = self.clean_int(row_vals[3])
                p['batting_average'] = self.clean_float(row_vals[4])
                p['batting_strike_rate'] = self.clean_float(row_vals[5])
                p['fours'] = self.clean_int(row_vals[6])
                p['sixes'] = self.clean_int(row_vals[7])

    def _scrape_bowling_table(self, html: str, team_id: str, team_name: str, team_code: str, players: Dict[str, Dict[str, Any]]):
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table')
        if not table:
            return

        for row in table.find_all('tr')[1:]:
            cells = row.find_all('td')
            if len(cells) < 7:
                continue

            a_tag = cells[0].find('a')
            name = a_tag.text.strip() if a_tag else cells[0].text.strip()
            href = a_tag['href'] if a_tag and a_tag.has_attr('href') else ''
            
            pid_match = re.search(r'/profiles/(\d+)', href)
            player_id = pid_match.group(1) if pid_match else name.lower().replace(' ', '-')
            
            row_vals = [c.text.strip() for c in cells]
            # Headers: ['PLAYER', 'MATCHES', 'OVERS', 'BALLS', 'WKTS', 'Avg', 'RUNS', '4-FERS', '5-FERS']
            if player_id not in players:
                players[player_id] = {
                    'player_id': player_id,
                    'player_name': name,
                    'team_name': team_name,
                    'team_code': team_code,
                    'profile_url': f"https://www.cricbuzz.com{href}" if href.startswith('/') else href,
                    'player_image_url': self.image_cache.get(player_id),
                    'matches_played': self.clean_int(row_vals[1]),
                    'batting_innings': None,
                    'runs_scored': None,
                    'batting_average': None,
                    'batting_strike_rate': None,
                    'fours': None,
                    'sixes': None,
                    'bowling_innings': None,
                    'overs_bowled': self.clean_float(row_vals[2]),
                    'balls_bowled': self.clean_int(row_vals[3]),
                    'wickets_taken': self.clean_int(row_vals[4]),
                    'runs_conceded': self.clean_int(row_vals[6]),
                    'bowling_average': self.clean_float(row_vals[5]),
                    'bowling_economy_rate': None,
                    'bowling_strike_rate': None,
                    'year': self.year
                }
            else:
                p = players[player_id]
                if p['matches_played'] is None:
                    p['matches_played'] = self.clean_int(row_vals[1])
                p['overs_bowled'] = self.clean_float(row_vals[2])
                p['balls_bowled'] = self.clean_int(row_vals[3])
                p['wickets_taken'] = self.clean_int(row_vals[4])
                p['bowling_average'] = self.clean_float(row_vals[5])
                p['runs_conceded'] = self.clean_int(row_vals[6])

            # Calculate economy rate and strike rate from overs & balls if available
            p = players[player_id]
            if p['overs_bowled'] is not None and p['runs_conceded'] is not None:
                overs = float(row_vals[2])
                overs_full = int(overs)
                balls_rem = round((overs - overs_full) * 10)
                total_overs = overs_full + (balls_rem / 6.0)
                if total_overs > 0:
                    p['bowling_economy_rate'] = round(p['runs_conceded'] / total_overs, 2)
            
            if p['balls_bowled'] is not None and p['wickets_taken'] is not None and p['wickets_taken'] > 0:
                p['bowling_strike_rate'] = round(p['balls_bowled'] / p['wickets_taken'], 2)

    def _scrape_econ_table(self, html: str, players: Dict[str, Dict[str, Any]]):
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.find('table')
        if not table:
            return

        for row in table.find_all('tr')[1:]:
            cells = row.find_all('td')
            if len(cells) < 8:
                continue
            a_tag = cells[0].find('a')
            href = a_tag['href'] if a_tag and a_tag.has_attr('href') else ''
            pid_match = re.search(r'/profiles/(\d+)', href)
            player_id = pid_match.group(1) if pid_match else cells[0].text.strip().lower().replace(' ', '-')
            
            row_vals = [c.text.strip() for c in cells]
            # Headers: ['Bowler', 'MATCHES', 'OVERS', 'INNS', 'WKTS', 'Eco', 'Avg', 'SR']
            if player_id in players:
                p = players[player_id]
                p['bowling_innings'] = self.clean_int(row_vals[3])
                if p['bowling_economy_rate'] is None:
                    p['bowling_economy_rate'] = self.clean_float(row_vals[5])
                if p['bowling_strike_rate'] is None:
                    p['bowling_strike_rate'] = self.clean_float(row_vals[7])

    def _fetch_single_player_image(self, item: tuple) -> tuple:
        pid, profile_url, name = item
        if pid in self.image_cache and self.image_cache[pid]:
            return pid, self.image_cache[pid]

        if not profile_url:
            return pid, None

        slug = profile_url.rstrip('/').split('/')[-1]
        try:
            r = self.session.get(profile_url, headers=self.headers, timeout=8)
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, 'html.parser')
                # Check all img tags for player image
                for img in soup.find_all('img'):
                    alt = (img.get('alt') or '').strip().lower()
                    src = img.get('src') or ''
                    if 'static.cricbuzz.com/a/img/v1/' in src and (
                        alt == slug or slug in alt or 'gthumb' in src or name.lower() in alt
                    ):
                        return pid, src
        except Exception:
            pass

        return pid, None

    def fetch_player_images(self, players: Dict[str, Dict[str, Any]], max_workers: int = 5):
        missing_items = []
        for pid, p in players.items():
            if pid not in self.image_cache or not self.image_cache[pid]:
                missing_items.append((pid, p.get('profile_url'), p.get('player_name')))

        if not missing_items:
            self.log(f"All {len(players)} player images found in local cache.")
            return

        self.log(f"Fetching images for {len(missing_items)} players via concurrent pool (workers={max_workers})...")
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = list(executor.map(self._fetch_single_player_image, missing_items))

        updated_count = 0
        for pid, img_url in results:
            if img_url:
                self.image_cache[pid] = img_url
                if pid in players:
                    players[pid]['player_image_url'] = img_url
                updated_count += 1
            else:
                # If image not found on profile, retain None or set placeholder URL
                self.image_cache[pid] = None

        self._save_image_cache()
        self.log(f"Image fetching complete: {updated_count} images fetched and cached.")

    def scrape(self, fetch_images: bool = True, max_workers: int = 5) -> List[Dict[str, Any]]:
        self.log(f"Starting IPL {self.year} player statistics scrape (Series ID: {self.series_id})...")
        players: Dict[str, Dict[str, Any]] = {}
        total_teams = len(IPL_TEAMS)

        for i, (team_id, team_info) in enumerate(IPL_TEAMS.items(), 1):
            team_name = team_info['name']
            team_code = team_info['code']
            self.log(f"[{i}/{total_teams}] Scraping stats for {team_name} ({team_code})...")

            # 1. Batting stats for team
            url_bat = f"https://www.cricbuzz.com/cricket-series/{self.series_id}/indian-premier-league-{self.year}/stats?statsType=mostRuns&teamId={team_id}"
            html_bat = self.fetch_url(url_bat)
            if html_bat:
                self._scrape_batting_table(html_bat, team_id, team_name, team_code, players)

            # 2. Bowling stats for team
            url_bowl = f"https://www.cricbuzz.com/cricket-series/{self.series_id}/indian-premier-league-{self.year}/stats?statsType=mostWickets&teamId={team_id}"
            html_bowl = self.fetch_url(url_bowl)
            if html_bowl:
                self._scrape_bowling_table(html_bowl, team_id, team_name, team_code, players)

            # 3. Economy & Bowling Innings for team
            url_econ = f"https://www.cricbuzz.com/cricket-series/{self.series_id}/indian-premier-league-{self.year}/stats?statsType=lowestEcon&teamId={team_id}"
            html_econ = self.fetch_url(url_econ)
            if html_econ:
                self._scrape_econ_table(html_econ, players)

            time.sleep(0.3)  # Respectful crawling delay

        # Also scrape tournament-wide leaderboard tables (teamId=all) to ensure 100% complete coverage
        self.log("Scraping overall tournament leaderboard tables to verify full player coverage...")
        for stype in ['mostRuns', 'mostWickets', 'lowestEcon']:
            url_all = f"https://www.cricbuzz.com/cricket-series/{self.series_id}/indian-premier-league-{self.year}/stats?statsType={stype}&teamId=all"
            html_all = self.fetch_url(url_all)
            if html_all:
                if stype == 'mostRuns':
                    self._scrape_batting_table(html_all, "all", "IPL", "IPL", players)
                elif stype == 'mostWickets':
                    self._scrape_bowling_table(html_all, "all", "IPL", "IPL", players)
                elif stype == 'lowestEcon':
                    self._scrape_econ_table(html_all, players)

        self.log(f"Total unified player records scraped: {len(players)}")

        # Fetch images if requested
        if fetch_images:
            self.fetch_player_images(players, max_workers=max_workers)

        # Apply cached images
        for pid, p in players.items():
            if not p.get('player_image_url') and pid in self.image_cache:
                p['player_image_url'] = self.image_cache[pid]

        player_list = list(players.values())
        # Sort by runs scored descending, then wickets taken descending
        player_list.sort(key=lambda x: (x.get('runs_scored') or 0, x.get('wickets_taken') or 0), reverse=True)

        return player_list

    def export_csv(self, players: List[Dict[str, Any]], filename: Optional[str] = None) -> Path:
        if not filename:
            filename = f"ipl_{self.year}_players.csv"
        filepath = DATA_DIR / filename

        df = pd.DataFrame(players)
        # Ensure column order
        cols = [
            'player_id', 'player_name', 'team_name', 'team_code', 'player_image_url',
            'matches_played', 'batting_innings', 'runs_scored', 'batting_average',
            'batting_strike_rate', 'fours', 'sixes', 'bowling_innings', 'overs_bowled',
            'balls_bowled', 'wickets_taken', 'runs_conceded', 'bowling_average',
            'bowling_economy_rate', 'bowling_strike_rate', 'year', 'profile_url'
        ]
        existing_cols = [c for c in cols if c in df.columns]
        df = df[existing_cols]

        # In CSV, keep nulls as empty string (or N/A) so numerical zeroes are not confused with missing data
        df.to_csv(filepath, index=False, na_rep="")
        self.log(f"CSV dump successfully exported to {filepath} ({len(df)} records)")
        return filepath

    def export_json(self, players: List[Dict[str, Any]], filename: Optional[str] = None) -> Path:
        if not filename:
            filename = f"ipl_{self.year}_players.json"
        filepath = DATA_DIR / filename

        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(players, f, indent=2, ensure_ascii=False)
        self.log(f"JSON dump successfully exported to {filepath} ({len(players)} records)")
        return filepath
