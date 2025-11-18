# KLIMA Weather App - Setup Guide

## Overview
KLIMA integrates **7 credible weather data sources** to provide accurate, multi-source validated forecasts:

1. **OpenWeather** - Industry standard weather API
2. **Open-Meteo** - Free open-source weather API
3. **WeatherAPI.com** - Comprehensive forecast data (1M calls/month free)
4. **Weatherbit.io** - Professional weather service (500 calls/day free)
5. **Tomorrow.io** - Most advanced weather API with 60+ data layers (500 calls/day free)
6. **Visual Crossing** - 50+ years historical data (1000 records/day free)
7. **PAGASA** - Official Philippine weather bureau (web scraper)

## Prerequisites
- XAMPP (Apache + PHP 7.4+)
- Internet connection for API calls
- API keys from weather providers

## API Key Setup

### 1. OpenWeather API
1. Sign up at https://openweathermap.org/api
2. Create a free API key (60 calls/min, 1M calls/month)
3. Copy your API key

**Free Tier Limits:**
- 60 calls/minute
- 1,000,000 calls/month
- Current weather, hourly, daily forecasts
- Air quality data included

### 2. WeatherAPI.com
1. Sign up at https://www.weatherapi.com/signup.aspx
2. Free plan includes 1,000,000 calls/month
3. Copy your API key from dashboard

**Free Tier Limits:**
- 1,000,000 calls/month
- Real-time weather
- 3-day forecast
- Weather alerts
- Air quality data

### 3. Weatherbit.io
1. Sign up at https://www.weatherbit.io/account/create
2. Free plan includes 500 calls/day
3. Copy your API key from account page

**Free Tier Limits:**
- 500 calls/day
- Current weather + 16-day forecast
- Hourly forecasts (48 hours)
- Severe weather alerts
- Air quality included

### 4. Tomorrow.io
1. Sign up at https://www.tomorrow.io
2. Free plan includes 500 calls/day, 25 calls/hour
3. Copy your API key from dashboard

**Free Tier Limits:**
- 500 calls/day
- 25 calls/hour
- 60+ weather data layers (most comprehensive)
- Real-time + 14-day forecast
- Air quality, pollen, fire index, flood risk
- Hyperlocal accuracy with AI/ML models

### 5. Visual Crossing
1. Sign up at https://www.visualcrossing.com/sign-up
2. Free plan includes 1000 records/day
3. Copy your API key from account page

**Free Tier Limits:**
- 1000 weather records/day
- 50+ years of historical data
- Historical forecasts (unique feature)
- Statistical forecasts beyond 15 days
- Single endpoint for all data
- Sub-hourly, hourly, daily data

### 6. Open-Meteo
- **No API key required!**
- Completely free and open-source
- No rate limits for non-commercial use
- https://open-meteo.com

### 7. PAGASA (Philippines)
- **No API key required!**
- Official Philippine weather data
- Web scraper implementation
- Only works for Philippine locations

## Environment Configuration

### Option 1: Environment Variables (Recommended)
Create a `.env` file in the project root:

```env
# OpenWeather API Key
OWM_API_KEY=your_openweather_api_key_here

# WeatherAPI.com Key
WEATHERAPI_KEY=your_weatherapi_key_here

# Weatherbit.io Key
WEATHERBIT_KEY=your_weatherbit_key_here

# Tomorrow.io Key
TOMORROW_KEY=your_tomorrow_key_here

# Visual Crossing Key
VISUALCROSSING_KEY=your_visualcrossing_key_here
```

### Option 2: Direct Configuration
Edit `config/config.php` and add your keys:

```php
define('OWM_API_KEY', 'your_openweather_api_key_here');
define('WEATHERAPI_KEY', 'your_weatherapi_key_here');
define('WEATHERBIT_KEY', 'your_weatherbit_key_here');
```

## Installation Steps

1. **Clone/Download** the project to your XAMPP htdocs folder:
   ```
   C:\xampp\htdocs\KLIMA\
   ```

2. **Configure API Keys** using one of the methods above

3. **Start XAMPP**
   - Open XAMPP Control Panel
   - Start Apache service

4. **Access the App**
   - Open browser: http://localhost/KLIMA/
   - Allow location access when prompted
   - Or use manual location search

5. **Test Multi-Source Integration**
   - Navigate to "Compare Sources" page
   - Verify all 5 sources load correctly
   - Check confidence score on main page

## API Endpoint Reference

### Main Weather Endpoints
- `/api/weather.php` - OpenWeather (primary)
- `/api/weather_free.php` - Open-Meteo (fallback)
- `/api/weatherapi.php` - WeatherAPI.com
- `/api/weatherbit.php` - Weatherbit.io
- `/api/pagasa.php` - PAGASA (Philippines only)

