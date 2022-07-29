require('dotenv/config');
// const express = require('express')
// const app = express()
// const port = 3000

const { App } = require('@slack/bolt');
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});


(async () => {
  try {
    await app.start(process.env.PORT || 3000);
  } catch (e) {
    throw e;
  }
})();


app.event('app_home_opened', ({ event, say }) => {
  say(`Hello world, <@${event.user}>!`)
});


app.event('app_mentioned', ({ event, say }) => {
  say(`Hello world, <@${event.user}>!`)
});
