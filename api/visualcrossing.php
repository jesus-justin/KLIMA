<?php
// Visual Crossing Timeline Weather API integration (free tier: 1000 records/day)
// Single endpoint for historical + forecast data with 50+ years history
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
$apiKey = getenv('VISUALCROSSING_KEY') ?: (defined('VISUALCROSSING_KEY') ? VISUALCROSSING_KEY : null);

if (!$apiKey) {
    http_response_code(200);
    echo json_encode([
        'error' => 'Visual Crossing key not configured',
        'note' => 'Sign up at https://www.visualcrossing.com for a free API key (1000 records/day)'
    ]);
    exit;
}

$cacheKey = 'visualcrossing:' . $lat . ',' . $lon . ':' . $units;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

// Visual Crossing Timeline API - single endpoint returns everything
// Units: us (imperial) or metric
$unitParam = $units === 'metric' ? 'metric' : 'us';

// Include: current conditions (today), next 7 days forecast, hourly data
$query = http_build_query([
    'key' => $apiKey,
    'unitGroup' => $unitParam,
    'include' => 'current,hours,days,alerts',
    'elements' => 'datetime,temp,feelslike,humidity,precip,precipprob,snow,windspeed,winddir,pressure,cloudcover,visibility,solarradiation,uvindex,conditions,description,icon',
    'contentType' => 'json'
]);

// Location format: lat,lon
$location = urlencode($lat . ',' . $lon);
$url = 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/' . $location . '?' . $query;
$resp = http_json($url);
$data = json_decode($resp, true);

if (!is_array($data) || isset($data['errorCode'])) {
    http_response_code(502);
    echo json_encode([
        'error' => 'Visual Crossing request failed',
        'detail' => $data['message'] ?? 'Unknown error'
    ]);
    exit;
}

// Extract current conditions
$currentConditions = $data['currentConditions'] ?? [];
$days = $data['days'] ?? [];

if (empty($days)) {
    http_response_code(502);
    echo json_encode(['error' => 'Visual Crossing no data returned']);
    exit;
}

// Build current weather from currentConditions
$currentOut = [
    'dt' => isset($currentConditions['datetimeEpoch']) ? $currentConditions['datetimeEpoch'] : time(),
    'temp' => $currentConditions['temp'] ?? null,
    'feels_like' => $currentConditions['feelslike'] ?? null,
    'humidity' => $currentConditions['humidity'] ?? null,
    'uvi' => $currentConditions['uvindex'] ?? 0,
    'wind_speed' => $currentConditions['windspeed'] ?? 0,
    'wind_deg' => $currentConditions['winddir'] ?? 0,
    'pressure' => $currentConditions['pressure'] ?? null,
    'visibility' => $currentConditions['visibility'] ?? null,
    'clouds' => $currentConditions['cloudcover'] ?? 0,
    'precip' => $currentConditions['precip'] ?? 0,
    'weather' => [[
        'id' => 0,
        'main' => $currentConditions['conditions'] ?? 'Clear',
        'description' => $currentConditions['conditions'] ?? 'Clear',
        'icon' => mapVisualCrossingIcon($currentConditions['icon'] ?? 'clear-day')
    ]],
];

// Visual Crossing provides sunrise/sunset in first day
if (isset($days[0])) {
    $currentOut['sunrise'] = isset($days[0]['sunriseEpoch']) ? $days[0]['sunriseEpoch'] : null;
    $currentOut['sunset'] = isset($days[0]['sunsetEpoch']) ? $days[0]['sunsetEpoch'] : null;
}

// Transform hourly forecast from today's hours (next 24 hours)
$hourly = [];
$todayHours = $days[0]['hours'] ?? [];
$currentHour = (int)date('H');