### Additional Features
- `/api/airquality.php` - OpenWeather air quality
- `/api/confidence.php` - Multi-source confidence score
- `/api/geocode.php` - Location search

## Rate Limit Management

KLIMA implements intelligent caching to respect API rate limits:

- **Cache Duration:** 60 seconds (configurable in config.php)
- **Automatic Fallback:** If primary source fails, uses Open-Meteo
- **Multi-Source Validation:** Confidence score requires ≥3 sources

### Daily API Call Estimates
For a single user checking weather every hour:

| Source | Calls/Day | Monthly Limit | Usage % |
|--------|-----------|---------------|---------|
| OpenWeather | 24 | 1,000,000 | 0.07% |
| WeatherAPI | 24 | 1,000,000 | 0.07% |
| Weatherbit | 24 | 15,000 | 4.8% |
| Open-Meteo | 24 | Unlimited | N/A |
| PAGASA | 24 | N/A | N/A |

**Recommendation:** All APIs comfortably support personal use. For production apps with multiple users, consider upgrading Weatherbit or implementing user-based rate limiting.

## Troubleshooting

### "Failed to load" errors on Compare page

**Possible causes:**
1. Missing API key - Check config.php or .env file
2. Invalid API key - Verify key is active in provider dashboard
3. Rate limit exceeded - Wait for reset or check provider limits
4. Network issues - Check internet connection

**Debug steps:**
1. Open browser DevTools (F12)
2. Check Network tab for API responses
3. Look for red/failed requests
4. View response to see specific error message

### Cache Issues

**Clear cache manually:**
```
Delete files in: C:\xampp\htdocs\KLIMA\cache\
```

**Adjust cache duration:**
Edit `config/config.php`:
```php
define('CACHE_DURATION', 300); // 5 minutes instead of 60 seconds
```

### PAGASA Data Not Showing

PAGASA only appears for Philippine locations:
- Manila, Philippines ✓
- Cebu, Philippines ✓
- New York, USA ✗

### Confidence Score Not Calculating

Requires at least 3 sources with valid data:
1. Verify API keys are configured
2. Check cache folder has recent data files
3. View confidence.php response in browser:
   ```
   http://localhost/KLIMA/api/confidence.php?lat=14.5995&lon=120.9842
   ```

## Performance Optimization

### Production Deployment
1. **Increase cache duration** to 300-600 seconds
2. **Enable PHP OPcache** in php.ini
3. **Use CDN** for static assets
4. **Implement service worker** for offline support (already included)
5. **Compress responses** with gzip

### Cache Strategy
- Current weather: 60s cache
- Hourly forecast: 300s cache
- Daily forecast: 600s cache
- Air quality: 300s cache

## Security Recommendations

1. **Never commit API keys** to version control
2. **Use .env files** (add to .gitignore)
3. **Implement rate limiting** for public deployments
4. **Validate user inputs** (lat/lon bounds checking)
5. **Use HTTPS** in production
6. **Sanitize PAGASA scraper** output (already implemented)

## Support & Resources

### API Documentation
- OpenWeather: https://openweathermap.org/api
- WeatherAPI: https://www.weatherapi.com/docs/
- Weatherbit: https://www.weatherbit.io/api
- Open-Meteo: https://open-meteo.com/en/docs
- PAGASA: https://www.pagasa.dost.gov.ph

### Project Files
- Main UI: `index.html`
- Compare UI: `compare.html`
- Configuration: `config/config.php`
- API handlers: `api/*.php`
- Frontend logic: `assets/js/*.js`

## Feature Checklist

✅ Multi-source weather integration (5 sources)  
✅ Confidence scoring algorithm  
✅ Air quality index display  
✅ Interactive hourly/daily charts  
✅ Weather animations (rain, snow, clouds)  
✅ Progressive Web App (PWA) support  
✅ Offline caching with service worker  
✅ Responsive design (mobile + desktop)  
✅ Dark/light theme toggle  
✅ Swipe gestures for forecast navigation  
✅ Location search with autocomplete  
✅ Geolocation support  
✅ PAGASA official Philippines data  

## Next Steps

1. **Test all integrations** with your API keys
2. **Customize cache durations** based on your needs
3. **Add more regions** to PAGASA scraper (if needed)
4. **Deploy to production** server with HTTPS
5. **Monitor API usage** via provider dashboards
6. **Implement analytics** to track user engagement

---

**Version:** 2.0  
**Last Updated:** 2024  
**Author:** KLIMA Weather Team
