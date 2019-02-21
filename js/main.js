$(document).ready(function(){

  chrome.storage.local.get(['image', 'verse'], function(result){
    let now = (new Date()).getTime();
    if(result.hasOwnProperty('image') && now <= result.image.timeout){
      setBackgroundImage(result.image.src);
    }
    else {
      let xhr;
      let _orgAjax = jQuery.ajaxSettings.xhr;
      jQuery.ajaxSettings.xhr = function () {
        xhr = _orgAjax();
        return xhr;
      };

      $.ajax({
        method: 'GET',
        url: 'https://source.unsplash.com/1600x900/?nature,mountains,landscape',
        headers: {
          'Access-Control-Expose-Headers': 'ETag'
        },
        success: function(data){
          setBackgroundImage(xhr.responseURL);
          let timeout = calculateTimeout();
          chrome.storage.local.set({image: {src: xhr.responseURL, timeout}});
        }
      });
    }

    if(result.hasOwnProperty('verse') && now <= result.verse.timeout){
      setVerse(result.verse.data);
    }
    else {
      let verseNumber = Math.floor(Math.random() * 6236) + 1
      $.get('http://api.alquran.cloud/v1/ayah/' + verseNumber, function(data){
        if(data.data.text){
          setVerse(data.data);
          let timeout = calculateTimeout();
          chrome.storage.local.set({verse: {data: data.data, timeout}});
        }
      });
    }
  });

  function setBackgroundImage(url){
    $(".background-image").attr('src', url).on('load', function(){
      $(this).animate({opacity: 1}, 500);
    });
  }

  function setVerse(data){
        $(".verse").html('<div class="verse-text">' + data.text + '</div><div class="verse-details">' + data.surah.name +
                            " - " + data.numberInSurah + '</div>').animate({opacity: 1}, 500);
  }

  function calculateTimeout(){
    return timeout = (new Date()).getTime() + 3600000;
  }
});
