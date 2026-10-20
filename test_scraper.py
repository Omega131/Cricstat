import unittest
from pathlib import Path
import pandas as pd
import json
import sqlite3

from app.scraper import CricbuzzScraper
from app.config import DATA_DIR, DB_PATH, SERIES_YEAR_MAP, IPL_TEAMS, get_teams_for_year

class TestCricbuzzScraper(unittest.TestCase):
    def test_series_mapping(self):
        self.assertIn(2025, SERIES_YEAR_MAP)
        self.assertEqual(SERIES_YEAR_MAP[2025], 9237)
        self.assertEqual(SERIES_YEAR_MAP[2024], 7607)

    def test_clean_missing_values(self):
        # Missing values must be None / null, NOT 0
        self.assertIsNone(CricbuzzScraper.clean_val("-"))
        self.assertIsNone(CricbuzzScraper.clean_val("--"))
        self.assertIsNone(CricbuzzScraper.clean_val("N/A"))
        self.assertIsNone(CricbuzzScraper.clean_val(""))
        self.assertIsNone(CricbuzzScraper.clean_val(None))
        self.assertIsNone(CricbuzzScraper.clean_int("-"))
        self.assertIsNone(CricbuzzScraper.clean_float("N/A"))

        # Valid values
        self.assertEqual(CricbuzzScraper.clean_int("15"), 15)
        self.assertEqual(CricbuzzScraper.clean_float("54.21"), 54.21)

    def test_teams_count(self):
        self.assertEqual(len(IPL_TEAMS), 10)
        codes = [t['code'] for t in IPL_TEAMS.values()]
        for expected in ['CSK', 'RCB', 'MI', 'KKR', 'RR', 'DC', 'PBKS', 'SRH', 'LSG', 'GT']:
            self.assertIn(expected, codes)

    def test_historical_teams_mapping(self):
        # Modern seasons (2022+) have 10 teams
        teams_2025 = get_teams_for_year(2025)
        self.assertEqual(len(teams_2025), 10)

        # 2011 season had 10 teams including KTK and PWI
        teams_2011 = get_teams_for_year(2011)
        codes_2011 = [t['code'] for t in teams_2011.values()]
        self.assertIn('KTK', codes_2011)
        self.assertIn('PWI', codes_2011)

        # 2016 season had GL and RPS
        teams_2016 = get_teams_for_year(2016)
        codes_2016 = [t['code'] for t in teams_2016.values()]
        self.assertIn('GL', codes_2016)
        self.assertIn('RPS', codes_2016)

        # 2009 had Deccan Chargers
        teams_2009 = get_teams_for_year(2009)
        codes_2009 = [t['code'] for t in teams_2009.values()]
        self.assertIn('DCH', codes_2009)

    def test_bowling_innings_fallback(self):
        scraper = CricbuzzScraper(year=2025)
        mock_players = {
            "p1": {
                "player_id": "p1",
                "player_name": "Test Bowler",
                "matches_played": 10,
                "overs_bowled": 32.0,
                "bowling_innings": None,
                "runs_scored": None,
                "wickets_taken": 8
            }
        }
        scraper._calculate_advanced_metrics(mock_players)
        self.assertIsNotNone(mock_players["p1"]["bowling_innings"])
        self.assertGreater(mock_players["p1"]["bowling_innings"], 0)

    def test_csv_and_json_dumps(self):
        csv_path = DATA_DIR / "ipl_2025_players.csv"
        json_path = DATA_DIR / "ipl_2025_players.json"

        self.assertTrue(csv_path.exists(), "CSV dump should exist")
        self.assertTrue(json_path.exists(), "JSON dump should exist")

        df = pd.read_csv(csv_path)
        self.assertGreaterEqual(len(df), 150, "Should have all players across 10 teams")

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(len(data), len(df))

        # Check required columns + advanced metric columns
        required_cols = [
            'player_name', 'team_name', 'player_image_url', 'matches_played',
            'batting_innings', 'runs_scored', 'batting_average', 'batting_strike_rate',
            'fours', 'sixes', 'bowling_innings', 'overs_bowled', 'wickets_taken',
            'runs_conceded', 'bowling_average', 'bowling_economy_rate', 'bowling_strike_rate',
            'boundary_percentage', 'impact_score'
        ]
        for col in required_cols:
            self.assertIn(col, df.columns)

    def test_sqlite_db_export(self):
        self.assertTrue(DB_PATH.exists(), "SQLite database cricstat.db should exist")
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM ipl_2025_players")
        count = cursor.fetchone()[0]
        self.assertGreaterEqual(count, 150, "SQLite table should contain all 2025 players")
        conn.close()

if __name__ == "__main__":
    unittest.main()
