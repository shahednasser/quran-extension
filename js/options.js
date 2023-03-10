//
// Copyright (c) 2023 by Shahed Nasser. All Rights Reserved.
//
document.addEventListener("DOMContentLoaded", loadPage());

function loadPage() {
  const messageRegex = /__MSG_(\w+)__/g;
  document.querySelector('html').setAttribute('lang', chrome.i18n.getUILanguage())
  localizeHtmlPage(document.body);
  let translationLanguagesElement = document.querySelector('select[name=translation_language]'),
      showTranslationElement = document.querySelector('input[name=show_translation]'),
      recitationElement = document.querySelector('select[name=recitation]'),
      showTopSitesElement = document.querySelector('input[name=show_top_sites]'),
      showAthkarElement = document.querySelector('input[name=show_athkar]'),
      showDateElement = document.querySelector('input[name=show_date]'),
      calendarStartDayElement = document.querySelector('select[name=calendar_start_day]'),
      sendFastingNotificationElement = document.querySelector('input[name=send_fasting_notification]'),
      showPrayerTimesElement = document.querySelector('#show_prayer_times'),
      prayerTimesMethodElement = document.querySelector('#prayer_times_method'),
      prayerTimesFormatElement = document.querySelector('#prayer_times_format'),
      shouldRefreshElement = document.querySelector('#should_refresh'),
      showSearchElement = document.querySelector('#show_search'),
      backgroundImageTypeElements = document.querySelectorAll('input[name=background_image_type]'),
      unsplashCollectionElement = document.querySelector('#collection_id'),
      singleImageElement = document.querySelector('#single_image_file'),
      imageFile = null;

  chrome.storage.sync.get([
    'translation_language', 
    'show_translation',
    'recitation', 
    'show_top_sites', 
    'show_athkar', 
    'show_date',
    'calendar_start_day',
    'send_fasting_notification',
    'show_prayer_times',
    'prayer_times_method',
    'prayer_times_format',
    'should_refresh',
    'show_search',
    'background_image_type',
    'background_image_type_options'], function(result){
    if(result.hasOwnProperty('show_translation') && result.show_translation){
      showTranslationElement.checked = true;
      translationLanguagesElement.disabled = false;
    }

    if(result.hasOwnProperty('translation_language') && !translationLanguagesElement.disabled){
      translationLanguagesElement.value = result.translation_language;
    }

    if(result.hasOwnProperty('recitation')){
      recitationElement.value = result.recitation;
    }

    showTopSitesElement.checked = !result.hasOwnProperty('show_top_sites') || result.show_top_sites;

    showAthkarElement.checked = !result.hasOwnProperty('show_athkar') || result.show_athkar;

    showDateElement.checked = !result.hasOwnProperty('show_date') || result.show_date
    
    if (result.hasOwnProperty('calendar_start_day')) {
      calendarStartDayElement.value = result.calendar_start_day;
    }

    sendFastingNotificationElement.checked = result.hasOwnProperty('send_fasting_notification') && result.send_fasting_notification;

    if (!result.hasOwnProperty('show_prayer_times') || result.show_prayer_times) {
      showPrayerTimesElement.checked = true;
      prayerTimesMethodElement.disabled = false;
      prayerTimesFormatElement.disabled = false;
    }

    if (result.hasOwnProperty('prayer_times_method')) {
      prayerTimesMethodElement.value = result.prayer_times_method
    }

    if (result.hasOwnProperty('prayer_times_format')) {
      prayerTimesFormatElement.value = result.prayer_times_format
    }

    shouldRefreshElement.checked = !result.hasOwnProperty('should_refresh') || result.should_refresh;
    showSearchElement.checked = !result.hasOwnProperty('show_search') || result.show_search;

    if (result.background_image_type) {
      document.querySelector(`input[name=background_image_type][value=${result.background_image_type}]`).checked = true

      if (result.background_image_type_options) {
        switch(result.background_image_type) {
          case 'unsplash_collection':
            unsplashCollectionElement.parentElement.classList.remove('d-none');
            unsplashCollectionElement.value = result.background_image_type_options;
            break;
          case 'single_image':
            singleImageElement.parentElement.classList.remove('d-none');
            setImage(result.background_image_type_options)
            break;
        }
      }
    } else {
      document.querySelector('input[name=background_image_type][value=default]').checked = true
    }
  });

  document.querySelector('#save').addEventListener('click', () => {
    document.querySelector('.alerts').innerHTML = '';
    let translation_language = translationLanguagesElement.value,
        translation_identifier = getTranslationLanguageIdentifier(translationLanguagesElement.value),
        show_translation = showTranslationElement.checked,
        recitation = recitationElement.value,
        show_top_sites = showTopSitesElement.checked,
        show_athkar = showAthkarElement.checked,
        show_date = showDateElement.checked,
        calendar_start_day = calendarStartDayElement.value,
        send_fasting_notification = sendFastingNotificationElement.checked,
        show_prayer_times = showPrayerTimesElement.checked,
        prayer_times_method = prayerTimesMethodElement.value,
        prayer_times_format = prayerTimesFormatElement.value,
        should_refresh = shouldRefreshElement.checked,
        show_search = showSearchElement.checked,
        background_image_type = document.querySelector('input[name=background_image_type]:checked').value,
        background_image_type_options = '';

    if(translation_identifier === null){
      document.querySelector('.alerts').innerHTML = `<div class="alert alert-danger">${chrome.i18n.getMessage('error')}</div>`
      return;
    }

    switch(background_image_type) {
      case 'unsplash_collection':
        background_image_type_options = unsplashCollectionElement.value?.trim();
        if (!background_image_type_options) {
          document.querySelector('.alerts').innerHTML = `<div class="alert alert-danger">${chrome.i18n.getMessage('unsplash_error')}</div>`;
          return;
        }
        break;
      case 'single_image':
        background_image_type_options = imageFile;
        if (!background_image_type_options) {
          document.querySelector('.alerts').innerHTML = `<div class="alert alert-danger">${chrome.i18n.getMessage('file_error')}</div>`;
          return;
        }
    }

    chrome.storage.sync.set({
      translation_language, 
      show_translation,
      recitation,
      translation_identifier,
      show_top_sites,
      show_athkar,
      show_date,
      calendar_start_day,
      send_fasting_notification,
      show_prayer_times,
      prayer_times_method,
      prayer_times_format,
      should_refresh,
      show_search,
      background_image_type, 
      background_image_type_options
    }, () => {
      chrome.storage.local.set({
        image: null,
        verse: null,
        prayerTimesCalendar: null,
        calendar: null
      }, () => {
        document.querySelector('.alerts').innerHTML = `<div class="alert alert-success mt-3">${chrome.i18n.getMessage('saved')}</div>`;

        if (send_fasting_notification) {
          //check whether it exists or not
          chrome.alarms.get('fastingNotification', (alarm) => {
            if (!alarm || alarm.name != "fastingNotification") {
              //create an alarm
              chrome.alarms.create('fastingNotification', {
                when: Date.now(),
                periodInMinutes: 1440 //every day
              });
            }
          });
        } else {
          chrome.alarms.clear('fastingNotification');
        }
      });
    });
  });

  showTranslationElement.addEventListener('change', (e) => {
    if(e.target.checked){
      translationLanguagesElement.disabled = false;
    } else {
      translationLanguagesElement.disabled = true;
    }
  });

  showPrayerTimesElement.addEventListener('change', (e) => {
    prayerTimesMethodElement.disabled = !e.target.checked;
    prayerTimesFormatElement.disabled = !e.target.checked;
  })

  backgroundImageTypeElements.forEach((element) => {
    element.addEventListener('change', (e) => {
      document.querySelector('.background-image-input')?.classList.add('d-none')
      switch(e.target.value) {
        case 'unsplash_collection':
          unsplashCollectionElement.parentElement.classList.remove('d-none');
          return;
        case 'single_image':
          singleImageElement.parentElement.classList.remove('d-none');
          return;
      }
    })
  })

  singleImageElement.addEventListener('change', () => {
    //get base64
    imageFile = URL.createObjectURL(this.files[0])
    setImage(imageFile)
  })

  function setImage (url) {
    singleImageElement.nextSibling?.remove();
    const imgElement = document.createElement('img');
    imgElement.src = url;
    imgElement.className = 'img-fluid';
    imgElement.style.width = '400px';
    imgElement.style.height = '400px';
    singleImageElement.after(imgElement);
    // singleImageElement.after('<img src="' + url + '" class="img-fluid" style="width: 400px; height: 400px;" />')
  }

  function getTranslationLanguageIdentifier(code){
    let identifiers = {
      en: 'en.ahmedali',
      none: '',
      ar: 'ar.muyassar',
      az: 'az.mammadaliyev',
      bn: 'bn.bengali',
      cs: 'cs.hrbek',
      de: 'de.aburida',
      dv: 'dv.divehi',
      es: 'es.cortes',
      fa: 'fa.ayati',
      fr: 'fr.hamidullah',
      ha: 'ha.gumi',
      hi: 'hi.hindi',
      id: 'id.indonesian',
      it: 'it.piccardo',
      ja: 'ja.japanese',
      ko: 'ko.korean',
      ku: 'ku.asan',
      ml: 'ml.abdulhameed',
      nl: 'nl.keyzer',
      no: 'no.berg',
      pl: 'pl.bielawskiego',
      pt: 'pt.elhayek',
      ro: 'ro.grigore',
      ru: 'ru.kuliev',
      sd: 'sd.amroti',
      so: 'so.abduh',
      sq: 'sq.ahmeti',
      sv: 'sv.bernstrom',
      sw: 'sw.barwani',
      ta: 'ta.tamil',
      tg: 'tg.ayati',
      th: 'th.thai',
      tr: 'tr.ates',
      tt: 'tt.nugman',
      ug: 'ug.saleh',
      ur: 'ur.ahmedali',
      uz: 'uz.sodik'
    }
    return identifiers.hasOwnProperty(code) ? identifiers[code] : null;
  }

  function localizeHtmlPage(elm)
  {
      //Localize by replacing __MSG_***__ meta tags
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

  function localizeString(_, str) {
      return str ? chrome.i18n.getMessage(str) : '';
  }
}
