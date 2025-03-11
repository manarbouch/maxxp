document.addEventListener("DOMContentLoaded", function () {
    // Chart.js Configurations
    const barCtx = document.getElementById("barChart").getContext("2d");
    const lineCtx = document.getElementById("lineChart").getContext("2d");

    new Chart(barCtx, {
        type: "bar",
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"],
            datasets: [{
                label: "Monthly Data",
                data: [250, 400, 350, 700, 900, 200, 500, 650, 800],
                backgroundColor: "#c47f2f",
            }]
        }
    });

    new Chart(lineCtx, {
        type: "line",
        data: {
            labels: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
            datasets: [{
                label: "Trends",
                data: [5, 7, 3, 10, 6, 8, 9, 4, 6],
                borderColor: "#f39c12",
                backgroundColor: "rgba(243, 156, 18, 0.2)",
                fill: true
            }]
        }
    });

    // Profile Icon Click Event
    const profileIcon = document.querySelector(".profile-icon");
    profileIcon.addEventListener("click", function () {
        window.location.href = "profile.html";
    });

    // Fetch Weather Data
    async function fetchWeather() {
        const apiKey = "c15559a110e64d6ae5779cced13242d2"; // Replace with your OpenWeatherMap API key
        const city = "New York"; // Change to your preferred location
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            // Extract weather details
            const temperature = Math.round(data.main.temp);
            const description = data.weather[0].description;
            const icon = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

            // Update the weather display
            document.getElementById("temperature").textContent = `${temperature}°C`;
            document.getElementById("weather-description").textContent = description;
            document.getElementById("weather-icon").src = icon;
            document.getElementById("weather-icon").style.display = "block";
        } catch (error) {
            console.error("Error fetching weather data:", error);
            document.getElementById("weather-description").textContent = "Weather unavailable";
        }
    }

    // Call weather function when page loads
    fetchWeather();
});
