# KLIMA Testing Guide

## Pre-Testing Setup

1. **Verify API Keys are Configured**
   - Option 1: Check `.env` file exists with all keys
   - Option 2: Check `config/config.php` has keys defined
   
2. **Start XAMPP Apache**
   - Open XAMPP Control Panel
   - Start Apache service

3. **Test Base URL**
   - Navigate to: http://localhost/KLIMA/
   - Should load without errors

## Testing Individual API Endpoints

### 1. OpenWeather API (api/weather.php)
**Test URL:**
```
http://localhost/KLIMA/api/weather.php?lat=14.5995&lon=120.9842&units=metric
```

**Expected Response:**
```json
{
  "current": {
    "temp": 28.5,
    "feels_like": 32.1,
    "humidity": 75,
    "wind_speed": 3.2,
    "weather": [{"description": "scattered clouds", "icon": "03d"}]
  },
  "hourly": [...],
  "daily": [...]
}
```

**Common Issues:**
- `{"error": "API key not configured"}` → Add OWM_API_KEY to .env
- `{"error": "Invalid API key"}` → Check key is active at openweathermap.org
- Empty response → Check Apache error logs

---

### 2. Open-Meteo API (api/weather_free.php)
**Test URL:**
```
http://localhost/KLIMA/api/weather_free.php?lat=14.5995&lon=120.9842&units=metric
```

**Expected Response:**
```json
{
  "current": {
    "temp": 28.3,
    "feels_like": 31.8,
    "humidity": 74,
    "wind_speed": 3.1
  },
  "hourly": [...],
  "daily": [...]
}
```

**Common Issues:**
- Open-Meteo rarely fails (no API key required)
- If it fails, check internet connectivity
- May be slower than other APIs

---

### 3. WeatherAPI.com (api/weatherapi.php)
**Test URL:**
```
http://localhost/KLIMA/api/weatherapi.php?lat=14.5995&lon=120.9842&units=metric
```

**Expected Response:**
```json
{
  "current": {
    "temp": 28.7,
    "feels_like": 32.4,
    "humidity": 76,
    "wind_speed": 3.3,
    "weather": [{"description": "Partly cloudy", "icon": "02d"}],
    "air_quality": {"aqi": 52}
  },
  "hourly": [...24 hours],
  "daily": [...7 days],
  "alerts": [...]
}
```

**Common Issues:**
- `{"error": "API key not configured"}` → Add WEATHERAPI_KEY to .env
- `{"error": "Invalid API key"}` → Check key at weatherapi.com dashboard
- `{"error": "API rate limit exceeded"}` → 1M calls/month exceeded (unlikely)

---

### 4. Weatherbit.io (api/weatherbit.php)
**Test URL:**
```
http://localhost/KLIMA/api/weatherbit.php?lat=14.5995&lon=120.9842&units=metric
```

**Expected Response:**
```json
{
  "current": {
    "temp": 28.4,
    "feels_like": 32.0,
    "humidity": 75,
    "wind_speed": 3.2,
    "weather": [{"description": "Scattered clouds", "icon": "03d"}],
    "air_quality": {"aqi": 50}
  },
  "hourly": [...48 hours],
  "daily": [...16 days]
}
```

**Common Issues:**
- `{"error": "API key not configured"}` → Add WEATHERBIT_KEY to .env
- `{"error": "Invalid API key"}` → Check key at weatherbit.io account page
- `{"error": "API rate limit exceeded"}` → 500 calls/day exceeded
- Slower response (makes 3 separate API calls)

---

### 5. PAGASA Scraper (api/pagasa.php)
**Test URL:**
```
http://localhost/KLIMA/api/pagasa.php?region=metro-manila
```

**Expected Response:**
```json
{
  "synopsis": "Southwest Monsoon affecting...",
  "issued_at": "2024-01-15 05:00 AM",
  "forecast": {
    "today": {
      "condition": "Partly cloudy with isolated rainshowers",
      "temp_min": 24,
      "temp_max": 32,
      "wind": "Southwest 10-25 kph"
    }
  }
}
```

**Common Issues:**
- `{"error": "Failed to fetch PAGASA data"}` → PAGASA website may be down
- Cached for 30 minutes → Delete cache file to force refresh
- Only works for Philippine regions

---

## Testing Confidence Score

**Test URL:**
```
http://localhost/KLIMA/api/confidence.php?lat=14.5995&lon=120.9842
```

