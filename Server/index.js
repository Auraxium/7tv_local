const express = require('express');
const app = express();
const cors = require("cors");
const Database = require('better-sqlite3');
const db = new Database('data.db');
db.pragma('journal_mode = WAL');
//01G3WEGZN0000ET2J0MQP5YJ0G
//cdn.7tv.app/emote/01G3WEGZN0000ET2J0MQP5YJ0G/1x.webp 1x, //cdn.7tv.app/emote/01FFRN3K3R0009CAK0J1469HYB/2x.webp 2x, //cdn.7tv.app/emote/01FFRN3K3R0009CAK0J1469HYB/4x.webp 4x
//https://api.betterttv.net/3/cached/users/twitch/22484632
//cdn.betterttv.net/emote/5e87b595acae25096140ca84/1x 1x, //cdn.betterttv.net/emote/5e87b595acae25096140ca84/2x 2x, //cdn.betterttv.net/emote/5e87b595acae25096140ca84/3x 4x

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
  )
  `)

const types = {}

app.use(cors());

app.get('/emote', async (req, res) => {
  if (!req.query.id) return res.end();
  let emote = db.prepare('SELECT img FROM emotes WHERE id = ?').get(req.query.id);
  // console.log(emote);
  if (!emote?.img) {
    let imageBuffer = await fetch(`https://cdn.7tv.app/emote/${req.query.id}/1x.webp`).then(res => res.arrayBuffer()).catch(err => null);
    if (!imageBuffer) return res.end(null);
    emote = { img: Buffer.from(imageBuffer) };
    db.prepare(`INSERT OR IGNORE INTO emotes VALUES (?,?,?)`).run(req.query.id, emote.img, Date.now())
  }
  res.writeHead(200, { 'Content-Type': 'image/png' });
  return res.end(emote.img);
})

app.get('/streamer', async (req, res) => {
  let streamer;
  if (req.query.username) streamer = db.prepare('SELECT emotes FROM streamers WHERE username = ?').get(req.query.username); // {name: id}
  else streamer = db.prepare('SELECT emotes FROM streamers WHERE id = ?').get(req.query.id);
  // console.log(streamer)
  if (!streamer?.emotes) {
    if (!req.query.id) return res.status(500).send('Error: no streamer with username');
    let fet = await Promise.all([
      fetch(`https://7tv.io/v3/users/twitch/${req.query.id}`).then(res => res.json()).then(res => {
        if (!res.emote_set?.emotes?.length) return null;
        return res.emote_set.emotes.map(e => ({
          name: e.name,
          id: e.id,
          type: '7tv'
        }))
      }).catch(err => null),
      fetch(`https://api.betterttv.net/3/cached/users/twitch/${req.query.id}`).then(res => res.json()).then(res => {
        if (!res.channelEmotes?.length) return null;
        return res.channelEmotes.map(e => ({
          name: e.code,
          id: e.id,
          type: 'bttv'
        }))
      }).catch(err => null)
    ]);
    // console.log(fet)
    fet = fet.flat();
    if (!fet?.length) return res.status(500).send('Error: no streamer or emotes');
    streamer = {
      name: fet.username,
      emotes: fet.reduce((acc, e) => {
        acc[e.name] = e;
        return acc;
      }, {})
    }
    db.prepare(`INSERT OR IGNORE INTO streamers VALUES (?,?,?,?)`).run(req.query.id, streamer.name, JSON.stringify(streamer.emotes), Date.now());
  } else {
    streamer.emotes = JSON.parse(streamer.emotes);
  }
  // console.log(streamer);
  return res.json(streamer.emotes);
})

// app.post('/')


app.listen(3124, (port) => console.log('started on 3124'))