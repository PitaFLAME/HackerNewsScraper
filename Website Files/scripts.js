document.addEventListener('DOMContentLoaded', function() {
    const images = [
        'TopAuthors.png',
        'TopArticles.png',
    ];

    
    function updateImages() {
        const image1 = document.getElementById('image1');
        const image2 = document.getElementById('image2');

        image1.src = images[0];
        image2.src = images[1];
    }

    updateImages();



    
    document.getElementById('updateButton').addEventListener('click', () => {
        runUpdateScript();
	    loadCSVData();
        updateTimestamp();
    });





    document.getElementById('emailForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
    
        fetch('subscribe.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({ email: email })
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Thank you for subscribing!');
            } else {
                alert(data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Thank you for subscribing!');
        });
    });





    function parseCSV(data) {
        const rows = data.trim().split('\n');
        const headers = rows[0].split(',');
        const result = rows.slice(1).map(row => {
            const values = [];
            let insideQuote = false;
            let value = '';
            for (let char of row) {
                if (char === '"') {
                    insideQuote = !insideQuote;
                } else if (char === ',' && !insideQuote) {
                    values.push(value);
                    value = '';
                } else {
                    value += char;
                }
            }
            console.log(value);
            values.push(value);
            return values;
        });
        return { headers, result };
    }






    function loadCSVData() {
        fetch('HackerNews.csv')
            .then(response => response.text())
            .then(data => {
                const table = document.getElementById('csvTable');
                const { headers, result } = parseCSV(data);

                // Clear the table
                table.querySelector('thead tr').innerHTML = '';
                table.querySelector('tbody').innerHTML = '';

                // Create headers
                headers.forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    table.querySelector('thead tr').appendChild(th);
                });

                // Create rows
                result.forEach(row => {
                    const tr = document.createElement('tr');
                    row.forEach(cell => {
                        const td = document.createElement('td');
                        if (cell.startsWith('http')) {
                            const a = document.createElement('a');
                            a.href = cell;
                            a.textContent = cell;
                            a.target = '_blank';
                            td.appendChild(a);
                        } else {
                            td.textContent = cell;
                        }
                        tr.appendChild(td);
                    });
                    table.querySelector('tbody').appendChild(tr);
                });
            })
            .catch(error => console.error('Error fetching CSV data:', error));
    }

    // Initial updates
    updateImages();
    loadCSVData();
    updateTimestamp();
});





function runUpdateScript() {
    fetch('runScript.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Script output:', data.output);
        alert('Update script has been run.');
    })
    .catch(error => {
        console.error('Error:', error);
        alert('There was an error running the update script.');
    });
}





function updateTimestamp() {
    fetch('last_updated.txt')
        .then(response => response.text())
        .then(data => {
            document.getElementById('lastUpdated').textContent = `Last Updated: ${data}`;
        })
        .catch(error => {
            console.error('Error fetching last updated time:', error);
        });
}
