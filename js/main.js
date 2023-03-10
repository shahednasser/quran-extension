//
// Copyright (c) 2023 by Shahed Nasser. All Rights Reserved.
//

document.addEventListener("DOMContentLoaded", loadPage());

function loadPage() {
  //initialize variables
  let audio,
    athkar = [],
    originalWeekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    currentHijriMonths = [],
    extensionURL = encodeURI("https://chrome.google.com/webstore/detail/quran-in-new-tab/hggkcijghhpkdjeokpfgbhnpecliiijg"),
    prayerTimeFormat = 24,
    shouldRefresh = false,
    calendarData = [],
    currentVerse = null;
  const messageRegex = /__MSG_(\w+)__/g,
      months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 
        'October', 'November', 'December'],
      hijriMonths = ['Muharram', 'Safar', 'Rabi__al_awwal', 'Rabi__al_thani', 'Jumada_al_ula', 'Jumada_al_akhirah',
        'Rajab', 'Sha_ban', 'Ramadan', 'Shawwal', 'Dhu_al_Qa_dah', 'Dhu_al_Hijjah'],
      currentHijriDate = moment(),
      currentDate = new Date();
  //initialize bootstrap tooltip
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl)
  })
  //initialize toast
  initializeToasts();
  //initialize localization
  document.querySelector("html").setAttribute('lang', chrome.i18n.getUILanguage());
  localizeHtmlPage(document.body);
  //load page's content
  load(false, true);

  //set current date
  chrome.storage.sync.get(["show_date"], function(result){
    if(!result.hasOwnProperty("show_date") || result.show_date){
      const date = new Date();
      setDates(date, currentHijriDate);
    }
  });

  //check if a new update is available
  chrome.runtime.onUpdateAvailable.addListener(function () {
    showUpdateToast();
  });

  //reload everything when reload button is clicked.
  document.querySelector(".reload").addEventListener('click', function(){
    load(true, false);
  });

  //audio player events
  document.querySelector(".audio-player").addEventListener('click', function () {
    const errorElm = document.querySelector(".audio-player .error"),
      imgElm = document.querySelector(".audio-player img"),
      loaderElm = document.querySelector(".audio-player .loader");
    hideElement(errorElm);
    if(!audio){
      chrome.storage.local.get(["verse"], function(result){
        if(result.hasOwnProperty("verse") && result.verse.hasOwnProperty("audio")){
          audio = new Audio(result.verse.audio);
          audio.onloadstart = function(){
            hideElement(errorElm);
            hideElement(imgElm);
            showElement(loaderElm);
          }
          audio.onended = function () {
            imgElm.setAttribute('src', 'assets/play.svg');
          }

          audio.play().then(function(){
            hideElement(errorElm);
            imgElm.setAttribute('src', 'assets/pause.svg');
            showElement(imgElm);
            hideElement(loaderElm);
          }).catch(function(){
            imgElm.setAttribute('src', 'assets/alert-triangle.svg');
            errorElm.textContent = "Can't connect.";
            showElement(errorElm);
            showElement(imgElm);
            hideElement(loaderElm);
          });
        }
      });
    } else {
      if (audio.paused) {
        audio.play().then(function () {
          imgElm.setAttribute('src', 'assets/pause.svg');
        }).catch(function () {
          imgElm.setAttribute('src', 'assets/alert-triangle.svg');
          errorElm.textContent = "Can't connect.";
          showElement(errorElm);
          showElement(imgElm);
          hideElement(loaderElm);
        });
      } else {
        audio.pause();
        imgElm.setAttribute('src', 'assets/play.svg');
      }
    }
  });

  //add event listener to elements that might be dynamically created
  document.body.addEventListener('click', function (e) {
    if (!e.target) {
      return;
    }

    switch (true) {
      case e.target.classList.contains('settings-link') || e.target.classList.contains('notifications-reminder'):
        openOptionPage();
        break;
      case e.target.classList.contains('remove') && e.target.parentNode.tagName.toLowerCase() === "a" && 
          e.target.parentNode.parentNode.classList.contains('top-sites-container'):
        removeTopSites(e);
        break;
      case e.target.classList.contains('favorite-button-list'):
        removeFavorite(e);
        break;
      case e.target.id === 'updateExtension':
        chrome.runtime.reload();
        break;
      case e.target.hasAttribute('data-bs-dismiss'):
        handleDismiss(e);
        break;
    }
  });

  //used to open the option page
  function openOptionPage () {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  }

  //used to remove top sites
  function removeTopSites (e) {
    e.stopPropagation();
    e.preventDefault();

    const parent = e.target.parentNode,
          removeUrl = parent.getAttribute('href');
          
    Swal.fire({
      title: chrome.i18n.getMessage('remove_top_site_title'),
      html: `<div class="text-center">${chrome.i18n.getMessage('remove_top_site_content')}</div>`,
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
              parent.remove();
              Swal.hideLoading();
              Swal.close();
            });
          }
        })
      }
    });
  }

  function getParentByClass(elm, className) {
    if (!elm.parentElement) {
      return null;
    }

    if (elm.parentNode.classList.contains(className)) {
      return elm.parentNode;
    }

    return getParentByClass(elm.parentNode, className);
  }

  //used to remove an item from favorites
  function removeFavorite (e) {
    e.preventDefault();
    const parent = getParentByClass(e.target, 'verse');
    const index = parent.id.split("_")[1];
    chrome.storage.sync.get(['favorite_verses'], function (result) {
      const favorites = result.favorite_verses;
      const verse = favorites[index];
      favorites.splice(index, 1);
      if (currentVerse.surah.number === verse.surah.number && currentVerse.numberInSurah === verse.numberInSurah) {
        document.querySelector(".favorite-button img").setAttribute('src', '/assets/heart.svg');
      }
      chrome.storage.sync.set({favorite_verses: favorites}, function () {
        refreshFavorites();
      })
    })
  }

  //handle dismiss related to bootstrap
  function handleDismiss(e) {
    const selector = e.target.getAttribute('data-bs-dismiss');
    const items = document.querySelectorAll(selector);
    items.forEach((item) => {
      item.classList.remove('show');
    });
  }

  //add event listener to show calendar
  document.querySelector(".calendar-btn").addEventListener('click', function () {
    document.querySelector(".calendar-container").classList.add('show');
  });

  //add event listener to hide calendar
  document.querySelector(".close-calendar").addEventListener('click', function () {
    document.querySelector(".calendar-container").classList.remove('show');
  });

  document.querySelector('.favorite-button').addEventListener('click', function (e) {
    e.preventDefault();
    if (currentVerse) {
      toggleFavorite(currentVerse);
    }
  });

  function load(reload, withTopSites){
    audio = null;
    hideElement(document.querySelector(".reload img"));
    showElement(document.querySelector(".reload .loader"));
    hideElement(document.querySelector(".calendar-inner-container"));
    showElement(document.querySelector(".calendar-table .loader"));
    chrome.storage.local.get(['image', 'verse', 'calendar', 'prayerTimesCalendar'], function(result){
      chrome.storage.sync.get(['show_translation', 'translation_language', 'recitation',
        'translation_identifier', 'show_top_sites', 'show_athkar', 
        'calendar_start_day', 'removed_top_sites', 'show_prayer_times',
        'prayer_times_format', 'should_refresh', 'last_update', 'show_search',
        'favorite_verses', 'background_image_type', 'background_image_type_options'], function(syncResult){
        //check if refresh is enabled on every new tab
        if (syncResult.should_refresh) {
          shouldRefresh = true;
        }
        //show a message if there's a new update
        if (syncResult.last_update && !syncResult.last_update.shown) {
          Swal.fire({
            html: syncResult.last_update.message
          });
          syncResult.last_update.shown = true;
          chrome.storage.sync.set({last_update: syncResult.last_update});
        }
        if(navigator.onLine){
          //check whether translation is enabled or not
          if(!syncResult.hasOwnProperty('show_translation') || !syncResult.hasOwnProperty('translation_language') ||
            !syncResult.show_translation || !syncResult.translation_language || !syncResult.translation_identifier){
              document.querySelector('.translation-container')?.remove();
          }
          let now = (new Date()).getTime();
          //check whether a new image should be loaded or the same image can be used.
          if(result.hasOwnProperty('image') && result.image && !shouldRefresh && now <= result.image.timeout && !reload){
            setBackgroundImage(result.image.src);
          } else {
            setNewImage(syncResult.background_image_type, syncResult.background_image_type_options);
          }

          //check whether a new verse should be loaded or not
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
            //get random verse number
            let verseNumber = Math.floor(Math.random() * 6236) + 1;
            let url = `https://api.alquran.cloud/v1/ayah/${verseNumber}/editions/quran-uthmani-min,`;
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
            fetch(url)
            .then((response) => response.json())
            .then(({data}) => {
              if(data){
                let verse = {};
                for(let i = 0; i < data.length; i++){
                  if(data[i].hasOwnProperty('audio')){
                    verse.audio = data[i].audio;
                  } else if(data[i].edition.type === "quran"){
                    setVerse(data[i]);
                    verse.data = data[i];
                  } else {
                    verse.translation = data[i];
                    let language = data[i].edition.language;
                    setTranslation(data[i], language);
                  }
                }
                let timeout = calculateTimeout();
                verse.timeout = timeout;
                chrome.storage.local.set({verse});
              }
            })
            .catch(() => {
              document.removeChild(".translation-container");
              setVerse(getDefaultVerse());
              document.removeChild(".audio-player");
            })
          }

          //check which day of the week is the start day
          if (syncResult.hasOwnProperty('calendar_start_day')) {
            if (syncResult.calendar_start_day === "Sunday") {
              weekdays.unshift(...weekdays.splice(6));
            }
          }

          //retrieve calendar
          if (result.hasOwnProperty('calendar') && result.calendar && result.calendar.data && 
            result.calendar.hijriMonths) {
            const calendarDate = new Date(result.calendar.date);
            if (calendarDate.getMonth() !== (new Date()).getMonth()) {
              //get calendar for new month
              assembleCalendarData();
            } else {
              //print old calendar
              currentHijriMonths = result.calendar.hijriMonths
              setCalendar(result.calendar.data);
            }
          } else {
            //get new calendar
            assembleCalendarData();
          }

          //whether to show prayer times or not
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
            document.querySelector(".next-prayer").remove();
          }
        }
        else {
          //show default data when offline
          document.querySelector(".translation-container").remove();
          setBackgroundImage('assets/offline-image.jpg');
          setVerse(getDefaultVerse());
          document.querySelector(".audio-player").remove();
        }

        //whether to show search bar or not
        if ((!syncResult.hasOwnProperty('show_search') || syncResult.show_search) && !reload) {
          showSearchBar();
        }

        //whether to show top sites or not
        if(withTopSites && (!syncResult.hasOwnProperty('show_top_sites') || syncResult.show_top_sites)){
          chrome.topSites.get((topSites) => {
            if (syncResult.hasOwnProperty('removed_top_sites')) {
              topSites = filterTopSites(topSites, syncResult.removed_top_sites);
            }
            addTopSites(topSites);
          });
        }

        //whether to show athkar or not
        if(!syncResult.hasOwnProperty('show_athkar') || syncResult.show_athkar){
          if(athkar.length == 0){
            fetch('/js/json/athkar.json')
            .then((response) => response.json())
            .then((json) => {
              athkar = json.athkar;
              showRandomThikr();
            });
          } else {
            showRandomThikr();
          }
        } else {
          document.querySelector(".athkar-container").remove();
          showRandomThikr();
        }

        //show favorite verses
        if (syncResult.hasOwnProperty('favorite_verses')) {
          showFavoriteVerses(syncResult.favorite_verses)
        }
        
      });
  });


  }

  //show a random thikr
  function showRandomThikr(){
    let thikr = getRandomThikr();
    document.querySelector(".athkar-container .thikr").innerHTML = `
      <span class="thikr-arabic">${thikr.ar}</span>
      <div class="translations">
        <span class="thikr-translation-title">Translation</span>
        <span class="thikr-english">${thikr.en}</span>
        <span class="thikr-transliteration-title">Transliteration</span>
        <span class="thikr-ar-en">${thikr['ar-en']}</span>
      </div>
    `;
    showElement(document.querySelector(".athkar-container"));
  }

  //set the background image
  function setBackgroundImage(url){
    const backgroundImageElm = document.querySelector(".background-image");
    backgroundImageElm.addEventListener("load", handleImageLoad);
    backgroundImageElm.addEventListener("error", handleImageError);

    backgroundImageElm.setAttribute('src', url);

    function handleImageLoad () {
      backgroundImageElm.classList.add('show');
      showElement(document.querySelector(".reload img"));
      hideElement(document.querySelector(".reload .loader"));
    }

    function handleImageError () {
      backgroundImageElm.setAttribute('src', 'assets/offline-image.jpg');
    }
  }

  //set the verse
  function setVerse(data){
    currentVerse = data;
    const verseTextElm = document.querySelector(".verse-text");
    const verseDetailsElm = document.querySelector(".verse-details");
    const verseElm = document.querySelector(".verse");

    verseTextElm.textContent = data.text;
    verseDetailsElm.textContent = `${data.surah.name}-${data.numberInSurah}`;
    verseElm.classList.add('show');

    //add social links
    const text = encodeURI(data.text + '\n\n' + data.surah.name + ' - ' + data.numberInSurah);
    //twitter
    let twitterElm = document.querySelector(".twitter-share-button");
    if (twitterElm) {
      twitterElm.setAttribute('href', `https://twitter.com/intent/tweet?text=${text}&url=${extensionURL}`);
    }
    //facebook
    let facebookElm = document.querySelector(".facebook-share-button");
    if (facebookElm) {
      facebookElm.setAttribute('href', `https://www.facebook.com/sharer/sharer.php?u=${extensionURL}&quote=${text}`)
    }
    //whatsapp
    let whatsappElm = document.querySelector(".whatsapp-share-button");
    if (whatsappElm) {
      whatsappElm.setAttribute('href', `https://wa.me/?text=${text + encodeURI("\n") + extensionURL}`);
    }
    //telegram
    let telegramElm = document.querySelector(".telegram-share-button");
    if (telegramElm.length) {
      telegramElm.setAttribute('href', `https://t.me/share/url?url=${extensionURL}&text=${text}`);
    }

    //check if in favorites
    chrome.storage.sync.get(['favorite_verses'], (result) => {
      const favorites = result.hasOwnProperty('favorite_verses') ? result.favorite_verses : [];
      const exists = favorites.some((verse) => verse.surah.number === data.surah.number && verse.numberInSurah === data.numberInSurah);
      const favoriteElm = document.querySelector(".favorite-button img");
      if (exists) {
        favoriteElm.setAttribute('src', '/assets/heart-filled.svg');
      } else {
        favoriteElm.setAttribute('src', '/assets/heart.svg');
      }
    })
  }

  //calculate timeout of data
  function calculateTimeout(){
    return timeout = (new Date()).getTime() + 3600000;
  }

  //get default verse data
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

  //set verse translation
  function setTranslation(translation, language){
    const translationBodyElm = document.querySelector(".translation-body");
    const translationContainerBody = document.querySelector(".translation-container .body");
    if(language === "ar") {
      translationBodyElm.classList.add('ar-translation');
    }
    translationContainerBody.textContent = translation.text;
    showElement(document.querySelector(".translation-container"));
  }

  //show google search bar
  function showSearchBar () {
    const formElm = document.createElement('form');
    formElm.setAttribute('action', 'https://google.com/search');
    formElm.setAttribute('method', 'GET');
    formElm.innerHTML = '<input type="search" name="q" placeholder="Search Google..." class="search-bar" />';
    document.querySelector(".content-container").append(formElm);
  }

  //show top sites
  function addTopSites(topSites){
    userTopSites = topSites;

    if(topSites.length){
      let container = document.createElement("div");
      container.classList.add("content", "top-sites-container");
      document.querySelector('.content-container').appendChild(container);
      topSites.forEach((topSite) => {
        const linkElm = document.createElement('a');
        linkElm.setAttribute('href', topSite.url);
        linkElm.classList.add('shadow');
        linkElm.innerHTML = `
          <img src="https://plus.google.com/_/favicon?domain_url=${topSite.url}" />
            ${topSite.title}
          <span class="remove">x</span>
        `;
        container.append(linkElm);
      })
    }
  }

  //filter top sites
  function filterTopSites (topSites, removedTopSites) {
    removedTopSites.forEach((topSite) => {
      let ind = topSites.findIndex((site) => {
        return site.url == topSite;
      });
      if (ind !== -1) {
        topSites.splice(ind, 1);
      }
    })
    return topSites;
  }

  //function to get a random thikr
  function getRandomThikr(){
    return athkar[Math.floor(Math.random() * athkar.length)];
  }

  //set today's date
  function setDates(dateObj, hijriData){
    document.querySelector(".gregorian-date").textContent = `${dateObj.getDate()}/${dateObj.getMonth() + 1}/${dateObj.getFullYear()}`;
    document.querySelector(".hijri-date").textContent = `${hijriData.iDate()} ${chrome.i18n.getMessage(hijriMonths[hijriData.iMonth()])} ${hijriData.iYear()}`;
  }

  //get a new background image
  function setNewImage(background_image_type, background_image_type_options) {
    let defaultCollection = 4331244
    switch(background_image_type) {
      case 'single_image':
        setBackgroundImage(background_image_type_options);
        //calculate when a new image should be fetched
        let timeout = calculateTimeout();
        chrome.storage.local.set({image: {src: background_image_type_options, timeout}});
        break;
      case 'unsplash_collection':
        defaultCollection = background_image_type_options;
      default:
        //get height and width of screen
        const width = window.innerWidth,
          height = window.innerHeight;

        fetch(`https://source.unsplash.com/collection/${defaultCollection}/${width}x${height}`, {
          headers: {
            'Access-Control-Expose-Headers': 'ETag'
          }
        })
        .then((response) => {
          return response.url
        })
        .then((url) => {
          setBackgroundImage(url);
          //calculate when a new image should be fetched
          let timeout = calculateTimeout();
          chrome.storage.local.set({image: {src: url, timeout}});
        })
        .catch(() => {
          setBackgroundImage('/assets/offline-image.jpg');
        })
    }
  }

  //set a new calendar and add it in the local storage
  function getNewCalendar () {
    setCalendar(calendarData);
    chrome.storage.local.set({calendar: {date: currentDate.toString(), data: calendarData,
      hijriMonths: currentHijriMonths}});
  }

  //set calendar element
  function setCalendar (data) {
    const calendarHeaderElm = document.querySelector(".calendar__header");
    const siblings = getSiblings(calendarHeaderElm)
    siblings.forEach((elm) => elm.remove());
    //set headings
    for (let i = 0; i < calendarHeaderElm.children.length; i++) {
      const child = calendarHeaderElm.children.item(i);
      child.textContent = chrome.i18n.getMessage(weekdays[i]);
    }
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
        //if the current day is not the same weekday, skip
        if (data[i].gregorian.weekday.en != weekdays[z]) {
          continue;
        }
        //if startedDay is not set, check if it's the current day by checking if it's the same weekday
        if (startedDay == -1) {
          if (data[i].gregorian.weekday.en == weekdays[z]) {
            startedDay = i;
          }
        }
  
        //check if the current day is the last day to set endedWeekday
        if (i == nbDates - 1) {
          if (data[i].gregorian.weekday.en !== weekdays[6]) {
            endedWeekday = weekdays.indexOf(data[i].gregorian.weekday.en);
          }
        }
  
        //if today is still not set and it's the current date, set it by index
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

    const calendarBodyElm = document.createElement("div");
    calendarHeaderElm.after(calendarBodyElm);
    calendarBodyElm.innerHTML = html;
    const gregorianMonthElm = document.getElementById("gregorianMonth");
    gregorianMonthElm.textContent = chrome.i18n.getMessage(data[0].gregorian.month.en);
    //assemble hijri months
    let hijriMonthsStr = "";
    for (let j = 0; j < currentHijriMonths.length; j++) {
      if (hijriMonthsStr.length) {
        hijriMonthsStr += "/";
      }
      hijriMonthsStr += chrome.i18n.getMessage(currentHijriMonths[j]);
    }
    const hijriMonthElm = document.getElementById("hijriMonth");
    hijriMonthElm.textContent = hijriMonthsStr;
    hideElement(document.querySelector(".calendar-table .loader"));
    showElement(document.querySelector(".calendar-inner-container"));
  }

  //add week to the calendar element
  function addWeek (fromDay, totalDays, todayDateIndex, calendarData) {
    str = '<div class="calendar__week">';
    let i = fromDay;
    for (let j = 0; j < 7; j++) {

      let additionalClasses = '';
      if (i <= 0 || i > totalDays) {
        additionalClasses = 'not-month-day';
      } else if (todayDateIndex !== null && todayDateIndex == i) {
        additionalClasses = 'today';
      }
      let dayStr = `<div class="calendar__day day ${additionalClasses}">${(i > totalDays || i <= 0 ? "" : `${i}<small class="calendar-hijri-date">${calendarData[i - 1].hijri.day}</small>`)}`;
      if (i <= totalDays && i > 0) {
        if (calendarData[i - 1].hijri.holidays.length) {
          calendarData[i - 1].hijri.holidays.forEach((holiday) => {
            dayStr += `<span class="badge bg-success calendar-note">${holiday}</span>`;
          })
        }

        if (isFastingDay(parseInt(calendarData[i - 1].hijri.day), originalWeekdays[j], calendarData[i - 1].hijri.holidays, 
              i > 1 ? calendarData[i - 2].hijri.holidays : [], i < totalDays ? calendarData[i].hijri.holidays : [],
              calendarData[i - 1].hijri.month.en)) {
          dayStr += `<span class="badge bg-danger calendar-note">${chrome.i18n.getMessage('Fasting')}</span>`;
        }
      }

      
      str += dayStr + '</div>';
      i++;
    }
    str += '</div>';
    return str;
  }

  //check whether a day is a fasting day or not
  function isFastingDay (dayIndex, dayOfWeekName, holidays, dayBeforeHolidays, dayAfterHolidays, monthName) {
    return (dayIndex == 13 && monthName !== 'Dhu_al_Hijjah') || dayIndex == 14 || dayIndex == 15 || dayOfWeekName == "Monday" || dayOfWeekName == "Thursday" || 
      holidays.includes("Ashura") || holidays.includes("Arafa") || dayBeforeHolidays.includes("Ashura") || 
      dayAfterHolidays.includes("Ashura") || monthName === 'Ramadan';
  }

  //localize the strings in an HTML page
  function localizeHtmlPage(elm)
  {
    for (let i = 0; i < elm.children.length; i++) {
      const child = elm.children.item(i);
      //Localize by replacing __MSG_***__ meta tags
      localizeHtmlPage(child);
      //localize values in element's attributes
      for (let j = 0; j < child.attributes.length; j++) {
        const attr = child.attributes.item(j);
        attr.value= attr.value.replace(messageRegex, localizeString);
      }
      //localize the content of the element
      child.innerHTML = child.innerHTML.replace(messageRegex, localizeString);
    }
  }

  //localize a single string
  function localizeString(_, str) {
    return str ? chrome.i18n.getMessage(str) : "";
  }

  //assemble new calendar data
  function assembleCalendarData () {
    const currentYear = currentDate.getFullYear(),
          currentMonth = currentDate.getMonth() + 1;

    fetch(`http://api.aladhan.com/v1/gToHCalendar/${currentMonth}/${currentYear}`)
    .then((response) => response.json())
    .then(({ data }) => {
      calendarData = data;
      data.forEach((date) => {
        if (currentHijriMonths.indexOf(hijriMonths[date.hijri.month.number - 1]) === -1) {
          currentHijriMonths.push(hijriMonths[date.hijri.month.number - 1]);
        }
      })
      getNewCalendar();
    });
  }

  //show a toast when a new update is available
  function showUpdateToast () {
    const toastContainerElm = document.createElement('div');
    toastContainerElm.classList.add('position-fixed', 'bottom-0', 'end-0', 'p-3');
    toastContainerElm.style.zIndex = 11;

    const toastElm = document.createElement('div');
    toastElm.classList.add('toast', 'fade', 'show', 'text-dark');
    toastElm.setAttribute('role', 'alert');
    toastElm.setAttribute('aria-live', 'assertive');
    toastElm.setAttribute('aria-atomic', 'true');
    toastContainerElm.append(toastElm);

    const toastBodyElm = document.createElement('div');
    toastBodyElm.classList.add('toast-body');
    toastElm.append(toastBodyElm);

    const toastBodyContentElm = document.createElement('p');
    toastBodyContentElm.classList.add('fw-bold');
    toastBodyContentElm.textContent = 'A new update is available. You can update now or wait until your browser reloads';
    toastBodyElm.append(toastBodyContentElm);

    const toastActionsElm = document.createElement('div');
    toastActionsElm.classList.add('mt-2', 'pt-2', 'border-top');
    toastBodyElm.append(toastActionsElm);

    const updateButtonElm = document.createElement('button');
    updateButtonElm.setAttribute('type', 'button');
    updateButtonElm.classList.add('btn', 'btn-success', 'btn-sm', 'me-2');
    updateButtonElm.id = 'updateExtension';
    updateButtonElm.textContent = 'Update now';
    toastActionsElm.append(updateButtonElm);

    const closeButtonElm = document.createElement('button');
    closeButtonElm.setAttribute('type', 'button');
    closeButtonElm.classList.add('btn', 'btn-secondary', 'btn-sm');
    closeButtonElm.setAttribute('data-bs-dismiss', '.toast');
    closeButtonElm.textContent = 'Close';
    toastActionsElm.append(closeButtonElm);
    
    document.body.append(toastContainerElm);
  }

  //show favorite verses list
  function showFavoriteVerses (favorites) {
    const container = document.querySelector(".favorite-verses .favorite-content");
    container.innerHTML = '';
    favorites.forEach((verse, index) => {
      const verseElm = document.createElement('div');
      verseElm.classList.add('verse');
      verseElm.id = `verse_${index}`;

      const verseTextElm = document.createElement('p');
      verseTextElm.classList.add('verse-text');
      verseTextElm.textContent = verse.text;
      verseElm.append(verseTextElm);

      const verseDetailsElm = document.createElement('p');
      verseDetailsElm.classList.add('verse-details');
      verseDetailsElm.textContent = `${verse.surah.name + " - " + verse.numberInSurah}`;
      verseElm.append(verseDetailsElm);

      const verseActionsElm = document.createElement('p');
      verseActionsElm.classList.add('verse-actions');
      const favoriteButtonElm = document.createElement('button');
      favoriteButtonElm.classList.add('btn', 'btn-link', 'favorite-button-list', 'text-dark');
      favoriteButtonElm.textContent = 'Remove';
      verseActionsElm.append(favoriteButtonElm);
      verseElm.append(verseActionsElm);

      container.append(verseElm);
    });
  }

  //refresh a favorite list
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
        const favoriteImgElm = document.querySelector('.favorite-button img');
        if (action === 'added') {
          favoriteImgElm.setAttribute('src', '/assets/heart-filled.svg');
        } else {
          favoriteImgElm.setAttribute('src', '/assets/heart.svg');
        }

        const toastContainerElm = document.createElement('div');
        toastContainerElm.classList.add('position-fixed', 'bottom-0', 'end-0', 'p-3');
        toastContainerElm.style.zIndex = 11;

        const toastElm = document.createElement('div');
        toastElm.classList.add('toast', 'fade', 'text-dark', 'show');
        toastElm.setAttribute('role', 'alert');
        toastElm.setAttribute('aria-live', 'assertive');
        toastElm.setAttribute('aria-atomic', 'true');
        toastElm.setAttribute('data-bs-autohide', true);
        toastContainerElm.append(toastElm);

        const toastBodyElm = document.createElement('div');
        toastBodyElm.classList.add('toast-body', 'd-flex', 'justify-content-between');
        toastElm.append(toastBodyElm);

        const toastBodyTextElm = document.createElement('p');
        toastBodyTextElm.classList.add('fw-bold', 'mb-0');
        toastBodyTextElm.textContent = `Ayah ${action} ${action === 'added' ? 'to' : 'from'} favorites!`;
        toastBodyElm.append(toastBodyTextElm);

        const toastActionElm = document.createElement('button');
        toastActionElm.setAttribute('type', 'button');
        toastActionElm.classList.add('btn-close', 'text-dark');
        toastActionElm.setAttribute('data-bs-dismiss', '.toast');
        toastActionElm.setAttribute('aria-label', 'Close');
        toastBodyElm.append(toastActionElm);

        document.body.append(toastContainerElm);
      });
    })
  }

  //get new prayer times calendar
  function getPrayerTimesCalendar () {
    navigator.geolocation.getCurrentPosition((position) => {
      const date = new Date();
      chrome.storage.sync.get(['prayer_times_method'], function (result) {
        fetch(`https://api.aladhan.com/v1/calendar?longitude=${position.coords.longitude}&latitude=${position.coords.latitude}&month=${date.getMonth() + 1}&year=${date.getFullYear()}&method=${result.hasOwnProperty('prayer_times_method') ? result.prayer_times_method : 0}`)
        .then((response) => response.json())
        .then(({data}) => {
          //store it in storage for the entire month
          chrome.storage.local.set({prayerTimesCalendar: {month: date.getMonth(), calendar: data}}, function () {
            getPrayerTimes();
          });
        })
      })
    });
  }

  //add prayer times elements
  function getPrayerTimes() {
    chrome.storage.local.get(['prayerTimesCalendar'], function(result) {
      if (result.hasOwnProperty('prayerTimesCalendar') && result.prayerTimesCalendar.hasOwnProperty('calendar')) {
        //get today's prayer times
        const today = new Date(),
          todayMoment = moment();
        const prayerTimesContainer = document.querySelector(".prayer-times-container"),
              prayerTimesWrapper = document.querySelector(".prayer-times-container .prayer-times-wrapper");
        prayerTimesContainer.classList.add('d-none');
        prayerTimesWrapper.innerHTML = '';
        prayerTimesWrapper.textContent = '';
        let nextPrayerTime = 0, nextPrayerName = '';
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
            prayerTimesWrapper.innerHTML += `
              <div class="prayer-time fajr">${fajr}</div>
              <div class="prayer-time dhuhr">${dhuhr}</div>
              <div class="prayer-time asr">${asr}</div>
              <div class="prayer-time maghrib">${maghrib}</div>
              <div class="prayer-time isha">${isha}</div>
            `
            prayerTimesContainer.classList.remove('d-none');
            return true; //break the loop
          }
          return false;
        });

        if (nextPrayerTime) {
          document.querySelector(".next-prayer").textContent = nextPrayerName + " " + nextPrayerTime;
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

  //initialize toasts in the page
  function initializeToasts () {
    const toastElList = [].slice.call(document.querySelectorAll('.toast:not(.hide)'))
    toastElList.map(function (toastEl) {
      new bootstrap.Toast(toastEl, {
        animation: true
      });
    });
  }

  //hide element using the hide class
  function hideElement (elm) {
    elm.classList.add("hide");
  }

  //show elements by removing the hide class
  function showElement (elm) {
    elm.classList.remove("hide");
  }

  //get all siblings of an element
  function getSiblings (elm) {
    // create an empty array
    let siblings = [];

    // if no parent, return empty list
    if (!elm.parentNode) {
        return siblings;
    }

    // first child of the parent node
    let sibling = elm.parentNode.firstElementChild;

    // loop through next siblings until `null`
    do {
        // push sibling to array
        if (sibling != elm) {
            siblings.push(sibling);
        }
    } while (sibling = sibling.nextElementSibling);
		
    return siblings;
  }
}
