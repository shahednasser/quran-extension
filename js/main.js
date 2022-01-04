//
// Copyright (c) 2021 by Shahed Nasser. All Rights Reserved.
//

$(document).ready(function(){
  let audio,
      athkar = [],
      originalWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hijriHolidays = [],
      currentHijriMonths = [],
      extensionURL = encodeURI("https://chrome.google.com/webstore/detail/quran-in-new-tab/hggkcijghhpkdjeokpfgbhnpecliiijg"),
      prayerTimeFormat = 24,
      shouldRefresh = false,
      currentVerse = null;
  const messageRegex = /__MSG_(\w+)__/g,
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 
          'October', 'November', 'December'],
        hijriMonths = ['Muharram', 'Safar', 'Rabi__al_awwal', 'Rabi__al_thani', 'Jumada_al_ula', 'Jumada_al_akhirah',
          'Rajab', 'Sha_ban', 'Ramadan', 'Shawwal', 'Dhu_al_Qa_dah', 'Dhu_al_Hijjah'],
        calendarData = [],
        currentHijriDate = moment(),
        currentDate = new Date();
  var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
  initializeToasts();
  $("html").attr('lang', chrome.i18n.getUILanguage());
  localizeHtmlPage($("body"));
  load(false, true);

  chrome.storage.sync.get(["show_date"], function(result){
    if(!result.hasOwnProperty("show_date") || result.show_date){
      const date = new Date();
      setDates(date, currentHijriDate);
    }
  });

  //check if a new update is available
  chrome.runtime.onUpdateAvailable.addListener(function (details) {
    showUpdateToast();
  });

  $(".reload").click(function(){
    load(true, false);
  });

  $(".audio-player").click(function(){
    $(".audio-player .error").hide();
    if(!audio){
      chrome.storage.local.get(["verse"], function(result){
        if(result.hasOwnProperty("verse") && result.verse.hasOwnProperty("audio")){
          audio = new Audio(result.verse.audio);
          $(audio).on('loadstart', function(){
            $(".audio-player .error").hide();
            $(".audio-player img").hide();
            $(".audio-player .loader").show();
          });
          $(audio).on('ended', function(){
            $(".audio-player img").attr('src', 'assets/play.svg');
          })
          audio.play().then(function(){
            $(".audio-player .error").hide();
            $(".audio-player img").attr('src', 'assets/pause.svg');
            $(".audio-player img").show();
            $(".audio-player .loader").hide();
          }).catch(function(){
            $(".audio-player img").attr('src', 'assets/alert-triangle.svg');
            $(".audio-player .error").text("Can't connect.");
            $(".audio-player .error").show();
            $(".audio-player img").show();
            $(".audio-player .loader").hide();
          });
        }
      });
    } else {
      if(audio.paused){
        audio.play().then(function(){
          $(".audio-player img").attr('src', 'assets/pause.svg');
        }).catch(function(){
          $(".audio-player img").attr('src', 'assets/alert-triangle.svg');
          $(".audio-player .error").text("Can't connect.");
          $(".audio-player .error").show();
          $(".audio-player img").show();
          $(".audio-player .loader").hide();
        });
      } else {
        audio.pause();
        $(".audio-player img").attr('src', 'assets/play.svg');
      }
    }
  });

  $("body").on('click', '.settings-link, .notifications-reminder', function(){
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });

  $(".calendar-btn").click(function () {
    $(".calendar-container").addClass("show");
  });

  $(".close-calendar").click(function () {
    $(".calendar-container").removeClass("show");
  });

  $("body").on("click", ".top-sites-container a .remove", function (e) {
    e.stopPropagation();
    e.preventDefault();
    const parent = $(this).parent("a"),
          removeUrl = parent.attr('href');
    Swal.fire({
      title: chrome.i18n.getMessage('remove_top_site_title'),
      html: chrome.i18n.getMessage('remove_top_site_content'),
      showConfirmButton: true,
      confirmButtonText: chrome.i18n.getMessage('remove'),
      showCloseButton: true,
      showCancelButton: true,
      cancelButtonText: chrome.i18n.getMessage('cancel'),
      icon: 'warning',
      showLoaderOnConfirm: true,
      preConfirm: function () {
        chrome.storage.sync.get(['removed_top_sites'], function (storageSync) {
          removedTopSites = storageSync.hasOwnProperty('removed_top_sites') ? storageSync.removed_top_sites : [];
          if (removedTopSites.indexOf(removeUrl) == -1) {
            removedTopSites.push(removeUrl);
            chrome.storage.sync.set({removed_top_sites: removedTopSites}, function () {
              parent.slideUp();
              setTimeout(function () {
                parent.remove();
              }, 2000);
              Swal.hideLoading();
              Swal.close();
            });
          }
        })
      }
    });
  });

  $("body").on('click', '#updateExtension', function () {
    chrome.runtime.reload();
  });

  $(".favorite-button").on('click', function (e) {
    e.preventDefault();
    if (currentVerse) {
      toggleFavorite(currentVerse);
    }
  });

  $("body").on('click', ".favorite-button-list", function (e) {
    e.preventDefault();
    const parent = $(this).parents(".verse");
    const index = parent.attr('id').split("_")[1];
    chrome.storage.sync.get(['favorite_verses'], function (result) {
      const favorites = result.favorite_verses;
      const verse = favorites[index];
      favorites.splice(index, 1);
      if (currentVerse.surah.number === verse.surah.number && currentVerse.numberInSurah === verse.numberInSurah) {
        $(".favorite-button").find("img").attr('src', '/assets/heart.svg');
      }
      chrome.storage.sync.set({favorite_verses: favorites}, function () {
        refreshFavorites();
      })
    })
  });

  $("body").on('click', "[data-bs-dismiss]", function () {
    const selector = $(this).attr('data-bs-dismiss');
    $(selector).each((_, elm) => {
      $(elm).removeClass('show');
    });
  });

  function load(reload, withTopSites){
    audio = null;
    $(".reload img").hide();
    $(".reload .loader").show();
    $(".calendar-inner-container").hide();
    $(".calendar-table .loader").show();
    chrome.storage.local.get(['image', 'verse', 'calendar', 'prayerTimesCalendar'], function(result){
      chrome.storage.sync.get(['show_translation', 'translation_language', 'recitation',
                                  'translation_identifier', 'show_top_sites', 'show_athkar', 
                                  'calendar_start_day', 'removed_top_sites', 'show_prayer_times',
                                  'prayer_times_format', 'should_refresh', 'last_update', 'show_search',
                                  'favorite_verses'], function(syncResult){
        if (syncResult.should_refresh) {
          shouldRefresh = true;
        }
        if (syncResult.last_update && !syncResult.last_update.shown) {
          Swal.fire({
            html: syncResult.last_update.message
          });
          syncResult.last_update.shown = true;
          chrome.storage.sync.set({last_update: syncResult.last_update});
        }
        if(navigator.onLine){
          if(!syncResult.hasOwnProperty('show_translation') || !syncResult.hasOwnProperty('translation_language') ||
              !syncResult.show_translation || !syncResult.translation_language || !syncResult.translation_identifier){
                $(".translation-container").remove();
              }
          let now = (new Date()).getTime();
          if(result.hasOwnProperty('image') && result.image && !shouldRefresh && now <= result.image.timeout && !reload){
            setBackgroundImage(result.image.src);
          }
          else {
            setNewImage(reload);
          }

          if(result.hasOwnProperty('verse') && result.verse && !shouldRefresh && now <= result.verse.timeout && !reload){
            setVerse(result.verse.data);
            audio = new Audio(result.verse.audio);
            if(syncResult.hasOwnProperty('show_translation') && syncResult.show_translation &&
              syncResult.hasOwnProperty('translation_identifier') && syncResult.translation_identifier &&
              syncResult.translation_identifier){
              setTranslation(result.verse.translation);
            }
          }
          else {
            let verseNumber = Math.floor(Math.random() * 6236) + 1;
            let url = 'https://api.alquran.cloud/v1/ayah/' + verseNumber + '/editions/quran-uthmani-min,';
            if(syncResult.hasOwnProperty('recitation')){
              url += syncResult.recitation;
            } else {
              url += 'ar.alafasy';
            }
            if(syncResult.hasOwnProperty('show_translation') && syncResult.show_translation &&
              syncResult.hasOwnProperty('translation_identifier') && syncResult.translation_identifier &&
              syncResult.translation_identifier){
              url += "," + syncResult.translation_identifier;
            }
            $.get(url, function(data){
              if(data.data){
                let verse = {};
                for(let i = 0; i < data.data.length; i++){
                  if(data.data[i].hasOwnProperty('audio')){
                    verse.audio = data.data[i].audio;
                  } else if(data.data[i].edition.type === "quran"){
                    setVerse(data.data[i]);
                    verse.data = data.data[i];
                  } else {
                    verse.translation = data.data[i];
                    let language = data.data[i].edition.language;
                    setTranslation(data.data[i], language);
                  }
                }
                let timeout = calculateTimeout();
                verse.timeout = timeout;
                chrome.storage.local.set({verse});
              }
            }).fail(function(){
              $(".translation-container").remove();
              setVerse(getDefaultVerse());
              $(".audio-player").remove();
            });
          }

          if (syncResult.hasOwnProperty('calendar_start_day')) {
            if (syncResult.calendar_start_day === "Sunday") {
              weekdays.unshift(...weekdays.splice(6));
            }
          }

          if (result.hasOwnProperty('calendar') && result.calendar && result.calendar.hijriHolidays && 
            result.calendar.data && result.calendar.data.length == result.calendar.hijriHolidays.length &&
            result.calendar.hijriMonths) {
            const calendarDate = new Date(result.calendar.date);
            if (calendarDate.getMonth() !== (new Date()).getMonth()) {
              //get calendar for new month
              assembleCalendarData();
            } else {
              //print old calendar
              hijriHolidays = result.calendar.hijriHolidays;
              currentHijriMonths = result.calendar.hijriMonths
              setCalendar(result.calendar.data);
           }
          } else {
            //get new calendar
            assembleCalendarData();
          }

          if (!syncResult.hasOwnProperty('show_prayer_times') || syncResult.show_prayer_times) {
            if (syncResult.prayer_times_format) {
              prayerTimeFormat = syncResult.prayer_times_format;
            }
            if (!result.hasOwnProperty('prayerTimesCalendar') || !result.prayerTimesCalendar || !result.prayerTimesCalendar.hasOwnProperty('month') || 
            !result.prayerTimesCalendar.hasOwnProperty('calendar') || result.prayerTimesCalendar.month != (new Date()).getMonth()) {
              getPrayerTimesCalendar();
            } else {
              getPrayerTimes();
            }
          } else {
            $(".next-prayer").remove();
          }
        }
        else{
          $(".translation-container").remove();
          setBackgroundImage('assets/offline-image.jpg');
          setVerse(getDefaultVerse());
          $(".audio-player").remove();
        }

        if ((!syncResult.hasOwnProperty('show_search') || syncResult.show_search) && !reload) {
          showSearchBar();
        }

        if(withTopSites && (!syncResult.hasOwnProperty('show_top_sites') || syncResult.show_top_sites)){
          chrome.topSites.get((topSites) => {
            if (syncResult.hasOwnProperty('removed_top_sites')) {
              topSites = filterTopSites(topSites, syncResult.removed_top_sites);
            }
            addTopSites(topSites);
          });
        }
        if(!syncResult.hasOwnProperty('show_athkar') || syncResult.show_athkar){
          if(athkar.length == 0){
            $.getJSON('/js/json/athkar.json', function(json, textStatus) {
              athkar = json.athkar;
              showRandomThikr();
            });
          } else {
            showRandomThikr();
          }
        } else {
          $(".athkar-container").remove();
          showRandomThikr();
        }

        if (syncResult.hasOwnProperty('favorite_verses')) {
          showFavoriteVerses(syncResult.favorite_verses)
        }
        
      });
    });
    
    
  }

  function showRandomThikr(){
    let thikr = getRandomThikr();
    $(".athkar-container .thikr").html(`
      <span class="thikr-arabic">${thikr.ar}</span>
      <div class="translations">
        <span class="thikr-translation-title">Translation</span>
        <span class="thikr-english">${thikr.en}</span>
        <span class="thikr-transliteration-title">Transliteration</span>
        <span class="thikr-ar-en">${thikr['ar-en']}</span>
      </div>
    `);
    $(".athkar-container").show();
  }

  function setBackgroundImage(url){
    $(".background-image").attr('src', url).on('load', function(){
      $(this).animate({opacity: 1}, 500);
      $(".reload img").show();
      $(".reload .loader").hide();
    }).on('error', function(){
      $(this).attr('src', 'assets/offline-image.jpg').animate({opacity: 1}, 500);
      $(".reload img").show();
      $(".reload .loader").hide();
    });
  }

  function setVerse(data){
    currentVerse = data;
    $(".verse-text").text(data.text);
    $(".verse-details").text(data.surah.name + " - " + data.numberInSurah);
    $(".verse").animate({opacity: 1}, 500);

    //add social links
    const text = encodeURI(data.text + '\n\n' + data.surah.name + ' - ' + data.numberInSurah);
    //twitter
    let twitterElm = $(".twitter-share-button");
    if (twitterElm.length) {
      twitterElm.attr('href', 'https://twitter.com/intent/tweet?text=' + text + '&url=' +
        extensionURL);
    }
    //facebook
    let facebookElm = $(".facebook-share-button");
    if (facebookElm.length) {
      facebookElm.attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + extensionURL + '&quote=' + text)
    }
    //whatsapp
    let whatsappElm = $(".whatsapp-share-button");
    if (whatsappElm.length) {
      whatsappElm.attr('href', 'https://wa.me/?text=' + text + encodeURI("\n") + extensionURL);
    }
    //telegram
    let telegramElm = $(".telegram-share-button");
    if (telegramElm.length) {
      telegramElm.attr('href', 'https://t.me/share/url?url=' + extensionURL + '&text=' + text);
    }

    //check if in favorites
    chrome.storage.sync.get(['favorite_verses'], (result) => {
      const favorites = result.hasOwnProperty('favorite_verses') ? result.favorite_verses : [];
      const exists = favorites.some((verse) => verse.surah.number === data.surah.number && verse.numberInSurah === data.numberInSurah);
      if (exists) {
        $(".favorite-button").find("img").attr('src', '/assets/heart-filled.svg');
      } else {
        $(".favorite-button").find("img").attr('src', '/assets/heart.svg');
      }
    })
  }

  function calculateTimeout(){
    return timeout = (new Date()).getTime() + 3600000;
  }

  function getDefaultVerse(){
    return {
      edition: {
        englishName: "Simple",
        format: "text",
        identifier: "quran-simple",
        language: "ar",
        name: "Simple",
        type: "quran",
      },
      hizbQuarter: 201,
      juz: 26,
      manzil: 6,
      number: 4523,
      numberInSurah: 13,
      page: 503,
      ruku: 439,
      sajda: false,
      surah: {
        englishName: "Al-Ahqaf",
        englishNameTranslation: "The Dunes",
        name: "سورة الأحقاف",
        number: 46,
        numberOfAyahs: 35,
        revelationType: "Meccan",
      },
      text: "إِنَّ الَّذِينَ قَالُوا رَبُّنَا اللَّهُ ثُمَّ اسْتَقَامُوا فَلَا خَوْفٌ عَلَيْهِمْ وَلَا هُمْ يَحْزَنُونَ"
    };
  }

  function setTranslation(translation, language){
    if(language === "ar") {
      $(".translation-body").addClass('ar-translation');
    }
    $(".translation-container .body").text(translation.text);
    $(".translation-container").show();
  }

  function showSearchBar () {
    $(".content-container").append(`
      <form action="https://google.com/search" method="GET">
        <input type="search" name="q" placeholder="Search Google..." class="search-bar" />
      </form>
    `);
  }

  function addTopSites(topSites){
    userTopSites = topSites;
    
    if(topSites.length){
      let $container = $('<div class="content top-sites-container">');
      $container.appendTo('.content-container');
      for(let i = 0; i < topSites.length; i++){
        $container.append('<a href="' + topSites[i].url + '" class="shadow"><img src="https://plus.google.com/_/favicon?domain_url=' + topSites[i].url + '" />' +
                          topSites[i].title + '<span class="remove">x</span></a>')
      }
    }
  }

  function filterTopSites (topSites, removedTopSites) {
    for (let i = 0; i < removedTopSites.length; i++) {
      let ind = topSites.findIndex((site) => {
        return site.url == removedTopSites[i];
      });
      if (ind !== -1) {
        topSites.splice(ind, 1);
      }
    }
    return topSites;
  }

  function getRandomThikr(){
    return athkar[Math.floor(Math.random() * athkar.length)];
  }

  function setDates(dateObj, hijriData){
    $(".gregorian-date").text(dateObj.getDate() + "/" + (dateObj.getMonth() + 1) + "/" + dateObj.getFullYear());
    $(".hijri-date").text(hijriData.iDate() + " " + chrome.i18n.getMessage(hijriMonths[hijriData.iMonth()]) + " " + hijriData.iYear());
  }

  function setNewImage(reload) {
    let xhr = new XMLHttpRequest();
    //get height and width of screen
    const width = $(window).width(),
          height = $(window).height();
    $.ajax({
      method: 'GET',
      url: 'https://source.unsplash.com/collection/4331244/' + width + 'x' + height,
      headers: {
        'Access-Control-Expose-Headers': 'ETag'
      },
      xhr: function() {
       return xhr;
      },
      success: function(data){
        setBackgroundImage(xhr.responseURL);
        let timeout = calculateTimeout();
        chrome.storage.local.set({image: {src: xhr.responseURL, timeout}});
      },
      error: function(){
        setBackgroundImage('/assets/offline-image.jpg');
      },
      complete: function(){
        if(reload){
          $(".reload img").show();
          $(".reload .loader").hide();
        }
      }
    });
  }

  function getNewCalendar () {
    setCalendar(calendarData);
    chrome.storage.local.set({calendar: {date: currentDate.toString(), data: calendarData, 
      hijriHolidays: hijriHolidays, hijriMonths: currentHijriMonths}});
  }

  function setCalendar (data) {
    $(".calendar__header").nextAll().remove();
    //set headings
    $(".calendar__header").children().each(function (index) {
      $(this).text(chrome.i18n.getMessage(weekdays[index]));
    });
    const nbDates = data.length;
    let startedDay = -1;
    let today = new Date();
    let todayDate = null;
    let i = 0;
    let nbWeeks = 0;
    let lastValue = 0;
    html = '';
    while (i < nbDates) {
      for (let z = 0; z < weekdays.length; z++) {
        if (data[i].gregorian.weekday.en != weekdays[z]) {
          continue;
        }
        if (startedDay == -1) {
          if (data[i].gregorian.weekday.en == weekdays[z]) {
            startedDay = i;
          }
        }
  
        if (i == nbDates - 1) {
          if (data[i].gregorian.weekday.en !== weekdays[6]) {
            endedWeekday = weekdays.indexOf(data[i].gregorian.weekday.en);
          }
        }
  
        if (todayDate == null && today.getDate() == data[i].gregorian.day) {
          todayDate = i + 1;
        }
        i++;
        if (i >= nbDates) {
          break;
        }
      }

      html += addWeek(i == nbDates ? i - (nbDates - lastValue - 1) : (nbWeeks > 4 && i > nbDates - 7 && i <= nbDates ? i : i - 6), nbDates, todayDate, data);
      nbWeeks++;
      lastValue = i;
    }

    $(".calendar__header").after(html);
    $("#gregorianMonth").text(chrome.i18n.getMessage(data[0].gregorian.month.en));
    //assemble hijri months
    let hijriMonthsStr = "";
    for (let j = 0; j < currentHijriMonths.length; j++) {
      if (hijriMonthsStr.length) {
        hijriMonthsStr += "/";
      }
      hijriMonthsStr += chrome.i18n.getMessage(currentHijriMonths[j]);
    }
    $("#hijriMonth").text(hijriMonthsStr);
    $(".calendar-table .loader").hide();
    $(".calendar-inner-container").show();
  }

  function addWeek (fromDay, totalDays, todayDate, calendarData) {
    str = '<div class="calendar__week">';
    let i = fromDay;
    for (let j = 0; j < 7; j++) {

      let additionalClasses = '';
      if (i <= 0 || i > totalDays) {
        additionalClasses = 'not-month-day';
      } else if (todayDate !== null && todayDate == i) {
        additionalClasses = 'today';
      }
      let dayStr = '<div class="calendar__day day ' + additionalClasses + '">' + (i > totalDays || i <= 0 ? "" : i + '<small class="calendar-hijri-date">' + calendarData[i - 1].hijri.day + '</small>');
      if (i <= totalDays && i > 0) {
        if (hijriHolidays[i - 1].length) {
          for (let j = 0; j < hijriHolidays[i - 1].length; j++) {
            dayStr += '<span class="badge bg-success calendar-note">' + hijriHolidays[i - 1][j] + '</span>';
            hasAshura = hijriHolidays[i - 1][j] == "Ashura";
          }
        }

        if (isFastingDay(parseInt(calendarData[i- 1].hijri.day), originalWeekdays[j], hijriHolidays, 
              i > 1 ? hijriHolidays[i - 2] : [], i < totalDays && hijriHolidays.length > i ? hijriHolidays[i] : [],
              calendarData[i - 1].hijri.month.en)) {
          dayStr += '<span class="badge bg-danger calendar-note">' + chrome.i18n.getMessage('Fasting') + '</span>';
        }
      }

      
      str += dayStr + '</div>';
      i++;
    }
    str += '</div>';
    return str;
  }

  function isFastingDay (day, dayOfWeek, holidays, dayBeforeHolidays, dayAfterHolidays, monthName) {
    return day == 13 || day == 14 || day == 15 || dayOfWeek == "Monday" || dayOfWeek == "Thursday" || 
      holidays.includes("Ashura") || holidays.includes("Arafa") || dayBeforeHolidays.includes("Ashura") || 
      dayAfterHolidays.includes("Ashura") || monthName === 'Ramadan';
  }

  function localizeHtmlPage($elm)
  {
      //Localize by replacing __MSG_***__ meta tags
      $elm.children().each(function () {
        localizeHtmlPage($(this));
        $.each(this.attributes, function () {
          this.name = this.name.replace(messageRegex, localizeString);

          this.value = this.value.replace(messageRegex, localizeString);
        });
        $(this).html($(this).html().replace(messageRegex, localizeString));
      });
  }

  function localizeString(_, str) {
    return str ? chrome.i18n.getMessage(str) : "";
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

  function assembleCalendarData () {
    const currentYear = currentDate.getFullYear(),
          currentMonth = currentDate.getMonth();
    const nbDays = getMonthDays(currentYear, currentMonth);
    hijriHolidays.splice = function (){
      const result = Array.prototype.splice.apply(this,arguments);
      if (this.length == nbDays) {
        getNewCalendar();
      }
      return result;
    }
    for (let i = 0; i < nbDays; i++) {
      const gregorianDate = new Date(currentYear, currentMonth, i + 1),
            hijriDate = moment(currentYear + '-' + (currentMonth + 1) + '-' + (i+1), 'YYYY-M-D');
      calendarData.push({
        "gregorian": {
          "weekday": {
            "en": gregorianDate.getDay() === 0 ? originalWeekdays[6] : originalWeekdays[gregorianDate.getDay() - 1]
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
      if (!currentHijriMonths.includes(hijriMonths[hijriDate.iMonth()])) {
        currentHijriMonths.push(hijriMonths[hijriDate.iMonth()]);
      }
      $.get('https://api.aladhan.com/v1/hToG?date=' + hijriDate.iDate() + "-" + (hijriDate.iMonth() + 1) + "-" + hijriDate.iYear(),
          function (data) {
            hijriHolidays.splice(this.i, 0, data.data.hijri.holidays);
            if(currentHijriDate.iDate() == data.data.hijri.day && data.data.hijri.holidays.length){
              let text = "";
              for(let i = 0; i < data.data.hijri.holidays.length; i++){
                if(i !== 0){
                  text += "<br>"
                }
                text += data.data.hijri.holidays[i];
              }
              $(".holidays").html(text);
            }
          }.bind({i, nbDays}))
    }
  }


  function showUpdateToast () {
    $("body").append(`
      <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11;">
        <div class="toast fade show text-dark" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-body">
            <p class="fw-bold">A new update is available. You can update now or wait until your browser reloads</p>
            <div class="mt-2 pt-2 border-top">
              <button type="button" class="btn btn-success btn-sm" id="updateExtension">Update now</button>
              <button type="button" class="btn btn-secondary btn-sm" data-bs-dismiss=".toast">Close</button>
            </div>
          </div>
        </div>
      </div>
    `)
  }

  function showFavoriteVerses (favorites) {
    const container = $(".favorite-verses .favorite-content");
    container.children().remove();
    favorites.forEach((verse, index) => {
      container.append(
        `
          <div class="verse" id="verse_${index}">
            <p class="verse-text">${verse.text}</p>
            <p class="verse-details">${verse.surah.name + " - " + verse.numberInSurah}</p>
            <p class="verse-actions">
              <button class="btn btn-link favorite-button-list text-dark">Remove</button>
            </p>
          </div>
        `
      )
    })
  }

  function refreshFavorites () {
    chrome.storage.sync.get(['favorite_verses'], function (result) {
      const favorites = result.hasOwnProperty('favorite_verses') ? result.favorite_verses : [];
      showFavoriteVerses(favorites);
    })
  }

  function toggleFavorite (item) {
    chrome.storage.sync.get(['favorite_verses'], function (result) {
      const favorites = result.hasOwnProperty('favorite_verses') ? result.favorite_verses : [];
      //check if current verse is in array or not
      const verseIndex = favorites.findIndex((verse) => verse.surah.number === item.surah.number && verse.numberInSurah === item.numberInSurah);
      let action = "added";
      if (verseIndex === -1) {
        //current verse should be added to favorites
        favorites.push(item);
      } else {
        //current verse should be removed from favorites
        favorites.splice(verseIndex, 1);
        action = "removed";
      }

      chrome.storage.sync.set({favorite_verses: favorites}, function () {
        refreshFavorites();
        if (action === 'added') {
          $(".favorite-button").find("img").attr('src', '/assets/heart-filled.svg');
        } else {
          $(".favorite-button").find("img").attr('src', '/assets/heart.svg');
        }
        //show toast
        $("body").append(`
          <div class="position-fixed bottom-0 end-0 p-3" style="z-index: 11;">
            <div class="toast fade text-dark show" role="alert" aria-live="assertive" aria-atomic="true" data-bs-autohide="true">
              <div class="toast-body d-flex justify-content-between">
                <p class="fw-bold mb-0">Ayah ${action} ${action === 'added' ? 'to' : 'from'} favorites!</p>
                <button type="button" class="btn-close text-dark" data-bs-dismiss=".toast" aria-label="Close"></button>
              </div>
            </div>
          </div>
        `)
      });
    })
  }

  function getPrayerTimesCalendar () {
    navigator.geolocation.getCurrentPosition((position) => {
      const date = new Date();
      chrome.storage.sync.get(['prayer_times_method'], function (result) {
        $.get('https://api.aladhan.com/v1/calendar?longitude=' + position.coords.longitude + '&latitude=' + position.coords.latitude + 
        '&month=' + (date.getMonth() + 1) + '&year=' + date.getFullYear() + '&method=' + (result.hasOwnProperty('prayer_times_method') ? result.prayer_times_method : 0), 
          function (data) {
          //store it in storage for the entire month
          chrome.storage.local.set({prayerTimesCalendar: {month: date.getMonth(), calendar: data.data}}, function () {
            getPrayerTimes();
          });
        });
      })
    });
  }

  function getPrayerTimes() {
    chrome.storage.local.get(['prayerTimesCalendar'], function(result) {
      if (result.hasOwnProperty('prayerTimesCalendar') && result.prayerTimesCalendar.hasOwnProperty('calendar')) {
        //get today's prayer times
        const today = new Date(),
          todayMoment = moment();
        const prayerTimesContainer = $(".prayer-times-container"),
              prayerTimesWrapper = prayerTimesContainer.find(".prayer-times-wrapper");
        prayerTimesContainer.addClass('d-none');
        prayerTimesWrapper.empty();
        let nextPrayerTime = 0, nextPrayerName = "";
        result.prayerTimesCalendar.calendar.some((dateData) => {
          if (parseInt(dateData.date.gregorian.day) == today.getDate()) {
            const fajr = formatTime(dateData.timings.Fajr),
              dhuhr = formatTime(dateData.timings.Dhuhr),
              asr = formatTime(dateData.timings.Asr),
              maghrib = formatTime(dateData.timings.Maghrib),
              isha = formatTime(dateData.timings.Isha),
              momentFajr = moment(fajr, getTimeFormat()).year(todayMoment.year()).month(todayMoment.month()).date(todayMoment.date()),
              momentDhuhr = moment(dhuhr, getTimeFormat()).year(todayMoment.year()).month(todayMoment.month()).date(todayMoment.date()),
              momentAsr = moment(asr, getTimeFormat()).year(todayMoment.year()).month(todayMoment.month()).date(todayMoment.date()),
              momentMaghrib = moment(maghrib, getTimeFormat()).year(todayMoment.year()).month(todayMoment.month()).date(todayMoment.date()),
              momentIsha = moment(isha, getTimeFormat()).year(todayMoment.year()).month(todayMoment.month()).date(todayMoment.date());

            switch (false) {
              case todayMoment.isAfter(momentFajr):
                nextPrayerTime = todayMoment.to(momentFajr);
                nextPrayerName = chrome.i18n.getMessage('fajr');
                break;
              case todayMoment.isAfter(momentDhuhr):
                nextPrayerTime = todayMoment.to(momentDhuhr);
                nextPrayerName = chrome.i18n.getMessage('dhuhr');
                break;
              case todayMoment.isAfter(momentAsr):
                nextPrayerTime = todayMoment.to(momentAsr);
                nextPrayerName = chrome.i18n.getMessage('asr');
                break;
              case todayMoment.isAfter(momentMaghrib):
                nextPrayerTime = todayMoment.to(momentMaghrib);
                nextPrayerName = chrome.i18n.getMessage('maghrib');
                break;
              case todayMoment.isAfter(momentIsha):
                nextPrayerTime = todayMoment.to(momentIsha);
                nextPrayerName = chrome.i18n.getMessage('isha');
                break;
            }

            //show prayer times
            prayerTimesWrapper.append(`<div class="prayer-time fajr">${fajr}</div>`);
            prayerTimesWrapper.append(`<div class="prayer-time dhuhr">${dhuhr}</div>`);
            prayerTimesWrapper.append(`<div class="prayer-time asr">${asr}</div>`);
            prayerTimesWrapper.append(`<div class="prayer-time maghrib">${maghrib}</div>`);
            prayerTimesWrapper.append(`<div class="prayer-time isha">${isha}</div>`);
            prayerTimesContainer.removeClass('d-none');
            return true; //break the loop
          }
          return false;
        });

        console.log(nextPrayerTime, nextPrayerName);
        if (nextPrayerTime) {
          $(".next-prayer").text(nextPrayerName + " " + nextPrayerTime);
        }
      }
    })
  }

  function formatTime (time) {
    let formattedTime = time.split(" ")[0];
    const momentTime = moment(formattedTime, 'HH:mm');
    formattedTime = momentTime.format(getTimeFormat())

    return formattedTime;
  }

  function getTimeFormat () {
    return prayerTimeFormat == 12 ? "hh:mm A" : 'HH:mm';
  }

  function initializeToasts () {
    var toastElList = [].slice.call(document.querySelectorAll('.toast:not(.hide)'))
    console.log(toastElList);
    toastElList.map(function (toastEl) {
      const toast = new bootstrap.Toast(toastEl, {
        animation: true
      });
    });
  }
});
