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
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() - 2);

  // Format the date as YYYY-MM-DD
  const maxDateValue = maxDate.toISOString().split("T")[0];

  // Set the max attribute for startDate and endDate inputs
  document.getElementById("startDate").setAttribute("max", maxDateValue);
  document.getElementById("endDate").setAttribute("max", maxDateValue);

  // Form Submit
  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    document.getElementById("error").style.display = "none";

    document.getElementById("temperatureStats").style.display = "block";
    document.getElementById("todaysWeather").style.display = "block";

    const city = document.getElementById("city").value;
    const state = document.getElementById("state").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    // Check if start date is before end date
    if (new Date(startDate) > new Date(endDate)) {
      alert("Start date must be before end date.");
      return;
    }
    const { latitude, longitude } = await convertCityStateToLatLong(
      city,
      state
    );
    console.log("latitude", latitude);
    console.log("longitude", longitude);

    fetchWeatherData(latitude, longitude, startDate, endDate);
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

async function fetchWeatherData(latitude, longitude, startDate, endDate) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch weather data");
    const data = await response.json();

    displayTemperatureData(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
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

function displayTemperatureData(data) {
  const weatherChartElement = document.getElementById("weatherChart");
  if (!weatherChartElement) return;

  if (
    !data ||
    !data.daily ||
    !data.daily.temperature_2m_max ||
    !data.daily.temperature_2m_min
  ) {
    displayError("No Data for the City!");
    return;
  }

  const ctx = weatherChartElement.getContext("2d");
  const maxTemps = data.daily.temperature_2m_max;
  const minTemps = data.daily.temperature_2m_min;
  const dates = data.daily.time;

  const chartHeight = weatherChartElement.height;
  const chartWidth = weatherChartElement.width;
  const maxTemp = Math.max(...maxTemps, ...minTemps);
  const minTemp = Math.min(...minTemps, ...maxTemps);

  ctx.clearRect(0, 0, chartWidth, chartHeight); // Clear previous chart

  drawAxisLabelsAndLegend(
    ctx,
    dates,
    maxTemp,
    minTemp,
    chartWidth,
    chartHeight
  );
  drawTemperatureLines(
    ctx,
    maxTemps,
    "red",
    maxTemp,
    minTemp,
    chartWidth,
    chartHeight
  );
  drawTemperatureLines(
    ctx,
    minTemps,
    "blue",
    maxTemp,
    minTemp,
    chartWidth,
    chartHeight
  );
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

  weatherInfo.textContent = `Current Temperature: ${data.current_weather.temperature}°C`;
}

function displayError(message) {
  const errorMessageElement = document.getElementById("errorMessage");
  const todaysWeatherElement = document.getElementById("todaysWeather");
  const temperatureStatsElement = document.getElementById("temperatureStats");

  // Display the error message
  errorMessageElement.textContent = message;
  document.getElementById("error").style.display = "block";

  // Hide the weather and temperature sections
  todaysWeatherElement.style.display = "none";
  temperatureStatsElement.style.display = "none";
}

function drawTemperatureLines(
  ctx,
  temperatures,
  color,
  maxTemp,
  minTemp,
  chartWidth,
  chartHeight
) {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2; 

  temperatures.forEach((temp, index) => {
    const x = (index / (temperatures.length - 1)) * chartWidth;
    const y = scaleTemp(temp, minTemp, maxTemp, chartHeight);
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

function drawAxisLabelsAndLegend(
  ctx,
  dates,
  maxTemp,
  minTemp,
  chartWidth,
  chartHeight
) {
  const dateInterval = Math.floor(dates.length / 6); 
  ctx.font = "12px Arial, sans-serif"; 
  ctx.fillStyle = "#333"; 

  // Draw horizontal grid lines and Y-axis labels
  const numGridLines = 5; // horizontal grid lines
  ctx.strokeStyle = "#eee";
  ctx.lineWidth = 1;

  for (let i = 0; i <= numGridLines; i++) {
    const temp = Math.round(minTemp + ((maxTemp - minTemp) * i) / numGridLines);
    const y = scaleTemp(temp, minTemp, maxTemp, chartHeight);
    ctx.fillText(`${temp}°C`, 0, y); // Y-axis labels

    // Draw horizontal grid line
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(chartWidth, y);
    ctx.stroke();
  }

  // Draw X-axis labels (dates)
  dates.forEach((date, index) => {
    if (index % dateInterval === 0) {
      const x = (index / (dates.length - 1)) * chartWidth;
      ctx.fillText(new Date(date).toLocaleDateString(), x, chartHeight - 10);
    }
  });

  // Draw legend
  drawLegend(ctx, chartWidth, chartHeight);
}

function drawLegend(ctx, chartWidth, chartHeight) {
  ctx.fillStyle = "red";
  ctx.fillRect(chartWidth - 120, 20, 10, 10); // Max Temp color
  ctx.fillStyle = "#333";
  ctx.fillText("Max Temp", chartWidth - 100, 30);

  ctx.fillStyle = "blue";
  ctx.fillRect(chartWidth - 120, 40, 10, 10); // Min Temp color
  ctx.fillText("Min Temp", chartWidth - 100, 50);
}

function scaleTemp(temp, minTemp, maxTemp, chartHeight) {
  return (
    chartHeight -
    50 -
    ((temp - minTemp) / (maxTemp - minTemp)) * (chartHeight - 100)
  );
}
