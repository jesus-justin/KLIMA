<?php
// PAGASA scraper for Philippine weather (Metro Manila and regions)
// Note: PAGASA does not offer a public JSON API; we scrape their public pages
// and cache results conservatively to minimize load.
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/config.php';

$region = isset($_GET['region']) ? trim($_GET['region']) : 'metro-manila';

// Map common locations to supported regions (initially focused on Metro Manila)
$regionMap = [
    'metro-manila' => 'Metro Manila',
    'ncr' => 'Metro Manila',
    'manila' => 'Metro Manila',
    'quezon-city' => 'Metro Manila',
    // Future: map other regions to dedicated pages when stable endpoints are identified
    'cebu' => 'Metro Manila',
    'davao' => 'Metro Manila',
    'baguio' => 'Metro Manila',
];

$regionName = $regionMap[strtolower($region)] ?? 'Metro Manila';

// Custom cache (30 minutes) independent of global cache TTL for APIs that update slowly
$cacheKey = 'pagasa:' . strtolower($regionName);
$cacheTTL = 1800; // 30 minutes
$cacheFile = __DIR__ . '/../.cache/' . md5($cacheKey) . '.json';

// Read cached JSON regardless of file mtime; validate via embedded fetched_at
if (is_readable($cacheFile)) {
    $raw = file_get_contents($cacheFile);
    $cached = json_decode($raw, true);
    if (is_array($cached) && isset($cached['fetched_at']) && (time() - (int)$cached['fetched_at']) < $cacheTTL) {
        echo $raw;
        exit;
    }
}

// Helpers
function http_get_html($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, HTTP_TIMEOUT);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        $resp = curl_exec($ch);
        $err = curl_error($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($resp === false || $code >= 400) return null;
        return $resp;
    }
    $ctx = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => HTTP_TIMEOUT,
            'ignore_errors' => true,
            'header' => "Accept: text/html\r\n",
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ]
    ]);
    $resp = @file_get_contents($url, false, $ctx);
    if ($resp === false) return null;
    return $resp;
}

function extract_between($haystack, $start, $end) {
    $posStart = stripos($haystack, $start);
    if ($posStart === false) return '';
    $posStart += strlen($start);
    $posEnd = stripos($haystack, $end, $posStart);
    if ($posEnd === false) $posEnd = strlen($haystack);
    return trim(substr($haystack, $posStart, $posEnd - $posStart));
}

// Strategy:
// - Parse homepage for Metro Manila card (condition + High/Low + wind)
// - Parse /weather for Synopsis text as a fallback for context
$homepage = http_get_html('https://bagong.pagasa.dost.gov.ph/');
$weatherpage = http_get_html('https://bagong.pagasa.dost.gov.ph/weather');

$condition = null;
$tHigh = null;
$tLow = null;
$wind = null;
$synopsis = null;

if (is_string($homepage)) {
    // Normalize whitespace for simpler regex
    $h = preg_replace('/\s+/', ' ', $homepage);
    // Look for the Metro Manila card pattern: "Port Area, Metro Manila ... CONDITION High NN°C | Low NN°C"
    if (preg_match('/Port Area,\s*Metro\s*Manila[^<]*\s+([A-Za-z\-\s]+?)\s+High\s*(\d{1,2})\s*°C\s*\|\s*Low\s*(\d{1,2})\s*°C/i', $h, $m)) {
        $condition = trim($m[1]);
        $tHigh = (int)$m[2];
        $tLow = (int)$m[3];
    }
    // Wind e.g., "Winds 7.2 km/hr ESE"
    if (preg_match('/Winds\s+([0-9\.]+\s*km\/hr\s*[A-Za-z]{1,3})/i', $h, $mw)) {
        $wind = trim($mw[1]);
    }
}

if (is_string($weatherpage)) {
    // Extract Synopsis section between "Synopsis" and next heading
    $syn = extract_between($weatherpage, 'Synopsis', 'Forecast Weather Conditions');
    if ($syn) {
        // Strip tags and condense spaces
        $syn = strip_tags($syn);
        $syn = preg_replace('/\s+/', ' ', $syn);
        $synopsis = trim($syn);
    }
    // If temps not found on homepage, try Temperature and Relative Humidity table
    if ($tHigh === null || $tLow === null) {
        $w = preg_replace('/\s+/', ' ', $weatherpage);
        // Pattern like: Temperature (°C) 31.9 °C ... 24.5 °C ...
        if (preg_match('/Temperature \(°C\)\s*(\d{1,2}(?:\.\d)?)\s*°C.*?(\d{1,2}(?:\.\d)?)\s*°C/i', $w, $mt)) {
            // The table shows Max then Min (or vice versa) — reorder to High/Low
            $v1 = (float)$mt[1];
            $v2 = (float)$mt[2];
            $tHigh = (int)round(max($v1, $v2));
            $tLow = (int)round(min($v1, $v2));
        }
    }
    // If condition not found, use Metro Manila row from Forecast Weather Conditions
    if ($condition === null) {
        $w = preg_replace('/\s+/', ' ', $weatherpage);
        if (preg_match('/Metro Manila and the rest of Luzon\s*\|\s*([^|]+?)\s*\|/i', $w, $mc)) {
            $condition = trim($mc[1]);
        }
    }
}

// Build response; keep fields stable for frontend
$now = time();
$forecast = [
    'source' => 'PAGASA',
    'region' => $regionName,
    'fetched_at' => $now,
    'issued_at' => date('Y-m-d H:i:s', $now),
    'forecast' => [
        'today' => [
            'condition' => $condition ?: '—',
            'temp_min' => $tLow !== null ? (int)$tLow : null,
            'temp_max' => $tHigh !== null ? (int)$tHigh : null,
            'wind' => $wind ?: '—',
            'advisory' => null,
        ],
    ],
    'synopsis' => $synopsis ?: '—',
    'note' => 'Unofficial scraper of public PAGASA pages. For official advisories, visit bagong.pagasa.dost.gov.ph',
];

// If everything failed, return a friendly error with HTTP 502 but cache briefly to avoid hammering
if (($condition === null) && ($tHigh === null) && ($tLow === null) && ($synopsis === null)) {
    http_response_code(502);
    $err = [
        'error' => 'Failed to retrieve PAGASA data',
        'source' => 'PAGASA',
        'region' => $regionName,
        'fetched_at' => $now,
    ];
    // Short cache even on error (5 minutes) to backoff
    @file_put_contents($cacheFile, json_encode($err));
    echo json_encode($err);
    exit;
}

// Cache and return
$json = json_encode($forecast);
@file_put_contents($cacheFile, $json);
echo $json;
?>