**Expected Response:**
```json
{
  "confidence": 92,
  "variance": 0.8,
  "sources_compared": ["openweather", "openmeteo", "weatherapi", "weatherbit", "pagasa"],
  "description": "High confidence"
}
```

**What It Means:**
- **90-100**: All sources agree (excellent)
- **80-89**: Minor differences (good)
- **70-79**: Moderate differences (fair)
- **<70**: Significant differences (caution)

**Common Issues:**
- Only 1-2 sources in array → Other API keys not configured
- Low confidence (< 70) → Normal weather pattern variation
- Error → Check that at least 3 sources have valid cached data

---

## Testing Air Quality

**Test URL:**
```
http://localhost/KLIMA/api/airquality.php?lat=14.5995&lon=120.9842
```

**Expected Response:**
```json
{
  "aqi": 52,
  "components": {
    "pm2_5": 12.5,
    "pm10": 25.3,
    "o3": 48.2
  },
  "description": "Moderate"
}
```

**AQI Scale:**
- **0-50**: Good (green)
- **51-100**: Moderate (yellow)
- **101-150**: Unhealthy for sensitive (orange)
- **151-200**: Unhealthy (red)
- **201+**: Very unhealthy (purple)

---

## Frontend Integration Testing

### 1. Main Page (index.html)
1. Navigate to http://localhost/KLIMA/
2. Search for "Manila, Philippines"
3. **Verify:**
   - Current weather loads
   - Confidence score badge appears (top-right)
   - AQI badge appears (if available)
   - Hourly forecast chart renders
   - Daily forecast chart renders
   - Weather animations play (rain/snow/clouds)

### 2. Compare Page (compare.html)
1. Navigate to http://localhost/KLIMA/compare.html
2. **Verify:**
   - OpenWeather card loads
   - Open-Meteo card loads
   - WeatherAPI card loads (NEW)
   - Weatherbit card loads (NEW)
   - PAGASA card loads (for Philippine locations only)
   - All cards show current temperature
   - All cards show weather description
   - AQI appears in WeatherAPI and Weatherbit cards

### 3. Source Attribution
Each card should show:
- Temperature, feels like, humidity, wind
- Weather description
- Source name at bottom
- AQI (if supported by that source)

---

## Browser Console Testing

### Enable Developer Tools
- Press `F12` in browser
- Go to "Console" tab

### Check for Errors
**Common Console Messages:**

✅ **Good:**
```
[Weather] Loaded OpenWeather data
[Weather] Loaded WeatherAPI data
[Weather] Confidence score: 92%
```

❌ **Bad:**
```
Failed to fetch api/weatherapi.php: 500
Uncaught TypeError: Cannot read property 'temp'
API key not configured
```

### Network Tab Analysis
1. Open DevTools → Network tab
2. Reload page
3. Check API calls:
   - `weather.php` → Should return 200 OK
   - `weatherapi.php` → Should return 200 OK
   - `weatherbit.php` → Should return 200 OK
   - `confidence.php` → Should return 200 OK

**Response Time Benchmarks:**
- OpenWeather: 200-500ms
- Open-Meteo: 300-600ms
- WeatherAPI: 250-550ms
- Weatherbit: 600-1200ms (slower, makes 3 calls)

---

## Cache Testing

