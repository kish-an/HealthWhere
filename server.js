const express = require('express');
const app = express();
const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Starting server at ${port}`));
app.use(express.static('public'));

//Generate csv file of all symptoms from NHS Health A-Z
const writeStream = fs.createWriteStream('public/health-a-to-z.csv');

function nhsScrape() {
	request('https://www.nhs.uk/conditions/', (error, response, html) => {
		if (!error && response.statusCode == 200) {
			const $ = cheerio.load(html);

			const symptoms = $('.nhsuk-list-panel__item a').each((i, element) => {
				const symptom = $(element).text();
				const link = $(element).attr('href');

				writeStream.write(`${symptom},${link}\n`);
			});
		}
	});
}

nhsScrape();

/* 1. Grab whatever condition the user entered from the client side 
2. Fetch condition info from NHS Search API
3. Send response info back to client */
app.use(express.json({limit: '1mb'}));

app.post('/condition', async (request, response) => {
	const condition = request.body.link;
	//NHS Search API - GET request of the conditions pages
	const endpoint = `https://api.nhs.uk/${condition}`
	const options = {
			headers: {
				'Content-Type': 'application/json',
				'subscription-key': process.env.NHS_API_KEY
			}
		}	
 	const nhsResponse = await fetch(endpoint, options);
  	const data = await nhsResponse.json();
	response.json(data);
});

app.post('/services', async (request, response) => {
	//Extract latitude and longitude 
	const long = request.body.long;
	const lat = request.body.lat;

	//NHS Services Search API - POST request of the service search page 
	let data = {
		"orderby": `geo.distance(Geocode, geography'POINT(${long} ${lat})')`,
		"top": 20,
		"skip": 0,
		"count": true
	}
	const info = await fetch('https://api.nhs.uk/service-search/search?api-version=1', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'subscription-key': process.env.NHS_API_KEY
		},
		body: JSON.stringify(data)
	});
	const services = await info.json();
	response.json(services);
});