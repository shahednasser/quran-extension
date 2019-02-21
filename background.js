chrome.runtime.onInstalled.addListener(function(){
  chrome.storage.sync.set({color: '#a33aaa'}, function(){
    console.log("I don't know what this color is.");
  })
})
