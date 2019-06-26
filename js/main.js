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

  const clock = new Clock({
    city: 'moscow',
    format: 24,
  });

  const analogClock = new AnalogClock({
    app,
    clock: clock
  });

  let interval;

  clock.onload = function() {
    render();
    analogClock.render();
    interval = setInterval(() => {
      clock.tick();
      render();
      analogClock.render();
    }, 1000);
  }

  citySelect.oninput = function(e) {
    clearInterval(interval);
    clock.city = this.value;
    clock.update()
      .then(() => {
        render();
        analogClock.render();
        interval = setInterval(() => {
          clock.tick();
          render();
          analogClock.render();
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

class AnalogClock {
  constructor(opts) {
    this.cnv = document.createElement('canvas');
    let appStyle = getComputedStyle(opts.app);
    let width = opts.app.clientWidth - 
      parseFloat(appStyle.paddingLeft) - 
      parseFloat(appStyle.paddingRight);
    this.cnv.width = width;
    this.cnv.height = width;
    app.prepend(this.cnv);

    this.ctx = this.cnv.getContext('2d');
    this.mainColor = "#343a40";
    this.clock = opts.clock;

    this.render();
  }

  render() {
    this.ctx.clearRect(0, 0, this.cnv.width, this.cnv.height);

    this.renderClockFace();

    if (!this.clock.date)
      return;

    let hours = this.clock.hours;
    if (hours > 12)
      hours -= 12;

    const hoursAngle = 360 * hours / 12;
    const minutesAngle = 360 * this.clock.minutes / 60;
    const secondsAngle = 360 * this.clock.seconds / 60;

    this.renderArrow(hoursAngle, "hours");
    this.renderArrow(minutesAngle, "minutes");
    this.renderArrow(secondsAngle, "seconds");
  }

  renderClockFace() {
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = this.mainColor;
    this.ctx.beginPath();
    this.ctx.arc(this.cnv.width / 2, this.cnv.height / 2, this.cnv.height / 2 - 10, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(this.cnv.width / 2, this.cnv.height / 2, 10, 0, 2 * Math.PI);
    this.ctx.stroke();

    for (let i = 0; i < 12; i++) {
      let angle = 360 / 12 * i;
      angle = angle * Math.PI / 180;
      
      const length = this.cnv.height / 2 - 10;
      const coords = AnalogClock.getVectorFromAngle(angle, length);
      coords.x += this.cnv.height / 2;
      coords.y += this.cnv.height / 2;

      this.ctx.beginPath();
      this.ctx.arc(coords.x, coords.y, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }

  renderArrow(angle, type="seconds") {
    // Переводим угол в радианы и приравниваем ноль к 12 часам
    angle -= 90;
    angle = angle * Math.PI / 180;

    const types = {
      hours: {
        color: "#007bff",
        width: 10,
        length: 0.7
      },
      minutes: {
        color: "#28a745",
        width: 7,
        length: 0.85
      },
      seconds: {
        color: this.mainColor,
        width: 4,
        length: 1
      },
    }
    
    const startPoint = AnalogClock.getVectorFromAngle(angle, 30);
    const endPoint = AnalogClock.getVectorFromAngle(
      angle, 
      (this.cnv.width / 2 - 30) * types[type].length
    );
    startPoint.x += this.cnv.width / 2;
    startPoint.y += this.cnv.width / 2;
    endPoint.x += this.cnv.width / 2;
    endPoint.y += this.cnv.width / 2;
    
    this.ctx.strokeStyle = types[type].color;
    this.ctx.fillStyle = types[type].color;
    this.ctx.lineWidth = types[type].width;
    this.ctx.beginPath();
    this.ctx.arc(startPoint.x, startPoint.y, types[type].width / 2, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(endPoint.x, endPoint.y, types[type].width / 2, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(startPoint.x, startPoint.y);
    this.ctx.lineTo(endPoint.x, endPoint.y);
    this.ctx.stroke();
  }

  static getVectorFromAngle(angle, magnitude) {
    return {
      x: magnitude * Math.cos(angle), 
      y: magnitude * Math.sin(angle)
    };
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