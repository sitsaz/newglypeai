<?php
$files = ['php-package/browse.php', 'wordpress-plugin/cloud-portal/cloud-portal.php'];
$blockedHeaders = "['host', 'cookie', 'content-length', 'connection', 'accept-encoding', 'x-forwarded-for', 'x-forwarded-host', 'x-forwarded-proto', 'x-real-ip', 'via', 'forwarded', 'client-ip', 'true-client-ip', 'cf-connecting-ip']";

foreach ($files as $file) {
    $content = file_get_contents($file);
    $content = preg_replace("/\['host', 'cookie', 'content-length', 'connection', 'accept-encoding'\]/", $blockedHeaders, $content);
    file_put_contents($file, $content);
}
echo "Done\n";
