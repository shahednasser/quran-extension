$(document).ready(function(){

  let translationLanguagesElement = $("select[name=translation_language]"),
      showTranslationElement = $("input[name=show_translation]"),
      recitationElement = $("select[name=recitation]");
  chrome.storage.sync.get(["translation_language", "show_translation", "recitation"], function(result){
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
  });

  $("#save").click(function(){
    $(".alerts").html("");
    let translation_language = translationLanguagesElement.val(),
        translation_identifier = getTranslationLanguageIdentifier(translationLanguagesElement.val()),
        show_translation = showTranslationElement.is(":checked"),
        recitation = recitationElement.val();
    if(translation_identifier === null){
      $(".alerts").html('<div class="alert alert-danger">An error occured, please try again later.</div>')
    }
    chrome.storage.sync.set({translation_language: translation_language, show_translation: show_translation,
                              recitation: recitation, translation_identifier: translation_identifier}, function(){
                                chrome.storage.local.set({image: null, verse: null}, function(){
                                  $(".alerts").html('<div class="alert alert-success">Saved.</div>');
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
});
