document.addEventListener("DOMContentLoaded", async () => {
  // ID Гугл таблицы
  const SHEET_ID =
    "2PACX-1vTHMZ6zDRciBsK1qpBsafc4cwUIbGF6DtAryE8Dw0zaJgC0Tf3ibH8DxhKDoYWpr-TmcGLM0igq1mnJ";
  const URL = `https://docs.google.com/spreadsheets/d/e/${SHEET_ID}/pub?output=csv`;

  const track = document.querySelector(".slider-track");
  const loader = document.querySelector(".loader");
  const sliderContainer = document.querySelector(".tenant-slider-container");
  const sliderNav = document.querySelector(".slider-nav");
  // Время слайда
  const SLIDE_INTERVAL = 10000;

  track.style.display = "none";
  sliderNav.style.display = "none";

  try {
    const response = await fetch(URL);
    if (!response.ok) throw new Error("Ошибка сети при загрузке данных.");
    const csvText = await response.text();
    const data = parseCSV(csvText);

    const slidesData = groupDataBySlide(data);
    createSlides(slidesData);
    createNavigationDots(slidesData);
    initializeSlider();
  } catch (error) {
    console.error("Не удалось загрузить или обработать данные:", error);
    loader.textContent = "Ошибка загрузки данных.";
  } finally {
    loader.style.display = "none";
    track.style.display = "flex";
    sliderNav.style.display = "flex";
  }

  function parseCSV(text) {
    const rows = text.split(/\r\n|\n/).slice(1);
    return rows
      .map((row) => {
        const values = [];
        let current = "";
        let insideQuotes = false;

        for (let i = 0; i < row.length; i++) {
          const char = row[i];

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
        if (values.length >= 3) {
          return {
            slide: values[0].trim(),
            tenantName: values[1].trim(),
            floor: values[2].trim(),
          };
        }
        return null;
      })
      .filter((item) => item && item.slide && item.tenantName);
  }

  function groupDataBySlide(data) {
    const slides = {};
    data.forEach((item) => {
      const slideNum = item.slide;
      if (!slides[slideNum]) slides[slideNum] = [];
      slides[slideNum].push({
        name: item.tenantName,
        floor: item.floor || "Не указан",
      });
    });
    return slides;
  }

  function createSlides(slidesData) {
    track.innerHTML = "";
    for (const slideNum in slidesData) {
      const slideDiv = document.createElement("div");
      slideDiv.className = "slide";
      const table = document.createElement("table");
      table.className = "tenant-table";
      const tbody = document.createElement("tbody");
      slidesData[slideNum].forEach((tenant) => {
        const row = document.createElement("tr");
        const tdName = document.createElement("td");
        tdName.className = "tenant-name";
        tdName.textContent = tenant.name;
        const tdFloor = document.createElement("td");
        tdFloor.className = "tenant-floor";
        tdFloor.textContent = tenant.floor;
        row.appendChild(tdName);
        row.appendChild(tdFloor);
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      slideDiv.appendChild(table);
      track.appendChild(slideDiv);
    }
  }

  function createNavigationDots(slidesData) {
    sliderNav.innerHTML = "";
    const slideCount = Object.keys(slidesData).length;
    if (slideCount <= 1) return;
    for (let i = 0; i < slideCount; i++) {
      const dot = document.createElement("div");
      dot.className = "slider-dot";
      sliderNav.appendChild(dot);
    }
  }

  function initializeSlider() {
    const slides = Array.from(track.children);
    const dots = Array.from(sliderNav.children);

    if (slides.length <= 1) {
      if (slides[0]) slides[0].classList.add("is-active");
      sliderNav.style.display = "none";
      return;
    }

    let currentIndex = 0;
    let slideInterval;

    const moveToSlide = (targetIndex) => {
      if (targetIndex < 0) targetIndex = slides.length - 1;
      if (targetIndex >= slides.length) targetIndex = 0;

      const slideWidth = slides[0]?.getBoundingClientRect().width;
      if (!slideWidth) return;

      track.style.transform = `translateX(-${slideWidth * targetIndex}px)`;

      slides[currentIndex].classList.remove("is-active");
      slides[targetIndex].classList.add("is-active");

      dots.forEach((dot, index) =>
        dot.classList.toggle("active", index === targetIndex)
      );

      currentIndex = targetIndex;
    };

    const nextSlide = () => moveToSlide(currentIndex + 1);
    const startSlider = () =>
      (slideInterval = setInterval(nextSlide, SLIDE_INTERVAL));
    const stopSlider = () => clearInterval(slideInterval);

    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => moveToSlide(index));
    });

    sliderContainer.addEventListener("mouseenter", stopSlider);
    sliderContainer.addEventListener("mouseleave", startSlider);

    window.addEventListener("resize", () => {
      track.style.transition = "none";
      moveToSlide(currentIndex);
      track.offsetHeight;
      track.style.transition = "transform 0.2s cubic-bezier(0.77, 0, 0.175, 1)";
    });

    slides[0].classList.add("is-active");
    dots[0].classList.add("active");
    startSlider();
  }
});

// Обновление времени
function digitalClock() {
  var date = new Date();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  var seconds = date.getSeconds();
  if (hours < 10) hours = "0" + hours;
  if (minutes < 10) minutes = "0" + minutes;
  if (seconds < 10) seconds = "0" + seconds;
  document.getElementById("id_clock").innerHTML =
    (hours - 1) + ":" + minutes + ":" + seconds;
  setTimeout(digitalClock, 1000);
}
digitalClock();

// Погода
!(function (d, s, id) {
  var js,
    fjs = d.getElementsByTagName(s)[0];
  if (!d.getElementById(id)) {
    js = d.createElement(s);
    js.id = id;
    js.src = "https://weatherwidget.io/js/widget.min.js";
    fjs.parentNode.insertBefore(js, fjs);
  }
})(document, "script", "weatherwidget-io-js");

// Валюта
async function fetchRates() {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/KZT");
    const data = await response.json();
    document.getElementById("usd").innerText = (1 / data.rates.USD).toFixed(2);
    document.getElementById("eur").innerText = (1 / data.rates.EUR).toFixed(2);
    document.getElementById("rub").innerText = (1 / data.rates.RUB).toFixed(2);
  } catch (error) {
    console.error("Ошибка загрузки данных:", error);
    document.getElementById("usd").innerText = "Ошибка";
    document.getElementById("eur").innerText = "Ошибка";
    document.getElementById("rub").innerText = "Ошибка";
  }
}
fetchRates();

// Автоматическое обновление погоды каждые 2 часа
function reloadWeather() {
  if (window.__weatherwidget_init) {
    window.__weatherwidget_init();
  }
}
reloadWeather();
const TWO_HOURS_IN_MS = 2 * 60 * 60 * 1000;
setInterval(reloadWeather, TWO_HOURS_IN_MS);

// Автоматическое полное обновление страницы на 10 часов
const TEN_HOURS_IN_MS = 10 * 60 * 60 * 1000;
setTimeout(function () {
  location.reload();
}, TEN_HOURS_IN_MS);



