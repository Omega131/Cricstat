import unittest
from pathlib import Path
import pandas as pd
import json

from app.scraper import CricbuzzScraper
from app.config import DATA_DIR, SERIES_YEAR_MAP, IPL_TEAMS

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

        # Check required columns
        required_cols = [
            'player_name', 'team_name', 'player_image_url', 'matches_played',
            'batting_innings', 'runs_scored', 'batting_average', 'batting_strike_rate',
            'fours', 'sixes', 'bowling_innings', 'overs_bowled', 'wickets_taken',
            'runs_conceded', 'bowling_average', 'bowling_economy_rate', 'bowling_strike_rate'
        ]
        for col in required_cols:
            self.assertIn(col, df.columns)

if __name__ == "__main__":
    unittest.main()
