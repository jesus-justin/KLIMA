<?php
// WeatherAPI.com integration (free tier: 1M calls/month)
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/config.php';

$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
$lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;
$units = isset($_GET['units']) && in_array($_GET['units'], ['metric','imperial']) ? $_GET['units'] : 'metric';

if ($lat === null || $lon === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing lat/lon parameters']);
    exit;
}

// Get API key from environment or config
$apiKey = getenv('WEATHERAPI_KEY') ?: (defined('WEATHERAPI_KEY') ? WEATHERAPI_KEY : null);

if (!$apiKey) {
    http_response_code(200);
    echo json_encode([
        'error' => 'WeatherAPI key not configured',
        'note' => 'Sign up at https://www.weatherapi.com for a free API key'
    ]);
    exit;
}

$cacheKey = 'weatherapi:' . $lat . ',' . $lon . ':' . $units;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

// WeatherAPI.com endpoint - forecast includes current + hourly + daily + alerts + aqi
$query = http_build_query([
    'key' => $apiKey,
    'q' => $lat . ',' . $lon,
    'days' => 7,
    'aqi' => 'yes',
    'alerts' => 'yes'
]);

$url = 'https://api.weatherapi.com/v1/forecast.json?' . $query;
$resp = http_json($url);
$data = json_decode($resp, true);

if (!is_array($data) || isset($data['error'])) {
    http_response_code(502);
    echo json_encode([
        'error' => 'WeatherAPI request failed',
        'detail' => $data['error']['message'] ?? 'Unknown error'
    ]);
    exit;
}

// Transform to our standard format
$current = $data['current'] ?? [];
$location = $data['location'] ?? [];
$forecast = $data['forecast']['forecastday'] ?? [];
$alerts = $data['alerts']['alert'] ?? [];

// Build current weather
$currentOut = [
    'dt' => $current['last_updated_epoch'] ?? time(),
    'temp' => $units === 'metric' ? $current['temp_c'] : $current['temp_f'],
    'feels_like' => $units === 'metric' ? $current['feelslike_c'] : $current['feelslike_f'],
    'humidity' => $current['humidity'] ?? null,
    'uvi' => $current['uv'] ?? 0,
    'wind_speed' => $units === 'metric' ? $current['wind_kph'] / 3.6 : $current['wind_mph'],
    'precip' => $units === 'metric' ? $current['precip_mm'] : $current['precip_in'],
    'weather' => [[
        'id' => $current['condition']['code'] ?? 0,
        'main' => $current['condition']['text'] ?? '',
        'description' => $current['condition']['text'] ?? '',
        'icon' => mapWeatherAPIIcon($current['condition']['code'] ?? 0, $current['is_day'] ?? 1)
    ]],
    'sunrise' => strtotime($forecast[0]['astro']['sunrise'] ?? 'today 6:00am'),
    'sunset' => strtotime($forecast[0]['astro']['sunset'] ?? 'today 6:00pm'),
];

// Air quality
if (isset($current['air_quality'])) {
    $currentOut['aqi'] = [
        'us_epa' => $current['air_quality']['us-epa-index'] ?? null,
        'pm25' => $current['air_quality']['pm2_5'] ?? null,
        'pm10' => $current['air_quality']['pm10'] ?? null,
        'o3' => $current['air_quality']['o3'] ?? null,
        'no2' => $current['air_quality']['no2'] ?? null,
        'so2' => $current['air_quality']['so2'] ?? null,
        'co' => $current['air_quality']['co'] ?? null,
    ];
}

// Build hourly (24 hours)
$hourly = [];
foreach ($forecast as $day) {
    foreach ($day['hour'] ?? [] as $h) {
        if (count($hourly) >= 24) break 2;
        $hourly[] = [
            'dt' => $h['time_epoch'],
            'temp' => $units === 'metric' ? $h['temp_c'] : $h['temp_f'],
            'pop' => $h['chance_of_rain'] / 100.0,
            'precip' => $units === 'metric' ? $h['precip_mm'] : $h['precip_in'],
            'wind_speed' => $units === 'metric' ? $h['wind_kph'] / 3.6 : $h['wind_mph'],
            'weather' => [[
                'icon' => mapWeatherAPIIcon($h['condition']['code'], $h['is_day'])
            ]]
        ];
    }
}

// Build daily (7 days)
$daily = [];
foreach ($forecast as $d) {
    $daily[] = [
        'dt' => $d['date_epoch'],
        'temp' => [
            'min' => $units === 'metric' ? $d['day']['mintemp_c'] : $d['day']['mintemp_f'],
            'max' => $units === 'metric' ? $d['day']['maxtemp_c'] : $d['day']['maxtemp_f'],
            'day' => $units === 'metric' ? $d['day']['avgtemp_c'] : $d['day']['avgtemp_f'],
        ],
        'pop' => $d['day']['daily_chance_of_rain'] / 100.0,
        'wind_speed' => $units === 'metric' ? $d['day']['maxwind_kph'] / 3.6 : $d['day']['maxwind_mph'],
        'weather' => [[
            'icon' => mapWeatherAPIIcon($d['day']['condition']['code'], 1)
        ]]
    ];
}

$out = [
    'source' => 'weatherapi',
    'fetched_at' => time(),
    'timezone_offset' => $location['tz_id'] ?? null,
    'timezone' => $location['tz_id'] ?? null,
    'current' => $currentOut,
    'hourly' => $hourly,
    'daily' => $daily,
    'alerts' => $alerts
];

$json = json_encode($out);
cache_set($cacheKey, $json);
echo $json;

// Map WeatherAPI condition codes to OpenWeather-style icons
function mapWeatherAPIIcon($code, $isDay) {
    $d = $isDay ? 'd' : 'n';
    // WeatherAPI codes: https://www.weatherapi.com/docs/weather_conditions.json
    if ($code == 1000) return '01' . $d; // Sunny/Clear
    if (in_array($code, [1003])) return '02' . $d; // Partly cloudy
    if (in_array($code, [1006, 1009])) return '03' . $d; // Cloudy
    if (in_array($code, [1030, 1135, 1147])) return '50' . $d; // Mist/Fog
    if (in_array($code, [1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246])) return '10' . $d; // Rain
    if (in_array($code, [1066, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258])) return '13' . $d; // Snow
    if (in_array($code, [1087, 1273, 1276, 1279, 1282])) return '11' . $d; // Thunderstorm
    return '04' . $d; // Default overcast
}
?>
