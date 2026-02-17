const express = require('express');
const app = express();
const cors = require("cors");
const Database = require('better-sqlite3');
const db = new Database('data.db');
// db.pragma('journal_mode = WAL');
//01G3WEGZN0000ET2J0MQP5YJ0G
//cdn.7tv.app/emote/01G3WEGZN0000ET2J0MQP5YJ0G/1x.webp 1x, //cdn.7tv.app/emote/01FFRN3K3R0009CAK0J1469HYB/2x.webp 2x, //cdn.7tv.app/emote/01FFRN3K3R0009CAK0J1469HYB/4x.webp 4x
//https://api.betterttv.net/3/cached/users/twitch/22484632
//cdn.betterttv.net/emote/5e87b595acae25096140ca84/1x 1x, //cdn.betterttv.net/emote/5e87b595acae25096140ca84/2x 2x, //cdn.betterttv.net/emote/5e87b595acae25096140ca84/3x 4x
//https://api.frankerfacez.com/v1/user/forsen
//cdn.frankerfacez.com/emote/381875/1 1x, //cdn.frankerfacez.com/emote/381875/2 2x, //cdn.frankerfacez.com/emote/381875/4 4x

db.exec(`
  CREATE TABLE IF NOT EXISTS emotes (
    id TEXT PRIMARY KEY,
    img BLOB,
    date INTEGER
  );
  CREATE TABLE IF NOT EXISTS streamers (
    id TEXT PRIMARY KEY,
    username TEXT,
    emotes JSON,
    date INTEGER
  );
  CREATE TABLE IF NOT EXISTS misc (
    key TEXT PRIMARY KEY,
    value TEXT
  )
  `)
// db.exec('drop table misc')

let cred = db.prepare("SELECT value FROM misc WHERE key = 'cred'").get()
cred = cred?.value ? JSON.parse(cred.value) : null;
console.log(cred)
let cache = {};

function isHexFast(str) {
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
    const isHexChar =
      (charCode >= 48 && charCode <= 57) ||  // 0-9
      (charCode >= 65 && charCode <= 70) ||  // A-F
      (charCode >= 97 && charCode <= 102);   // a-f

    if (!isHexChar) return false;
  }
  return str.length > 0;
}

app.use(cors());

app.post('/creds', express.json(), (req, res) => {
  if (req.body.cred?.access_token) {
    cred = req.body.cred;
    db.prepare('insert or ignore into misc values (?,?)').run('cred', JSON.stringify(cred));
  } 
  console.log(req.body, cred)
  res.end();
})

app.get('/emote', async (req, res) => {
  if (!req.query.id) return res.end();
  let emote = db.prepare('SELECT img FROM emotes WHERE id = ?').get(req.query.id);
  // console.log(emote);
  if (!emote?.img) {
    let link = isHexFast(req.query.id) ? `cdn.betterttv.net/emote/${req.query.id}/1x` : `https://cdn.7tv.app/emote/${req.query.id}/1x.webp`;
    let imageBuffer = await fetch(link).then(res => res.arrayBuffer()).catch(err => null);
    if (!imageBuffer) return res.end(null);
    emote = { img: Buffer.from(imageBuffer) };
    db.prepare(`INSERT OR IGNORE INTO emotes VALUES (?,?,?)`).run(req.query.id, emote.img, Date.now())
  }
  res.writeHead(200, { 'Content-Type': 'image/png' });
  return res.end(emote.img);
})

app.get('/streamer', async (req, res) => {
  let streamer;
  let username = req.query.username;
  let id = req.query.id;
  if(!username && !id) return res.end();
  if (username) streamer = db.prepare('SELECT emotes FROM streamers WHERE username = ?').get(username); // {name: id}
  else if (id) streamer = db.prepare('SELECT emotes FROM streamers WHERE id = ?').get(id);
  // console.log(streamer)
  if (!streamer?.emotes) {
    if (!id && username && cred) {
      let ax = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cred.access_token}`,
          "Client-Id": "0helgn8mxggk3ffv53sxgqrmkdojb3",
        },
      }).then((res) => res.json()).catch(console.log);
      if (!ax?.data[0]?.id) return res.status(500).send('Error: no streamer with username');
      id = ax.data[0].id;
    }

    let fet = await Promise.all([
      fetch(`https://7tv.io/v3/users/twitch/${id}`).then(res => res.json()).then(res => {
        if (!res.emote_set?.emotes?.length) return null;
        username = res.username;
        return res.emote_set.emotes.map(e => [e.name, e.id]);
      }).catch(err => null),
      fetch(`https://api.betterttv.net/3/cached/users/twitch/${id}`).then(res => res.json()).then(res => {
        if (!res.channelEmotes?.length) return null;
        return res.channelEmotes.map(e => [e.code, e.id]);
      }).catch(err => null)
    ]);
    // console.log(fet)
    let emotes = fet.flat().filter(Boolean);
    if (!emotes?.length) return res.status(500).send('Error: no streamer or emotes');
    emotes = Object.fromEntries(emotes);
    // return console.log(emotes)
    streamer = { username, emotes };
    db.prepare(`INSERT OR IGNORE INTO streamers VALUES (?,?,?,?)`).run(id, streamer.username, JSON.stringify(streamer.emotes), Date.now());
  } else {
    streamer.emotes = JSON.parse(streamer.emotes);
  }
  // console.log(streamer);
  return res.json(streamer.emotes);
})

// app.post('/')


app.listen(3124, (port) => console.log('started on 3124'))

// https://edge.ads.twitch.tv/2018-01-01/3p/ads?cid=436206574&rt=vast3&dur=30&geoc=US&dt=2&pid=2776469337031770589699104&cb=1318960&ws=754x734&u=https%3A%2F%2Fwww.twitch.tv%2Fvideos%2F2692445092&slots=%5B%7B%22id%22%3A%22twitch-player-ui%22%2C%22mt%22%3A%22v%22%2C%22kv%22%3A%7B%7D%2C%22s%22%3A%22640x480%22%7D%5D&pj=%7B%22game%22%3A%22just_chatting%22%2C%22chan%22%3A%22forsen%22%2C%22chanid%22%3A%2222484632%22%2C%22twitchcorrelator%22%3A%22JtR7mdaevVejGDDgeEkVfjKG3VoLDMoE%22%2C%22ad_session_id%22%3A%22JtR7mdaevVejGDDgeEkVfjKG3VoLDMoE%22%2C%22embed%22%3A%22false%22%2C%22platform%22%3A%22web%22%2C%22mature%22%3A%22true%22%2C%22pos%22%3A%221%22%2C%22timebreak%22%3A%2230%22%2C%22tag%22%3A%22%22%2C%22content_labels%22%3A%22%22%2C%22chantype%22%3A%22partner%22%2C%22delivery_type%22%3A%22csai%22%2C%22vb%22%3A%22null%22%2C%22adunit%22%3A%22web_csai%22%2C%22loggedin%22%3A%22true%22%2C%22v%22%3A%22ARCHIVE%22%2C%22vod_type%22%3A%22undefined%22%2C%22embed_url%22%3A%22null%22%2C%22game_id%22%3A%22509658%22%2C%22user_lang%22%3A%22en%22%7D&gdprl=%7B%22status%22%3A%22cmp%22%7D&pbid=twitch&bp=preroll&aid=TFFAHt7udwYizgjCFte7WzcwunY4zmL8&ulang=en