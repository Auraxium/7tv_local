let tab = {}

let msgs = {
  streamer: async (e, sendResponse) => {
    fetch(`http://localhost:3124/streamer?id=${e.id}`).then(res => res.json()).then(res => {
      console.log(res);
      chrome.tabs.sendMessage({ 'streamer': res });
    }).catch(console.log);
  },
  start: () => chrome.tabs.sendMessage(tab.tabId || 0, { port: "start" }),
};

if (chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    console.log('req: ', request);
    (async () => msgs[request.port] && msgs[request.port](request, sendResponse))().catch(console.log);
    // msgs[request.port] && msgs[request.port](request, sendResponse)
  
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