let cred = {}
let cache = {};
let port = 'http://localhost:3124';

// const socket = new WebSocket("wss://example.com/chat");
chrome.storage.local.get(['7tvlocal_cred']).then(res => console.log(res));

async function axi(s) {
  let now = Date.now();

  if (cache[s]) {
    if (cache[s] == -1) return 0;
    if (cache[s].date > now) return cache[s].res;
    else delete cache[s];
  }
  cache[s] = -1;

  let ax = await fetch(s, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${cred.access_token}`,
      "Client-Id": "0helgn8mxggk3ffv53sxgqrmkdojb3",
    },
  })
    .then((res) => res.json())
    .catch((err) => delete cache[s]);

  cache[s] = { res: { ...ax, cached: true, now }, date: now + 1000 * 60 * 2 };
  return ax;
}

async function auth() {
  let popup = window.open(`https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=0helgn8mxggk3ffv53sxgqrmkdojb3&redirect_uri=https://misc.auraxium.dev/twotch&scope=user%3Aread%3Afollows&state=${window.location.href}`, "popup", "popup=true");

  let auth = (event) => {
    console.log(event);
    if (event.origin != "https://misc.auraxium.dev") return;
    // if (!event.data?.slice || event.data.slice(0, 4) != 'tsf_') return;
    let ind = event.data.indexOf("access_token=");
    if (ind == -1) {
      window.removeEventListener("message", auth);
      popup.close();
      return;
    }
    let ac = event.data.slice(ind + 13, event.data.length);
    if (ac == "null") {
      window.removeEventListener("message", auth);
      popup.close();
      return;
    }
    // console.log('ac:', ac);
    window.removeEventListener("message", auth);
    popup.close();

    cred.access_token = ac;
    console.log(cred)
    fetch(port + '/creds', {
      method: 'POST',
      body: JSON.stringify({cred}),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  };

  window.addEventListener("message", auth, false);
}

async function main() {

}

main();

document.querySelector('.start').addEventListener('click', () => {
  chrome.runtime.sendMessage({port: 'start'});
})

document.querySelector('.login').addEventListener('click', auth)


//#endregion