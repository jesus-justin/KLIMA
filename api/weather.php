<?php
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

if (OWM_API_KEY === 'REPLACE_WITH_YOUR_OPENWEATHER_API_KEY') {
    http_response_code(500);
    echo json_encode(['error' => 'API key not configured']);
    exit;
}

$query = http_build_query([
    'lat' => $lat,
    'lon' => $lon,
    'units' => $units,
    'exclude' => 'minutely,alerts',
    'appid' => OWM_API_KEY,
]);

$url = OWM_ONECALL_URL . '?' . $query;

$cacheKey = 'onecall:' . $lat . ',' . $lon . ':' . $units;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

$resp = http_json($url);
$decoded = json_decode($resp, true);
if (!is_array($decoded)) {
    // Upstream failure already set response code; pass error
    echo $resp;
    exit;
}
// Basic validation: ensure critical keys
if (!isset($decoded['current']) || !isset($decoded['hourly']) || !isset($decoded['daily'])) {
    http_response_code(502);
    echo json_encode(['error' => 'Incomplete data from upstream']);
    exit;
}
// annotate source and fetch time to aid UI transparency
$decoded['source'] = 'openweather';
$decoded['fetched_at'] = time();

$json = json_encode($decoded);
cache_set($cacheKey, $json);
echo $json;
?>
