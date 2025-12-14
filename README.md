# KLIMA — Local Weather & Jog Planner

Track your local weather with **multi-source forecasts** including **PAGASA (Philippines)**, OpenWeather, Open-Meteo, WeatherAPI.com, and Weatherbit.io. Plan your jogs with intelligent suitability scoring and engage with favorites, comparisons, and sharing.



## Features

### Core Weather
- Search any city or use your current location
- Live date/time for the location's timezone with **NOW highlight** on current hour
- Current conditions with feels‑like, humidity, wind, **precipitation rate**, UV, sunrise/sunset
- Hourly forecast (next 24h) with temperature and **precipitation intensity (mm/h)**
- 7‑day forecast with daily ranges and rain chance
- **Multi-source comparison**: OpenWeather, Open-Meteo, WeatherAPI.com, Weatherbit.io, and **PAGASA (for Philippines)**
- **Confidence scoring**: Multi-source variance analysis for forecast reliability
- **Air Quality Index (AQI)**: Real-time air pollution data
- Weather **alerts** with official warnings and heuristic fallbacks for heavy rain/storms/wind



### Jog Planning### Jog Planning

- Jog suitability badges (Good / Fair / Poor) based on temperature, wind, and rain chance- Jog suitability badges (Good / Fair / Poor) based on temperature, wind, and rain chance

- Summary counts for quick planning (Daily vs Weekly view toggle)- Summary counts for quick planning (Daily vs Weekly view toggle)

- Jog status navigation bar- Jog status navigation bar



### Engagement & Personalization
- **⭐ Favorites**: Save your frequent locations
- **🕐 Recent searches**: Quick access to recently viewed places
- **📊 Compare mode**: Side-by-side view of 5 weather sources (OpenWeather, Open-Meteo, WeatherAPI, Weatherbit, PAGASA)
- **📈 Interactive charts**: Hourly/daily temperature and precipitation visualization
- **🔗 Share button**: Share location weather via native share API or clipboard
- **Direct links**: Share URLs like `?loc=Manila` to open specific locations
- **PWA support**: Install as a progressive web app (offline-ready manifest)
- **📊 Weather History**: Track temperature trends with charts showing your past weather checks
- **👕 Clothing Recommendations**: Smart suggestions on what to wear based on current conditions
- **🧠 Weather Trivia**: Educational facts and interesting information about current weather
- **🏆 Achievements System**: Gamification with badges for weather exploration milestones
- **🎯 Activity Suggestions**: Personalized indoor/outdoor activity recommendations
- **📥 Data Export**: Download weather data in CSV, HTML, or JSON formats
- **⚖️ Quick Comparison**: Side-by-side weather comparison widget for multiple locations
- **📖 Weather Journal**: Personal notes and mood tracking for weather experiences



### UX Enhancements
- Smooth animations and transitions
- **Weather animations**: Real-time canvas effects (rain, snow, clouds)
- **Swipe gestures**: Navigate hourly/daily forecasts with touch
- Responsive dark theme optimized for all screens
- Icons in header for quick actions
- Auto-scroll to current hour in timeline
- Debug mode (`?debugHourly=1`) to verify timezone accuracy



## Quick start (XAMPP on Windows)

1) **Get API keys (free tier)**:
   - OpenWeather: https://openweathermap.org/api (1M calls/month)
   - WeatherAPI.com: https://www.weatherapi.com/signup.aspx (1M calls/month)
   - Weatherbit.io: https://www.weatherbit.io/account/create (500 calls/day)
   - Open-Meteo: No API key required
   - PAGASA: No API key required (web scraper)

2) **Configure the keys**:
   - Copy `.env.example` to `.env` and add your API keys
   - Or edit `config/config.php` directly
   - See `SETUP.md` for detailed configuration instructions



3) **Run locally via XAMPP**:
   - Ensure Apache is started
   - Place this folder under `c:\xampp\htdocs\KLIMA`
   - Open http://localhost/KLIMA in your browser

4) **Try new features**:
   - Click ⭐ to favorite a location
   - Visit **Compare** to see all 5 weather sources
   - Check **confidence score** badge on main page
   - View **AQI** (Air Quality Index) when available
   - Click **News** to view alerts (including PAGASA advisories for PH)
   - Share locations via the 🔗 button



## How it works

- **Frontend**: HTML5, vanilla JavaScript, responsive CSS with animations
- **Backend**: PHP endpoints proxy weather APIs (OpenWeather, Open-Meteo, WeatherAPI, Weatherbit, PAGASA scraper)
  - `api/geocode.php`: resolves place names to coordinates
  - `api/weather.php`: OpenWeather One Call (requires key)
  - `api/weather_free.php`: Open-Meteo fallback (no key needed)
  - `api/weatherapi.php`: WeatherAPI.com integration (requires key)
  - `api/weatherbit.php`: Weatherbit.io integration (requires key)
  - `api/pagasa.php`: scrapes PAGASA public forecasts for Philippines
  - `api/alerts.php`: aggregates official alerts + heuristic warnings
  - `api/confidence.php`: multi-source variance calculation for accuracy scoring
  - `api/airquality.php`: air quality index from OpenWeather
