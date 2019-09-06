const express = require('express');
const app = express();
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

app.listen(3000, () => console.log('Listening at 3000'));
app.use(express.static('public'));

const writeStream = fs.createWriteStream('public/health-a-to-z.csv');

//Generate csv file of all symptoms from NHS Health A-Z
function nhsScrape() {
	request('https://www.nhs.uk/conditions/', (error, response, html) => {
		if (!error && response.statusCode == 200) {
			const $ = cheerio.load(html);

			const symptoms = $('.nhsuk-list-panel__item a').each((i, element) => {
				const symptom = $(element).text();
				const link = $(element).attr('href');

				writeStream.write(`${symptom},${link}\n`);
			});

			console.log('Scraping done.');
		}
	});
}

nhsScrape();

//Grab whatever condition the user entered from the client side 
app.use(express.json({limit: '1mb'}));

let condition;
app.post('/api', (request, response) => {
	console.log(request.body);
	//Grab condition from the body and replace white spaces with hyphens
	condition = request.body.link;
	
	diagnose().catch(err => console.error(err));
	response.end();
});

//NHS Search API - GET request of the conditions pages
async function diagnose() {
	const endpoint = `https://api.nhs.uk/${condition}`
	const options = {
			headers: {
				'Content-Type': 'application/json',
				'subscription-key': process.env.NHS_API_KEY
			}
		}
		
 	const response = await fetch(endpoint, options);
  	const data = await response.json();
 	//console.log(data.mainEntityOfPage);
}