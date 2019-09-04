let located = false;

//Removes location input if user allows access to navigator geolocation
if ('geolocation' in navigator) {
	console.log('available');
	navigator.geolocation.getCurrentPosition(position => {
		document
			.querySelector('.landing__form--location')
			.classList.toggle('located');
		located = true;
		console.log(position);
	}, () => console.log('failed'));
} 
//Changes height of landing form and moves submit button up
document.querySelector('.landing').addEventListener('transitionend', e => {
	if (located && e.propertyName === 'transform') {
		document.querySelector('.landing--container').style.height = '45%';
		document.getElementById('submit').style.transform = 'translateY(-8rem)';
	}
});

//Grabs value of symptoms when submit button is clicked
const symptomInput = document.getElementById('symptoms');
const locationInput = document.getElementById('location')
const submitBtn = document.getElementById('submit');

submitBtn.addEventListener('click', function() {
	console.log(symptomInput.value);
	showMap();
})
// or or enter is pressed
document.addEventListener('keydown', function(e) {
	if (e.key === 'Enter') {
		console.log(symptomInput.value);
		showMap();
	}
});

function showMap() {
	//Removes landing screen
	document.querySelector('.landing').style.transform = 'translateY(-100%)';
	document.querySelector('header').style.transform = 'translateY(-90vh)';
	document.querySelector('body').style.display = 'block';

	//Show header symptom bar and put map above body again
	document.querySelector('.header__symptoms').value = symptomInput.value;
	document.querySelector('.header__symptoms').style.display = 'inline-block';
}

document.addEventListener('transitionend', function(e) {
	if (e.srcElement.className === 'landing') {
		document.querySelector('.landing').style.display = 'none';
	}
});


let map;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
	center: {lat: -34.397, lng: 150.644},
	zoom: 8
  });
}
