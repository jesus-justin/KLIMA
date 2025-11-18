<?php
// Multi-source confidence scoring
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

// Fetch from multiple sources in parallel (simulate with sequential for PHP; real impl would use curl_multi)
$sources = [];

// OpenWeather
try {
    $owResp = @file_get_contents(__DIR__ . "/../.cache/" . md5("onecall:$lat,$lon:$units") . ".json");
    if ($owResp) {
        $sources['openweather'] = json_decode($owResp, true);
    }
} catch (Exception $e) {}

// Open-Meteo
try {
    $omResp = @file_get_contents(__DIR__ . "/../.cache/" . md5("om:$lat,$lon:$units") . ".json");
    if ($omResp) {
        $sources['openmeteo'] = json_decode($omResp, true);
    }
} catch (Exception $e) {}

// WeatherAPI.com
try {
    $waResp = @file_get_contents(__DIR__ . "/../.cache/" . md5("weatherapi:$lat,$lon:$units") . ".json");
    if ($waResp) {
        $wa = json_decode($waResp, true);
        if (!isset($wa['error'])) {
            $sources['weatherapi'] = $wa;
        }
    }
} catch (Exception $e) {}

// Weatherbit
try {
    $wbResp = @file_get_contents(__DIR__ . "/../.cache/" . md5("weatherbit:$lat,$lon:$units") . ".json");
    if ($wbResp) {
        $wb = json_decode($wbResp, true);
        if (!isset($wb['error'])) {
            $sources['weatherbit'] = $wb;
        }
    }
} catch (Exception $e) {}

// PAGASA (if Philippines)
try {
    $pgResp = @file_get_contents(__DIR__ . "/../.cache/" . md5("pagasa:metro manila") . ".json");
    if ($pgResp) {
        $pg = json_decode($pgResp, true);
        if (!isset($pg['error'])) {
            $sources['pagasa'] = $pg;
        }
    }
} catch (Exception $e) {}

// Tomorrow.io
try {
    $tmrResp = @file_get_contents(__DIR__ . "/../.cache/" . md5("tomorrow:$lat,$lon:$units") . ".json");
    if ($tmrResp) {
        $tmr = json_decode($tmrResp, true);
        if (!isset($tmr['error'])) {
            $sources['tomorrow'] = $tmr;
        }
    }
} catch (Exception $e) {}

// Visual Crossing
try {
    $vcResp = @file_get_contents(__DIR__ . "/../.cache/" . md5("visualcrossing:$lat,$lon:$units") . ".json");
    if ($vcResp) {
        $vc = json_decode($vcResp, true);
        if (!isset($vc['error'])) {
            $sources['visualcrossing'] = $vc;
        }
    }
} catch (Exception $e) {}

if (count($sources) < 2) {
    echo json_encode([
        'confidence' => 'low',
        'sources_count' => count($sources),
        'note' => 'Insufficient data for confidence scoring'
    ]);
    exit;
}

// Compare temps, precipitation, wind
$temps = [];
$winds = [];
$pops = [];

foreach ($sources as $name => $data) {
    if ($name === 'pagasa') {
        // PAGASA returns forecast ranges
        if (isset($data['forecast']['today']['temp_max'])) {
            $temps[] = $data['forecast']['today']['temp_max'];
        }
    } else {
        if (isset($data['current']['temp'])) {
            $temps[] = $data['current']['temp'];
        }
        if (isset($data['current']['wind_speed'])) {
            $winds[] = $data['current']['wind_speed'];
        }
        if (isset($data['hourly'][0]['pop'])) {
            $pops[] = $data['hourly'][0]['pop'];
        }
    }
}

$confidence = 'high';
$variance = 0;

// Compute variance in temps
if (count($temps) >= 2) {
    $mean = array_sum($temps) / count($temps);
    $sumSq = 0;
    foreach ($temps as $t) {
        $sumSq += pow($t - $mean, 2);
    }
    $variance = $sumSq / count($temps);
    
    // High confidence if variance < 2°, medium < 5°, else low
    if ($variance > 5) {
        $confidence = 'low';
    } elseif ($variance > 2) {
        $confidence = 'medium';
    }
}

echo json_encode([
    'confidence' => $confidence,
    'sources_count' => count($sources),
    'temperature_variance' => round($variance, 2),
    'sources_compared' => array_keys($sources),
    'note' => 'Confidence based on agreement between sources'
]);
?>
