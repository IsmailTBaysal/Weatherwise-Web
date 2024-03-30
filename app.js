const weatherCodeToIcon = {
  0: "sunny",
  1: "partly_cloudy",
  2: "partly_cloudy",
  3: "cloudy",
  45: "foggy",
  48: "foggy",
  51: "rainy",
  53: "rainy",
  55: "rainy",
  56: "rainy",
  57: "rainy",
  61: "rainy",
  63: "rainy",
  65: "rainy",
  66: "snowing",
  67: "snowing",
  71: "snowing",
  73: "snowing",
  75: "snowing",
  77: "snowing",
  80: "rainy",
  81: "rainy",
  82: "rainy",
  85: "snowing",
  86: "snowing",
  95: "windy",
  96: "windy",
  99: "windy",
};

document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");

  // Form Submit
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    document.getElementById("error").style.display = "none";
    document.getElementById("sevenDayForecast").style.display = "block";
    document.getElementById("todaysWeather").style.display = "block";

    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;

    const { latitude, longitude } = await convertCityStateToLatLong(
      city,
      state
    );
    console.log("latitude", latitude);
    console.log("longitude", longitude);
    localStorage.setItem("latitude", latitude);
    localStorage.setItem("longitude", longitude);

    fetchCurrentWeather(latitude, longitude);
  });
});

async function convertCityStateToLatLong(city, userState) {
  const baseUrl = "https://geocoding-api.open-meteo.com/v1/search";

  // Construct the full URL with the city name and other parameters
  const url = `${baseUrl}?name=${encodeURIComponent(
    city
  )}&count=50&language=en&format=json`;

  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((json) => {
      if (json.results && json.results.length > 0) {
        // Filter the results to find a match with the user's state
        const matchingResult = json.results.find((result) => {
          return result.admin1?.toLowerCase() === userState.toLowerCase();
        });
        if (matchingResult) {
          return {
            latitude: matchingResult.latitude,
            longitude: matchingResult.longitude,
          };
        } else {
          throw new Error("No matching results found for the specified state");
        }
      } else {
        throw new Error("No results found");
      }
    })
    .catch((error) => {
      displayError(error.message);
      console.error("Error fetching coordinates:", error);
    });
}

async function fetchCurrentWeather(latitude, longitude) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch current weather data");
    const data = await response.json();

    displayCurrentWeather(data);
  } catch (error) {
    console.error("Error fetching current weather data:", error);
  }
}

function displayCurrentWeather(data) {
  const weatherIcon = document.querySelector("#todaysWeather img");
  const weatherInfo = document.getElementById("weatherInfo");
  if (!data || !data.current_weather) {
    weatherInfo.textContent = "No current weather data available.";
    weatherIcon.src = "icons/sunny.svg";
    return;
  }

  // Retrieve the weather code from the API response
  const weatherCode = String(data.current_weather.weathercode);

  // Determine the icon file based on the weather code
  const iconFile = weatherCodeToIcon[weatherCode] || "default";

  // Update the src attribute of the img tag
  weatherIcon.src = `icons/${iconFile}.svg`;

  weatherInfo.textContent = `Current Temperature: ${data.current_weather.temperature}°C, Windspeed: ${data.current_weather.windspeed} km/h`;
}

function displayError(message) {
  const errorMessageElement = document.getElementById("errorMessage");
  const todaysWeatherElement = document.getElementById("todaysWeather");
  const temperatureStatsElement = document.getElementById("temperatureStats");

  // Display the error message
  errorMessageElement.textContent = message;
  document.getElementById("error").style.display = "block";

  // Hide the forcast, weather and temperature sections
  document.getElementById("sevenDayForecast").style.display = "none";
  todaysWeatherElement.style.display = "none";
  temperatureStatsElement.style.display = "none";
}
