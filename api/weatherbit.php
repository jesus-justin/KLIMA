<?php
// Weatherbit.io integration (free tier: 500 calls/day, 50/min)
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

$apiKey = getenv('WEATHERBIT_KEY') ?: (defined('WEATHERBIT_KEY') ? WEATHERBIT_KEY : null);

if (!$apiKey) {
    http_response_code(200);
    echo json_encode([
        'error' => 'Weatherbit key not configured',
        'note' => 'Sign up at https://www.weatherbit.io for a free API key'
    ]);
    exit;
}

$cacheKey = 'weatherbit:' . $lat . ',' . $lon . ':' . $units;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

// Weatherbit uses separate endpoints for current and forecast
$unitParam = $units === 'metric' ? 'M' : 'I';

// Fetch current weather
$currentQuery = http_build_query([
    'lat' => $lat,
    'lon' => $lon,
    'key' => $apiKey,
    'units' => $unitParam
]);
$currentUrl = 'https://api.weatherbit.io/v2.0/current?' . $currentQuery;
$currentResp = http_json($currentUrl);
$currentData = json_decode($currentResp, true);

// Fetch forecast
$forecastQuery = http_build_query([
    'lat' => $lat,
    'lon' => $lon,
    'key' => $apiKey,
    'units' => $unitParam,
    'days' => 7,
    'hours' => 24
]);
$forecastUrl = 'https://api.weatherbit.io/v2.0/forecast/hourly?' . $forecastQuery;
$forecastResp = http_json($forecastUrl);
$forecastData = json_decode($forecastResp, true);

// Fetch daily forecast
$dailyQuery = http_build_query([
    'lat' => $lat,
    'lon' => $lon,
    'key' => $apiKey,
    'units' => $unitParam,
    'days' => 7
]);
$dailyUrl = 'https://api.weatherbit.io/v2.0/forecast/daily?' . $dailyQuery;
$dailyResp = http_json($dailyUrl);
$dailyData = json_decode($dailyResp, true);

if (!is_array($currentData) || !is_array($forecastData) || !is_array($dailyData)) {
    http_response_code(502);
    echo json_encode(['error' => 'Weatherbit request failed']);
    exit;
}

// Transform current
$c = $currentData['data'][0] ?? [];
$currentOut = [
    'dt' => $c['ts'] ?? time(),
    'temp' => $c['temp'] ?? null,
    'feels_like' => $c['app_temp'] ?? null,
    'humidity' => $c['rh'] ?? null,
    'uvi' => $c['uv'] ?? 0,
    'wind_speed' => $units === 'metric' ? $c['wind_spd'] : $c['wind_spd'],
    'precip' => $c['precip'] ?? 0,
    'weather' => [[
        'id' => $c['weather']['code'] ?? 0,
        'main' => $c['weather']['description'] ?? '',
        'description' => $c['weather']['description'] ?? '',
        'icon' => mapWeatherbitIcon($c['weather']['code'] ?? 0)
    ]],
    'sunrise' => strtotime($c['sunrise'] ?? 'today 6:00am'),
    'sunset' => strtotime($c['sunset'] ?? 'today 6:00pm'),
];

// AQI if available
if (isset($c['aqi'])) {
    $currentOut['aqi'] = [
        'aqi' => $c['aqi'],
        'pm25' => $c['pm25'] ?? null,
        'pm10' => $c['pm10'] ?? null,
        'o3' => $c['o3'] ?? null,
        'no2' => $c['no2'] ?? null,
        'so2' => $c['so2'] ?? null,
        'co' => $c['co'] ?? null,
    ];
}

// Transform hourly
$hourly = [];
foreach ($forecastData['data'] ?? [] as $h) {
    if (count($hourly) >= 24) break;
    $hourly[] = [
        'dt' => $h['ts'],
        'temp' => $h['temp'] ?? null,
        'pop' => $h['pop'] / 100.0,
        'precip' => $h['precip'] ?? 0,
        'wind_speed' => $h['wind_spd'] ?? null,
        'weather' => [[
            'icon' => mapWeatherbitIcon($h['weather']['code'] ?? 0)
        ]]
    ];
}

// Transform daily
$daily = [];
foreach ($dailyData['data'] ?? [] as $d) {
    if (count($daily) >= 7) break;
    $daily[] = [
        'dt' => $d['ts'],
        'temp' => [
            'min' => $d['min_temp'] ?? null,
            'max' => $d['max_temp'] ?? null,
            'day' => $d['temp'] ?? null,
        ],
        'pop' => $d['pop'] / 100.0,
        'wind_speed' => $d['wind_spd'] ?? null,
        'weather' => [[
            'icon' => mapWeatherbitIcon($d['weather']['code'] ?? 0)
        ]]
    ];
}

$out = [
    'source' => 'weatherbit',
    'fetched_at' => time(),
    'timezone_offset' => $currentData['data'][0]['timezone'] ?? null,
    'timezone' => $currentData['data'][0]['timezone'] ?? null,
    'current' => $currentOut,
    'hourly' => $hourly,
    'daily' => $daily
];

$json = json_encode($out);
cache_set($cacheKey, $json);
echo $json;

function mapWeatherbitIcon($code) {
    // Weatherbit codes: https://www.weatherbit.io/api/codes
    if ($code >= 800 && $code < 802) return '01d'; // Clear
    if ($code >= 802 && $code < 804) return '02d'; // Partly cloudy
    if ($code >= 804 && $code < 900) return '04d'; // Cloudy
    if ($code >= 700 && $code < 752) return '50d'; // Fog/mist
    if ($code >= 300 && $code < 700) return '10d'; // Rain/drizzle
    if ($code >= 600 && $code < 700) return '13d'; // Snow
    if ($code >= 200 && $code < 300) return '11d'; // Thunderstorm
    return '04d'; // Default
}
?>
