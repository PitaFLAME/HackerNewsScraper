#!/bin/bash
csvFile="/home4/nfalgumy/public_html/HackerNews.csv" 
htmlFile="/home4/nfalgumy/public_html/emailContent.html"


echo "<html><body><h1>Current HackerNews Table</h1><table border='1'>" > $htmlFile 
echo "<tr><th>Title</th><th>Age</th><th>Author</th><th>Score</th><th>URL</th></tr>" >> $htmlFile


tail -n +2 "$csvFile" | while IFS=, read -r title age author score url; do
    echo "<tr><td>$title</td><td>$age</td><td>$author</td><td>$score</td><td><a href='$url'>$url</a></td></tr>" >> $htmlFile
done


echo "</table><br><br>" >> $htmlFile
echo "<img src='cid:image1'><br>" >> $htmlFile
echo "<img src='cid:image2'><br>" >> $htmlFile
echo "</body></html>" >> $htmlFile
