
var apiKey = "8747fb00b3baaa9c806f0f9f23d9d66b";
var today = dayjs().format('MM/DD/YYYY');
var searchHistoryDisplay = [];

// function for current condition of a city
function currentWeather(city) {

    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&units=imperial&appid=" + apiKey;

    $.ajax({ //ajax was used here to minimize the amount of thens we have to use.  I tried just using fetch but the nesting got rediculous.
        url: queryURL,
        method: "GET"
    }).then(function(response) {
        
        //store elements in variables for repeated use.
        var weatherContent = $("#weather-content");
        var cityDetail = $("city-detail");

        weatherContent.css("display", "block");
        cityDetail.empty(); //clear out the details

        //get the icon for the current weather in an area
        var iconCode = response.weather[0].icon;
        var iconURL = "https://openweathermap.org/img/w/" + iconCode + ".png";

        //create the display for the current city.  Used string interpolation to create everything in one go.
        var currentCity = $(`
            <h2 id="current-city">
                ${response.name} ${today} <img src="${iconURL}" alt="${response.weather[0].description}" />
            </h2>
            <p>Temperature: ${response.main.temp} °F</p>
            <p>Humidity: ${response.main.humidity}\%</p>
            <p>Wind Speed: ${response.wind.speed} MPH</p>`);

        $("#city-detail").append(currentCity);

        //Query the UVI at that specific location
        var latitude = response.coord.lat;
        var longitude = response.coord.lon;
        console.log(latitude);
        console.log(longitude);
        var uviQueryURL = "https://api.openweathermap.org/data/2.5/uvi?lat=" + latitude + "&lon=" + longitude + "&appid=" + apiKey;
        console.log(uviQueryURL);

        $.ajax({
            url: uviQueryURL,
            method: "GET"
        }).then(function(response) {

            var uvIndex = response.value;
            var uvIndexEl = 
            $(`<p>UV Index: 
                    <span id="uv-index-color" class="px-2 py-2 rounded">${uvIndex}</span>
                </p>`);

            $("#city-detail").append(uvIndexEl);


            // 0-2 green, 3-5 yellow, 6-7 orange, 8-10 red, 11+ violet
            if (uvIndex >= 0 && uvIndex <= 2) {
                $("#uv-index-color").css("background-color", "green").css("color", "white");
            } else if (uvIndex >= 3 && uvIndex <= 5) {
                $("#uv-index-color").css("background-color", "yellow");
            } else if (uvIndex >= 6 && uvIndex <= 7) {
                $("#uv-index-color").css("background-color", "orange");
            } else if (uvIndex >= 8 && uvIndex <= 10) {
                $("#uv-index-color").css("background-color", "red").css("color", "white");
            } else {
                $("#uv-index-color").css("background-color", "violet").css("color", "white"); 
            }
            fiveDayForecast(latitude, longitude);  
        });
    });
}

// function for the five day forecast 
function fiveDayForecast(latitude, longitude) {

    //query the five day forecast
    var futureURL = "https://api.openweathermap.org/data/2.5/forecast?lat=" + latitude + "&lon=" + longitude + "$&units=imperial&exclude=current,minutely,hourly,alerts&appid=" + apiKey;
    console.log(futureURL);

    $.ajax({
        url: futureURL,
        method: "GET"
    }).then(function(response) {
        $("#five-day-forecast").empty(); //clear it out before we get a new one.
        
        for (let i = 1; i < 6; i++) {
            var cityDailyInfo = { //create an object to hold info about the city on each day
                date: response.daily[i].dt,
                icon: response.daily[i].weather[0].icon,
                temp: response.daily[i].temp.day,
                humidity: response.daily[i].humidity
            };

            var currentDate = dayjs(cityDailyInfo.date).format("MM/DD/YYYY");
            var iconURL = `<img src="https://openweathermap.org/img/w/${cityDailyInfo.icon}.png" alt="${response.daily[i].weather[0].main}" />`;

            //displays the weather for each day.  Contains icons for each of these
            var dailyCard = $(`
                <div class="pl-3">
                    <div class="card pl-3 pt-3 mb-3" style="width: 12rem;>
                        <div class="card-body">
                            <h5>${currentDate}</h5>
                            <p>${iconURL}</p>
                            <p>Temp: ${cityDailyInfo.temp} °F</p>
                            <p>Humidity: ${cityDailyInfo.humidity}\%</p>
                        </div>
                    </div>
                <div>
            `);

            $("#five-day-forecast").append(dailyCard);
        }
    }); 
}

//run this when the search button gets clicked
$("#search-button").on("click", function(event) {
    event.preventDefault();

    var city = $("#input-city").val().trim();

    currentWeather(city);
    if (!searchHistoryDisplay.includes(city)) {
        searchHistoryDisplay.push(city);
        var searchedCity = //create a list item for the searched city
        $(`<li class="list-group-item">${city}</li>`);
        $("#search-history").append(searchedCity);
    };
    
    localStorage.setItem("city-history", JSON.stringify(searchHistoryDisplay)); //stringify the history list and store it
});

//when we click on a list item in the search history, we search for it agian.
$(document).on("click", ".list-group-item", function() {
    var listCity = $(this).text();
    currentWeather(listCity);
});

//this is run when the document loads in order to get the last searched city.
$(document).ready(function() {
    var searchHistoryList = JSON.parse(localStorage.getItem("city-history"));

    if (searchHistoryList !== null) {
        var lastSearchedIndex = searchHistoryList.length - 1;
        var lastSearchedCity = searchHistoryList[lastSearchedIndex];
        currentWeather(lastSearchedCity);
    }
});