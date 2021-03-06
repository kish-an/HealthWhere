const symptomInputLanding = document.getElementById('symptoms');
const symptomInputMain = document.getElementById('symptoms-header');
const locationInput = document.getElementById('location');
let located = false;

//Removes location input if user allows access to navigator geolocation
if ('geolocation' in navigator) {
	navigator.geolocation.getCurrentPosition(
		position => {
			document
				.querySelector('.landing__form--location')
				.classList.toggle('located');
			located = true;
			document.getElementById('location').removeAttribute("required");
			map.flyTo({center: [position.coords.longitude, position.coords.latitude], zoom: 14});
			const location = {
				long: position.coords.longitude,
				lat: position.coords.latitude
			}
			getServices(location);
		}
	);
}
//Changes height of landing form and moves submit button up
document.querySelector('.landing').addEventListener('transitionend', e => {
	if (located && e.propertyName === 'transform') {
		document.querySelector('.landing--container').style.height = 'calc(70% - 10vw)';
		document.getElementById('submit').style.transform = 'translateY(-8rem)';
	}
});

//Handles submit button being clicked on landing page
document.getElementById('landing-form').addEventListener('submit', async function(e) {
	e.preventDefault();
	showMap();
	let waitTime;

	//Center map on postcode input (if geolocation is not available)
	if (locationInput.hasAttribute('required')) {
		const response = await fetch(`https://api.postcodes.io/postcodes/${locationInput.value}`);
		const data = await response.json();
		const location = {
			long: data.result.longitude,
			lat: data.result.latitude
		}
		map.flyTo({center: [location.long, location.lat], zoom: 14});
		getServices(location);
		waitTime = 3000;
	} else {
		//Map will have already loaded so speed up time to show popup
		waitTime = 250;
	}

	//Condition search
	setTimeout(() => {
		if (searchSymptoms(symptomInputLanding.value).length > 1) {
			suggestions();
		} else if (searchSymptoms(symptomInputLanding.value).length === 1) {
			const symptom = searchSymptoms(symptomInputLanding.value)[0];
			diagnose(symptom);
		} else {
			error();
		}
	}, waitTime)
});

function showMap() {
	//Removes landing screen
	document.querySelector('.landing').style.transform = 'translateY(-100%)';
	document.querySelector('header').style.top = '0';
	document.querySelector('header').style.height = '5rem';
	document.querySelector('body').style.display = 'block';

	//Show header symptom bar and put map above body again
	document.getElementById('symptoms-header').value = symptomInputLanding.value;
	document.getElementById('symptoms-header').style.display = 'inline-block';
	document.querySelector('.symptom__list').style.display = 'inline-block';
}

//Removes landing page from document flow
document.addEventListener('transitionend', function(e) {
	if (e.srcElement.className === 'landing') {
		document.querySelector('.landing').style.display = 'none';
	}
});

//Grabs data from CSV file and adds it to symptoms array
let symptomsAndLinks = [];
let symptoms = [];

async function getSymptomList() {
	const response = await fetch('health-a-to-z.csv');
	const data = await response.text();
	const list = data.split('\n');

	symptomsAndLinks = list;
	symptoms = list.map(el => el.replace(/,\/.+/g, ' ').trim());
}

getSymptomList();


//Checks search bar input to see if it matches any entry in the array
const searchSymptoms = searchText => {
	let symptomMatches = symptoms.filter(symptom => {
		const regex = new RegExp(`^${searchText}`, 'gi');
		return symptom.match(regex);
	});

	// if (symptomMatches.length > 5) {
	// 	symptomMatches = symptomMatches.slice(0, 5);
	// }

	if (searchText.length === 0) {
		symptomMatches = [];
		document.querySelector('.symptom__list').innerHTML = '';
	}
	return symptomMatches;
};

//Outputs results from searchSymptoms to header search bar
const outputHtml = symptomMatches => {
	if (symptomMatches.length > 0) {
		const html = symptomMatches
			.map(match => `<li class="symptom__list__item">${match}</li>`)
			.join('');
		document.querySelector('.symptom__list').innerHTML = html;
	}
};
//Updates search bar every time the input changes
symptomInputMain.addEventListener('input', () => {
	const result = searchSymptoms(symptomInputMain.value);
	outputHtml(result);
});

