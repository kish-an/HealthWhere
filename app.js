const express = require('express');
const app = express();
app.listen(3000, () => console.log('Listening at 3000'));
app.use(express.static('public'));

const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const writeStream = fs.createWriteStream('public/health-a-to-z.csv');

//Generate csv file of all symptoms from NHS Health A-Z
function nhsScrape() {
	request('https://www.nhs.uk/conditions/', (error, response, html) => {
		if (!error && response.statusCode == 200) {
			const $ = cheerio.load(html);

			const symptoms = $('.nhsuk-list-panel__item a').each((i, element) => {
				const symptom = $(element).text();

				writeStream.write(`${symptom}, \n`);
			});

			console.log('Scraping done.');
		}
	});
}

nhsScrape();

