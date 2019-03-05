//
// Copyright (c) 2019 by Shahed Nasser. All Rights Reserved.
//

$(document).ready(function(){
  let audio;
  load(false, true);

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

  $(".settings-link").click(function(){
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  })

  function load(reload, withTopSites){
    audio = null;
    $(".reload img").hide();
    $(".reload .loader").show();
    chrome.storage.local.get(['image', 'verse'], function(result){
      chrome.storage.sync.get(['show_translation', 'translation_language', 'recitation',
                                  'translation_identifier', 'show_top_sites'], function(syncResult){
        if(navigator.onLine){
          if(!syncResult.hasOwnProperty('show_translation') || !syncResult.hasOwnProperty('translation_language') ||
              !syncResult.show_translation || !syncResult.translation_language || !syncResult.translation_identifier){
                $(".translation-container").remove();
              }
          let now = (new Date()).getTime();
          if(result.hasOwnProperty('image') && result.image && now <= result.image.timeout && !reload){
            setBackgroundImage(result.image.src);
          }
          else {
            let xhr = new XMLHttpRequest();

            $.ajax({
              method: 'GET',
              url: 'https://source.unsplash.com/1600x900/?nature,mountains,landscape',
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

          if(result.hasOwnProperty('verse') && result.verse && now <= result.verse.timeout && !reload){
            setVerse(result.verse.data);
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
        }
        else{
          $(".translation-container").remove();
          setBackgroundImage('assets/offline-image.jpg');
          setVerse(getDefaultVerse());
          $(".audio-player").remove();
        }
        if(withTopSites && syncResult.hasOwnProperty('show_top_sites') && syncResult.show_top_sites){
          chrome.topSites.get(addTopSites);
        }
      });
    });
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
        $(".verse").html('<div class="verse-text">' + data.text + '</div><div class="verse-details">' + data.surah.name +
                            " - " + data.numberInSurah + '</div>').animate({opacity: 1}, 500);
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
  }

  function addTopSites(topSites){
    if(topSites.length){
      let $container = $('<div class="content top-sites-container">');
      $container.appendTo('.content-container');
      for(let i = 0; i < topSites.length; i++){
        $container.append('<a href="' + topSites[i].url + '"><img src="https://plus.google.com/_/favicon?domain_url=' + topSites[i].url + '" />' +
                          topSites[i].title + '</a>')
      }
    }
  }
});
