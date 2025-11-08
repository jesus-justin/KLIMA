<?php
// Open-Meteo fallback (no API key required)
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

// Request current, hourly and daily data
$params = [
    'latitude' => $lat,
    'longitude' => $lon,
    'current' => 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weathercode,wind_speed_10m',
    'hourly' => 'temperature_2m,precipitation_probability,weathercode,wind_speed_10m',
    'daily' => 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset',
    'timezone' => 'auto'
];

$query = http_build_query($params);
$url = 'https://api.open-meteo.com/v1/forecast?' . $query;

$cacheKey = 'om:' . $lat . ',' . $lon . ':' . $units;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

$resp = http_json($url);
$data = json_decode($resp, true);
if (!is_array($data)) {
    http_response_code(502);
    echo json_encode(['error' => 'Open-Meteo request failed']);
    exit;
}

// Helpers
function wmo_to_owm_icon($code, $isDay){
    // Approximate mapping
    $d = $isDay ? 'd' : 'n';
    if ($code === 0) return '01'.$d; // clear
    if (in_array($code, [1])) return '02'.$d; // mainly clear
    if (in_array($code, [2])) return '03'.$d; // partly cloudy
    if (in_array($code, [3])) return '04'.$d; // overcast
    if (in_array($code, [45,48])) return '50'.$d; // fog
    if (in_array($code, [51,53,55,80,81,82,61,63,65])) return '10'.$d; // rain/drizzle/showers
    if (in_array($code, [71,73,75,77,85,86])) return '13'.$d; // snow
    if (in_array($code, [95,96,99])) return '11'.$d; // thunder
    return '04'.$d; // default cloudy
}

// timezone offset seconds
$tzOffset = isset($data['utc_offset_seconds']) ? intval($data['utc_offset_seconds']) : 0;

// Build current
$isDay = ($data['current']['is_day'] ?? 1) ? true : false;
$currentTempC = $data['current']['temperature_2m'] ?? null; // in °C
$currentWindKmh = $data['current']['wind_speed_10m'] ?? 0; // in km/h
$currentWindMs = $currentWindKmh / 3.6;
$current = [
    'dt' => isset($data['current']['time']) ? strtotime($data['current']['time']) - $tzOffset : time(),
    'sunrise' => isset($data['daily']['sunrise'][0]) ? strtotime($data['daily']['sunrise'][0]) - $tzOffset : null,
    'sunset' => isset($data['daily']['sunset'][0]) ? strtotime($data['daily']['sunset'][0]) - $tzOffset : null,
    'temp' => $units === 'metric' ? $currentTempC : ($currentTempC !== null ? ($currentTempC * 9/5 + 32) : null),
    'feels_like' => $units === 'metric' ? ($data['current']['apparent_temperature'] ?? null) : (isset($data['current']['apparent_temperature']) ? ($data['current']['apparent_temperature'] * 9/5 + 32) : null),
    'humidity' => $data['current']['relative_humidity_2m'] ?? null,
    'uvi' => 0,
    'wind_speed' => $units === 'metric' ? round($currentWindMs,1) : round($currentWindMs * 2.23694,1),
    'weather' => [[
        'id' => $data['current']['weathercode'] ?? 0,
        'main' => '',
        'description' => '',
        'icon' => wmo_to_owm_icon($data['current']['weathercode'] ?? 0, $isDay)
    ]]
];

// Build hourly (next 24 entries)
$hourly = [];
if (isset($data['hourly']['time'])) {
    $len = min(24, count($data['hourly']['time']));
    for ($i=0; $i<$len; $i++) {
        $t = $data['hourly']['time'][$i];
        $tempC = $data['hourly']['temperature_2m'][$i] ?? null;
        $pop = ($data['hourly']['precipitation_probability'][$i] ?? 0) / 100.0;
        $wcode = $data['hourly']['weathercode'][$i] ?? 0;
        $windKmh = $data['hourly']['wind_speed_10m'][$i] ?? 0;
        $windMs = $windKmh / 3.6;
        $hourly[] = [
            'dt' => strtotime($t) - $tzOffset,
            'temp' => $units === 'metric' ? $tempC : ($tempC !== null ? ($tempC * 9/5 + 32) : null),
            'pop' => $pop,
            'wind_speed' => $units === 'metric' ? round($windMs,1) : round($windMs * 2.23694,1),
            'weather' => [[ 'icon' => wmo_to_owm_icon($wcode, true) ]]
        ];
    }
}

// Build daily (7 days)
$daily = [];
if (isset($data['daily']['time'])) {
    $len = min(7, count($data['daily']['time']));
    for ($i=0; $i<$len; $i++) {
        $t = $data['daily']['time'][$i];
        $minC = $data['daily']['temperature_2m_min'][$i] ?? null;
        $maxC = $data['daily']['temperature_2m_max'][$i] ?? null;
        $popDay = ($data['daily']['precipitation_probability_max'][$i] ?? 0) / 100.0;
        $icon = '04d';
        $daily[] = [
            'dt' => strtotime($t) - $tzOffset,
            'temp' => [
                'min' => $units === 'metric' ? $minC : ($minC !== null ? ($minC * 9/5 + 32) : null),
                'max' => $units === 'metric' ? $maxC : ($maxC !== null ? ($maxC * 9/5 + 32) : null),
                'day' => $units === 'metric' ? ($maxC ?? $minC) : (($maxC ?? $minC) !== null ? (($maxC ?? $minC) * 9/5 + 32) : null)
            ],
            'pop' => $popDay,
            'wind_speed' => null,
            'weather' => [[ 'icon' => $icon ]]
        ];
    }
}

$out = [
    'timezone_offset' => $tzOffset,
    'timezone' => $data['timezone'] ?? null,
    'current' => $current,
    'hourly' => $hourly,
    'daily' => $daily
];

$json = json_encode($out);
cache_set($cacheKey, $json);
echo $json;
?>
