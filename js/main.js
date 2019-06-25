window.onload = function() {
  const 
    app = document.getElementById('app'),
    hoursSpan = app.querySelector('.hours-span'),
    minutesSpan = app.querySelector('.minutes-span'),
    secondsSpan = app.querySelector('.seconds-span'),
    meridiemSpan = app.querySelector('.meridiem-span'),
    weekDaySpan = app.querySelector('.weekday-span'),
    daySpan = app.querySelector('.day-span'),
    monthSpan = app.querySelector('.month-span'),
    yearSpan = app.querySelector('.year-span'),
    citySelect = app.querySelector('.city-label__select'),
    formatInputs = app.querySelectorAll('.format-label__input'),
    formatInputLabels = app.querySelectorAll('.format-label__label'),
    title = document.querySelector('title');

  let clock = new Clock({
    city: 'moscow',
    format: 24,
  });

  let interval;
  
  clock.onload = function() {
    render();
    interval = setInterval(() => {
      clock.tick();
      render();
    }, 1000);
  }

  citySelect.oninput = function(e) {
    clearInterval(interval);
    clock.city = this.value;
    clock.update()
      .then(() => {
        render();
        interval = setInterval(() => {
          clock.tick();
          render();
        }, 1000);
      });
  }

  formatInputs.forEach(el => el.oninput = function() {
    formatInputLabels.forEach(el => el.classList.remove('active'));
    this.parentElement.classList.add('active');
    clock.format = +this.value;
    render();
  })

  // Обновление каждые пять минут
  setInterval(() => {
    clock.update();
  }, 5 * 60 * 1000)

  function render() {
    hoursSpan.textContent = clock.meridiemHours;
    minutesSpan.textContent = clock.minutes;
    secondsSpan.textContent = clock.seconds;
    meridiemSpan.textContent = clock.meridiem;
    weekDaySpan.textContent = clock.weekday;
    daySpan.textContent = clock.day;
    monthSpan.textContent = clock.month;
    yearSpan.textContent = clock.year;

    title.textContent = `${hoursSpan.textContent} : 
      ${minutesSpan.textContent} : 
      ${secondsSpan.textContent}`;
  }
}

let cities = {
  moscow: {
    url: "https://worldtimeapi.org/api/timezone/Europe/Moscow",
    name: "Москва"
  },
  newYork: {
    url: "https://worldtimeapi.org/api/timezone/America/New_York",
    name: "Нью-Йорк"
  },
  tokyo: {
    url: "https://worldtimeapi.org/api/timezone/Asia/Tokyo",
    name: "Токио"
  }
}

class Clock {
  constructor(opts) {
    this.city = opts.city;
    this.format = opts.format || 24;
    this.update()
      .then(res => {
        if (this.onload) {
          this.onload();
        }
      });
  }

  update() {
    return getCurrentTime(cities[this.city].url)
      .then(res => {
        let date = new Date(res.utc_datetime);
        // Получаем разницу во времени текущего города относительно нулевого меридиана в мс
        let offset = parseInt(res.utc_offset) * 60 * 60 * 1000;
        // Корректируем дату относительно нулевого меридиана и текущего местоположения
        date = new Date(+date + offset + date.getTimezoneOffset() * 60 * 1000);
        this.date = date;
      })
  }

  tick() {
    this.date = new Date(+this.date + 1000);
  }

  get hours() {
    return Clock.getFormatedNumber(this.date.getHours());
  }

  get meridiemHours() {
    if (this.format == 24)
      return this.hours;

    let hours = +this.hours;
    if (hours > 12)
      hours -= 12;
    return Clock.getFormatedNumber(hours);
  }

  get minutes() {
    return Clock.getFormatedNumber(this.date.getMinutes());
  }

  get seconds() {
    return Clock.getFormatedNumber(this.date.getSeconds());
  }

  get year() {
    return this.date.getFullYear();
  }

  get month() {
    return Clock.getFormatedNumber(this.date.getMonth() + 1);
  }

  get day() {
    return Clock.getFormatedNumber(this.date.getDate());
  }

  get weekday() {
    const days = [
      "Воскресенье",
      "Понедельник",
      "Вторник",
      "Среда",
      "Четверг",
      "Пятница",
      "Суббота",
    ];

    return days[this.date.getDay()];
  }

  get meridiem() {
    if (this.format == 24)
      return "";

    return this.hours > 12 ? "PM" : "AM";
  }

  // Возвращает строковое представление числа с ведущим нулём
  static getFormatedNumber(num) {
    num = num + "";
    if (num.length < 2) {
      return "0" + num;
    }
    return num;
  }
}

function getCurrentTime(url) {
  return new Promise(function(onsuccess, onerror) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.send();
    xhr.onload = function() {
      if (xhr.status !== 200) {
        onerror({
          status: xhr.status,
          statusText: xhr.statusText
        })
      }

      onsuccess(JSON.parse(xhr.response));
    };
  });
}