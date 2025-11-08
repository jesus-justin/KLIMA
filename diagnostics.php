<?php
// Simple diagnostics page to verify API key & connectivity.
require_once __DIR__ . '/config/config.php';
header('Content-Type: text/html; charset=utf-8');

$keyStatus = (OWM_API_KEY && OWM_API_KEY !== 'REPLACE_WITH_YOUR_OPENWEATHER_API_KEY');
$messages = [];

if (!$keyStatus) {
    $messages[] = 'API key NOT configured. Edit config/.env and set OWM_API_KEY=YOUR_KEY';
} else {
    $messages[] = 'API key appears configured.';
    // Perform a very small test: fetch current weather for a fixed coordinate (Manila)
    $lat = 14.5995; $lon = 120.9842;
    $url = OWM_ONECALL_URL . '?lat=' . $lat . '&lon=' . $lon . '&exclude=minutely,alerts&units=metric&appid=' . OWM_API_KEY;
    $raw = http_json($url);
    $decoded = json_decode($raw, true);
    if (isset($decoded['current'])) {
        $messages[] = 'Test request succeeded: Current temp (metric) Manila = ' . $decoded['current']['temp'] . '°';
    } else {
        $messages[] = 'Test request failed or unexpected response: ' . htmlentities($raw);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>KLIMA Diagnostics</title>
  <style>
    body{font-family:system-ui,Arial,sans-serif; background:#0f172a; color:#e5e7eb; padding:24px}
    .ok{color:#22c55e} .bad{color:#ef4444}
    code{background:#111827; padding:2px 4px; border-radius:4px}
    .box{background:#111827; padding:16px; border-radius:12px; max-width:860px}
  </style>
</head>
<body>
  <h1>KLIMA Diagnostics</h1>
  <div class="box">
    <h2>Status</h2>
    <ul>
      <?php foreach ($messages as $m): ?>
        <li class="<?php echo $keyStatus ? 'ok' : 'bad';?>"><?php echo $m; ?></li>
      <?php endforeach; ?>
    </ul>
    <h2>Environment</h2>
    <p>.env file: <strong><?php echo is_readable(__DIR__.'/config/.env') ? 'FOUND' : 'MISSING';?></strong></p>
    <p>OWM_API_KEY present: <strong><?php echo $keyStatus ? 'YES' : 'NO';?></strong></p>
    <p>cURL available: <strong><?php echo function_exists('curl_init') ? 'YES' : 'NO';?></strong></p>
    <p>allow_url_fopen: <strong><?php echo ini_get('allow_url_fopen') ? 'ENABLED' : 'DISABLED';?></strong></p>
    <p>Fallback (Open-Meteo) available: <strong>YES</strong> — Test: <a href="api/weather_free.php?lat=14.5995&lon=120.9842&units=metric" target="_blank" style="color:#38bdf8">open JSON</a></p>
    <h2>Next Steps</h2>
    <ol>
      <li>If API key not configured, edit <code>config/.env</code> and set <code>OWM_API_KEY=YOUR_KEY</code>.</li>
      <li>Reload this page. Should show current temp line on success.</li>
      <li>Return to <a href="index.html">main app</a> and test search / geolocation.</li>
    </ol>
  </div>
</body>
</html>