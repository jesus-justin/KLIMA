KLIMA — Local Weather & Jog Planner
===================================

Track your local weather and quickly see the best times to jog, with an hourly timeline, 7‑day outlook, and a simple “Jog suitability” score.

Features
--------

- Search any city or use your current location
- Live date/time for the location’s timezone
- Current conditions with feels‑like, humidity, wind, UV, sunrise/sunset
- Hourly forecast (next 24h) with temperature and precipitation probability
- 7‑day forecast with daily ranges and rain chance
- Jog suitability badges (Good / Fair / Poor) based on temperature, wind and rain chance
- Units toggle (°C/°F)

Quick start (XAMPP on Windows)
------------------------------

1) Get an OpenWeather API key (free tier):
	- https://openweathermap.org/api

2) Configure the key:
	- Open `config/config.php`
	- Replace `REPLACE_WITH_YOUR_OPENWEATHER_API_KEY` with your real key

3) Run locally via XAMPP:
	- Ensure Apache is started
	- Place this folder under `c:\\xampp\\htdocs\\KLIMA` (already done)
	- Open http://localhost/KLIMA in your browser

How it works
------------

- Frontend: static files in `index.html`, `assets/css/styles.css`, `assets/js/app.js`.
- Backend: tiny PHP endpoints proxy OpenWeather so your key stays server‑side:
  - `api/geocode.php`: resolves a place name to latitude/longitude
  - `api/weather.php`: fetches One Call (2.5) weather (current, hourly, daily)
- Caching: a minimal 120‑second file cache reduces API calls in `config/.cache/`.

Jog suitability logic (v1)
--------------------------

Heuristic score based on:

- Temperature: best around 15–26°C; large penalties below 10°C or above 28°C
- Wind: penalty above 6 m/s (≈ 13 mph)
- Rain chance (pop): penalty proportional to probability
- Daylight slightly preferred

You can tweak the thresholds in `assets/js/app.js` (see `jogScore`).

Notes and limits
----------------

- This uses OpenWeather One Call v2.5 endpoints for wide compatibility. If you have One Call 3.0 access, you can switch the URL in `config/config.php`.
- Keep your API key private. Do not commit a real key to public repositories.
- Free API tiers have rate limits; the short cache helps avoid hitting them.

Troubleshooting
---------------

- If you see “API key not configured”, edit `config/config.php` and set your key.
- If geolocation fails, your browser may be blocking it—use the city search.
- If nothing loads, check Apache/PHP error logs in XAMPP Control Panel.

Diagnostics
-----------

- Visit `http://localhost/KLIMA/diagnostics.php` to verify your API key and connectivity.
- If the test request fails, ensure `config/.env` contains `OWM_API_KEY=...` and that either cURL is enabled or `allow_url_fopen` is ON.

License
-------

Personal use. Replace with your preferred license if publishing.
