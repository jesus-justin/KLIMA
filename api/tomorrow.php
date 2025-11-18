<?php
// Tomorrow.io integration (free tier: 500 calls/day, 25/hour)
// Most advanced weather API with 60+ data layers
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
$apiKey = getenv('TOMORROW_KEY') ?: (defined('TOMORROW_KEY') ? TOMORROW_KEY : null);

if (!$apiKey) {
    http_response_code(200);
    echo json_encode([
        'error' => 'Tomorrow.io key not configured',
        'note' => 'Sign up at https://www.tomorrow.io for a free API key (500 calls/day)'
    ]);
    exit;
}

$cacheKey = 'tomorrow:' . $lat . ',' . $lon . ':' . $units;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

// Tomorrow.io Timeline API - single endpoint with all data
// Units: metric or imperial
$unitParam = $units === 'metric' ? 'metric' : 'imperial';

$query = http_build_query([
    'location' => $lat . ',' . $lon,
    'apikey' => $apiKey,
    'units' => $unitParam,
    'timesteps' => '1h,1d', // hourly and daily
    'fields' => 'temperature,temperatureApparent,humidity,windSpeed,windDirection,precipitationType,precipitationIntensity,precipitationProbability,weatherCode,uvIndex,visibility,cloudCover,pressureSurfaceLevel,particulateMatter25,particulateMatter10,pollutantO3,pollutantNO2,pollutantCO,epaIndex,fireIndex,floodIndex'
]);

$url = 'https://api.tomorrow.io/v4/timelines?' . $query;
$resp = http_json($url);
$data = json_decode($resp, true);

if (!is_array($data) || isset($data['code'])) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Tomorrow.io request failed',
        'detail' => $data['message'] ?? $data['type'] ?? 'Unknown error'
    ]);
    exit;
}

$timelines = $data['data']['timelines'] ?? [];
$hourlyTimeline = null;
$dailyTimeline = null;

foreach ($timelines as $tl) {
    if ($tl['timestep'] === '1h') {
        $hourlyTimeline = $tl['intervals'] ?? [];
    } elseif ($tl['timestep'] === '1d') {
        $dailyTimeline = $tl['intervals'] ?? [];
    }
}

if (!$hourlyTimeline || !$dailyTimeline) {
    http_response_code(502);
    echo json_encode(['error' => 'Tomorrow.io incomplete data']);
    exit;
}

// Transform current weather (first hourly interval)
$current = $hourlyTimeline[0]['values'] ?? [];
$currentTime = strtotime($hourlyTimeline[0]['startTime'] ?? 'now');

$currentOut = [
    'dt' => $currentTime,
    'temp' => $current['temperature'] ?? null,
    'feels_like' => $current['temperatureApparent'] ?? null,
    'humidity' => $current['humidity'] ?? null,
    'uvi' => $current['uvIndex'] ?? 0,
    'wind_speed' => $units === 'metric' ? ($current['windSpeed'] ?? 0) : (($current['windSpeed'] ?? 0) * 2.23694), // km/h to mph if imperial
    'wind_deg' => $current['windDirection'] ?? 0,
    'pressure' => $current['pressureSurfaceLevel'] ?? null,
    'visibility' => $current['visibility'] ?? null,
    'clouds' => $current['cloudCover'] ?? 0,
    'precip' => $current['precipitationIntensity'] ?? 0,
    'weather' => [[
        'id' => $current['weatherCode'] ?? 0,
        'main' => mapTomorrowWeatherCode($current['weatherCode'] ?? 0),
        'description' => mapTomorrowWeatherCode($current['weatherCode'] ?? 0),
        'icon' => mapTomorrowIcon($current['weatherCode'] ?? 0, true) // assume daytime for now
    ]],
];

// Air quality (Tomorrow.io uses EPA Index)
if (isset($current['epaIndex']) || isset($current['particulateMatter25'])) {
    $currentOut['air_quality'] = [
        'aqi' => $current['epaIndex'] ?? null,
        'pm2_5' => $current['particulateMatter25'] ?? null,
        'pm10' => $current['particulateMatter10'] ?? null,
        'o3' => $current['pollutantO3'] ?? null,
        'no2' => $current['pollutantNO2'] ?? null,
        'co' => $current['pollutantCO'] ?? null,
    ];
}

// Additional Tomorrow.io exclusive data
$currentOut['fire_index'] = $current['fireIndex'] ?? null;
$currentOut['flood_index'] = $current['floodIndex'] ?? null;

