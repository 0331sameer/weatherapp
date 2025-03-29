const API_KEY = "b1b15e88fa797225412429c1c50c122a1";

document.addEventListener("DOMContentLoaded", function () {
  // Set default city to London when the page loads
  fetchWeatherData("London");
});

const weatherBackgroundMap = {
  0: "images/default.jpg",
  1: "images/clear.jpg",
  2: "images/thunderstorm.jpg",
  3: "images/drizzle.jpg",
  5: "images/rain.jpg",
  6: "images/snow.jpg",
  7: "images/mist.jpg",
  8: "images/cloud.jpg",
};

function searchToggle(obj, evt) {
  var container = $(obj).closest(".search-wrapper");

  if (!container.hasClass("active")) {
    container.addClass("active");
    evt.preventDefault();
  } else if (
    container.hasClass("active") &&
    $(obj).closest(".input-holder").length == 0
  ) {
    container.removeClass("active");
    container.find(".search-input").val("");
    container.find(".result-container").fadeOut(100, function () {
      $(this).empty();
    });
  }
}

function submitFn(obj, evt) {
  const value = $(obj).find(".search-input").val().trim();

  if (!value.length) {
    _html = "Please enter a city name.";
    $(obj)
      .find(".result-container")
      .html("<span>" + _html + "</span>");
    $(obj).find(".result-container").fadeIn(100);
  } else {
    fetchWeatherData(value);
  }
  evt.preventDefault();
}

