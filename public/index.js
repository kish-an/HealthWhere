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
			console.log(position);
		},
		() => console.log('geolocation not available')
	);
}
//Changes height of landing form and moves submit button up
document.querySelector('.landing').addEventListener('transitionend', e => {
	if (located && e.propertyName === 'transform') {
		document.querySelector('.landing--container').style.height = '320px';
		document.getElementById('submit').style.transform = 'translateY(-8rem)';
	}
});

//Grabs value of symptoms when submit button is clicked
const symptomInputLanding = document.getElementById('symptoms');
const symptomInputMain = document.getElementById('symptoms-header');
const locationInput = document.getElementById('location');
const submitBtn = document.getElementById('submit');

submitBtn.addEventListener('click', function() {
	console.log(symptomInputLanding.value);
	showMap();
	console.log(searchSymptoms(symptomInputLanding.value));
});
// or if enter is pressed
document.addEventListener('keydown', function(e) {
	if (e.key === 'Enter' && e.srcElement.id === 'symptoms') {
		console.log(symptomInputLanding.value);
		showMap();
	}
});

function showMap() {
	//Removes landing screen
	document.querySelector('.landing').style.transform = 'translateY(-100%)';
	document.querySelector('header').style.transform = 'translateY(-90vh)';
	document.querySelector('body').style.display = 'block';

	//Show header symptom bar and put map above body again
	document.getElementById('symptoms-header').value = symptomInputLanding.value;
	document.getElementById('symptoms-header').style.display = 'inline-block';
}

//Removes landing page from document flow
document.addEventListener('transitionend', function(e) {
	if (e.srcElement.className === 'landing') {
		document.querySelector('.landing').style.display = 'none';
	}
});

//Google maps
let map;

function initMap() {
	map = new google.maps.Map(document.getElementById('map'), {
		center: { lat: -34.397, lng: 150.644 },
		zoom: 8
	});
}

//Grabs data from CSV file and adds it to symptoms array
let symptomsAndLinks = [];
let symptoms = [];

async function getSymptomList() {
	const response = await fetch('health-a-to-z.csv');
	const data = await response.text();
	const list = data.split('\n');

	symptomsAndLinks = list;
	symptoms = list.map(el => el.replace(/,\/.+/g, ' ').trim());
	console.log(symptomsAndLinks);
	console.log(symptoms)
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
			.map(
				match => `
			<li class="symptom__list__item">${match}</li>
			`
			)
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
			const condition = e.target.innerText;
			console.log(condition);
			//Grab the conditions associated link
			const conditionWithLink = symptomsAndLinks.filter(el => el.includes(`${condition}`));

			//If an associated link is not found then search input value is sent to the server as the link
			let link;
			if (conditionWithLink.length > 0) {
				link = /\/.+/g.exec(conditionWithLink)[0];
			} else {
				link = `conditions/${e.target.innerText.toLowerCase().split(' ').join('-')}`;
			}

			//Post data to the server
			const data = { condition, link };

			fetch('/api', {
				method: 'POST',
				headers: {
					"Content-Type": 'application/json'
				},
				body: JSON.stringify(data)
			});

		})
	);
}


document.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		console.log(symptomInputMain.value);
	}
});
