
let msgs = {
  streamer: async (e, sendResponse) => {
    fetch(`http://localhost:3124/streamer?id=${e.id}`).then(res => res.json()).then(res => {
      console.log(res);
      chrome.tabs.sendMessage({'streamer': res})
    }).catch();
  }
};

if (chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log(request)
    msgs[request.port] && msgs[request.port](request, sendResponse);
    
    return true;
  });
}

chrome.webRequest.onCompleted.addListener(
  (details) => {
    console.log("Request detected:", details.url);
  },
  { urls: ["https://edge.ads.twitch.tv/*"] }
);


function main() {

  // changes_plat = {device: cred.device, }
  console.log('hello from background')
  
}


main();

// chrome.windows.onRemoved.addListener(hardSave);

// let background = chrome.extension.getBackgroundPage();
// background.addEventListener("unload", () => {
//   cache['baj'] = 'bajbaj'
//   save({cache})
// })

// console.log('am i like restarting?');

// add recent stuff with tab.url
// return chrome.tabs.sendMessage(activeInfo.tabId, { type: "username" }, res => {
//   last_streamer = res;
// });
