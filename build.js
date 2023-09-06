;function initEta(conf) {
	let interval = 1000 * 60 * conf.updateEveryMins
	fetchEta(conf)
	window.setInterval(_ => fetchEta(conf), interval)
}

function fetchEta({ stopIds }) {
	let promises = stopIds.map(fetchStop)

	Promise
		.all(promises)
		//Concat all the arrays of arrays in a single one
		.then(arrays => arrays?.flat())
		.then(checkUnits)
}

function fetchStop(stopId) {
	return fetch(endpointStop.replace("%ID%", stopId))
		.then(r => r.json())
		//Responds stringified JSON (text)
		.then(r => JSON.parse(r))
		//Response is an array, [0] contains Stop info/details [1] contains Units data (array), we only care about Units here
		.then(r => r?.at(1))
}

/*
Unit model:
{
	DirectionID: "-1"
	ETAResult: "1"
	ETASeconds: "6761"
	ETAType: "0"
	RouteColor: "#C34415"
	RouteName: "Orange Line"
	ShortName: "2316 - 0Y0V"
	StopDirection: ""
	StopID: "1451920"
	StopName: "Gateway Park"
	StopNumber: "136"
	UnitID: "1097943"
}
*/
function checkUnits(units = []) {

	if (units.length <= 0) {
		noUnitsAvailable()
		return
	}

	//Sort by ETA ASC
	units.sort((a, b) => (
		parseInt(a.ETASeconds) - parseInt(b.ETASeconds)
	))

	//Update info panel with smallest ETA unit
	let minETAUnit = units[0]
	updateInfoPanel(
		minETAUnit.ETASeconds,
		minETAUnit.ShortName
	)

	//Fitlter out duplicated units and update map
	let uniqueUnits = []
	units.forEach(a => {
		let exists = uniqueUnits
			.find(({ UnitID }) => a.UnitID == UnitID);
		if (!exists) {
			uniqueUnits.push(a)
		}
	})

	uniqueUnits.forEach(addVehicleToDOMAndMoveIt)
}

function updateInfoPanel(
	ETASeconds,
	unitName
) {
	// Convertir a minutos
	let minutes = (Math.floor(ETASeconds / 60));

	let isInTheStop = minutes <= 1;

	let etaElement0 = document.getElementById("minutes-eta");
	let etaElement1 = document.getElementById("text-eta");
	let etaElement4 = document.getElementById("next-unit");

	if (isInTheStop) {
		etaElement0.style.display = "none";

		etaElement1.innerHTML = 'The Shuttle</span><br/><span>is in the Stop';

		etaElement1.classList.add("TrolleyAtStop");
	} else {
		etaElement0.style.display = "block";
		etaElement0.innerHTML = `${minutes} mins`

		etaElement1.innerHTML = 'Until Next Arrival';

		etaElement1.classList.remove("TrolleyAtStop");
	}

	etaElement4.innerHTML = `UNIT ${unitName}`;
}

function addVehicleToDOMAndMoveIt({ UnitID, ShortName }) {
	let icon = document.getElementById(`shuttle-${UnitID}`)

	if (!icon) {
		icon = addVehicleToDOM(UnitID, ShortName)
	}

	moveVehicle(UnitID, icon)
}

function addVehicleToDOM(unitId, unitName) {
	let div = document.createElement("DIV")
	div.id = `shuttle-${unitId}`
	div.classList.add("shuttle-icon-container")
	div.innerHTML = `<img src="./res/images/ShuttleIcon.svg" /><span>${unitName}</span>`

	document
		.getElementById("map-container")
		.appendChild(div)

	return div
}

function moveVehicle(unitId, icon) {
	fetch(endpointShuttle.replace("%ID%", unitId))
		.then(r => r.json())
		//Responds stringified JSON (text)
		.then(r => JSON.parse(r))
		//Response is an array
		.then(r => r?.at(0))
		.then(r => parseInt(r?.RealStopId || 0))
		.then(r => moveVehicleByID(r, icon))
}

function moveVehicleByID(stopId, shuttleIcon) {

	console.log(stopId, shuttleIcon)

	switch (true) {
		case TowardsIntracoastalMallNorth2South.includes(stopId):
			console.log("Estoy en el arreglo IntracoastalMallNorth2South");
			shuttleIcon.style.right = "170px";
			shuttleIcon.style.top = "810px";
			break;
		case TowardsIntracoastalMallSouth2North.includes(stopId):
			console.log("Estoy en el arreglo IntracoastalMallSouth2North");
			shuttleIcon.style.right = "240px";
			shuttleIcon.style.top = "1000px";
			break;
		case IntracoastalMall.includes(stopId):
			console.log("Estoy en el arreglo IntracoastalMall");
			shuttleIcon.style.right = "340px";
			shuttleIcon.style.top = "900px";

			break;
		case GovtCenter.includes(stopId):
			console.log("Estoy en el arreglo GovtCenter");
			shuttleIcon.style.right = "20px";
			shuttleIcon.style.top = "660px";
			break;
		case PelicanCommunityPark.includes(stopId):
			console.log("Estoy en el arreglo PelicanCommunityPark");
			shuttleIcon.style.right = "200px";
			shuttleIcon.style.top = "600px";
			break;
		case AventuraMall.includes(stopId):
			console.log("Estoy en el arreglo AventuraMall");
			shuttleIcon.style.right = "450px";
			shuttleIcon.style.top = "420px";
			break;
		case GoldenShores.includes(stopId):
			console.log("Estoy en el arreglo GoldenShores");
			shuttleIcon.style.right = "170px";
			shuttleIcon.style.top = "480px";
			break;
		case Publix.includes(stopId):
			console.log("Estoy en el arreglo Publix");
			shuttleIcon.style.right = "150px";
			shuttleIcon.style.top = "520px";
			break;
		default:
			console.log("El ID no se encuentra en ninguno de los arreglos.");
			shuttleIcon.style.right = "20px";
			shuttleIcon.style.top = "350px";
			break;
	}
}

