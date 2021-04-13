//
// Copyright (c) 2020 by Shahed Nasser. All Rights Reserved.
//
$(document).ready(function(){
  const messageRegex = /__MSG_(\w+)__/g;
  $("html").attr('lang', chrome.i18n.getUILanguage());
  localizeHtmlPage($("body"));
  let translationLanguagesElement = $("select[name=translation_language]"),
      showTranslationElement = $("input[name=show_translation]"),
      recitationElement = $("select[name=recitation]"),
      showTopSitesElement = $("input[name=show_top_sites]"),
      showAthkarElement = $("input[name=show_athkar]"),
      showDateElement = $("input[name=show_date]"),
      calendarStartDayElement = $("select[name=calendar_start_day]"),
      sendFastingNotificationElement = $("input[name=send_fasting_notification]"),
      showPrayerTimesElement = $("#show_prayer_times"),
      prayerTimesMethodElement = $("#prayer_times_method");
  chrome.storage.sync.get([
    "translation_language", 
    "show_translation", 
    "recitation", 
    "show_top_sites", 
    "show_athkar", 
    "show_date",
    "calendar_start_day",
    "send_fasting_notification",
    "show_prayer_times"], function(result){
    if(result.hasOwnProperty('show_translation') && result.show_translation){
      showTranslationElement.prop('checked', true);
      translationLanguagesElement.prop('disabled', false);
    }

    if(result.hasOwnProperty('translation_language') && !translationLanguagesElement.prop('disabled')){
      translationLanguagesElement.val(result.translation_language);
    }

    if(result.hasOwnProperty('recitation')){
      recitationElement.val(result.recitation);
    }

    showTopSitesElement.prop('checked', !result.hasOwnProperty('show_top_sites') || result.show_top_sites);

    showAthkarElement.prop('checked', !result.hasOwnProperty('show_athkar') || result.show_athkar);

    showDateElement.prop('checked', !result.hasOwnProperty('show_date') || result.show_date)
    
    if (result.hasOwnProperty('calendar_start_day')) {
      calendarStartDayElement.val(result.calendar_start_day);
    }

    sendFastingNotificationElement.prop('checked', result.hasOwnProperty('send_fasting_notification') && result.send_fasting_notification)
    if (!result.hasOwnProperty('show_prayer_times') || result.show_prayer_times) {
      showPrayerTimesElement.prop('checked', true);
      prayerTimesMethodElement.prop('disabled', false);
    }
  });

  $("#save").click(function(){
    $(".alerts").html("");
    let translation_language = translationLanguagesElement.val(),
        translation_identifier = getTranslationLanguageIdentifier(translationLanguagesElement.val()),
        show_translation = showTranslationElement.is(":checked"),
        recitation = recitationElement.val(),
        show_top_sites = showTopSitesElement.is(":checked"),
        show_athkar = showAthkarElement.is(":checked"),
        show_date = showDateElement.is(":checked"),
        calendar_start_day = calendarStartDayElement.val(),
        send_fasting_notification = sendFastingNotificationElement.is(":checked"),
        show_prayer_times = showPrayerTimesElement.is(":checked"),
        prayer_times_method = prayerTimesMethodElement.val();
    if(translation_identifier === null){
      $(".alerts").html('<div class="alert alert-danger">' + chrome.i18n.getMessage('error') + '</div>')
    }
    chrome.storage.sync.set({translation_language: translation_language, show_translation: show_translation,
                              recitation: recitation, translation_identifier: translation_identifier,
                              show_top_sites: show_top_sites, show_athkar: show_athkar, show_date: show_date,
                              calendar_start_day: calendar_start_day, send_fasting_notification: send_fasting_notification,
                              show_prayer_times: show_prayer_times, prayer_times_method: prayer_times_method}, function(){
                                chrome.storage.local.set({image: null, verse: null, prayerTimesCalendar: null}, function(){
                                  $(".alerts").html('<div class="alert alert-success mt-3">' + chrome.i18n.getMessage('saved') + '</div>');

                                  if (send_fasting_notification) {
                                    //check whether it exists or not
                                    chrome.alarms.get('fastingNotification', function (alarm) {
                                      console.log(alarm);
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

  showTranslationElement.change(function(){
    if($(this).is(":checked")){
      translationLanguagesElement.prop('disabled', false);
    } else {
      translationLanguagesElement.prop('disabled', true);
    }
  });

  showPrayerTimesElement.change(function () {
    prayerTimesMethodElement.prop('disabled', !$(this).is(":checked"));
  })

  function getTranslationLanguageIdentifier(code){
    let identifiers = {
      en: 'en.ahmedali',
      none: '',
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
});
