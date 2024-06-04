document.addEventListener('DOMContentLoaded', function() {
    const apiKey = '7efa96c592d8951a08334f3971e9d120';

    const searchForm = document.getElementById('searchForm');
    const cityInput = document.getElementById('cityInput');
    const locationBtn = document.getElementById('locationBtn');
    const forecastContainer = document.getElementById('forecastContainer');
    const currentWeatherContainer = document.getElementById('currentWeatherContainer');
    const errorContainer = document.getElementById('errorContainer');
    const loadingContainer = document.getElementById('loadingContainer');
    const forecastHeading = document.getElementById('forecastHeading');
    const recentCitiesContainer = document.getElementById('recentCitiesContainer');
    const recentCitiesDropdown = document.getElementById('recentCities');

    // Initial message
    currentWeatherContainer.innerHTML = '<p>Weather data will be displayed here...</p>';

    // Load recent cities from local storage
    loadRecentCities();

    // Event listener for form submission
    searchForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const city = cityInput.value.trim();
        if (city !== '') {
            getWeatherForecast(city);
        }
    });

    // Event listener for location button
    locationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                getWeatherForecastByCoordinates(latitude, longitude);
            }, function(error) {
                displayError('Error getting current location. Please try again or search by city.');
            });
        } else {
            displayError('Geolocation is not supported by this browser.');
        }
    });

    // Event listener for recent cities dropdown
    recentCitiesDropdown.addEventListener('change', function() {
        const city = recentCitiesDropdown.value;
        if (city) {
            getWeatherForecast(city);
        }
    });

    // Fetch weather data by city name
    function getWeatherForecast(city) {
        showLoading();
        fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`)
            .then(handleResponse)
            .then(data => {
                displayWeather(data);
                saveRecentCity(city);
            })
            .catch(handleError);
    }

    // Fetch weather data by coordinates
    function getWeatherForecastByCoordinates(latitude, longitude) {
        showLoading();
        fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`)
            .then(handleResponse)
            .then(displayWeather)
            .catch(handleError);
    }

    // Handle API response
    function handleResponse(response) {
        if (!response.ok) {
            hideLoading();
            if (response.status === 404) {
                throw new Error('City not found');
            } else {
                throw new Error('Network response was not ok');
            }
        }
        return response.json();
    }

    // Handle errors
    function handleError(error) {
        hideLoading();
        displayError('Error fetching weather data: ' + error.message);
        console.error('Error fetching weather data:', error);
    }

    // Display weather data
    function displayWeather(data) {
        clearError();
        hideLoading();
        const cityName = data.city.name;
        const currentWeather = data.list[0];
        const currentTemperature = currentWeather.main.temp;
        const currentWeatherDescription = currentWeather.weather[0].description;
        const currentWeatherIcon = currentWeather.weather[0].icon;
        const currentWindSpeed = currentWeather.wind.speed;
        const currentHumidity = currentWeather.main.humidity;

        // Get the current date and day
        const currentDate = new Date();
        const currentDayName = getDayName(currentDate.getDay());
        const currentDateString = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        currentWeatherContainer.innerHTML = `
            <div class="font-bold text-xl mb-2">${cityName}</div>
            <div class="text-lg mb-2">${currentDayName}, ${currentDateString}</div>
            <div class="flex items-center mb-2">
                <img src="https://openweathermap.org/img/w/${currentWeatherIcon}.png" alt="${currentWeatherDescription}" class="w-12 h-12 mr-4">
                <span class="text-lg">${currentWeatherDescription}</span>
            </div>
            <div class="text-lg">Temperature: ${currentTemperature}°C</div>
            <div class="text-lg">Wind Speed: ${currentWindSpeed} m/s</div>
            <div class="text-lg">Humidity: ${currentHumidity}%</div>
        `;

        forecastContainer.innerHTML = ''; // Clear previous forecasts

        // Display 5-day forecast at 24-hour intervals
        for (let i = 0; i < data.list.length; i += 8) {
            const forecast = data.list[i];
            const forecastDate = new Date(forecast.dt * 1000);
            const forecastDay = getDayName(forecastDate.getDay());
            const forecastTemperature = forecast.main.temp;
            const forecastWeatherDescription = forecast.weather[0].description;
            const forecastWeatherIcon = forecast.weather[0].icon;
            const forecastWindSpeed = forecast.wind.speed;
            const forecastHumidity = forecast.main.humidity;

            const forecastElement = document.createElement('div');
            forecastElement.classList.add('forecast-item', 'bg-white', 'rounded', 'p-4', 'shadow-md');
            forecastElement.innerHTML = `
                <div class="font-bold">${forecastDay}</div>
                <div>${forecastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                <div class="flex items-center">
                    <img src="https://openweathermap.org/img/w/${forecastWeatherIcon}.png" alt="${forecastWeatherDescription}" class="w-8 h-8 mr-2">
                    <span>${forecastWeatherDescription}</span>
                </div>
                <div class="mt-2">Temperature: ${forecastTemperature}°C</div>
                <div class="mt-2">Wind Speed: ${forecastWindSpeed} m/s</div>
                <div class="mt-2">Humidity: ${forecastHumidity}%</div>
            `;
            forecastContainer.appendChild(forecastElement);
        }

        // Show the forecast heading
        forecastHeading.classList.remove('hidden');
    }

    // Get day name from day index
    function getDayName(dayIndex) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[dayIndex];
    }

    // Show loading indicator
    function showLoading() {
        currentWeatherContainer.innerHTML = '<p>Loading...</p>';
    }

    // Hide loading indicator
    function hideLoading() {
        currentWeatherContainer.innerHTML = '';
    }

    // Display error message
    function displayError(message) {
        errorContainer.innerHTML = message;
        errorContainer.classList.remove('hidden');
    }

    // Clear error message
    function clearError() {
        errorContainer.innerHTML = '';
        errorContainer.classList.add('hidden');
    }

    // Load recent cities from local storage
    function loadRecentCities() {
        const recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
        if (recentCities.length > 0) {
            recentCitiesContainer.classList.remove('hidden');
            recentCitiesDropdown.innerHTML = recentCities.map(city => `<option value="${city}">${city}</option>`).join('');
        }
    }

    // Save recent city to local storage
    function saveRecentCity(city) {
        let recentCities = JSON.parse(localStorage.getItem('recentCities')) || [];
        if (!recentCities.includes(city)) {
            recentCities.push(city);
            if (recentCities.length > 5) {
                recentCities.shift(); // Keep only the last 5 recent cities
            }
            localStorage.setItem('recentCities', JSON.stringify(recentCities));
            loadRecentCities();
        }
    }
});
