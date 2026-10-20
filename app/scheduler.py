import threading
import time
from datetime import datetime
from typing import Optional, Callable
from .scraper import CricbuzzScraper
from .config import DEFAULT_YEAR

class BackgroundScraperScheduler:
    def __init__(self):
        self.enabled = False
        self.interval_seconds = 12 * 3600  # Default 12 hours
        self.year = DEFAULT_YEAR
        self.thread: Optional[threading.Thread] = None
        self.stop_event = threading.Event()
        self.last_run: Optional[str] = None
        self.next_run: Optional[str] = None
        self.is_running = False
        self.lock = threading.Lock()
        self.on_scrape_complete: Optional[Callable[[int], None]] = None

    def start(self, year: int = DEFAULT_YEAR, interval_hours: int = 12):
        with self.lock:
            self.year = year
            self.interval_seconds = max(1, interval_hours) * 3600
            self.enabled = True
            self.stop_event.clear()
            if self.thread is None or not self.thread.is_alive():
                self.thread = threading.Thread(target=self._run_loop, daemon=True)
                self.thread.start()
            self._update_next_run()

    def stop(self):
        with self.lock:
            self.enabled = False
            self.stop_event.set()
            self.next_run = None

    def _update_next_run(self):
        next_ts = time.time() + self.interval_seconds
        self.next_run = datetime.fromtimestamp(next_ts).strftime("%Y-%m-%d %H:%M:%S")

    def _run_loop(self):
        while not self.stop_event.is_set():
            # Wait for next interval
            interrupted = self.stop_event.wait(timeout=self.interval_seconds)
            if interrupted or not self.enabled:
                break

            try:
                self.is_running = True
                print(f"[Scheduler] Triggering scheduled scrape for IPL {self.year}...")
                scraper = CricbuzzScraper(year=self.year)
                players = scraper.scrape(fetch_images=True)
                scraper.export_csv(players)
                scraper.export_json(players)
                scraper.export_sqlite(players)
                self.last_run = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                self._update_next_run()
                if self.on_scrape_complete:
                    self.on_scrape_complete(self.year)
            except Exception as e:
                print(f"[Scheduler] Error during scheduled scrape: {e}")
            finally:
                self.is_running = False

    def get_status(self):
        with self.lock:
            return {
                "enabled": self.enabled,
                "interval_hours": round(self.interval_seconds / 3600, 1),
                "year": self.year,
                "last_run": self.last_run,
                "next_run": self.next_run,
                "is_running": self.is_running
            }

scheduler_instance = BackgroundScraperScheduler()
