<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../config/config.php';

$lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
$lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;

if ($lat === null || $lon === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing lat/lon parameters']);
    exit;
}

$cacheKey = 'alerts:' . $lat . ',' . $lon;
if ($cached = cache_get($cacheKey)) {
    echo $cached;
    exit;
}

$alerts = [];

// Try OpenWeather alerts first (if API key configured)
if (OWM_API_KEY !== 'REPLACE_WITH_YOUR_OPENWEATHER_API_KEY') {
    $url = OWM_ONECALL_URL . '?lat=' . $lat . '&lon=' . $lon . '&exclude=current,minutely,hourly,daily&appid=' . OWM_API_KEY;
    $resp = http_json($url);
    $data = json_decode($resp, true);
    
    if (is_array($data) && isset($data['alerts']) && is_array($data['alerts'])) {
        foreach ($data['alerts'] as $alert) {
            $severity = 'moderate';
            $event = strtolower($alert['event'] ?? '');
            
            // Classify severity based on event type
            if (preg_match('/(hurricane|tornado|tsunami|extreme)/i', $event)) {
                $severity = 'extreme';
            } elseif (preg_match('/(storm|severe|warning|cyclone|typhoon)/i', $event)) {
                $severity = 'severe';
            } elseif (preg_match('/(watch|advisory|wind|rain|flood)/i', $event)) {
                $severity = 'moderate';
            } else {
                $severity = 'minor';
            }
            
            $alerts[] = [
                'event' => $alert['event'] ?? 'Weather Alert',
                'severity' => $severity,
                'start' => $alert['start'] ?? null,
                'end' => $alert['end'] ?? null,
                'description' => $alert['description'] ?? '',
                'sender' => $alert['sender_name'] ?? 'Weather Service',
                'source' => 'OpenWeather'
            ];
        }
    }
}

// Fallback: Try Open-Meteo Air Quality API for basic warnings (limited alert coverage)
if (empty($alerts)) {
    // Open-Meteo doesn't provide comprehensive alerts, but we can check extreme conditions
    $omUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' . $lat . '&longitude=' . $lon . 
             '&current=temperature_2m,wind_speed_10m,precipitation&hourly=temperature_2m,wind_speed_10m,precipitation&timezone=auto';
    $resp = http_json($omUrl);
    $data = json_decode($resp, true);
    
    if (is_array($data) && isset($data['current'])) {
        $warnings = [];
        
        // Check for extreme conditions in next 24h
        if (isset($data['hourly']['wind_speed_10m'])) {
            $maxWind = max(array_slice($data['hourly']['wind_speed_10m'], 0, 24));
            if ($maxWind > 50) { // > 50 km/h
                $warnings[] = [
                    'event' => 'High Wind Warning',
                    'severity' => 'moderate',
                    'start' => time(),
                    'end' => time() + 86400,
                    'description' => 'Strong winds expected with gusts up to ' . round($maxWind) . ' km/h. Secure loose objects and avoid outdoor activities.',
                    'sender' => 'KLIMA Weather Analysis',
                    'source' => 'Open-Meteo Analysis'
                ];
            }
        }
        
        if (isset($data['hourly']['precipitation'])) {
            $totalPrecip = array_sum(array_slice($data['hourly']['precipitation'], 0, 24));
            if ($totalPrecip > 50) { // > 50mm in 24h
                $warnings[] = [
                    'event' => 'Heavy Rain Advisory',
                    'severity' => 'moderate',
                    'start' => time(),
                    'end' => time() + 86400,
                    'description' => 'Heavy rainfall expected with accumulation up to ' . round($totalPrecip) . ' mm in the next 24 hours. Potential for flooding in low-lying areas.',
                    'sender' => 'KLIMA Weather Analysis',
                    'source' => 'Open-Meteo Analysis'
                ];
            }
        }
        
        if (isset($data['hourly']['temperature_2m'])) {
            $maxTemp = max(array_slice($data['hourly']['temperature_2m'], 0, 24));
            $minTemp = min(array_slice($data['hourly']['temperature_2m'], 0, 24));
            
            if ($maxTemp > 38) {
                $warnings[] = [
                    'event' => 'Excessive Heat Warning',
                    'severity' => 'severe',
                    'start' => time(),
                    'end' => time() + 86400,
                    'description' => 'Dangerously high temperatures up to ' . round($maxTemp) . '°C expected. Stay hydrated, avoid prolonged outdoor exposure, and check on vulnerable individuals.',
                    'sender' => 'KLIMA Weather Analysis',
                    'source' => 'Open-Meteo Analysis'
                ];
            } elseif ($minTemp < -10) {
                $warnings[] = [
                    'event' => 'Extreme Cold Warning',
                    'severity' => 'severe',
                    'start' => time(),
                    'end' => time() + 86400,
                    'description' => 'Dangerously low temperatures down to ' . round($minTemp) . '°C expected. Risk of frostbite and hypothermia. Limit outdoor exposure.',
                    'sender' => 'KLIMA Weather Analysis',
                    'source' => 'Open-Meteo Analysis'
                ];
            }
        }
        
        $alerts = $warnings;
    }
}

$out = [
    'alerts' => $alerts,
    'count' => count($alerts),
    'location' => ['lat' => $lat, 'lon' => $lon],
    'timestamp' => time()
];

$json = json_encode($out);
cache_set($cacheKey, $json);
echo $json;
?>
