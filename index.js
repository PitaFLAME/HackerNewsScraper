// Author: Pita Sherwood
// Verison: 1.1
// 

// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1

const { firefox } = require("playwright");
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-write-stream');
const QuickChart = require('quickchart-js');
const axios = require('axios');
const archiver = require('archiver');
const ftp = require('basic-ftp');
const cron = require('node-cron');
const express = require('express');

async function saveHackerNewsArticles() {
  
  const content = await getData("https://news.ycombinator.com");

  console.log('started');
  const filesDir = path.join(__dirname, 'payloadFiles');
  if (!fs.existsSync(filesDir)) { fs.mkdirSync(filesDir); }

  createFile(content);

  //await sanitizeCSVFile();

  updateAuthorScores(content);
  updateTopArticles(content);

  generateAuthorChart();
  generateTopArticlesChart();

  console.log('file generation completed, sending...');

}


(async () => {
  await saveHackerNewsArticles();

  try {
    await generateZip();
    await pushFilesToFTP();
    console.log('Files pushed successfully');
  } catch (error) {
    console.error('Failed to generate and push ZIP file', error);
    }

})();

cron.schedule('*/10 * * * *', async () => {
  console.log('Running scheduled task...');
  await saveHackerNewsArticles();

  try {
    await generateZip();
    await pushFilesToFTP();
    console.log('Files pushed successfully');
  } catch (error) {
    console.error('Failed to generate and push ZIP file', error);
    }
});





async function getData (webpage) {
    // launch browser
    
    const browser = await firefox.launch({
      headless: true });

    const context = await browser.newContext();
    const page = await context.newPage();
  
    console.log('New page created.');

    // go to Hacker News
    await page.goto(webpage);

    await page.waitForSelector('.title', { timeout: 5000 });
  
    // get titles and urls
      const entries = await page.$$eval('.titleline', data => {
        return data.slice(0,10).map(element => {
          const titleComponent = element.querySelector('a');
          const sitebitComponent = element.querySelector('.sitebit comhead');

          return {
            title: titleComponent ? titleComponent.textContent.replace(/[/,]/g, '') : null,
            url: titleComponent ? titleComponent.href : null,
            discard: sitebitComponent ? sitebitComponent.textContent : null
          }
        });
      });
  
      // get subcontent
      const subcontent = await page.$$eval('.subline', data => {
        return data.slice(0,10).map(element => {
          const scoreComponent = element.querySelector('.score');
          const authorComponent = element.querySelector('.hnuser');
          const dateComponent = element.querySelector('.age a');
          
          return {
            score: scoreComponent ? scoreComponent.textContent : null,
            author: authorComponent ? authorComponent.textContent : null,
            date: dateComponent ? dateComponent.textContent : null
          }
        });
      });

      const content = formatMap(entries.map((element, i) => {
        return {
          ...element,
          ...subcontent[i]
        };
      }));

      browser.close();

      return content;
}





function createFile(data) {
  const writer = csvWriter();

  const filepath = path.join('payloadFiles', 'HackerNews.csv');

  writer.pipe(fs.createWriteStream(filepath));


  data.forEach(element => {
    writer.write({Title: element.title, 
                  Age: element.date, 
                  Author: element.author, 
                  Score: element.score, 
                  URL: element.url});
  });

  console.log(`HackerNews.csv saved at: ${filepath}`);

  writer.end();
}

function formatMap(data) {
  const formatted = data.map(element => {
    return {
      ...element,
      score: element.score.replace('points', '')
    };
  });

  return formatted;
}






function updateAuthorScores(data) {
  const filepath = path.join('payloadFiles', 'AuthorScores.csv');
  const authorScores = {};

  // Read existing data from the file
  if (fs.existsSync(filepath)) {
    const fileData = fs.readFileSync(filepath, 'utf8');
    const rows = fileData.split('\n').slice(1); // Skip the header row

    rows.forEach(row => {
      if (row) {
        const [author, averageScore, numArticles] = row.split(',');
        authorScores[author] = {
          averageScore: parseFloat(averageScore),
          numArticles: parseInt(numArticles, 10)
        };
      }
    });
  }

  // Update scores
  data.forEach(item => {
    const author = item.author;
    const score = parseInt(item.score, 10);

    if (authorScores[author]) {
      const totalScore = authorScores[author].averageScore * authorScores[author].numArticles + score;
      authorScores[author].numArticles += 1;
      authorScores[author].averageScore = totalScore / authorScores[author].numArticles;
    } else {
      authorScores[author] = {
        averageScore: score,
        numArticles: 1
      };
    }
  });

  // Write back to file
  const writer = csvWriter({ headers: ['Author', 'AverageScore', 'NumArticles'] });
  writer.pipe(fs.createWriteStream(filepath));

  Object.keys(authorScores).forEach(author => {
    writer.write({
      Author: author,
      AverageScore: authorScores[author].averageScore.toFixed(2),
      NumArticles: authorScores[author].numArticles
    });
  });

  writer.end();

  console.log(`Author scores updated at: ${filepath}`);
}




