
let tab = {}

let msgs = {
  streamer: async (e, sendResponse) => {
    fetch(`http://localhost:3124/streamer?id=${e.id}`).then(res => res.json()).then(res => {
      console.log(res);
      chrome.tabs.sendMessage({ 'streamer': res })
    }).catch();
  },
  start: () => chrome.tabs.sendMessage(tab.tabId || 0, { port: "start" }),
};

if (chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    // console.log('req: ', request);
    try {
      msgs[request.port] && msgs[request.port](request, sendResponse);
    } catch (err) {
      console.log(err)
    }

    return true;
  });
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
  tab = activeInfo;
});

function main() {
  console.log('hello from background');
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
