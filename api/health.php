<?php
require_once __DIR__ . '/../config/config.php';
if (function_exists('send_security_headers')) send_security_headers();
if (function_exists('log_request')) log_request('health');

header('Content-Type: application/json');
$ok = [
  'status' => 'ok',
  'time' => date('c')
];
echo json_encode($ok);
