<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/config.php';

$query = isset($_GET['q']) ? trim($_GET['q']) : '';
if ($query === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing q parameter']);
    exit;
}

$limit = 1; // just first match for simplicity
$cacheKey = 'geocode:' . strtolower($query) . ':' . $limit;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

if (OWM_API_KEY !== 'REPLACE_WITH_YOUR_OPENWEATHER_API_KEY') {
    // Use OpenWeather (requires key)
    $url = OWM_GEOCODE_DIRECT_URL . '?q=' . urlencode($query) . '&limit=' . $limit . '&appid=' . OWM_API_KEY;
    $resp = http_json($url);
    $data = json_decode($resp, true);
    if (!is_array($data) || count($data) === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Location not found']);
        exit;
    }
    $loc = $data[0];
    $out = [
        'name' => $loc['name'] ?? $query,
        'lat' => $loc['lat'] ?? null,
        'lon' => $loc['lon'] ?? null,
        'country' => $loc['country'] ?? null,
        'state' => $loc['state'] ?? null,
        'raw' => $loc,
        'source' => 'openweather'
    ];
} else {
    // Fallback: Open-Meteo geocoding (no key)
    $gmUrl = 'https://geocoding-api.open-meteo.com/v1/search?name=' . urlencode($query) . '&count=' . $limit . '&language=en&format=json';
    $resp = http_json($gmUrl);
    $data = json_decode($resp, true);
    if (!is_array($data) || !isset($data['results']) || count($data['results']) === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Location not found']);
        exit;
    }
    $loc = $data['results'][0];
    $out = [
        'name' => $loc['name'] ?? $query,
        'lat' => $loc['latitude'] ?? null,
        'lon' => $loc['longitude'] ?? null,
        'country' => $loc['country_code'] ?? ($loc['country'] ?? null),
        'state' => $loc['admin1'] ?? null,
        'raw' => $loc,
        'source' => 'open-meteo'
    ];
}

$json = json_encode($out);
cache_set($cacheKey, $json);
echo $json;
?>
