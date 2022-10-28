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

let queue = [];

const getTimeDifferenceInMinutes = (date) => {
  const diffTime = Math.abs(new Date() - date);
  return `${Math.round(diffTime / 60000)}min`;
}

const getStringifiedQueue = () => {
  if (!queue.length) { 
    return; 
  }
  const divider = '-------------------';
  let response = [divider];
  queue.forEach(item => response.push(`${getTimeDifferenceInMinutes(item.date)} *${item.name}*`));
  return [...response, divider].join('\n');
}

app.event('app_home_opened', ({ event, say }) => {
  say(`Hello, <@${event.user}>! You chan check available commands using /queue help`);
});

app.event('app_mentioned', ({ event, say }) => {
  say(`I'm here, <@${event.user}>!`)
});

app.command('/queue', async ({ command, ack, respond, say }) => {
  await ack();
  const commandParams = command.text.split(' ');

  switch (commandParams[0]) {
    case "help":
      await say(`*/queue list* - show current queue\n
*/queue add <squad>* - add your squad to the queue\n
*/queue remove <squad>* - remove your squad from the queue\n`);
      break;
    case "list":
      if (!queue.length) {
        await say(`queue is empty`);
        return true;
      }
      await say(getStringifiedQueue());
      break;
    case "add":
      queue.push({ name: commandParams[1], date: new Date()});
      await say(`${commandParams[1]} added`);
      await say(getStringifiedQueue());
      break;
    case "remove":
      if (!queue.length) {
        await say(`queue is empty`);
        return true;
      }
      if (queue.find(item => item.name.toLowerCase() === commandParams[1].toLowerCase())) {
        queue = queue.filter(item => item.name.toLowerCase() !== commandParams[1].toLowerCase());
        await say(`${commandParams[1]} removed`);
      } else {
        await say(`failed, squad *${commandParams[1]}* not found in queue`);
      }
      await say(getStringifiedQueue());
      break;
    default:
      await say(`:red_circle:  *${command.text}* is not a valid option `);
  }
});
