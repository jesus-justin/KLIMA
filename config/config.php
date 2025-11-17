<?php
// OpenWeatherMap API configuration
// 1) Get a free API key: https://openweathermap.org/api
// 2) Prefer setting your key via environment variable OWM_API_KEY or config/.env
//    (create config/.env with a line: OWM_API_KEY=your_key_here)
// 3) For quick testing, you can still hardcode below, but avoid committing real keys.

// Load .env (very small parser)
$dotenvPath = __DIR__ . '/.env';
if (is_readable($dotenvPath)) {
    $lines = file($dotenvPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (str_starts_with(trim($line), '#')) continue;
        $parts = explode('=', $line, 2);
        if (count($parts) === 2) {
            $k = trim($parts[0]);
            $v = trim($parts[1]);
            // strip optional surrounding quotes
            if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                $v = substr($v, 1, -1);
            }
            if ($k !== '') putenv("$k=$v");
        }
    }
}

$__owm_key_env = getenv('OWM_API_KEY');
define('OWM_API_KEY', $__owm_key_env ?: 'REPLACE_WITH_YOUR_OPENWEATHER_API_KEY');

// WeatherAPI.com (https://www.weatherapi.com - Free: 1M calls/month)
$__weatherapi_key = getenv('WEATHERAPI_KEY');
if ($__weatherapi_key && !defined('WEATHERAPI_KEY')) {
    define('WEATHERAPI_KEY', $__weatherapi_key);
}

// Weatherbit.io (https://www.weatherbit.io - Free: 500 calls/day)
$__weatherbit_key = getenv('WEATHERBIT_KEY');
if ($__weatherbit_key && !defined('WEATHERBIT_KEY')) {
    define('WEATHERBIT_KEY', $__weatherbit_key);
}

// Endpoints (using One Call v2.5 for broad compatibility)
define('OWM_ONECALL_URL', 'https://api.openweathermap.org/data/2.5/onecall');
define('OWM_GEOCODE_DIRECT_URL', 'https://api.openweathermap.org/geo/1.0/direct');

// Basic request settings
define('HTTP_TIMEOUT', 10); // seconds
// Keep cache short to reflect rapidly changing rain/storm conditions
define('CACHE_SECONDS', 60); // seconds

// Very small file-based cache dir (writable by PHP process)
$cacheDir = __DIR__ . '/../.cache';
if (!is_dir($cacheDir)) {
    @mkdir($cacheDir, 0775, true);
}

function cache_get($key) {
    $file = __DIR__ . '/../.cache/' . md5($key) . '.json';
    if (file_exists($file) && (time() - filemtime($file) < CACHE_SECONDS)) {
        $contents = file_get_contents($file);
        if ($contents !== false) {
            return $contents;
        }
    }
    return null;
}

function cache_set($key, $data) {
    $file = __DIR__ . '/../.cache/' . md5($key) . '.json';
    @file_put_contents($file, $data);
}

function http_json($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, HTTP_TIMEOUT);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        $resp = curl_exec($ch);
        $err = curl_error($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
    } else {
        // Fallback without cURL
        $ctx = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => HTTP_TIMEOUT,
                'ignore_errors' => true,
                'header' => "Accept: application/json\r\n",
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ]
        ]);
        $resp = @file_get_contents($url, false, $ctx);
        $err = $resp === false ? 'file_get_contents failed' : '';
        // Parse HTTP status from $http_response_header if available
        $code = 0;
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $h) {
                if (preg_match('#^HTTP/\S+\s(\d{3})#', $h, $m)) {
                    $code = (int)$m[1];
                    break;
                }
            }
        }
    }

    if ($resp === false) {
        http_response_code(502);
        return json_encode(['error' => 'Upstream request failed', 'detail' => $err]);
    }
    if ($code >= 400) {
        http_response_code($code);
        return json_encode(['error' => 'Upstream returned HTTP ' . $code, 'body' => $resp]);
    }
    return $resp;
}
?>
