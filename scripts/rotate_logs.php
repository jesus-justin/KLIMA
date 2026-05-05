<?php
$log = __DIR__ . '/../.cache/requests.log';
if (!file_exists($log)) exit(0);
$max = 1024 * 1024; // 1MB
if (filesize($log) > $max) {
    $bak = $log . '.' . date('YmdHis');
    rename($log, $bak);
    // create new empty file
    file_put_contents($log, "");
}