//Get the value if a symptom from the search bar is clicked on
symptomInputMain.addEventListener('input', grabSymptomSearch);

function grabSymptomSearch() {
	const symptomSearches = document.querySelectorAll('.symptom__list__item');

	symptomSearches.forEach(symptomSearch =>
		symptomSearch.addEventListener('click', function(e) {
			//set search bar value to whatever was clicked
			document.getElementById('symptoms-header').value = e.target.innerText;
			//remove dropdown list 
			document.querySelector('.symptom__list').innerHTML = '';
			
			//Grab condition from search bar 
			const value = e.target.innerText;

			diagnose(value);
		})
	);
}

//Send value of search bar to server when enter is pressed 
symptomInputMain.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		//If users search matches more than 1 item than show a suggestions card 
		if (searchSymptoms(symptomInputMain.value).length > 1) {
			suggestions();
		} else if (searchSymptoms(symptomInputMain.value).length === 1) {
			const symptom = searchSymptoms(symptomInputMain.value)[0];
			diagnose(symptom);
		} else {
			error();
		}
		//Removes dropdown autocomplete list
		document.querySelector('.symptom__list').innerHTML = '';
	}
});

function suggestions() {
	//Show the suggestions card
	const suggestions = document.querySelector('.suggestions');
	suggestions.style.transform = 'translate(-50%, -50%) scale(1)';

	//stop interaction with search bar
	symptomInputMain.classList.add('overlay');

	//Add all all matching conditions to the suggestions card
	const array = searchSymptoms(symptomInputMain.value);
	const html = array.map(el => `
		<li class="suggestions__list__item">${el}</li>
		`).join('');
	document.querySelector('.suggestions__list').innerHTML = html;

	//Close menu icon 
	document.querySelector('.suggestions__close').addEventListener('click', () => {
		suggestions.style.transform = 'translate(-50%, -50%) scale(0)';
		symptomInputMain.classList.remove('overlay');
	});

	//Sends condition to server if a condition is clicked 
	document.querySelectorAll('.suggestions__list__item').forEach(el => el.addEventListener('click', (e) => {
		suggestions.style.transform = 'translate(-50%, -50%) scale(0)';
		symptomInputMain.classList.remove('overlay');
		symptomInputMain.value = e.target.innerText;
		diagnose(e.target.innerText);
	}));
}

function error() {
	symptomInputMain.classList.add('overlay');
	const error = document.querySelector('.error');
	error.style.transform = 'translate(-50%, -50%) scale(1)';
	document.querySelector('.error__close').addEventListener('click', () => {
		error.style.transform = 'translate(-50%, -50%) scale(0)';
		symptomInputMain.classList.remove('overlay');
	});
}

async function diagnose(input) {
	const condition = escapeRegExp(input);
	function escapeRegExp(string) {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}
	//Grab the conditions associated link
	const regex = new RegExp(`^(${condition}),\/.+`, 'gi');
	const conditionWithLink = symptomsAndLinks.filter(el => el.match(regex));

	//If an associated link is not found then display error popup
	let link;
	if (conditionWithLink.length > 0) {
		//Isolates link from symptomsAndLinks array
		link = /\/.+/g.exec(conditionWithLink)[0];
	} else {
		return error();
	}

	//Post data to the server and receive condition response back
	const data = { condition, link };
	const response = await fetch('/condition', {
		method: 'POST',
		headers: {
			"Content-Type": 'application/json'
		},
		body: JSON.stringify(data)
	});
	const nhsResponse = await response.json();
	displayConditionInfo(nhsResponse, condition);
}