function updateTopArticles(data) {
  const filepath = path.join('payloadFiles', 'TopArticles.csv');
  let topArticles = [];

  if (fs.existsSync(filepath)) {
    const fileData = fs.readFileSync(filepath, 'utf8');
    const rows = fileData.split('\n').slice(1);

    rows.forEach(row => {
      if (row) {
        const [score, article, author] = row.split(',');
        topArticles.push({
          score: parseInt(score, 10),
          article: article.replace(/"/g, ''),
          author
        });
      }
    });
  }

  data.forEach(item => {
    const score = parseInt(item.score, 10);
    const article = item.title.replace(/"/g, '');
    const author = item.author;

    const existingArticleIndex = topArticles.findIndex(a => a.article === article);

    if (existingArticleIndex !== -1) {
      if (score > topArticles[existingArticleIndex].score) {
        topArticles[existingArticleIndex].score = score;
      }
    } else {
      if (topArticles.length < 10 || score > topArticles[topArticles.length - 1].score) {
        topArticles.push({ score, article, author });
        topArticles.sort((a, b) => b.score - a.score);
        if (topArticles.length > 10) {
          topArticles.pop();
        }
      }
    }
  });

  const writer = csvWriter({ headers: ['Score', 'Article', 'Author'] });
  writer.pipe(fs.createWriteStream(filepath));

  topArticles.forEach(item => {
    writer.write({
      Score: item.score,
      Article: item.article,
      Author: item.author
    });
  });

  writer.end();

  console.log(`Top articles updated at: ${filepath}`);
}





      async function generateAuthorChart() {
        const filepath = path.join('payloadFiles', 'AuthorScores.csv');
        const authorScores = [];
      
        if (fs.existsSync(filepath)) {
          const fileData = fs.readFileSync(filepath, 'utf8');
          const rows = fileData.split('\n').slice(1);
      
          rows.forEach(row => {
            if (row) {
              const [author, averageScore, numArticles] = row.split(',');
              authorScores.push({
                author: author,
                averageScore: parseFloat(averageScore),
                numArticles: parseInt(numArticles, 10)
              });
            }
          });
        }
      
        const sortedData = authorScores.sort((a, b) => b.averageScore - a.averageScore).slice(0, 10);
      
        const authors = sortedData.map(item => item.author);
        const scores = sortedData.map(item => item.averageScore);
      

        const chart = new QuickChart();
        chart.setConfig({
          type: 'bar',
          data: {
            labels: authors,
            datasets: [{
              label: 'Average Score',
              data: scores,
              backgroundColor: 'rgba(28, 143, 160, 0.2)',
              borderColor: 'rgba(28, 143, 160, 1)',
              borderWidth: 1
            }]
          },
          options: {
            scales: {
              yAxes: [{
                ticks: {
                  beginAtZero: true
                }
              }]
            },
            title: {
              display: true,
              text: 'Top 10 Authors by Average Score'
            }
          }
        });
      
        chart.setWidth(800);
        chart.setHeight(600);
        chart.setBackgroundColor('white');
      
        // Get URL
        const chartUrl = chart.getUrl();
        console.log(`Chart URL: ${chartUrl}`);
      
        // Download image
        const response = await axios.get(chartUrl, { responseType: 'arraybuffer' });
        fs.writeFileSync(path.join('payloadFiles', 'TopAuthors.png'), response.data);
        console.log('Chart image saved as TopAuthors.png');
      }






async function generateTopArticlesChart() {
  const filepath = path.join('payloadFiles', 'TopArticles.csv');
  let topArticles = [];

  if (fs.existsSync(filepath)) {
    const data = fs.readFileSync(filepath, 'utf8');
    const rows = data.split('\n').slice(1);

    rows.forEach(row => {
      if (row) {
        const [score, article, author] = row.split(',');
        topArticles.push({
          score: parseInt(score, 10),
          article: article.replace(/"/g, ''),
          author
        });
      }
    });
  }

  const sortedData = topArticles.sort((a, b) => b.score - a.score).slice(0, 10);

  const articles = sortedData.map(item => item.article.replace(/"/g, ''));
  const scores = sortedData.map(item => item.score);

  // Create the chart
  const chart = new QuickChart();
  chart.setConfig({
    type: 'horizontalBar',
    data: {
      labels: articles,
      datasets: [{
        label: 'Score',
        data: scores,
        backgroundColor: 'rgba(28, 143, 160, 0.2)',
        borderColor: 'rgba(28, 143, 160, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }]
      },
      title: {
        display: true,
        text: 'Top 10 Articles by Score'
      }
    }
  });

  chart.setWidth(800);
  chart.setHeight(600);
  chart.setBackgroundColor('white');

  // Get URL
  const chartUrl = chart.getUrl();
  console.log(`Chart URL: ${chartUrl}`);

  // Download image
  const response = await axios.get(chartUrl, { responseType: 'arraybuffer' });
  fs.writeFileSync(path.join('payloadFiles', 'TopArticles.png'), response.data);  
  console.log('Chart image saved as TopArticles.png');
}






const FTP_HOST = 'ftp.nfa.lgu.mybluehost.me';
const FTP_REMOTE_PATH = 'payloadFiles.zip';
const LOCAL_ZIP_PATH = path.join(__dirname, 'payloadFiles.zip');
const PAYLOAD_DIR = path.join(__dirname, 'payloadFiles');

async function pushFilesToFTP() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
      await client.access({
          host: FTP_HOST,
          user: 'codespace@nfa.lgu.mybluehost.me',
          password: '[REMOVED_FOR_DISTRIBUTION]]',
      });

      const remoteDir = path.dirname(FTP_REMOTE_PATH);
    const remoteFileName = path.basename(FTP_REMOTE_PATH);

    await client.ensureDir(remoteDir);

    // Change to the remote directory
    await client.cd(remoteDir);


      await client.uploadFrom(LOCAL_ZIP_PATH, FTP_REMOTE_PATH);
      console.log(`File uploaded successfully to ${FTP_REMOTE_PATH}`);
  } catch (err) {
      console.error(err);
  }
  client.close();
}

async function generateZip() {
  const output = fs.createWriteStream(LOCAL_ZIP_PATH);
  const archive = archiver('zip');

  return new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.directory(PAYLOAD_DIR, false);
      archive.finalize();
  });
}

