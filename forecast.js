const latitude = localStorage.getItem("latitude");
const longitude = localStorage.getItem("longitude");

document.getElementById("back-button").style.display = "block";

const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min`;

// Fetch the weather data
fetch(url)
  .then((response) => response.json())
  .then((data) => {
    const container = document.getElementById("forecast-container");
    
    for (let i = 0; i < 7; i++) {
      const dayForecast = data.daily.time[i];
      const maxTemp = data.daily.temperature_2m_max[i];
      const minTemp = data.daily.temperature_2m_min[i];

      // Create the HTML for each day's forecast
      const forecastDiv = document.createElement("div");
      forecastDiv.className = "day-forecast";
      forecastDiv.innerHTML = `
                <h3>${dayForecast}</h3>
                <p>Max Temp: ${maxTemp}°C</p>
                <p>Min Temp: ${minTemp}°C</p>
            `;

      // Add the forecast to the container
      container.appendChild(forecastDiv);
    }
  })
  .catch((error) => console.error("Error fetching weather data:", error));