function displayConditionInfo(data, condition) {
	const conditionURL = data.url.replace('api', 'www');
	const conditionInfoSummary = data.mainEntityOfPage[0].mainEntityOfPage[0].text;
	let conditionInfoSymptoms;
	//See if data contains symptom information
	try {
		conditionInfoSymptoms = data.mainEntityOfPage[1].mainEntityOfPage;
	} catch {
		if (conditionInfoSymptoms) error();
	}
	//Loop through NHS API data and if they contain applicable text then push it to infoArray
	let infoArray = [];
	if (conditionInfoSymptoms) {
		conditionInfoSymptoms.forEach(el => {
			if (el.hasOwnProperty('text') && el['@type'] === 'WebPageElement') {
				infoArray.push(el.text);
			}
		});
	}
	//Condition pop-up UI 
	const conditionPopUp = document.querySelector('.condition');
	conditionPopUp.style.transform = 'translate(-50%, -50%) scale(1)';
	symptomInputMain.classList.add('overlay');
	document.querySelector('.condition__title').textContent = condition;
	document.querySelector('.condition__summary').innerHTML = conditionInfoSummary;
	const html = infoArray.map(el => `<div class="condition__info__item">${el}</div>`).join('');
	document.querySelector('.condition__info').innerHTML = html;
	document.querySelector('.condition__link').setAttribute('href', `${conditionURL}`);
	document.querySelector('.condition__link').innerText = conditionURL;
	document.querySelector('.condition__close').addEventListener('click', () => {
		symptomInputMain.classList.remove('overlay');
		conditionPopUp.style.transform = 'translate(-50%, -50%) scale(0)'
	});
}

async function getServices(location) {
	const response = await fetch('/services', {
		method: 'POST',
		headers: {
			"Content-Type": 'application/json'
		},
		body: JSON.stringify(location)
	});
	const services = await response.json();
	services.value.forEach(el => {
		placeMarker(el.Longitude, el.Latitude, el.Postcode);
		markerPopup(el, el.Postcode);
	});
}

//Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoibGV0c2p1c3RqdW1waW50b2l0IiwiYSI6ImNrMGNxbG9vOTAwNDUzcHM1bGlseGNvd3EifQ.1TgakHM0JVuPRoeecqkrLw';
const map = new mapboxgl.Map({
	container: 'map',
	style: 'mapbox://styles/mapbox/streets-v11',
	center: [-0.118092, 51.509865],
	zoom: 8
});
// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl(), 'top-right');

function placeMarker(long, lat, id) {
	/* Image: An image is loaded and added to the map. */
	map.loadImage("https://i.imgur.com/qR9ekBa.png", function(error, image) {
	  if (error) throw error;

	  if (typeof map.getLayer(id) === 'undefined') {
		  map.addImage("custom-marker", image);
		  /* Style layer: A style layer ties together the source and image and specifies how they are displayed on the map. */
		  map.addLayer({
			  id: id,
			  type: "symbol",
			  /* Source: A data source specifies the geographic coordinate where the image marker gets placed. */
			  source: {
				  type: "geojson",
				  data: {
					type: 'FeatureCollection',
					features: [
						{
						type: 'Feature',
						properties: {},
						geometry: {
							type: "Point",
							coordinates: [long, lat]
						}
						}
					]
				}
			  },
			  layout: {
				  "icon-image": "custom-marker",
			  }
		  });
	  } 	
	});
}

function markerPopup(info, id) {
		//Marker popup 
		const popup = new mapboxgl.Popup({
			closeButton: false,
			closeOnClick: false
		});
	
		map.on('mouseenter', id, function(e) {
			// Change the cursor style as a UI indicator.
			map.getCanvas().style.cursor = 'pointer';
			 
			const coordinates = e.features[0].geometry.coordinates.slice();
			const description = `
			<h2>${info.OrganisationName}</h2> | <h3>(${info.OrganisationType})</h3>
			<p>${info.Address1 ? `${info.Address1},` : ''}
			${info.Address2 ? `${info.Address2},` : ''} ${info.Address3 ? `${info.Address3}` : ''}</p>
			<p>${info.Postcode}</p>
			<br>
			<a href='${info.URL}' target='_blank'>${info.URL ? `${info.URL}` : ''}</a>
			`; 
			 
			// Ensure that if the map is zoomed out such that multiple
			// copies of the feature are visible, the popup appears
			// over the copy being pointed to.
			while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
			coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
			}
			
			// Populate the popup and set its coordinates
			// based on the feature found.
			popup.setLngLat(coordinates)
			.setHTML(description)
			.addTo(map);
		});

		map.on('click', id, function(e) {
			if (info.URL) {
				window.open(info.URL);
			}
		});
			 
		map.on('mouseleave', id, function() {
			map.getCanvas().style.cursor = '';
			popup.remove();
		});
}