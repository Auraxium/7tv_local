let port = 'http://localhost:3124';

function log(s) {
  console.log('7tv local:', s)
}

async function waitForDOM(query, debug) {
  while (!document.querySelector(query)) {
    await new Promise((y, n) => setTimeout(() => y(""), 1000));
    if (debug) log('waiiting for ' + query);
  }
  await new Promise((y, n) => setTimeout(() => y(""), 1000));
}

log({ ...window.sessionStorage })
// log(document.querySelector('.channel-root__right-column channel-root__right-column--expanded'));

let emotes;
let query = 'img[data-test-selector=image_test_selector]';
let READY = false;

(async () => {
  //get name
  let name = '';
  if (+window.location.pathname.split('/').at(-1)) { // is vod
    for (let e of [...document.querySelectorAll('meta[content]')]) {
      let cnt = e.getAttribute('content');
      if (!cnt.includes(' went live on Twitch')) continue;
      name = cnt.split(' ')[0].toLocaleLowerCase();
      break;
    }
  } else name = window.location.pathname.split('/').at(-1);
  log(name)
  
  emotes = await fetch(port + `/streamer?username=${name}`).then(res => res.json()).catch(err => console.log(err));

  if (!emotes) {//get id
    await waitForDOM(query, 1)
    id = document.querySelector(query)?.src.split('-')[1];
    emotes = await fetch(port + `/streamer?id=${id}`).then(res => res.json()).catch(err => console.log(err));
  }

  console.log(emotes);
  if (!emotes) return log('couldnt find emotes');
  let observer = new MutationObserver(callback);
  await waitForDOM('.channel-root__right-column', 1)
  observer.observe(document.querySelector('.channel-root__right-column'), { childList: true, subtree: true });
})();

var callback = function (mutationsList, observer) {
  if(!READY) return;
  for (var mutation of mutationsList) {
    mutation.addedNodes.forEach(function (node) {
      if (!node?.querySelector) return;
      let ele = node.querySelector('span.text-fragment[data-a-target="chat-message-text"]');
      let msg = ele?.innerHTML;
      if (!msg) return;
      node.style.display = 'none';
      
      let toLoad = 0;
      let add = msg.split(' ').map(e => {
        let child;
        if(emotes[e]) {
          toLoad++;
          child = document.createElement('img');
          child.src = `http://localhost:3124/emote?id=${emotes[e]}`
          child.onload = () => node.style.display = 'flex';
          child.onerror = () => node.style.display = 'flex';
          child.style.margin = '0px 2px';
          child.style.maxHeight = '26px';
          child.title = e;
          child.alt = e;
          child.loading = 'lazy';
          child.decoding="async";
        } else {
          child = document.createTextNode(` ${e} `);
        }
        if(!toLoad) node.style.display = 'flex';
        return child;
      })
      ele.replaceChildren(...add);
    });
  }
};

let msgs = {
  start: (e) => READY = !READY,
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // log(request);
  msgs[request.port] && msgs[request.port](request, sendResponse);
})
// log(chrome)
//sessionstorage now stores new watchstreak with id, and doesnt update till stream loads. so right when page load capture session storage keys, wait till stream load, find the new key. else query name

// class="Layout-sc-1xcs6mc-0 nvivF chat-scrollable-area__message-container chat-scrollable-area__message-container--paused" 
// data-test-selector="chat-scrollable-area__message-container" 
// role="log"

// document.addEventListener('onload', (e) => console.log('load', e))
// window.addEventListener('onload', (e) => console.log('load', e))