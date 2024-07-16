<?php

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = escapeshellarg($_POST['email']);
    $output = shell_exec("/bin/bash /home4/nfalgumy/public_html/collectFiles.sh $email 2>&1");
    echo json_encode(['status' => 'success', 'message' => $output]);
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed']);
}

?>
