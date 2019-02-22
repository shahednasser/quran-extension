$(document).ready(function(){
  let audio;
  chrome.storage.local.get(['image', 'verse'], function(result){
    if(navigator.onLine){
      let now = (new Date()).getTime();
      if(result.hasOwnProperty('image') && now <= result.image.timeout){
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
          }
        });
      }

      if(result.hasOwnProperty('verse') && now <= result.verse.timeout){
        setVerse(result.verse.data);
      }
      else {
        let verseNumber = Math.floor(Math.random() * 6236) + 1
        $.get('http://api.alquran.cloud/v1/ayah/' + verseNumber + '/ar.alafasy', function(data){
          if(data.data.text){
            setVerse(data.data);
            let timeout = calculateTimeout();
            chrome.storage.local.set({verse: {data: data.data, timeout}});
          }
        });
      }
    }
    else{
      setBackgroundImage('assets/offline-image.jpg');
      setVerse(getDefaultVerse());
    }
  });

  $(".audio-player").click(function(){
    if(!audio){
      chrome.storage.local.get(["verse"], function(result){
        if(result.hasOwnProperty("verse") && result.verse.data.hasOwnProperty("audio")){
          audio = new Audio(result.verse.data.audio);
          audio.play().then(function(){
            $(".audio-player img").attr('src', 'assets/pause.svg');
          })
        }
      });
    } else {
      if(audio.paused){
        audio.play().then(function(){
          $(".audio-player img").attr('src', 'assets/pause.svg');
        });
      } else {
        audio.pause();
        $(".audio-player img").attr('src', 'assets/play.svg');
      }
    }
  });

  function setBackgroundImage(url){
    $(".background-image").attr('src', url).on('load', function(){
      $(this).animate({opacity: 1}, 500);
    }).on('error', function(){
      $(this).attr('src', 'assets/offline-image.jpg').animate({opacity: 1}, 500);
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
});