// Transform hourly forecast (next 24 hours)
$hourly = [];
for ($i = 0; $i < min(24, count($hourlyTimeline)); $i++) {
    $h = $hourlyTimeline[$i]['values'] ?? [];
    $hourly[] = [
        'dt' => strtotime($hourlyTimeline[$i]['startTime'] ?? 'now'),
        'temp' => $h['temperature'] ?? null,
        'feels_like' => $h['temperatureApparent'] ?? null,
        'humidity' => $h['humidity'] ?? null,
        'wind_speed' => $units === 'metric' ? ($h['windSpeed'] ?? 0) : (($h['windSpeed'] ?? 0) * 2.23694),
        'pop' => ($h['precipitationProbability'] ?? 0) / 100,
        'precip' => $h['precipitationIntensity'] ?? 0,
        'weather' => [[
            'icon' => mapTomorrowIcon($h['weatherCode'] ?? 0, true)
        ]]
    ];
}

// Transform daily forecast (next 7 days)
$daily = [];
for ($i = 0; $i < min(7, count($dailyTimeline)); $i++) {
    $d = $dailyTimeline[$i]['values'] ?? [];
    $daily[] = [
        'dt' => strtotime($dailyTimeline[$i]['startTime'] ?? 'now'),
        'temp' => [
            'min' => $d['temperatureMin'] ?? $d['temperature'] ?? null,
            'max' => $d['temperatureMax'] ?? $d['temperature'] ?? null,
        ],
        'humidity' => $d['humidity'] ?? null,
        'wind_speed' => $units === 'metric' ? ($d['windSpeed'] ?? 0) : (($d['windSpeed'] ?? 0) * 2.23694),
        'pop' => ($d['precipitationProbability'] ?? 0) / 100,
        'weather' => [[
            'icon' => mapTomorrowIcon($d['weatherCode'] ?? 0, true)
        ]]
    ];
}

$out = [
    'source' => 'tomorrow',
    'fetched_at' => time(),
    'current' => $currentOut,
    'hourly' => $hourly,
    'daily' => $daily,
];

$json = json_encode($out);
cache_set($cacheKey, $json);
echo $json;

// Map Tomorrow.io weather codes to descriptions
function mapTomorrowWeatherCode($code) {
    // Tomorrow.io weather codes: https://docs.tomorrow.io/reference/data-layers-weather-codes
    $codes = [
        0 => 'Unknown',
        1000 => 'Clear',
        1001 => 'Cloudy',
        1100 => 'Mostly Clear',
        1101 => 'Partly Cloudy',
        1102 => 'Mostly Cloudy',
        2000 => 'Fog',
        2100 => 'Light Fog',
        3000 => 'Light Wind',
        3001 => 'Wind',
        3002 => 'Strong Wind',
        4000 => 'Drizzle',
        4001 => 'Rain',
        4200 => 'Light Rain',
        4201 => 'Heavy Rain',
        5000 => 'Snow',
        5001 => 'Flurries',
        5100 => 'Light Snow',
        5101 => 'Heavy Snow',
        6000 => 'Freezing Drizzle',
        6001 => 'Freezing Rain',
        6200 => 'Light Freezing Rain',
        6201 => 'Heavy Freezing Rain',
        7000 => 'Ice Pellets',
        7101 => 'Heavy Ice Pellets',
        7102 => 'Light Ice Pellets',
        8000 => 'Thunderstorm',
    ];
    return $codes[$code] ?? 'Unknown';
}

// Map Tomorrow.io codes to OpenWeather-style icons
function mapTomorrowIcon($code, $isDay) {
    $d = $isDay ? 'd' : 'n';
    
    // Clear/Cloudy
    if ($code == 1000) return '01' . $d; // Clear
    if ($code == 1100) return '02' . $d; // Mostly Clear
    if ($code == 1101) return '02' . $d; // Partly Cloudy
    if ($code == 1102) return '03' . $d; // Mostly Cloudy
    if ($code == 1001) return '04' . $d; // Cloudy
    
    // Fog
    if ($code >= 2000 && $code <= 2100) return '50' . $d;
    
    // Rain
    if ($code == 4000 || $code == 4200) return '09' . $d; // Drizzle/Light Rain
    if ($code == 4001 || $code == 4201) return '10' . $d; // Rain/Heavy Rain
    
    // Snow
    if ($code >= 5000 && $code <= 5101) return '13' . $d;
    
    // Freezing rain/Ice
    if ($code >= 6000 && $code <= 7102) return '13' . $d;
    
    // Thunderstorm
    if ($code == 8000) return '11' . $d;
    
    return '01' . $d; // Default to clear
}
?>
