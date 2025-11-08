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

// ------------------------------------------------------------------
// Clean implementation below
// ------------------------------------------------------------------
$alerts = [];

// 1. Official OpenWeather alerts (if key configured)
if (OWM_API_KEY !== 'REPLACE_WITH_YOUR_OPENWEATHER_API_KEY') {
    $owUrl = OWM_ONECALL_URL . '?lat=' . $lat . '&lon=' . $lon . '&exclude=current,minutely,hourly,daily&appid=' . OWM_API_KEY;
    $resp = http_json($owUrl);
    $owData = json_decode($resp, true);
    if (is_array($owData) && isset($owData['alerts'])) {
        foreach ($owData['alerts'] as $alert) {
            $sev = 'moderate';
            $event = strtolower($alert['event'] ?? '');
            if (preg_match('/(hurricane|tornado|tsunami|extreme)/i', $event)) $sev = 'extreme';
            elseif (preg_match('/(storm|severe|warning|cyclone|typhoon)/i', $event)) $sev = 'severe';
            elseif (preg_match('/(watch|advisory|wind|rain|flood)/i', $event)) $sev = 'moderate';
            else $sev = 'minor';
            $alerts[] = [
                'event' => $alert['event'] ?? 'Weather Alert',
                'severity' => $sev,
                'start' => $alert['start'] ?? null,
                'end' => $alert['end'] ?? null,
                'description' => $alert['description'] ?? '',
                'sender' => $alert['sender_name'] ?? 'Weather Service',
                'source' => 'OpenWeather'
            ];
        }
    }
}

// 2. Official Open-Meteo warnings (Europe, some regions)
if (empty($alerts)) {
    $warnUrl = 'https://api.open-meteo.com/v1/warnings?latitude=' . $lat . '&longitude=' . $lon . '&timezone=auto';
    $resp = http_json($warnUrl);
    $warnData = json_decode($resp, true);
    if (is_array($warnData) && isset($warnData['warnings'])) {
        foreach ($warnData['warnings'] as $w) {
            $title = $w['event'] ?? ($w['headline'] ?? 'Weather Warning');
            $sev = strtolower($w['severity'] ?? ($w['level'] ?? 'moderate'));
            if (preg_match('/extreme|red/', $sev)) $sev = 'extreme';
            elseif (preg_match('/severe|orange/', $sev)) $sev = 'severe';
            elseif (preg_match('/moderate|yellow/', $sev)) $sev = 'moderate';
            else $sev = 'minor';
            $start = isset($w['start']) ? strtotime($w['start']) : null;
            $end = isset($w['end']) ? strtotime($w['end']) : null;
            $desc = $w['description'] ?? ($w['instruction'] ?? '');
            $sender = $w['provider'] ?? 'Meteoalarm / Open-Meteo';
            $alerts[] = [
                'event' => $title,
                'severity' => $sev,
                'start' => $start,
                'end' => $end,
                'description' => $desc,
                'sender' => $sender,
                'source' => 'Open-Meteo Warnings'
            ];
        }
    }
}

// 3. Heuristic alerts (derived from forecast extremes)
if (empty($alerts)) {
    $fcUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' . $lat . '&longitude=' . $lon . '&current=temperature_2m,wind_speed_10m,precipitation&hourly=temperature_2m,wind_speed_10m,precipitation,weathercode&timezone=auto';
    $resp = http_json($fcUrl);
    $fcData = json_decode($resp, true);
    if (is_array($fcData) && isset($fcData['hourly'])) {
        $hourly = $fcData['hourly'];
        $warnings = [];

        // Wind
        if (isset($hourly['wind_speed_10m'])) {
            $maxWind = max(array_slice($hourly['wind_speed_10m'], 0, 24));
            if ($maxWind > 50) {
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

        // Rain
        if (isset($hourly['precipitation'])) {
            $slice = array_slice($hourly['precipitation'], 0, 24);
            $total = array_sum($slice);
            $maxRate = max($slice);
            if ($total > 50) {
                $warnings[] = [
                    'event' => 'Heavy Rain Advisory',
                    'severity' => 'moderate',
                    'start' => time(),
                    'end' => time() + 86400,
                    'description' => 'Heavy rainfall expected with accumulation up to ' . round($total) . ' mm in the next 24 hours. Flooding possible in low-lying areas.',
                    'sender' => 'KLIMA Weather Analysis',
                    'source' => 'Open-Meteo Analysis'
                ];
            } elseif ($maxRate >= 5) {
                $warnings[] = [
                    'event' => 'Heavy Rain Warning',
                    'severity' => 'severe',
                    'start' => time(),
                    'end' => time() + 6*3600,
                    'description' => 'Intense rain bursts up to ' . round($maxRate,1) . ' mm/h may cause localized flooding.',
                    'sender' => 'KLIMA Weather Analysis',
                    'source' => 'Open-Meteo Analysis'
                ];
            }
        }

        // Temperature
        if (isset($hourly['temperature_2m'])) {
            $maxTemp = max(array_slice($hourly['temperature_2m'], 0, 24));
            $minTemp = min(array_slice($hourly['temperature_2m'], 0, 24));
            if ($maxTemp > 38) {
                $warnings[] = [
                    'event' => 'Excessive Heat Warning',
                    'severity' => 'severe',
                    'start' => time(),
                    'end' => time() + 86400,
                    'description' => 'Dangerously high temperatures up to ' . round($maxTemp) . '°C expected. Limit strenuous outdoor activity.',
                    'sender' => 'KLIMA Weather Analysis',
                    'source' => 'Open-Meteo Analysis'
                ];
            } elseif ($minTemp < -10) {
                $warnings[] = [
                    'event' => 'Extreme Cold Warning',
                    'severity' => 'severe',
                    'start' => time(),
                    'end' => time() + 86400,
                    'description' => 'Very low temperatures down to ' . round($minTemp) . '°C. Risk of frostbite/hypothermia.',
                    'sender' => 'KLIMA Weather Analysis',
                    'source' => 'Open-Meteo Analysis'
                ];
            }
        }

        // Thunderstorms (WMO codes 95/96/99)
        if (isset($hourly['weathercode'])) {
            $codeSlice = array_slice($hourly['weathercode'], 0, 12);
            foreach ($codeSlice as $code) {
                if (in_array(intval($code), [95,96,99])) {
                    $warnings[] = [
                        'event' => 'Thunderstorm Risk',
                        'severity' => 'severe',
                        'start' => time(),
                        'end' => time() + 6*3600,
                        'description' => 'Thunderstorms possible with lightning, heavy rain, and gusty winds.',
                        'sender' => 'KLIMA Weather Analysis',
                        'source' => 'Open-Meteo Analysis'
                    ];
                    break;
                }
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
