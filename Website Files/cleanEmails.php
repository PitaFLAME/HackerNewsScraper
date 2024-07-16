<?php
$filePath = '/home4/nfalgumy/public_html/emails.csv'; 
$thresholdTime = strtotime('-24 hours');

if (file_exists($filePath)) {
    $updatedEmails = array();
    $file = fopen($filePath, 'r');
    while (($line = fgetcsv($file)) !== FALSE) {
        $email = $line[0];
        $timestamp = strtotime($line[1]);
        if ($timestamp > $thresholdTime) {
            $updatedEmails[] = $line;
        }
    }
    fclose($file);

    $file = fopen($filePath, 'w');
    foreach ($updatedEmails as $line) {
        fputcsv($file, $line);
    }
    fclose($file);
    echo "Cleanup completed. Removed emails older than 24 hours.\n";
} else {
    echo "Error: emails.csv does not exist.\n";
}

?>
