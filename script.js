var savedCities = [];
var currentLocation;

function initialize() {
    //grab previous locations from local storage
    savedCities = JSON.parse(localStorage.getItem("cityWeather"));
    var lastSearch;
    //Click on previous searches
    if (savedCities) {
        //display previous city search
        currentLocation = savedCities[savedCities.length - 1];
        showPrevious();
        getCurrent(currentLocation);
    }
    else {
        //try to geolocate, otherwise set city to atlanta
        if (!navigator.geolocation) {
            //can't geolocate and no previous searches, just display a location
            getCurrent("Atlanta");
        }
        else {
            navigator.geolocation.getCurrentPosition(success, error);
        }
    }

}

function success(position) {
    var lat = position.coords.latitude;
    var lon = position.coords.longitude;
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon + "&APPID=7e4c7478cc7ee1e11440bf55a8358ec3";
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        currentLocation = response.name;
        saveLoc(response.name);
        getCurrent(currentLocation);
    });

}

function error(){
    //can't geolocate and no previous searches, just display a location  
    currentLocation = "Atlanta"
    getCurrent(currentLocation);
}

function showPrevious() {
    //show the previously searched for locations that saved on local storage
    if (savedCities) {
        $("#recentSearch").empty();
        var button = $("<div>").attr("class", "list-group");
        for (var i = 0; i < savedCities.length; i++) {
            var locationBtn = $("<a>").attr("href", "#").attr("id", "loc-btn").text(savedCities[i]);
            if (savedCities[i] == currentLocation){
                locationBtn.attr("class", "list-group-item list-group-item-action active");
            }
            else {
                locationBtn.attr("class", "list-group-item list-group-item-action");
            }
            button.prepend(locationBtn);
        }
        $("#recentSearch").append(button);
    }
}

function getCurrent(city) {
    var queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + city + "&APPID=7e4c7478cc7ee1e11440bf55a8358ec3&units=imperial";
    $.ajax({
        url: queryURL,
        method: "GET",
        error: function (){
            savedCities.splice(savedCities.indexOf(city), 1);
            localStorage.setItem("cityWeather", JSON.stringify(savedCities));
            initialize();
        }
    }).then(function (response) {
        //creates current weather card
        var currentCard = $("<div>").attr("class", "card bg-light");
        $("#forecast").append(currentCard);

        //adds location on header of weather card
        var weatherHead = $("<div>").attr("class", "card-header").text("Current weather for " + response.name);
        currentCard.append(weatherHead);

        var cardRow = $("<div>").attr("class", "row no-gutters");
        currentCard.append(cardRow);

        //get icon for weather conditions
        var weathericonURL = "https://openweathermap.org/img/wn/" + response.weather[0].icon + "@2x.png";

        var imgDiv = $("<div>").attr("class", "col-md-4").append($("<img>").attr("src", weathericonURL).attr("class", "card-img"));
        cardRow.append(imgDiv);

        var textCntr = $("<div>").attr("class", "col-md-8");
        var cardBody = $("<div>").attr("class", "card-body");
        textCntr.append(cardBody);
        //display searched city
        cardBody.append($("<h3>").attr("class", "card-title").text(response.name));
        //display last updated
        var currentDate = moment(response.dt, "X").format("dddd, MMMM Do YYYY, h:mm a");
        cardBody.append($("<p>").attr("class", "card-text").append($("<small>").attr("class", "text-muted").text("Last updated: " + currentDate)));
        //display Temperature
        cardBody.append($("<p>").attr("class", "card-text").html("Temperature: " + response.main.temp + " &#8457;"));
        //display Humidity
        cardBody.append($("<p>").attr("class", "card-text").text("Humidity: " + response.main.humidity + "%"));
        //display Wind Speed
        cardBody.append($("<p>").attr("class", "card-text").text("Wind Speed: " + response.wind.speed + " MPH"));

        //get UV Index
        var uvIndexURL = "https://api.openweathermap.org/data/2.5/uvi?appid=7e4c7478cc7ee1e11440bf55a8358ec3&lat=" + response.coord.lat + "&lon=" + response.coord.lat;
        $.ajax({
            url: uvIndexURL,
            method: "GET"
        }).then(function (uvresponse) {
            var uvindex = uvresponse.value;
            var backgroundcolor;
            if (uvindex <= 3) {
                backgroundcolor = "green";
            }
            else if (uvindex >= 3 || uvindex <= 6) {
                backgroundcolor = "yellow";
            }
            else if (uvindex >= 6 || uvindex <= 8) {
                backgroundcolor = "orange";
            }
            else {
                backgroundcolor = "red";
            }
            var uvdisplay = $("<p>").attr("class", "card-text").text("UV Index: ");
            uvdisplay.append($("<span>").attr("class", "uvindex").attr("style", ("background-color:" + backgroundcolor)).text(uvindex));
            cardBody.append(uvdisplay);

        });

        cardRow.append(textCntr);
        getForecast(response.id);
    });
}

function getForecast(city) {
    //daily forecast - 5 days
    var queryURL = "https://api.openweathermap.org/data/2.5/forecast?id=" + city + "&APPID=7e4c7478cc7ee1e11440bf55a8358ec3&units=imperial";
    $.ajax({
        url: queryURL,
        method: "GET"
    }).then(function (response) {
        //adds container for daily forecast
        var newrow = $("<div>").attr("class", "forecast");
        $("#forecast").append(newrow);

        //loops array to find the forecasts for 12:00
        for (var i = 0; i < response.list.length; i++) {
            if (response.list[i].dt_txt.indexOf("12:00:00") !== -1) {
                var newColumn = $("<div>").attr("class", "column");
                newrow.append(newColumn);

                var newCard = $("<div>").attr("class", "card text-white bg-primary");
                newColumn.append(newCard);

                var cardDate = $("<div>").attr("class", "card-header").text(moment(response.list[i].dt, "X").format("MMM Do"));
                newCard.append(cardDate);

                var cardimageweather = $("<img>").attr("class", "card-img-top").attr("src", "https://openweathermap.org/img/wn/" + response.list[i].weather[0].icon + "@2x.png");
                newCard.append(cardimageweather);

                var bodyDiv = $("<div>").attr("class", "card-body");
                newCard.append(bodyDiv);

                bodyDiv.append($("<p>").attr("class", "card-text").html("Temp: " + response.list[i].main.temp + " &#8457;"));
                bodyDiv.append($("<p>").attr("class", "card-text").text("Humidity: " + response.list[i].main.humidity + "%"));
            }
        }
    });
}

function clear() {
    //clear all the weather
    $("#forecast").empty();
}

function saveLoc(loc){
    if (savedCities === null) {
        savedCities = [loc];
    }
    else if (savedCities.indexOf(loc) === -1) {
        savedCities.push(loc);
    }

    localStorage.setItem("cityWeather", JSON.stringify(savedCities));
    showPrevious();
}

$("#btnSearch").on("click", function () {
    //stops from refreshing the screen
    event.preventDefault();
    //grab the value of the input in search
    var loc = $("#cityInput").val().trim();
    //if loc wasn't empty
    if (loc !== "") {
        //clear the previous forecast
        clear();
        currentLocation = loc;
        saveLoc(loc);
        //clear the search field
        $("#cityInput").val("");
        //get the new forecast
        getCurrent(loc);
    }
});

$(document).on("click", "#loc-btn", function () {
    clear();
    currentLocation = $(this).text();
    showPrevious();
    getCurrent(currentLocation);
});

initialize();