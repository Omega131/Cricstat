import argparse
import sys
from pathlib import Path

# Add current dir to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.scraper import CricbuzzScraper
from app.config import DEFAULT_YEAR, SERIES_YEAR_MAP

def main():
    parser = argparse.ArgumentParser(description="Scrape complete IPL player statistics from Cricbuzz.")
    parser.add_argument("--year", type=int, default=DEFAULT_YEAR, help=f"IPL season year (e.g. 2025, 2024, 2023). Available: {list(SERIES_YEAR_MAP.keys())}")
    parser.add_argument("--no-images", action="store_true", help="Skip fetching player image URLs")
    parser.add_argument("--workers", type=int, default=4, help="Number of concurrent workers for image fetching")
    parser.add_argument("--csv", type=str, default=None, help="Custom CSV output filename")
    parser.add_argument("--json", type=str, default=None, help="Custom JSON output filename")

    args = parser.parse_args()

    print(f"==================================================")
    print(f"  IPL CRICKET PLAYER STATISTICS SCRAPER")
    print(f"  Year: {args.year}")
    print(f"  Fetch Images: {not args.no_images}")
    print(f"==================================================")

    scraper = CricbuzzScraper(year=args.year, on_log=lambda msg: print(f"[*] {msg}"))
    players = scraper.scrape(fetch_images=not args.no_images, max_workers=args.workers)

    csv_path = scraper.export_csv(players, filename=args.csv)
    json_path = scraper.export_json(players, filename=args.json)
    db_path = scraper.export_sqlite(players)

    print("\n---------------- SUMMARY ----------------")
    print(f"Total Unified Players: {len(players)}")
    print(f"CSV Dump:    {csv_path}")
    print(f"JSON Dump:   {json_path}")
    print(f"SQLite DB:   {db_path}")
    print("-----------------------------------------")

if __name__ == "__main__":
    main()