function fetchWeatherData(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`;

  fetch(url)
    .then((response) => response.json())
    .then(async (data) => {
      if (data.cod === 200) {
        document.getElementById(
          "cityName"
        ).textContent = `${data.name}, ${data.sys.country}`;
        document.getElementById(
          "temperature"
        ).textContent = `${data.main.temp} °C`;
        document.getElementById(
          "conditions"
        ).textContent = `Conditions: ${data.weather[0].description}`;
        document.getElementById(
          "humidity"
        ).textContent = `Humidity: ${data.main.humidity}%`;
        document.getElementById(
          "windSpeed"
        ).textContent = `Wind Speed: ${data.wind.speed} m/s`;
        document.querySelector(".result-container").innerHTML = "";
        document.getElementById(
          "city"
        ).textContent = `5-Day Weather Forecast of ${data.name}, ${data.sys.country}`;
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        document.getElementById("temperatureIcon").src = iconUrl;
        let bgid = Math.floor(data.weather[0].id / 100);
        if (data.weather[0].id === 800) {
          bgid = 1;
        }
        const backgroundImageUrl = weatherBackgroundMap[bgid];
        if (backgroundImageUrl) {
          document.getElementById(
            "weatherInfo"
          ).style.backgroundImage = `url(${backgroundImageUrl})`;
          document.getElementById("weatherInfo").style.backgroundSize = "cover";
          document.getElementById("weatherInfo").style.backgroundPosition =
            "center";
        } else {
          console.error("Invalid condition ID:", conditionId);
        }
        document.getElementById("temperatureIcon").src = iconUrl;

        const lon = data.coord.lon;
        const lat = data.coord.lat;

        // console.log(lat, lon);

        const weatherData = await charts(lat, lon);
        const { averageTemperatures, weatherConditions } =
          processWeatherData(weatherData);

        renderBarChart(averageTemperatures);
        renderDoughnutChart(weatherConditions);
        renderLineChart(averageTemperatures);
        renderTable(temperatureTimeDate, 1);
      } else {
        const errorMessage = "City not found. Please try again!";
        document.querySelector(
          ".result-container"
        ).innerHTML = `<span>${errorMessage}</span>`;
        document.querySelector(".result-container").style.display = "block";
      }
    })
    .catch((error) => {
      console.error("Error fetching weather data:", error);
      const errorMessage = "Error fetching data. Please try again later!";
      document.querySelector(
        ".result-container"
      ).innerHTML = `<span>${errorMessage}</span>`;
      document.querySelector(".result-container").style.display = "block";
    });
}

async function charts(lat, lon) {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

let temperatureTimeDate = {};

const processWeatherData = (data) => {
  temperatureTimeDate = {};
  const temperatures = {};
  const weatherConditions = {};
  const daysCount = {};
  data.list.forEach((item) => {
    const date = new Date(item.dt_txt).toLocaleDateString();
    const time = new Date(item.dt_txt).toLocaleTimeString();
    const temp = item.main.temp;
    //console.log(`Date: ${date}, Temperature: ${temp}°C`);
    // console.log(`Date: ${time}, Temperature: ${date}°C`);
    if (!temperatures[date]) {
      temperatures[date] = [];
      daysCount[date] = 0;
    }

    temperatures[date].push(temp);
    daysCount[date]++;

    let condition;
    item.weather.forEach((weather) => {
      const main = (condition = weather.main);
      weatherConditions[main] = (weatherConditions[main] || 0) + 1;
      // console.log(`Date: ${date}, Conditions: ${main}`);
    });

    if (!temperatureTimeDate[date]) {
      temperatureTimeDate[date] = [];
    }

    temperatureTimeDate[date].push({ time, temp, condition });
  });

  let averageTemperatures = {};

  for (let date in temperatures) {
    const average =
      temperatures[date].reduce((a, b) => a + b, 0) / daysCount[date];
    averageTemperatures[date] = average;
    // console.log(`Date: ${date}, Average Temperature: ${average}°C`);
  }

  return { averageTemperatures, weatherConditions };
};

let barChartInstance = null;

const resetCanvas = (canvasId) => {
  const canvasWrapper = document.getElementById(canvasId).parentNode;
  document.getElementById(canvasId).remove();
  const newCanvas = document.createElement("canvas");
  newCanvas.setAttribute("id", canvasId);
  canvasWrapper.appendChild(newCanvas);
};

const renderBarChart = (averageTemperatures) => {
  resetCanvas("barChart");
  const ctx = document.getElementById("barChart").getContext("2d");
  const temperatures = Object.values(averageTemperatures);
  barChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: Object.keys(averageTemperatures),
      datasets: [
        {
          label: "Average Temperature (°C)",
          data: temperatures,
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.9)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 2,
          borderRadius: 10,
          hoverBackgroundColor: "rgba(255, 99, 132, 0.8)",
          hoverBorderColor: "rgba(255, 99, 132, 1)",
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      scales: {
        y: {
          grid: {
            display: true,
            drawBorder: false,
          },
        },
      },
    },
  });
};

const renderDoughnutChart = (weatherConditions) => {
  resetCanvas("doughnutChart");
  const ctx = document.getElementById("doughnutChart").getContext("2d");

  new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(weatherConditions),
      datasets: [
        {
          data: Object.values(weatherConditions),
          backgroundColor: [
            "rgba(255, 99, 132, 0.5)",
            "rgba(54, 162, 235, 0.7)",
            "rgba(255, 206, 86, 0.9)",
            "rgba(75, 192, 192, 0.6)",
            "rgba(153, 102, 255, 0.8)",
          ],
          borderColor: [
            "rgba(255, 99, 132, 1)",
            "rgba(54, 162, 235, 1)",
            "rgba(255, 206, 86, 1)",
            "rgba(75, 192, 192, 1)",
            "rgba(153, 102, 255, 1)",
          ],
          borderWidth: 2,
          hoverBackgroundColor: "rgba(75, 192, 192, 0.8",
          hoverBorderColor: "rgba(75, 192, 192, 1",
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
    },
  });
};

const renderLineChart = (averageTemperatures) => {
  resetCanvas("lineChart");
  const ctx = document.getElementById("lineChart").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: Object.keys(averageTemperatures),
      datasets: [
        {
          label: "Temperature Change (°C)",
          data: averageTemperatures,
          fill: false,
          borderColor: "rgba(75, 192, 192, 1)",
          tension: 0.1,
        },
      ],
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
    },
  });
};

filtersButton = "Reset";

document.getElementById("highestBtn").addEventListener("click", () => {
  filtersButton = "Highest";
  renderTable(temperatureTimeDate, 1);
});

document.getElementById("ascendingBtn").addEventListener("click", () => {
  filtersButton = "Ascending";
  renderTable(temperatureTimeDate, 1);
});

document.getElementById("descendingBtn").addEventListener("click", () => {
  filtersButton = "Descending";
  renderTable(temperatureTimeDate, 1);
});

document.getElementById("rainbtn").addEventListener("click", () => {
  filtersButton = "Rain";
  renderTable(temperatureTimeDate, 1);
});

document.getElementById("resetbtn").addEventListener("click", () => {
  filtersButton = "Reset";
  renderTable(temperatureTimeDate, 1);
});

const renderTable = (temperatureTimeDate, pageNumber) => {
  const tableBody = document.querySelector("#forecastBody");
  tableBody.innerHTML = ""; // Clear the table

  let temperatureTimeDate2 = [];

  // Filter logic based on the selected filter
  if (filtersButton === "Highest") {
    let highestEntry = null;

    // Loop through all entries to find the one with the highest temperature
    for (let date in temperatureTimeDate) {
      temperatureTimeDate[date].forEach((entry) => {
        if (!highestEntry || entry.temp > highestEntry.temp) {
          highestEntry = {
            date: date,
            time: entry.time,
            temp: entry.temp,
            condition: entry.condition,
          };
        }
      });
    }

    // Set temperatureTimeDate2 to an array containing just the highest entry
    if (highestEntry) {
      temperatureTimeDate2 = [highestEntry]; // This will be an array with a single element
    }
    temperatureTimeDate2.forEach((entry) => {
      const row = document.createElement("tr");

      const dateCell = document.createElement("td");
      dateCell.textContent = entry.date;
      row.appendChild(dateCell);

      const timeCell = document.createElement("td");
      timeCell.textContent = entry.time;
      row.appendChild(timeCell);

      const tempCell = document.createElement("td");
      tempCell.textContent = `${entry.temp} °C`;
      row.appendChild(tempCell);

      const conditionCell = document.createElement("td");
      conditionCell.textContent = entry.condition;
      row.appendChild(conditionCell);

      tableBody.appendChild(row);
    });
  } else if (filtersButton === "Ascending") {
    let allEntries = [];

    for (let date in temperatureTimeDate) {
      temperatureTimeDate[date].forEach((entry) => {
        allEntries.push({
          date: date,
          time: entry.time,
          temp: entry.temp,
          condition: entry.condition,
        });
      });
    }

    allEntries.sort((a, b) => a.temp - b.temp);

    temperatureTimeDate2 = allEntries;
  } else if (filtersButton === "Descending") {
    let allEntries = [];

    for (let date in temperatureTimeDate) {
      temperatureTimeDate[date].forEach((entry) => {
        allEntries.push({
          date: date,
          time: entry.time,
          temp: entry.temp,
          condition: entry.condition,
        });
      });
    }

    allEntries.sort((a, b) => b.temp - a.temp);

    temperatureTimeDate2 = allEntries;
  } else if (filtersButton === "Rain") {
    let rainEntries = [];

    // Loop through all entries and find those with the rain condition
    for (let date in temperatureTimeDate) {
      temperatureTimeDate[date].forEach((entry) => {
        if (entry.condition.toLowerCase() === "rain") {
          // Check if the condition is rain
          rainEntries.push({
            date: date,
            time: entry.time,
            temp: entry.temp,
            condition: entry.condition,
          });
        }
      });
    }

    // Sort the rain entries by temperature in descending order
    rainEntries.sort((a, b) => b.temp - a.temp);

    // Set temperatureTimeDate2 to the sorted rain entries
    temperatureTimeDate2 = rainEntries;
  } else {
    temperatureTimeDate2 = [];

    // Loop through all entries and add them back to temperatureTimeDate2
    for (let date in temperatureTimeDate) {
      temperatureTimeDate[date].forEach((entry) => {
        temperatureTimeDate2.push({
          date: date,
          time: entry.time,
          temp: entry.temp,
          condition: entry.condition,
        });
      });
    }
  }

  const entriesPerPage = 10;
  const startIndex = (pageNumber - 1) * entriesPerPage;

  const endIndex = Math.min(
    startIndex + entriesPerPage,
    temperatureTimeDate2.length - 1
  );

  // for (let i = 0; i < temperatureTimeDate2.length; i++) {
  //     entry = temperatureTimeDate2[i];
  //     console.log(entry.temp)
  // }

  // Pagination logic
  // const entriesPerPage = 10;
  // // const entries = [];
  // // for (let date in temperatureTimeDate2) {
  // //     temperatureTimeDate2[date].forEach(entry => {
  // //         entries.push({
  // //             date: date,
  // //             time: entry.time,
  // //             temp: entry.temp,
  // //             condition: entry.condition
  // //         });
  // //     });
  // // }
  // const startIndex = (pageNumber - 1) * entriesPerPage;
  // const endIndex = Math.min(startIndex + entriesPerPage, entries.length);

  // console.log('xxxxxxxxxxxxx')
  // Render the table rows
  for (
    let i = startIndex;
    i < endIndex && i < temperatureTimeDate2.length;
    i++
  ) {
    const entry = temperatureTimeDate2[i];
    console.log(entry);
    const row = document.createElement("tr");

    const dateCell = document.createElement("td");
    dateCell.textContent = entry.date;
    row.appendChild(dateCell);

    const timeCell = document.createElement("td");
    timeCell.textContent = entry.time;
    row.appendChild(timeCell);

    const tempCell = document.createElement("td");
    tempCell.textContent = `${entry.temp} °C`;
    row.appendChild(tempCell);

    const conditionCell = document.createElement("td");
    conditionCell.textContent = entry.condition;
    row.appendChild(conditionCell);

    tableBody.appendChild(row);
  }
};

const startBtn = document.querySelector("#startBtn"),
  endBtn = document.querySelector("#endBtn"),
  prevNext = document.querySelectorAll(".prevNext"),
  numbers = document.querySelectorAll(".link");

let currentStep = 0;

const updateBtn = () => {
  if (currentStep === 3) {
    endBtn.disabled = true;
    prevNext[1].disabled = true;
  } else if (currentStep === 0) {
    startBtn.disabled = true;
    prevNext[0].disabled = true;
  } else {
    endBtn.disabled = false;
    prevNext[1].disabled = false;
    startBtn.disabled = false;
    prevNext[0].disabled = false;
  }
};

numbers.forEach((number, numIndex) => {
  number.addEventListener("click", (e) => {
    e.preventDefault();
    currentStep = numIndex;
    renderTable(temperatureTimeDate, currentStep + 1);
    document.querySelector(".active").classList.remove("active");
    number.classList.add("active");
    updateBtn();
  });
});

prevNext.forEach((button) => {
  button.addEventListener("click", (e) => {
    currentStep += e.target.id === "next" ? 1 : -1;
    renderTable(temperatureTimeDate, currentStep + 1);
    numbers.forEach((number, numIndex) => {
      number.classList.toggle("active", numIndex === currentStep);
      updateBtn();
    });
  });
});

startBtn.addEventListener("click", () => {
  document.querySelector(".active").classList.remove("active");
  numbers[0].classList.add("active");
  currentStep = 0;
  renderTable(temperatureTimeDate, currentStep + 1);
  updateBtn();
  endBtn.disabled = false;
  prevNext[1].disabled = false;
});

endBtn.addEventListener("click", () => {
  document.querySelector(".active").classList.remove("active");
  numbers[3].classList.add("active");
  currentStep = 3;
  renderTable(temperatureTimeDate, currentStep + 1);
  updateBtn();
  startBtn.disabled = false;
  prevNext[0].disabled = false;
});

document.addEventListener("DOMContentLoaded", function () {
  const dashboardLinkButton = document.getElementById("Dashboard");
  const tableLinkButton = document.getElementById("Tables");
  const main1 = document.getElementById("main-1");
  const main2 = document.getElementById("main-2");

  dashboardLinkButton.addEventListener("click", function (event) {
    event.preventDefault();
    main1.style.display = "flex";
    main2.style.display = "none";
  });

  tableLinkButton.addEventListener("click", function (event) {
    event.preventDefault();
    main1.style.display = "none";
    main2.style.display = "flex";
  });
});

function handleUserInput() {
  const userInput = document.getElementById("userInput").value;
  addMessageToChat("User: " + userInput);
  document.getElementById("userInput").value = ""; // Clear input

  // Determine the response based on user input
  const response = getWeatherResponse(userInput);
  addMessageToChat("Bot: " + response);
}

// Function to add message to chat
function addMessageToChat(message) {
  const chatbox = document.getElementById("chatbox");
  chatbox.innerHTML += message + "<br>";
  chatbox.scrollTop = chatbox.scrollHeight;
}

// Function to get weather response based on user input
function getWeatherResponse(input) {
  const dateMatch = input.match(/(\d{2}\/\d{2}\/\d{4})/); // Match date in DD/MM/YYYY format
  const date = dateMatch ? dateMatch[1] : null;

  console.log(date);

  if (input.toLowerCase().includes("current temperature")) {
    return getCurrentTemperature(date);
  } else if (input.toLowerCase().includes("highest temperature")) {
    return getHighestTemperature(date);
  } else if (input.toLowerCase().includes("lowest temperature")) {
    return getLowestTemperature(date);
  } else if (input.toLowerCase().includes("average temperature")) {
    return getAverageTemperature(date);
  } else if (
    input.toLowerCase().includes("time of") &&
    input.toLowerCase().includes("rain")
  ) {
    return getTimeOfWeatherCondition(date, "Rain");
  } else if (
    input.toLowerCase().includes("time of") &&
    input.toLowerCase().includes("cloud")
  ) {
    return getTimeOfWeatherCondition(date, "Cloudy");
  } else if (
    input.toLowerCase().includes("time of") &&
    input.toLowerCase().includes("drizzle")
  ) {
    return getTimeOfWeatherCondition(date, "Drizzle");
  } else if (
    input.toLowerCase().includes("time of") &&
    input.toLowerCase().includes("thunderstorm")
  ) {
    return getTimeOfWeatherCondition(date, "Thunderstorm");
  } else {
    return "Sorry, I didn't understand that. Please ask about the current temperature, highest temperature, lowest temperature, or average temperature.";
  }
}

// Functions to get weather information
function getCurrentTemperature(date) {
  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  const weatherData = temperatureTimeDate[date || today];
  return weatherData && weatherData.length > 0
    ? weatherData[weatherData.length - 1].temp + "°C"
    : "No data available.";
}

function getHighestTemperature(date) {
  const weatherData = temperatureTimeDate[date];
  if (!weatherData || weatherData.length === 0) return "No data available.";
  const highestTemp = Math.max(...weatherData.map((data) => data.temp));
  return highestTemp + "°C";
}

function getLowestTemperature(date) {
  const weatherData = temperatureTimeDate[date];
  if (!weatherData || weatherData.length === 0) return "No data available.";
  const lowestTemp = Math.min(...weatherData.map((data) => data.temp));
  return lowestTemp + "°C";
}

function getAverageTemperature(date) {
  const weatherData = temperatureTimeDate[date];
  if (!weatherData || weatherData.length === 0) return "No data available.";
  const averageTemp =
    weatherData.reduce((sum, data) => sum + data.temp, 0) / weatherData.length;
  return averageTemp.toFixed(2) + "°C";
}

function getTimeOfWeatherCondition(date, condition) {
  const weatherData = temperatureTimeDate[date];
  if (!weatherData || weatherData.length === 0) return "No data available.";
  const times = weatherData
    .filter((data) => data.condition.toLowerCase() === condition.toLowerCase())
    .map((data) => data.time);
  return times.length > 0
    ? "It will be " + condition + " at: " + times.join(", ")
    : "No " + condition + " data available.";
}

document.getElementById("sendBtn").addEventListener("click", handleUserInput);

document
  .getElementById("userInput")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      handleUserInput();
    }
  });

crossBtn = document.getElementById("crossBtn");
commentBtn = document.getElementById("commentBtn");

crossBtn.addEventListener("click", function () {
  document.getElementById("chatbot-popup").style.display = "none";
  document.getElementById("comment-popup").style.display = "block";
});

commentBtn.addEventListener("click", function () {
  document.getElementById("chatbot-popup").style.display = "flex";
  document.getElementById("comment-popup").style.display = "none";
});
