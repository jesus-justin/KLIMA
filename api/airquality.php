<?php
// Air Quality Index endpoint (OpenWeather)
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/config.php';

$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
$lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;

if ($lat === null || $lon === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing lat/lon parameters']);
    exit;
}

if (OWM_API_KEY === 'REPLACE_WITH_YOUR_OPENWEATHER_API_KEY') {
    // Fallback: use Open-Meteo AQI if available
    http_response_code(200);
    echo json_encode([
        'aqi' => null,
        'components' => [],
        'note' => 'Air quality data unavailable (no API key)'
    ]);
    exit;
}

$query = http_build_query([
    'lat' => $lat,
    'lon' => $lon,
    'appid' => OWM_API_KEY,
]);

$url = 'https://api.openweathermap.org/data/2.5/air_pollution?' . $query;

$cacheKey = 'aqi:' . $lat . ',' . $lon;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

$resp = http_json($url);
$data = json_decode($resp, true);

if (!is_array($data) || !isset($data['list'][0])) {
    http_response_code(200);
    echo json_encode([
        'aqi' => null,
        'components' => [],
        'note' => 'No air quality data available'
    ]);
    exit;
}

$aqi = $data['list'][0]['main']['aqi'] ?? null;
$components = $data['list'][0]['components'] ?? [];

$result = [
    'aqi' => $aqi,
    'aqi_label' => get_aqi_label($aqi),
    'components' => $components,
    'fetched_at' => time()
];

$json = json_encode($result);
cache_set($cacheKey, $json);
echo $json;

function get_aqi_label($aqi) {
    // 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=Very Poor
    $labels = [
        1 => 'Good',
        2 => 'Fair',
        3 => 'Moderate',
        4 => 'Poor',
        5 => 'Very Poor'
    ];
    return $labels[$aqi] ?? 'Unknown';
}
?>