### View Cache Files
Navigate to: `C:\xampp\htdocs\KLIMA\cache\`

**Expected Files:**
- `weather_openweather_14.5995_120.9842.json`
- `weather_openmeteo_14.5995_120.9842.json`
- `weather_weatherapi_14.5995_120.9842.json`
- `weather_weatherbit_14.5995_120.9842.json`
- `pagasa_metro-manila.json`

**Test Cache Expiration:**
1. Load a location
2. Check timestamp on cache file
3. Wait 60 seconds
4. Reload page
5. Verify cache file has new timestamp

### Clear Cache Manually
```powershell
Remove-Item C:\xampp\htdocs\KLIMA\cache\*.json
```

---

## Rate Limit Testing

### Monitor API Usage

**OpenWeather:**
- Dashboard: https://home.openweathermap.org/api_keys
- Free tier: 1,000,000 calls/month
- KLIMA usage (1 user, hourly checks): ~720 calls/month (0.07%)

**WeatherAPI.com:**
- Dashboard: https://www.weatherapi.com/my/
- Free tier: 1,000,000 calls/month
- KLIMA usage: ~720 calls/month (0.07%)

**Weatherbit.io:**
- Dashboard: https://www.weatherbit.io/account/dashboard
- Free tier: 500 calls/day
- KLIMA usage: ~24 calls/day (4.8%)

**Recommendation:** With caching, all free tiers are more than sufficient for personal use.

---

## Multi-Location Testing

Test different locations to verify data variety:

### Tropical (Manila, Philippines)
```
lat=14.5995, lon=120.9842
Expected: Hot (28-32°C), High humidity (70-85%), PAGASA data available
```

### Temperate (London, UK)
```
lat=51.5074, lon=-0.1278
Expected: Mild (10-20°C), Moderate humidity, No PAGASA
```

### Cold (Oslo, Norway)
```
lat=59.9139, lon=10.7522
Expected: Cold (-5 to 15°C depending on season), No PAGASA
```

### Desert (Dubai, UAE)
```
lat=25.2048, lon=55.2708
Expected: Hot (30-45°C), Low humidity, High AQI possible
```

---

## Troubleshooting Checklist

### Issue: No data loads on any source
- [ ] Apache is running in XAMPP
- [ ] PHP is enabled (check phpinfo.php)
- [ ] Internet connection active
- [ ] Browser console shows no CORS errors

### Issue: Only Open-Meteo works
- [ ] API keys are configured in .env or config.php
- [ ] Keys are valid (check provider dashboards)
- [ ] Keys have correct permissions
- [ ] Cache folder is writable

### Issue: Confidence score always shows "Not enough data"
- [ ] At least 3 API keys configured
- [ ] Cache files exist for multiple sources
- [ ] Cache files are not stale (< 60 seconds old)
- [ ] confidence.php returns valid JSON

### Issue: Compare page shows "Failed to load"
- [ ] Check compare.js is loading (Network tab)
- [ ] Location is stored in localStorage (check Application tab)
- [ ] Each API endpoint returns 200 OK
- [ ] No JavaScript errors in console

### Issue: PAGASA card never shows
- [ ] Location is in Philippines (country code "PH")
- [ ] Region parameter is valid (metro-manila, etc.)
- [ ] PAGASA website is accessible
- [ ] Cache/pagasa file exists and is recent

---

## Performance Testing

### Page Load Time
**Target:** < 3 seconds for initial load

**Measure with DevTools:**
1. Open DevTools → Performance tab
2. Click "Record"
3. Reload page
4. Stop recording
5. Check "Load" event timestamp

### API Response Aggregation
**Target:** < 2 seconds for all 5 sources in parallel

**Test:**
```javascript
// Paste in browser console
const start = Date.now();
Promise.all([
  fetch('api/weather.php?lat=14.5995&lon=120.9842&units=metric'),
  fetch('api/weather_free.php?lat=14.5995&lon=120.9842&units=metric'),
  fetch('api/weatherapi.php?lat=14.5995&lon=120.9842&units=metric'),
  fetch('api/weatherbit.php?lat=14.5995&lon=120.9842&units=metric'),
  fetch('api/pagasa.php?region=metro-manila')
]).then(() => console.log('Total time:', Date.now() - start, 'ms'));
```

---

## Production Checklist

Before deploying to production server:

- [ ] All API keys configured via environment variables (not hardcoded)
- [ ] .env file in .gitignore
- [ ] Cache folder permissions set (writable)
- [ ] HTTPS enabled
- [ ] Error logging configured
- [ ] Rate limiting implemented (if public)
- [ ] Service worker configured for correct domain
- [ ] PWA manifest icons added (192x192, 512x512)
- [ ] Analytics integrated (optional)
- [ ] CORS headers configured (if cross-origin)
- [ ] Compression enabled (gzip)
- [ ] Cache headers optimized
- [ ] Database backup strategy (if applicable)

---

## Success Criteria

✅ **Integration is working correctly if:**
1. All 5 sources load on compare page
2. Confidence score shows 80-100% for stable weather
3. AQI data appears from WeatherAPI and Weatherbit
4. No console errors
5. Cache files generate and expire correctly
6. Response times < 1 second per API
7. PAGASA loads for Philippine locations
8. Charts render without errors
9. Weather animations play smoothly
10. PWA can be installed and works offline

---

**Last Updated:** 2024  
**Tested On:** Windows 10/11, XAMPP 8.2, PHP 7.4+, Chrome/Edge/Firefox
