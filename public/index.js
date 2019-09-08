const symptomInputLanding = document.getElementById('symptoms');
const symptomInputMain = document.getElementById('symptoms-header');
const locationInput = document.getElementById('location');
let located = false;

//Removes location input if user allows access to navigator geolocation
if ('geolocation' in navigator) {
	console.log('geolocation available');
	navigator.geolocation.getCurrentPosition(
		position => {
			document
				.querySelector('.landing__form--location')
				.classList.toggle('located');
			located = true;
			document.getElementById('location').removeAttribute("required");
			console.log(position);
		},
		() => console.log('geolocation not available')
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
document.getElementById('landing-form').addEventListener('submit', function(e) {
	e.preventDefault();
	showMap();
	setTimeout(() => {
		if (searchSymptoms(symptomInputLanding.value).length > 1) {
			suggestions();
		} else if (searchSymptoms(symptomInputLanding.value).length === 1) {
			const symptom = searchSymptoms(symptomInputLanding.value)[0];
			diagnose(symptom);
		} else {
			error();
		}
	}, 500)
});

function showMap() {
	//Removes landing screen
	document.querySelector('.landing').style.transform = 'translateY(-100%)';
	document.querySelector('header').style.transform = 'translateY(-90vh)';
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
	const condition = input;
	//Grab the conditions associated link
	const conditionWithLink = symptomsAndLinks.filter(el => el.includes(`${condition}`));

	//If an associated link is not found then search input value is sent to the server as the link
	let link;
	if (conditionWithLink.length > 0) {
		//Isolates link from symptomsAndLinks array
		link = /\/.+/g.exec(conditionWithLink)[0];
	} else {
		link = `conditions/${e.target.innerText.toLowerCase().split(' ').join('-')}`;
	}

	//Post data to the server and receive condition response back
	const data = { condition, link };
	const response = await fetch('/api', {
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


//Google maps
let map;
function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: -34.397, lng: 150.644 },
		zoom: 8
	});
}