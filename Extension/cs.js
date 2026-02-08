let port = 'http://localhost:3124';

function log(s) {
  console.log('7tv local:', s)
}

async function waitForDOM(query, debug) {
  while(!document.querySelector(query)) {
     await new Promise((y,n) => setTimeout(() => y(""), 1000));
     if(debug) log('waiiting for ' + query);
  }
  await new Promise((y,n) => setTimeout(() => y(""), 1000));
}

log({...window.sessionStorage})
log(document.querySelector('.channel-root__right-column channel-root__right-column--expanded'));

let emotes;
let query = 'img[data-test-selector=image_test_selector]';
(async () => {
  //get name
  let name = '';
  if(+window.location.pathname.split('/').at(-1)) { // is vod
    log('its a  vod')
    for (let e of [...document.querySelectorAll('meta[content]')]) {
      let cnt = e.getAttribute('content');
      // log(cnt)
      if(!cnt.includes(' went live on Twitch')) continue;
      name = cnt.split(' ')[0].toLocaleLowerCase();
      // console.log(name, cnt);
      break;
    }
    if(name) emotes = await fetch(port + `/streamer?username=${name}`).then(res => res.json()).catch(err => console.log(err));
  }
  
  if(!emotes) {
    //get id
    await waitForDOM(query, 1)
    id = document.querySelector(query)?.src.split('-')[1];
    emotes = await fetch(port + `/streamer?id=${id}`).then(res => res.json()).catch(err => console.log(err));
  }

  console.log(emotes);
  if(!emotes) return log('couldnt find emotes');
  let observer = new MutationObserver(callback);
  await waitForDOM('.channel-root__right-column', 1)
  observer.observe(document.querySelector('.channel-root__right-column'), { childList: true, subtree: true });
})();

// class="Layout-sc-1xcs6mc-0 nvivF chat-scrollable-area__message-container chat-scrollable-area__message-container--paused" 
// data-test-selector="chat-scrollable-area__message-container" 
// role="log"

var callback = function (mutationsList, observer) {
  for (var mutation of mutationsList) {
    mutation.addedNodes.forEach(function (node) {
      //<span class="text-fragment" data-a-target="chat-message-text">Twaga</span>
      if(!node?.querySelector) return;
      let ele = node.querySelector('span.text-fragment[data-a-target="chat-message-text"]');
      let msg = ele?.innerHTML;
      if(!msg) return;
      // console.log(msg);
      let add = msg.split(' ').map(e => emotes[e] ? `<img src="http://localhost:3124/emote?id=${emotes[e]}" title="${e}" alt="${e}" lazy="true" />` : e).join(" ");
      ele.innerHTML = add;
    });
  }
};

//sessionstorage now stores new watchstreak with id, and doesnt update till stream loads. so right when page load capture session storage keys, wait till stream load, find the new key. else query name

35780889
42360116
61812950
71092938
81628627
83402203
121059319
248620874
279388141
485587109
517475551

35780889
42360116
61812950
62300805
71092938
81628627
83402203
121059319
248620874
279388141
485587109
517475551

35780889
42360116
56649026
61812950
62300805
71092938
81628627
83402203
121059319
248620874
279388141
485587109
517475551
