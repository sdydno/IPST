document.addEventListener("DOMContentLoaded", function () {
  // ID Гугл таблицы
  var SHEET_ID =
    "2PACX-1vTKOLQ6_-_BafhY1dZaLwgj7P_3TMlPCJaAR94NpCgEMw8bkbiVruIGeelIlx0xr9QUdYUDvPm2lTvh";
  var URL = "https://docs.google.com/spreadsheets/d/e/" + SHEET_ID + "/pub?output=csv";

  var track = document.querySelector(".slider-track");
  var loader = document.querySelector(".loader");
  var sliderContainer = document.querySelector(".tenant-slider-container");
  var sliderNav = document.querySelector(".slider-nav");
  var SLIDE_INTERVAL = 10000;

  if (track) track.style.display = "none";
  if (sliderNav) sliderNav.style.display = "none";

  // Загрузка данных
  fetch(URL)
    .then(function (response) {
      if (!response.ok) throw new Error("Ошибка сети при загрузке данных.");
      return response.text();
    })
    .then(function (csvText) {
      var data = parseCSV(csvText);
      var slidesData = groupDataBySlide(data);
      createSlides(slidesData);
      createNavigationDots(slidesData);
      initializeSlider();
    })
    .catch(function (error) {
      console.error("Не удалось загрузить данные:", error);
      if (loader) loader.textContent = "Ошибка загрузки данных.";
    })
    .then(function () {
      if (loader) loader.style.display = "none";
      if (track) track.style.display = "flex";
      if (sliderNav) sliderNav.style.display = "flex";
    });

  // Парсер CSV
  function parseCSV(text) {
    var rows = text.split(/\r\n|\n/).slice(1);
    var result = [];

    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      if (!row) continue;

      var values = [];
      var current = "";
      var insideQuotes = false;

      for (var i = 0; i < row.length; i++) {
        var char = row[i];
        if (char === '"') {
          if (insideQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            insideQuotes = !insideQuotes;
          }
        } else if (char === "," && !insideQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      if (values.length >= 3 && values[0] && values[1]) {
        result.push({
          slide: values[0].trim(),
          tenantName: values[1].trim(),
          floor: values[2].trim()
        });
      }
    }
    return result;
  }

  // Группировка
  function groupDataBySlide(data) {
    var slides = {};
    for (var i = 0; i < data.length; i++) {
      var item = data[i];
      var slideNum = item.slide;
      if (!slides[slideNum]) slides[slideNum] = [];
      slides[slideNum].push({
        name: item.tenantName,
        floor: item.floor || "Не указан"
      });
    }
    return slides;
  }

  // Создание слайдов
  function createSlides(slidesData) {
    if (!track) return;
    track.innerHTML = "";
    var keys = Object.keys(slidesData);

    for (var k = 0; k < keys.length; k++) {
      var slideNum = keys[k];
      var slideDiv = document.createElement("div");
      slideDiv.className = "slide";

      var table = document.createElement("table");
      table.className = "tenant-table";
      var tbody = document.createElement("tbody");

      var tenants = slidesData[slideNum];
      for (var t = 0; t < tenants.length; t++) {
        var tenant = tenants[t];
        var row = document.createElement("tr");

        var tdName = document.createElement("td");
        tdName.className = "tenant-name";
        tdName.textContent = tenant.name;

        var tdFloor = document.createElement("td");
        tdFloor.className = "tenant-floor";
        tdFloor.textContent = tenant.floor;

        row.appendChild(tdName);
        row.appendChild(tdFloor);
        tbody.appendChild(row);
      }

      table.appendChild(tbody);
      slideDiv.appendChild(table);
      track.appendChild(slideDiv);
    }
  }

  // Создание точек навигации
  function createNavigationDots(slidesData) {
    if (!sliderNav) return;
    sliderNav.innerHTML = "";
    var slideCount = Object.keys(slidesData).length;
    if (slideCount <= 1) return;

    for (var i = 0; i < slideCount; i++) {
      var dot = document.createElement("div");
      dot.className = "slider-dot";
      sliderNav.appendChild(dot);
    }
  }

  // Инициализация слайдера
  function initializeSlider() {
    var slides = Array.prototype.slice.call(track.children);
    var dots = Array.prototype.slice.call(sliderNav.children);

    if (slides.length <= 1) {
      if (slides[0]) slides[0].classList.add("is-active");
      if (sliderNav) sliderNav.style.display = "none";
      return;
    }

    var currentIndex = 0;
    var slideInterval;

    function moveToSlide(targetIndex) {
      if (targetIndex < 0) targetIndex = slides.length - 1;
      if (targetIndex >= slides.length) targetIndex = 0;

      var slideWidth = slides[0].getBoundingClientRect().width;
      if (!slideWidth) return;

      track.style.transform = "translateX(-" + (slideWidth * targetIndex) + "px)";

      slides[currentIndex].classList.remove("is-active");
      slides[targetIndex].classList.add("is-active");

      if (dots.length) {
        for (var d = 0; d < dots.length; d++) {
          if (d === targetIndex) {
            dots[d].classList.add("active");
          } else {
            dots[d].classList.remove("active");
          }
        }
      }

      currentIndex = targetIndex;
    }

    function nextSlide() {
      moveToSlide(currentIndex + 1);
    }

    function startSlider() {
      slideInterval = setInterval(nextSlide, SLIDE_INTERVAL);
    }

    function stopSlider() {
      clearInterval(slideInterval);
    }

    for (var i = 0; i < dots.length; i++) {
      (function (index) {
        dots[index].addEventListener("click", function () {
          moveToSlide(index);
        });
      })(i);
    }

    if (sliderContainer) {
      sliderContainer.addEventListener("mouseenter", stopSlider);
      sliderContainer.addEventListener("mouseleave", startSlider);
    }

    window.addEventListener("resize", function () {
      track.style.transition = "none";
      moveToSlide(currentIndex);
      track.offsetHeight;
      track.style.transition = "transform 0.3s ease-in-out";
    });

    slides[0].classList.add("is-active");
    if (dots[0]) dots[0].classList.add("active");
    startSlider();
  }
});

// Исправленные электронные часы
function digitalClock() {
  var date = new Date();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();

  if (hours < 10) hours = "0" + hours;
  if (minutes < 10) minutes = "0" + minutes;
  if (seconds < 10) seconds = "0" + seconds;

  var clockEl = document.getElementById("id_clock");
  if (clockEl) {
    clockEl.textContent = hours + ":" + minutes + ":" + seconds;
  }
  setTimeout(digitalClock, 1000);
}
digitalClock();

// Курсы валют
function fetchRates() {
  fetch("https://open.er-api.com/v6/latest/KZT")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      if (data && data.rates) {
        document.getElementById("usd").innerText = (1 / data.rates.USD).toFixed(2);
        document.getElementById("eur").innerText = (1 / data.rates.EUR).toFixed(2);
        document.getElementById("rub").innerText = (1 / data.rates.RUB).toFixed(2);
      }
    })
    .catch(function (error) {
      console.error("Ошибка валют:", error);
      document.getElementById("usd").innerText = "—";
      document.getElementById("eur").innerText = "—";
      document.getElementById("rub").innerText = "—";
    });
}
fetchRates();

// Перезагрузка страницы каждые 10 часов
setTimeout(function () {
  location.reload();
}, 10 * 60 * 60 * 1000);
