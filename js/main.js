//
// Copyright (c) 2020 by Shahed Nasser. All Rights Reserved.
//

$(document).ready(function(){
  let audio,
      athkar = [],
      originalWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      hijriHolidays = [],
      currentHijriMonths = [],
      extensionURL = encodeURI("https://chrome.google.com/webstore/detail/quran-in-new-tab/hggkcijghhpkdjeokpfgbhnpecliiijg");
  const messageRegex = /__MSG_(\w+)__/g,
        months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 
          'October', 'November', 'December'],
        hijriMonths = ['Muharram', 'Safar', 'Rabi__al_awwal', 'Rabi__al_thani', 'Jumada_al_ula', 'Jumada_al_akhirah',
          'Rajab', 'Sha_ban', 'Ramadan', 'Shawwal', 'Dhu_al_Qa_dah', 'Dhu_al_Hijjah'],
        calendarData = [],
        currentHijriDate = moment(),
        currentDate = new Date();
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });
  $("html").attr('lang', chrome.i18n.getUILanguage());
  localizeHtmlPage($("body"));
  load(false, true);
  chrome.storage.sync.get(["show_date", "date", "showed_survey_popup", 
    "showed_new_feature_report", "showed_new_feature_calendar",
    "showed_new_top_sites", "showed_languages"], function(result){
    if(!result.hasOwnProperty("show_date") || result.show_date){
      const date = new Date();
      setDates(date, currentHijriDate);
    }
    if (!result.hasOwnProperty("showed_survey_popup") || !result.showed_survey_popup) {
      Swal.fire({
        title: chrome.i18n.getMessage('feedback_window_title'),
        html: chrome.i18n.getMessage('feedback_window_content'),
        showConfirmButton: false,
        showCloseButton: true,
        cancelButtonText: chrome.i18n.getMessage('cancel'),
        onClose: function () {
          chrome.storage.sync.set({showed_survey_popup: true});
        }
      })
    }

    if (!result.hasOwnProperty("showed_new_feature_report") || !result.showed_new_feature_report) {
      Swal.fire({
        icon: 'info',
        title: chrome.i18n.getMessage('reporting_window_message'),
        html: chrome.i18n.getMessage('reporting_window_content'),
        showConfirmButton: false,
        showCloseButton: true,
        cancelButtonText: chrome.i18n.getMessage('cancel'),
        onClose: function () {
          chrome.storage.sync.set({showed_new_feature_report: true});
        }
      })
    }

    if (!result.hasOwnProperty("showed_new_feature_calendar") || !result.showed_new_feature_calendar) {
      Swal.fire({
        icon: 'info',
        title: chrome.i18n.getMessage('new_features_title'),
        html: chrome.i18n.getMessage('new_features_calendar_content'),
        showConfirmButton: false,
        showCloseButton: true,
        cancelButtonText: chrome.i18n.getMessage('cancel'),
        customClass: {
          content: 'new-features-list'
        },
        onClose: function () {
          chrome.storage.sync.set({showed_new_feature_calendar: true});
        }
      })
    }

    if (!result.hasOwnProperty("showed_new_top_sites") || !result.showed_new_top_sites) {
      Swal.fire({
        icon: 'info',
        title: chrome.i18n.getMessage('new_features_title'),
        html: chrome.i18n.getMessage('new_feature_top_sites'),
        showConfirmButton: false,
        showCloseButton: true,
        cancelButtonText: chrome.i18n.getMessage('cancel'),
        onClose: function () {
          chrome.storage.sync.set({showed_new_top_sites: true});
        }
      })
    }

    if (!result.hasOwnProperty('showed_languages') || !result.showed_languages) {
      let currentLocale = chrome.i18n.getUILanguage(),
          html = '';
      if (currentLocale.indexOf('id') !== -1) {
          html = 'This extension is now available in Indonesian!<br /> Our countributors did their best to translate this extension, but if you find any problems or missing translations and you would like to help, please click <a href="https://crowdin.com/project/quran-in-new-tab-extension">here</a>.';
      } else if (currentLocale.indexOf('tr') !== -1) {
        html = 'This extension has now been translated 30% to Turkish!<br /> Our countributors did their best to translate some parts of this extension, but if you find any problems or missing translations and you would like to help, please click <a href="https://crowdin.com/project/quran-in-new-tab-extension">here</a>.';
      } else if (currentLocale.indexOf('en') === -1 && currentLocale.indexOf('ar') === -1) {
        html = 'This extension is now fully available in English and Arabic, and partly in Indonesian and Turkish.<br /><b>If you would like to see this extension translated to your language as well, you can help out by going <a href="https://crowdin.com/project/quran-in-new-tab-extension">here</a>.</b>'
      }
      if (html.length) {
        Swal.fire({
          icon: 'info',
          title: chrome.i18n.getMessage('new_features_title'),
          html, 
          showConfirmButton: false,
          showCloseButton: true,
          cancelButtonText: chrome.i18n.getMessage('cancel'),
          onClose: function () {
            chrome.storage.sync.set({showed_languages: true});
          }
        });
      } else {
        chrome.storage.sync.set({showed_languages: true});
      }
    }
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

  $(".report").click(function() {
    Swal.fire({
      title: chrome.i18n.getMessage('report_image_window_title'),
      html: chrome.i18n.getMessage('report_image_window_content'),
      showConfirmButton: true,
      showCloseButton: true,
      confirmButtonText: chrome.i18n.getMessage('report_image_window_title'),
      showCancelButton: true,
      cancelButtonText: chrome.i18n.getMessage('cancel'),
      showLoaderOnConfirm: true,
      preConfirm: function () {
        const imageElm = $(".background-image");
        if (imageElm.length) {
          return $.ajax({
            url: 'http://quran-extension-api.alwaysdata.net/blacklistImage',
            type: 'PUT',
            data: {image: imageElm.attr('src')},
            success: function (result) {
              return result;
            }
          });
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    }).then (function (result) {
      if (result.isConfirmed) {
        load(true, false, true);
      }
    })
  });

  $(".translation-container").hover(function () {
    $(this).children(".body").show('fast');
  }, function () {
    $(this).children(".body").hide('fast');
  });

  $(".calendar-btn").click(function () {
    $(".calendar-container").addClass("show");
  });

  $(".close-calendar").click(function () {
    $(".calendar-container").removeClass("show");
  });

  function load(reload, withTopSites, isReport = false){
    audio = null;
    $(".reload img").hide();
    $(".reload .loader").show();
    $(".calendar-inner-container").hide();
    $(".calendar-table .loader").show();
    chrome.storage.local.get(['image', 'verse', 'calendar'], function(result){
      chrome.storage.sync.get(['show_translation', 'translation_language', 'recitation',
                                  'translation_identifier', 'show_top_sites', 'show_athkar', 
                                  'calendar_start_day', 'removed_top_sites'], function(syncResult){
        if(navigator.onLine){
          if(!syncResult.hasOwnProperty('show_translation') || !syncResult.hasOwnProperty('translation_language') ||
              !syncResult.show_translation || !syncResult.translation_language || !syncResult.translation_identifier){
                $(".translation-container").remove();
              }
          let now = (new Date()).getTime();
          if(result.hasOwnProperty('image') && result.image && now <= result.image.timeout && !reload && !isReport){
            setBackgroundImage(result.image.src);
          }
          else {
            setNewImage(reload);
          }

          if(result.hasOwnProperty('verse') && result.verse && now <= result.verse.timeout && !reload){
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
            let url = 'http://api.alquran.cloud/v1/ayah/' + verseNumber + '/editions/quran-uthmani-min,';
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
                  } else if(data.data[i].edition.language === "ar"){
                    setVerse(data.data[i]);
                    verse.data = data.data[i];
                  } else {
                    verse.translation = data.data[i];
                    setTranslation(data.data[i]);
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
            result.calendar.data && result.calendar.data.length == result.calendar.hijriHolidays.length) {
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
        }
        else{
          $(".translation-container").remove();
          setBackgroundImage('assets/offline-image.jpg');
          setVerse(getDefaultVerse());
          $(".audio-player").remove();
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
      });
    });
    
    
  }

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

  function showRandomThikr(){
    let thikr = getRandomThikr();
    $(".athkar-container .thikr").html(`
      <span class="thikr-arabic">${thikr.ar}</span>
      <div class="translations">
        <span class="thikr-english">${thikr.en}</span>
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

  function setTranslation(translation){
    $(".translation-container .body").text(translation.text);
    $(".translation-container").show();
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
      url: 'https://source.unsplash.com/' + width + 'x' + height + '/?nature,mountains,landscape,animal,quran,islam',
      headers: {
        'Access-Control-Expose-Headers': 'ETag'
      },
      xhr: function() {
       return xhr;
      },
      success: function(data){
        $.getJSON('http://quran-extension-api.alwaysdata.net/isImageBlacklisted?image=' + encodeURI(xhr.responseURL), 
        function(json, textStatus) {
          if (json.success) {
            if (json.blacklisted) {
              setNewImage(false);
            } else {
              setBackgroundImage(xhr.responseURL);
              let timeout = calculateTimeout();
              chrome.storage.local.set({image: {src: xhr.responseURL, timeout}});
            }
          }
        });
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
            dayStr += '<span class="badge badge-success calendar-note">' + hijriHolidays[i - 1][j] + '</span>';
            hasAshura = hijriHolidays[i - 1][j] == "Ashura";
          }
        }

        if (isFastingDay(parseInt(calendarData[i- 1].hijri.day), originalWeekdays[j], hijriHolidays, 
              i > 1 ? hijriHolidays[i - 2] : [], i < totalDays && hijriHolidays.length > i ? hijriHolidays[i] : [],
              calendarData[i - 1].hijri.month.en)) {
          dayStr += '<span class="badge badge-danger calendar-note">' + chrome.i18n.getMessage('Fasting') + '</span>';
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
      $.get('http://api.aladhan.com/v1/hToG?date=' + hijriDate.iDate() + "-" + (hijriDate.iMonth() + 1) + "-" + hijriDate.iYear(),
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
});