- **Caching**: 60‑second file cache for weather; 30‑minute cache for PAGASA
- **Storage**: localStorage for favorites, recent searches, and preferences



PAGASA IntegrationPAGASA Integration

------------------------------------



For Philippine locations, KLIMA now includes **official PAGASA forecasts**:For Philippine locations, KLIMA now includes **official PAGASA forecasts**:

- Displayed in **Compare mode** alongside international sources- Displayed in **Compare mode** alongside international sources

- Scraped from PAGASA public forecast pages (respecting their terms)- Scraped from PAGASA public forecast pages (respecting their terms)

- Includes synoptic analysis, temperature ranges, wind conditions, and advisories- Includes synoptic analysis, temperature ranges, wind conditions, and advisories

- Cached for 30 minutes to minimize server load- Cached for 30 minutes to minimize server load

- **Note**: PAGASA does not offer a public API; data is educational use only- **Note**: PAGASA does not offer a public API; data is educational use only



Jog suitability logicJog suitability logic (v1)

-----------------------------------------------



Heuristic score based on:Heuristic score based on:



- Temperature: best around 15–26°C; penalties below 10°C or above 28°C- Temperature: best around 15–26°C; large penalties below 10°C or above 28°C

- Wind: penalty above 6 m/s (≈ 13 mph)- Wind: penalty above 6 m/s (≈ 13 mph)

- Rain: penalty proportional to precipitation probability + intensity- Rain chance (pop): penalty proportional to probability

- Daylight slightly preferred- Daylight slightly preferred



Tweak thresholds in `assets/js/app.js` (`jogScore` function).You can tweak the thresholds in `assets/js/app.js` (see `jogScore`).



Notes and limitsNotes and limits

--------------------------------



- Uses OpenWeather One Call v2.5 for compatibility; upgrade to 3.0 in `config/config.php` if available- This uses OpenWeather One Call v2.5 endpoints for wide compatibility. If you have One Call 3.0 access, you can switch the URL in `config/config.php`.

- Keep your API key private. Do not commit a real key to public repositories- Keep your API key private. Do not commit a real key to public repositories.

- Free API tiers have rate limits; caching helps avoid hitting them- Free API tiers have rate limits; the short cache helps avoid hitting them.

- PAGASA scraper is best-effort; official advisories at **pagasa.dost.gov.ph**

- PWA manifest included; add icons (`assets/icon-192.png`, `assets/icon-512.png`) for full offline supportTroubleshooting

---------------

Troubleshooting

---------------- If you see “API key not configured”, edit `config/config.php` and set your key.

- If geolocation fails, your browser may be blocking it—use the city search.

- **"API key not configured"**: Edit `config/.env` or `config/config.php`- If nothing loads, check Apache/PHP error logs in XAMPP Control Panel.

- **Geolocation fails**: Browser may block it—use city search

- **Nothing loads**: Check Apache/PHP logs in XAMPP Control PanelDiagnostics

- **PAGASA data missing**: Only available for Philippine locations; check `api/pagasa.php`-----------

- **NOW highlight wrong**: Enable debug mode with `?debugHourly=1` and hover hour tiles

- Visit `http://localhost/KLIMA/diagnostics.php` to verify your API key and connectivity.

Diagnostics- If the test request fails, ensure `config/.env` contains `OWM_API_KEY=...` and that either cURL is enabled or `allow_url_fopen` is ON.

-----------

License

- Visit `http://localhost/KLIMA/diagnostics.php` to verify your API key and connectivity-------

- Check browser console (F12) for JS errors

- Ensure cURL or `allow_url_fopen` is enabled in PHPPersonal use. Replace with your preferred license if publishing.


License
-------

Personal/educational use. For public deployment, ensure compliance with PAGASA terms and weather data provider licenses.

---

**New in this version:**
- ✅ 5-source weather integration (OpenWeather, Open-Meteo, WeatherAPI, Weatherbit, PAGASA)
- ✅ Confidence scoring based on multi-source variance
- ✅ Air Quality Index (AQI) display
- ✅ Interactive hourly/daily charts with Chart.js
- ✅ Weather animations (rain, snow, clouds)
- ✅ PWA with service worker for offline support
- ✅ Swipe gestures for forecast navigation
- ✅ PAGASA integration for Philippines
- ✅ Favorites and recent searches
- ✅ Multi-source comparison page
- ✅ Share functionality
- ✅ Precipitation intensity display
- ✅ NOW hour highlighting with auto-scroll
- ✅ Smooth animations and UX polish
