import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
STATIC_DIR = BASE_DIR / "static"

DATA_DIR.mkdir(exist_ok=True)
STATIC_DIR.mkdir(exist_ok=True)

DEFAULT_YEAR = 2025

# Mapping from IPL Year to Cricbuzz Series ID
SERIES_YEAR_MAP = {
    2026: 9241,
    2025: 9237,
    2024: 7607,
    2023: 5945,
    2022: 4061,
    2021: 3472,
    2020: 3130,
    2019: 2810,
    2018: 2676,
    2017: 2568,
    2016: 2430,
    2015: 2330,
    2014: 2261,
    2013: 2170,
    2012: 2115,
    2011: 2037,
    2010: 2060,
    2009: 2059,
    2008: 2058
}

# The 10 IPL franchises with identifiers, brand colors, and team codes
IPL_TEAMS = {
    "58": {
        "name": "Chennai Super Kings",
        "code": "CSK",
        "primary_color": "#FDB913",
        "secondary_color": "#0081E9",
        "logo_text": "CSK"
    },
    "59": {
        "name": "Royal Challengers Bengaluru",
        "code": "RCB",
        "primary_color": "#EC1C24",
        "secondary_color": "#1D1D1D",
        "logo_text": "RCB"
    },
    "61": {
        "name": "Delhi Capitals",
        "code": "DC",
        "primary_color": "#0078BC",
        "secondary_color": "#D71920",
        "logo_text": "DC"
    },
    "62": {
        "name": "Mumbai Indians",
        "code": "MI",
        "primary_color": "#004BA0",
        "secondary_color": "#D1AB3E",
        "logo_text": "MI"
    },
    "63": {
        "name": "Kolkata Knight Riders",
        "code": "KKR",
        "primary_color": "#3A225D",
        "secondary_color": "#F7D54E",
        "logo_text": "KKR"
    },
    "64": {
        "name": "Rajasthan Royals",
        "code": "RR",
        "primary_color": "#EA1A85",
        "secondary_color": "#254AA5",
        "logo_text": "RR"
    },
    "65": {
        "name": "Punjab Kings",
        "code": "PBKS",
        "primary_color": "#DD1F2D",
        "secondary_color": "#DCDDDF",
        "logo_text": "PBKS"
    },
    "255": {
        "name": "Sunrisers Hyderabad",
        "code": "SRH",
        "primary_color": "#F26522",
        "secondary_color": "#111111",
        "logo_text": "SRH"
    },
    "966": {
        "name": "Lucknow Super Giants",
        "code": "LSG",
        "primary_color": "#0057E7",
        "secondary_color": "#FD8023",
        "logo_text": "LSG"
    },
    "971": {
        "name": "Gujarat Titans",
        "code": "GT",
        "primary_color": "#1C2A38",
        "secondary_color": "#E5B757",
        "logo_text": "GT"
    }
}

SCRAPER_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
]