// Get remaining hours from today + hours from tomorrow
for ($i = 0; $i < min(24, count($todayHours)); $i++) {
    $h = $todayHours[$i] ?? [];
    if (!$h) continue;
    
    $hourly[] = [
        'dt' => isset($h['datetimeEpoch']) ? $h['datetimeEpoch'] : time(),
        'temp' => $h['temp'] ?? null,
        'feels_like' => $h['feelslike'] ?? null,
        'humidity' => $h['humidity'] ?? null,
        'wind_speed' => $h['windspeed'] ?? 0,
        'pop' => ($h['precipprob'] ?? 0) / 100,
        'precip' => $h['precip'] ?? 0,
        'weather' => [[
            'icon' => mapVisualCrossingIcon($h['icon'] ?? 'clear-day')
        ]]
    ];
}

// If we need more hours, get from tomorrow
if (count($hourly) < 24 && isset($days[1]['hours'])) {
    $tomorrowHours = $days[1]['hours'];
    $needed = 24 - count($hourly);
    for ($i = 0; $i < min($needed, count($tomorrowHours)); $i++) {
        $h = $tomorrowHours[$i];
        $hourly[] = [
            'dt' => isset($h['datetimeEpoch']) ? $h['datetimeEpoch'] : time(),
            'temp' => $h['temp'] ?? null,
            'feels_like' => $h['feelslike'] ?? null,
            'humidity' => $h['humidity'] ?? null,
            'wind_speed' => $h['windspeed'] ?? 0,
            'pop' => ($h['precipprob'] ?? 0) / 100,
            'precip' => $h['precip'] ?? 0,
            'weather' => [[
                'icon' => mapVisualCrossingIcon($h['icon'] ?? 'clear-day')
            ]]
        ];
    }
}

// Transform daily forecast (next 7 days)
$daily = [];
for ($i = 0; $i < min(7, count($days)); $i++) {
    $d = $days[$i];
    $daily[] = [
        'dt' => isset($d['datetimeEpoch']) ? $d['datetimeEpoch'] : time(),
        'temp' => [
            'min' => $d['tempmin'] ?? null,
            'max' => $d['tempmax'] ?? null,
        ],
        'humidity' => $d['humidity'] ?? null,
        'wind_speed' => $d['windspeed'] ?? 0,
        'pop' => ($d['precipprob'] ?? 0) / 100,
        'precip' => $d['precip'] ?? 0,
        'weather' => [[
            'main' => $d['conditions'] ?? 'Clear',
            'description' => $d['description'] ?? '',
            'icon' => mapVisualCrossingIcon($d['icon'] ?? 'clear-day')
        ]]
    ];
}

// Alerts if available
$alerts = [];
if (isset($data['alerts']) && is_array($data['alerts'])) {
    foreach ($data['alerts'] as $alert) {
        $alerts[] = [
            'event' => $alert['event'] ?? 'Weather Alert',
            'headline' => $alert['headline'] ?? '',
            'description' => $alert['description'] ?? '',
            'start' => isset($alert['onsetEpoch']) ? $alert['onsetEpoch'] : null,
            'end' => isset($alert['endsEpoch']) ? $alert['endsEpoch'] : null,
        ];
    }
}

$out = [
    'source' => 'visualcrossing',
    'fetched_at' => time(),
    'timezone_offset' => $data['tzoffset'] ?? 0,
    'timezone' => $data['timezone'] ?? null,
    'current' => $currentOut,
    'hourly' => $hourly,
    'daily' => $daily,
    'alerts' => $alerts
];

$json = json_encode($out);
cache_set($cacheKey, $json);
echo $json;

// Map Visual Crossing icon names to OpenWeather-style icons
function mapVisualCrossingIcon($vcIcon) {
    // Visual Crossing icons: clear-day, clear-night, cloudy, fog, wind, snow, rain, etc.
    $mapping = [
        'clear-day' => '01d',
        'clear-night' => '01n',
        'partly-cloudy-day' => '02d',
        'partly-cloudy-night' => '02n',
        'cloudy' => '04d',
        'fog' => '50d',
        'wind' => '50d',
        'rain' => '10d',
        'snow' => '13d',
        'snow-showers-day' => '13d',
        'snow-showers-night' => '13n',
        'thunder-rain' => '11d',
        'thunder-showers-day' => '11d',
        'thunder-showers-night' => '11n',
        'showers-day' => '09d',
        'showers-night' => '09n',
    ];
    
    return $mapping[$vcIcon] ?? '01d';
}
?>
