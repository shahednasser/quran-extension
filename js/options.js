$(document).ready(function(){

  let translation_languages = allTranslations(),
      translationLanguagesElement = $("select[name=translation_language]");
  chrome.storage.sync.get(["default_translation"], function(result){
    for(let i = 0; i < translation_languages.length; i++){
      let isSelected = result.hasOwnProperty('default_translation') ? result.default_translation === translation_languages[i].code :
                       translation_languages[i].code === "none";
      translationLanguagesElement.append('<option value="' + translation_languages[i].code + '"' +
                                          (isSelected ? ' selected' : '') + '>' + translation_languages[i].name + '</option>');
    }
  });

  function allTranslations(){
    return [{
      code: 'none',
      name: 'None'
    },
    {
      code: "en",
      name: 'English'
    },
    {
      code: "az",
      name: 'Azerbaijani'
    },
    {
      code: "bn",
      name: 'Bengali'
    },
    {
      code: "cs",
      name: 'Czech'
    },
    {
      code: 'de',
      name: 'German'
    },{
      code: "dv",
      name: 'Divehi / Maldivian'
    },
    {
      code: "es",
      name: 'Spanish'
    },
    {
      code: "fa",
      name: 'Farsi'
    },
    {
      code: "fr",
      name: 'French'
    },
    {
      code: "ha",
      name: 'Hausa'
    },
    {
      code: "hi",
      name: 'Hindi'
    },
    {
      code: "id",
      name: 'Indonesian'
    },
    {
      code: "it",
      name: 'Italian'
    },
    {
      code: "ja",
      name: 'Japanese'
    },
    {
      code: "ko",
      name: 'Korean'
    },
    {
      code: "ku",
      name: 'Kurdish'
    },
    {
      code: "ml",
      name: 'Malayalam'
    },
    {
      code: "nl",
      name: 'Dutch'
    },
    {
      code: "no",
      name: 'Norwegiwn'
    },
    {
      code: "pl",
      name: 'Polish'
    },
    {
      code: "pt",
      name: 'Portuguese'
    },
    {
      code: "ro",
      name: 'Romanian'
    },
    {
      code: "ru",
      name: 'Russian'
    },
    {
      code: "sd",
      name: "Sindhi"
    },
    {
      code: "so",
      name: "Somali"
    },
    {
      code: "sq",
      name: 'Albanian'
    },
    {
      code: "sv",
      name: 'Swedish'
    },
    {
      code: "sw",
      name: "Swahili"
    },
    {
      code: "ta",
      name: "Tamil"
    },
    {
      code: "tg",
      name: "Tajik"
    },
    {
      code: "th",
      name: "Thau"
    },
    {
      code: "tr",
      name: "Turkish"
    },
    {
      code: "tt",
      name: "Tatar"
    },
    {
      code: "ug",
      name: "Uyghur"
    },
    {
      code: "ur",
      name: "Urdu"
    },
    {
      code: "uz",
      name: "Uzbek"
    }];
  }

  function allRecitations(){
    return [{
      identifier: "ar.abdullahbasfar",
      language: "ar",
      name: "Abdullah Basfar",
    },
    {
      identifier: "ar.abdurrahmaansudais",
      language: "ar",
      name: "Abdurrahmaan As-Sudais"
    },
    {
      identifier: "ar.abdulsamad"
      language: "ar"
      name: "Abdul Samad"
    },
    {
      identifier: "ar.shaatree"
      language: "ar"
      name: "Abu Bakr Ash-Shaatree"
    },
    {
      identifier: "ar.ahmedajamy",
      language: "ar",
      name: "Ahmed ibn Ali al-Ajamy"
    },
    {
      identifier: "ar.alafasy",
      language: "ar",
      name: "Alafasy"
    },
    {
      identifier: "ar.hanirifai",
      language: "ar",
      name: "Hani Rifai"
    },
    {
      identifier: "ar.husary",
      language: "ar",
      name: "Husary"
    },
    {
      identifier: "ar.husarymujawwad",
      language: "ar",
      name: "Husary (Mujawwad)"
    },
    {
      identifier: "ar.hudhaify",
      language: "ar",
      name: "Hudhaify"
    },
    {
      identifier: "ar.ibrahimakhbar",
      language: "ar",
      name: "Ibrahim Akhdar"
    },
    {
      identifier: "ar.mahermuaiqly",
      language: "ar",
      name: "Maher Al Muaiqly"
    },
    {
      identifier: "ar.muhammadayyoub",
      language: "ar",
      name: "Muhammad Ayyoub"
    },
    {
      identifier: "ar.muhammadjibreel",
      language: "ar",
      name: "Muhammad Jibreel"
    },
    {
      identifier: "ar.saoodshuraym",
      language: "ar",
      name: "Saood bin Ibraaheem Ash-Shuraym"
    },
    {
      identifier: "en.walk"
      language: "en"
      name: "Ibrahim Walk"
    },
    {
      identifier: "ar.parhizgar",
      language: "ar",
      name: "Parhizgar"
    },
    {
      identifier: "ur.khan",
      language: "ur",
      name: "Shamshad Ali Khan"
    },
    {
      identifier: "zh.chinese",
      language: "zh",
      name: "中文"
    },
    {
      identifier: "fr.leclerc",
      language: "fr",
      name: "Youssouf Leclerc"
    }
    ]
  }
})
