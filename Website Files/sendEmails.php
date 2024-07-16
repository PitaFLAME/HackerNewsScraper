<?php $filePath = "/home4/nfalgumy/public_html/emails.csv";
$subject = "Your updated HackerNews information";
$bodyFile = "/home4/nfalgumy/public_html/emailContent.html";
$image1 = "/home4/nfalgumy/public_html/TopAuthors.png";
$image2 = "/home4/nfalgumy/public_html/TopArticles.png";

if (!file_exists($filePath)) {
    echo "Error: emails.csv does not exist.";
    exit(1);
}

if (!file_exists($bodyFile)) {
    echo "Error: emailContent.html does not exist.";
    exit(1);
}

if (!file_exists($image1)) {
    echo "Error: TopAuthors.png does not exist.";
    exit(1);
}

if (!file_exists($image2)) {
    echo "Error: TopArticles.png does not exist.";
    exit(1);
}

$emailContent = file_get_contents($bodyFile); function 


generateBoundary() {
    return '----=_Part_' . md5(uniqid(rand(), true));
}


if (($handle = fopen($filePath, "r")) !== FALSE) {
    fgetcsv($handle);
    while (($data = fgetcsv($handle, 1000, ",")) !== FALSE) {
        $email = $data[0];
        if (!empty($email)) {
            $boundary = generateBoundary();
            $headers = "From: QAWolfAssessment@pita.blue\r\n";
            $headers .= "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: multipart/related; boundary=\"$boundary\"\r\n";
            $message = "--$boundary\r\n";
            $message .= "Content-Type: text/html; charset=UTF-8\r\n";
            $message .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
            $message .= $emailContent . "\r\n";
            $message .= "--$boundary\r\n";
            $message .= "Content-Type: image/png; name=\"TopAuthors.png\"\r\n";
            $message .= "Content-Transfer-Encoding: base64\r\n";
            $message .= "Content-Disposition: inline; filename=\"TopAuthors.png\"\r\n";
            $message .= "Content-ID: <image1>\r\n\r\n";
            $message .= chunk_split(base64_encode(file_get_contents($image1))) . "\r\n";
            $message .= "--$boundary\r\n";
            $message .= "Content-Type: image/png; name=\"TopArticles.png\"\r\n";
            $message .= "Content-Transfer-Encoding: base64\r\n";
            $message .= "Content-Disposition: inline; filename=\"TopArticles.png\"\r\n";
            $message .= "Content-ID: <image2>\r\n\r\n";
            $message .= chunk_split(base64_encode(file_get_contents($image2))) . "\r\n";
            $message .= "--$boundary--";
            if (mail($email, $subject, $message, $headers)) {
                echo "Email sent to $email\n";
            } else {
                echo "Failed to send email to $email\n";
            }
        }
    }
    fclose($handle);
}
?>
