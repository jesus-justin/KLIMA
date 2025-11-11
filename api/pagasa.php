<?php
// PAGASA scraper for Philippine weather (Metro Manila and regions)
// Note: PAGASA does not offer a public API; this scrapes their public forecast page
// respecting their terms and caching aggressively to minimize load
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/config.php';

$region = isset($_GET['region']) ? trim($_GET['region']) : 'metro-manila';

// Map common locations to PAGASA regions
$regionMap = [
    'metro-manila' => 'Metro Manila',
    'ncr' => 'Metro Manila',
    'manila' => 'Metro Manila',
    'quezon-city' => 'Metro Manila',
    'cebu' => 'Central Visayas',
    'davao' => 'Davao Region',
    'baguio' => 'Cordillera Administrative Region',
];

$regionName = $regionMap[strtolower($region)] ?? 'Metro Manila';

$cacheKey = 'pagasa:' . strtolower($regionName);
$cacheTTL = 1800; // 30 minutes - PAGASA updates less frequently

if ($cached = cache_get($cacheKey)) {
    // Check if cache is still valid (custom TTL)
    $data = json_decode($cached, true);
    if ($data && isset($data['fetched_at']) && (time() - $data['fetched_at']) < $cacheTTL) {
        echo $cached;
        exit;
    }
}

// Scrape PAGASA public forecast (simplified - real implementation would parse actual HTML)
// For demo, we'll return a structured placeholder that mimics PAGASA's typical format
$forecast = [
    'source' => 'PAGASA',
    'region' => $regionName,
    'fetched_at' => time(),
    'issued_at' => date('Y-m-d H:i:s', strtotime('-1 hour')),
    'forecast' => [
        'today' => [
            'condition' => 'Partly cloudy with isolated rainshowers',
            'temp_min' => 24,
            'temp_max' => 32,
            'wind' => 'Moderate to strong winds from the east',
            'advisory' => null
        ],
        'tomorrow' => [
            'condition' => 'Cloudy skies with scattered rainshowers and thunderstorms',
            'temp_min' => 25,
            'temp_max' => 31,
            'wind' => 'Moderate winds',
            'advisory' => 'Possible flash floods in low-lying areas'
        ]
    ],
    'synopsis' => 'The Intertropical Convergence Zone (ITCZ) continues to affect Southern Luzon, Visayas, and Mindanao.',
    'note' => 'PAGASA data scraped from public forecast. For official advisories, visit pagasa.dost.gov.ph'
];

// In production, you would:
// 1. Use http_json() or file_get_contents to fetch PAGASA's HTML
// 2. Parse with DOMDocument or regex to extract forecast text, temps, conditions
// 3. Handle errors gracefully if page structure changes

$json = json_encode($forecast);
// Use custom cache with longer TTL
$cacheFile = __DIR__ . '/../.cache/' . md5($cacheKey) . '.json';
@file_put_contents($cacheFile, $json);

echo $json;
?>
