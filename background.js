//add moment and moment-hijri scripts
importScripts('/js/moment.js');
importScripts('/js/moment-hijri.js');

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 
        'October', 'November', 'December'],
      hijriMonths = ['Muharram', 'Safar', 'Rabi__al_awwal', 'Rabi__al_thani', 'Jumada_al_ula', 'Jumada_al_akhirah',
        'Rajab', 'Sha_ban', 'Ramadan', 'Shawwal', 'Dhu_al_Qa_dah', 'Dhu_al_Hijjah'],
      currentDate = new Date();
let hijriHolidays = [],
    calendarData = [];

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name == "fastingNotification") {
        chrome.storage.local.get(['calendar'], (result) => {
            if (result.hasOwnProperty('calendar') && result.calendar && result.calendar.hijriHolidays && 
            result.calendar.data && result.calendar.data.length == result.calendar.hijriHolidays.length) {
                const calendarDate = new Date(result.calendar.date);
                if (calendarDate.getMonth() !== (new Date()).getMonth()) {
                  //get calendar for new month
                  getNewCalendar();
                } else {
                  //use old calendar
                  calendarData = result.calendar.data;
                  hijriHolidays = result.calendar.hijriHolidays;
                  checkNotification();
               }
              } else {
                //get new calendar
                getNewCalendar();
              }
        });
    }
});

function getNewCalendar () {
    const currentYear = currentDate.getFullYear(),
          currentMonth = currentDate.getMonth(),
          nbDays = getMonthDays(currentYear, currentMonth);
    hijriHolidays.splice = () => {
        const result = Array.prototype.splice.apply(this,arguments);
        if (this.length == nbDays) {
          chrome.storage.local.set({calendar: {date: currentDate.toString(), data: calendarData, hijriHolidays: hijriHolidays}});
          checkNotification();
        }
        return result;
    }
    for (let i = 0; i < nbDays; i++) {
      const gregorianDate = new Date(currentYear, currentMonth, i + 1),
            hijriDate = moment(currentYear + '-' + (currentMonth + 1) + '-' + (i+1), 'YYYY-M-D');
      calendarData.push({
        "gregorian": {
          "weekday": {
            "en": gregorianDate.getDay() === 0 ? weekdays[6] : weekdays[gregorianDate.getDay() - 1]
          },
          "day": gregorianDate.getDate(),
          "month": {
            "en": months[gregorianDate.getMonth()]
          }
        },
        "hijri": {
          "month": {
            "en": hijriMonths[hijriDate.iMonth()]
          },
          "day": hijriDate.iDate()
        }
      });
      fetch('http://api.aladhan.com/v1/hToG?date=' + hijriDate.iDate() + "-" + (hijriDate.iMonth() + 1) + "-" + hijriDate.iYear())
      .then((response) => response.json())
        .then(function (data) {
          hijriHolidays.splice(this.i, 0, data.data.hijri.holidays);
        }.bind({i, nbDays}))
    }
}

function checkNotification () {
    for (let i = 0; i < calendarData.length; i++) {
        if (calendarData[i].gregorian.day == currentDate.getDate() + 1) {
            if (isFastingDay(parseInt(calendarData[i].hijri.day), calendarData[i].gregorian.weekday.en, hijriHolidays[i], 
                i > 0 ? hijriHolidays[i - 1] : [], i < hijriHolidays.length + 1 ? hijriHolidays[i + 1] : [])) {
                    //send notification
                    chrome.notifications.create('fastingReminder', {
                        type: 'basic',
                        iconUrl: 'assets/icon-128.png',
                        title: chrome.i18n.getMessage('fasting_reminder_title'),
                        message: chrome.i18n.getMessage('fasting_notification'),
                        priority: 2
                    });
                }

                break;
        }
    }
}

function getMonthDays(year, monthIndex) {
    //const monthIndex = month - 1; // 0..11 instead of 1..12
    const date = new Date(year, monthIndex, 1);
    let nbDays = 0;
    while (date.getMonth() == monthIndex) {
      nbDays++;
      date.setDate(date.getDate() + 1);
    }
    return nbDays;
  }

function isFastingDay (day, dayOfWeek, holidays, dayBeforeHolidays, dayAfterHolidays) {
    return day == 13 || day == 14 || day == 15 || dayOfWeek == "Monday" || dayOfWeek == "Thursday" || 
      holidays.includes("Ashura") || holidays.includes("Arafa") || dayBeforeHolidays.includes("Ashura") || 
      dayAfterHolidays.includes("Ashura");
}

chrome.runtime.onInstalled.addListener(() => {
  const manifest = chrome.runtime.getManifest();
  //reset the current saved local data
  chrome.storage.local.remove(['image', 'verse', 'calendar', 'prayerTimesCalendar']);
  chrome.storage.sync.get(['last_update'], (result) => {
    if (!result.hasOwnProperty('last_update') || result.last_update.version != manifest.version) {
      //send request to server to get message
      fetch('https://quran-extension-api.alwaysdata.net/updates/' + manifest.version)
      .then((response) => response.json())
      .then((data) => {
        let message;
        if (data.success) {
          message = data.message;
        }

        chrome.storage.sync.set({last_update: {version: manifest.version, message, shown: message.length === 0}});
      });
    }
  })
})