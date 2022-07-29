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

const queue = [];

(async () => {
  try {
    await app.start(process.env.PORT || 3000);
  } catch (e) {
    throw e;
  }
})();


app.command('/queue', async ({ command, ack, respond, say }) => {
  // Acknowledge command request
  await ack();

  switch (command.text) {
    case "show":
      await say(JSON.stringify(queue));
      break;
    case "join":
      queue.push(`Item ${queue.length + 1}`);
      await say(JSON.stringify(queue));
      break;
    default:
      await say(`${command.text} is not a valid option`);
  }
  console.log(command)
});
