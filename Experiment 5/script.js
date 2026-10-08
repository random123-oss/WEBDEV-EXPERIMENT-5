// Getting the elements from the HTML
const form = document.getElementById("weatherForm");
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const loader = document.getElementById("loader");
const errorBox = document.getElementById("error");
const result = document.getElementById("result");

const cityName = document.getElementById("cityName");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const feelsLike = document.getElementById("feelsLike");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const weatherIcon = document.getElementById("weatherIcon");
const cityButtons = document.querySelectorAll(".city-btn");

// Each weather code has its text AND its emoji in one place
const weatherCodes = {
  0:  { text: "Clear sky", icon: "☀️" },
  1:  { text: "Mainly clear", icon: "⛅" },
  2:  { text: "Partly cloudy", icon: "⛅" },
  3:  { text: "Cloudy", icon: "☁️" },
  45: { text: "Fog", icon: "🌫️" },
  48: { text: "Fog", icon: "🌫️" },
  51: { text: "Light drizzle", icon: "🌧️" },
  53: { text: "Drizzle", icon: "🌧️" },
  55: { text: "Heavy drizzle", icon: "🌧️" },
  61: { text: "Light rain", icon: "🌧️" },
  63: { text: "Rain", icon: "🌧️" },
  65: { text: "Heavy rain", icon: "🌧️" },
  66: { text: "Freezing rain", icon: "🌧️" },
  67: { text: "Heavy freezing rain", icon: "🌧️" },
  71: { text: "Light snow", icon: "❄️" },
  73: { text: "Snow", icon: "❄️" },
  75: { text: "Heavy snow", icon: "❄️" },
  77: { text: "Snow grains", icon: "❄️" },
  80: { text: "Rain showers", icon: "🌦️" },
  81: { text: "Rain showers", icon: "🌦️" },
  82: { text: "Heavy rain showers", icon: "🌦️" },
  85: { text: "Snow showers", icon: "❄️" },
  86: { text: "Heavy snow showers", icon: "❄️" },
  95: { text: "Thunderstorm", icon: "⛈️" },
  96: { text: "Thunderstorm with hail", icon: "⛈️" },
  99: { text: "Thunderstorm with hail", icon: "⛈️" }
};

// Runs when the user clicks Search or presses Enter
form.addEventListener("submit", function (event) {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city === "") return;
  getWeather(city);
});

// Quick city buttons: fill the input and search
cityButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    const city = button.dataset.city;   // reads data-city from the HTML
    cityInput.value = city;
    getWeather(city);
  });
});

// Main function: gets the weather using the Fetch API
async function getWeather(city) {
  errorBox.classList.add("d-none");
  result.classList.add("d-none");
  loader.classList.remove("d-none");
  searchBtn.disabled = true;

  try {
    // Step 1: find the latitude and longitude of the city
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geoResponse = await fetch(geoUrl);

    if (!geoResponse.ok) {
      throw new Error("Could not search for the city. Try again later.");
    }

    const geoData = await geoResponse.json();

    if (!geoData.results) {
      throw new Error("City not found. Please check the spelling.");
    }

    const place = geoData.results[0];

    // Step 2: get the current weather (is_day tells us if it is day or night)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m`;
    const weatherResponse = await fetch(weatherUrl);

    if (!weatherResponse.ok) {
      throw new Error("Could not get weather data. Try again later.");
    }

    const weatherData = await weatherResponse.json();
    showWeather(place, weatherData.current);

    // Remember this city for next time
    localStorage.setItem("lastCity", city);

  } catch (error) {
    if (error.message === "Failed to fetch") {
      errorBox.textContent = "Network error. Check your internet connection.";
    } else {
      errorBox.textContent = error.message;
    }
    errorBox.classList.remove("d-none");
  } finally {
    loader.classList.add("d-none");
    searchBtn.disabled = false;
  }
}

// Shows the data on the page
function showWeather(place, current) {
  const info = weatherCodes[current.weather_code] || { text: "Weather data available", icon: "🌡️" };

  weatherIcon.textContent = current.is_day === 0 && current.weather_code <= 1 ? "🌙" : info.icon;
  cityName.textContent = `${place.name}, ${place.country}`;
  temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
  description.textContent = info.text;
  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  wind.textContent = `${current.wind_speed_10m} km/h`;

  document.body.className = document.body.className.replace(/sky-\S+/, getSky(current.weather_code, current.is_day));
  result.classList.remove("d-none");
}

// Chooses the background class based on the weather
function getSky(code, isDay) {
  if (isDay === 0) return "sky-night";
  if (code >= 95) return "sky-storm";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "sky-snow";
  if (code >= 51) return "sky-rain";
  if (code >= 3) return "sky-cloudy";
  return "sky-clear";
}

// When the page opens, show the last searched city (if there is one)
const savedCity = localStorage.getItem("lastCity");
if (savedCity) {
  cityInput.value = savedCity;
  getWeather(savedCity);
}