function noUnitsAvailable() {
	let etaElement0 = document.getElementById("minutes-eta");
	let etaElement1 = document.getElementById("text-eta");
	let etaElement4 = document.getElementById("next-unit");

	etaElement0.innerHTML = `---`;
	etaElement4.innerHTML = `---`

	removeAllVehiclesFromDOM()
}

function removeAllVehiclesFromDOM() {
	document
		.getElementsByClassName("shuttle-icon-container")
		?.forEach(e => e.remove())
}


// - Constants

const endpointStop = `https://publictransportation.tsomobile.com/wcf/PubTrans/GetModuleInfoPublic?Key=STOPINFO_WITHOVERLAPS&id=%ID%&f1=31344&lan=en&_=1684446499883`;

const endpointShuttle = `https://publictransportation.tsomobile.com/wcf/PubTrans/GetModuleInfoPublic?Key=GET_UNIT_NEXTSTOP&id=%ID%&f1=31344`

const TowardsIntracoastalMallNorth2South = [893643, 883291, 893644, 893645, 893646, 893647, 893839, 893841, 893842, 893843, 883331, 1123175, 893845, 893846, 893847, 1140614, 893848, 893849];

const TowardsIntracoastalMallSouth2North = [893850, 893890, 1451920, 914322, 893851, 893852, 893853, 893854, 896443, 893861, 883296, 893888, 893889, 883295];

const IntracoastalMall = [883332, 893891];

const GovtCenter = [893892, 893893, 893894, 914323, 893895, 893896, 893897, 1123176, 893899, 883299, 883300, 893910, 893911];

const PelicanCommunityPark = [897618];

const AventuraMall = [893913, 893916, 896933, 896934, 893916, 893919, 893920, 883335, 893930, 896935, 893929];

const GoldenShores = [893838, 893928, 893636];

const Publix = [893637, 893638, 893639, 893641, 883290, 914324, 914321];
;let APP_CONFIG = {};

function initApp(configFile = "./config.json") {
	fetch(configFile)
		.then(d => d.json())
		.then(config => APP_CONFIG = config)
		.then(config => {
			initWeather(config.weather)
			initEta(config.eta)
			initMeta(config)
		})

	initClock()
}

function initClock() {
	window.setInterval(updateClock, 1000 * 60 * 1)
}

function updateClock() {
	let timeElement = document.getElementById("time");
	let currTime = moment().format("hh:mm A")
	timeElement.innerHTML = currTime;
}

function initMeta({ routeName }) {
	document.getElementById("main-route-stop").innerHTML = routeName
}
;function initWeather(conf) {
	let interval = 1000 * 60 * conf.updateEveryMins
	fetchWeather(conf)
	window.setInterval(_ => fetchWeather(conf), interval)
}

function fetchWeather({ apiKey, lat, lon, units }) {
	try {
		fetch(
			`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=${units}&appid=${apiKey}`
		)
			.then(r => r.json())
			.then(r => updateWeather(r.hourly.slice(0, 6)))
	} catch (e) {
		l(e)
	}
}

function updateWeather(weatherList) {
	for (let i = 0; i < weatherList.length; i++) {
		let weatherElement = document.getElementById("weather" + i);
		let hour = moment.unix(weatherList[i].dt);
		let isDay = isDayFunction(hour);
		let weather = weatherCode2text(weatherList[i].weather[0].id, isDay);
		let temperature = Math.round(weatherList[i].temp);
		let timeText = i == 0 ? "Now" : hour.format("HH:mm");
		weatherElement.innerHTML =
			"<span>" +
			timeText +
			"</span>" +
			"<span>" +
			'<i class="wi wi-' +
			weather +
			'"></i>' +
			"</span>" +
			"<span>" +
			temperature +
			"º</span>";
	}
	//l("WEATHER UPDATED", weatherList)
}

function isDayFunction(hour) {
	const dayStart = moment("06:00:00", "HH:mm:ss");
	const dayEnd = moment("17:00:00", "HH:mm:ss");
	return hour.isBetween(dayStart, dayEnd);
}

function weatherCode2text(code, isDay) {
	let text = "";
	if (code < 300) {
		text = "thunderstorm";
	} else if (code < 400) {
		text = "sprinkle";
	} else if (code < 600) {
		text = "rain";
	} else if (code < 700) {
		text = "snow";
	} else if (code < 800) {
		text = "fog";
	} else if (code == 800 && isDay) {
		text = "day-sunny";
	} else if (code == 800 && !isDay) {
		text = "night-clear";
	} else if (code == 801 && isDay) {
		text = "day-cloudy";
	} else if (code == 801 && isDay) {
		text = "night-partly-cloudy";
	} else if (code < 900) {
		text = "cloudy";
	} else {
	}
	return text;
}