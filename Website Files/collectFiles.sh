cd /home4/nfalgumy/public_html

[ -f TopAuthors.png ] && rm TopAuthors.png
[ -f TopArticles.png ] && rm TopArticles.png
[ -f HackerNews.csv ] && rm HackerNews.csv
[ -f TopAuthors.csv ] && rm TopAuthors.csv
[ -f TopArticles.csv ] && rm TopArticles.csv


unzip -o "/home4/nfalgumy/nfa.lgu.mybluehost.me/codespace/payloadFiles.zip" -d "/home4/nfalgumy/public_html"


echo "$(date '+%Y-%m-%d %H:%M:%S')" > /home4/nfalgumy/public_html/last_updated.txt
