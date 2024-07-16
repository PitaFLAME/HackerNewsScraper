<?php
$filePath = '/home4/nfalgumy/public_html/emails.csv';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';

if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $emails = array();
    $updated = false;
    if (file_exists($filePath)) {
        $file = fopen($filePath, 'r');
        while (($line = fgetcsv($file)) !== FALSE) {
            if ($line[0] === $email) {
                $emails[] = array($email, date('Y-m-d H:i:s'));
                $updated = true;
            } else {
                $emails[] = $line;
            }
        }
        fclose($file);
    }
    if (!$updated) {
        $emails[] = array($email, date('Y-m-d H:i:s'));
    }
    $file = fopen($filePath, 'w');
    foreach ($emails as $line) {
        fputcsv($file, $line);
    }
    fclose($file);
    echo 'Email subscribed successfully.';
} else {
    echo 'Invalid email address.';
}

?>
