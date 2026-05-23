<?php
require_once __DIR__ . '/../config/config.php';
if (function_exists('send_security_headers')) send_security_headers();
if (function_exists('log_request')) log_request('health');

header('Content-Type: application/json');
header('Cache-Control: no-store, max-age=0, must-revalidate');
header('Pragma: no-cache');

$cacheDir = __DIR__ . '/../.cache';
$cacheReady = is_dir($cacheDir) && is_writable($cacheDir);
$owmConfigured = defined('OWM_API_KEY') && OWM_API_KEY !== 'REPLACE_WITH_YOUR_OPENWEATHER_API_KEY';
$otherProviders = [
  'weatherapi' => defined('WEATHERAPI_KEY'),
  'weatherbit' => defined('WEATHERBIT_KEY'),
  'tomorrow' => defined('TOMORROW_KEY'),
  'visualcrossing' => defined('VISUALCROSSING_KEY'),
];

$warnings = [];
if (!$owmConfigured) {
  $warnings[] = 'OpenWeather key is not configured';
}
if (!$cacheReady) {
  $warnings[] = 'Cache directory is not writable';
}

$status = $cacheReady ? (empty($warnings) ? 'ok' : 'degraded') : 'error';
if ($status !== 'ok') {
  http_response_code($status === 'degraded' ? 200 : 503);
}

$payload = [
  'service' => 'KLIMA',
  'status' => $status,
  'time' => date('c'),
  'php_version' => PHP_VERSION,
  'checks' => [
    'cache_writable' => $cacheReady,
    'openweather_configured' => $owmConfigured,
    'providers' => $otherProviders,
  ],
  'warnings' => $warnings,
];

echo json_encode($payload, JSON_UNESCAPED_SLASHES);
