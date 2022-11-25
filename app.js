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
let log = [];

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

const getStringifiedLog = () => {
  if (!log.length) { 
    return; 
  }
  const divider = '-------------------';
  let response = [divider];
  log.forEach(item => response.push(`${item.command} - ${item.user}`));
  return [...response, divider].join('\n');
}

app.event('app_home_opened', ({ event, say }) => {
  say(`Hello, <@${event.user}>! You can check available commands using /queue help`);
});

app.event('app_mentioned', ({ event, say }) => {
  say(`I'm here, <@${event.user}>!`)
});

app.command('/queue', async ({ command, ack, respond, say }) => {
  await ack();
  await say(command.text);
  log.push({ command: command.text, user: command.user_name, date: new Date()});
  const commandParams = command.text.split(' ');
  if(commandParams[1] && !commandParams[1].startsWith('@')) {
    await say(`Error: Name of entity shoud start with @ symbol`);
    return;
  }

  switch (commandParams[0]) {
    case "help":
      await say(`*/queue list* - show current queue\n
*/queue add *@entity* - add your entity to the queue\n
*/queue move *@entity* *position* - move entity to specific position (first, last, number)\n
*/queue remove *@entity* - remove your entity from the queue\n
*/queue log - show log\n
`);
      break;
    case "list":
      if (!queue.length) {
        await say(`queue is empty`);
        return true;
      }
      await say(getStringifiedQueue());
      break;
    case "log":
      if (!log.length) {
        await say(`log is empty`);
        return true;
      }
      await say(getStringifiedLog());
      break;
    case "add":
      if (queue.find(item => item.name.toLowerCase() === commandParams[1].toLowerCase())) {
        await say(`<${commandParams[1]}> is already in the queue`);
        return;
      }
      queue.push({ name: commandParams[1], date: new Date()});
      await say(`<${commandParams[1]}> added`);
      await say(getStringifiedQueue());
      break;
    case "remove":
      if (!queue.length) {
        await say(`queue is empty`);
        return true;
      }
      if (queue.find(item => item.name.toLowerCase() === commandParams[1].toLowerCase())) {
        queue = queue.filter(item => item.name.toLowerCase() !== commandParams[1].toLowerCase());
        await say(`<${commandParams[1]}> removed`);
        await say(`<${queue[0].name}> is in the first position of queue`);
      } else {
        await say(`failed, entity *${commandParams[1]}* not found in queue`);
      }
      await say(getStringifiedQueue());
      break;
    case "move":
      console.log(parseInt(Number(commandParams[2]), 10), queue.length);
      if (commandParams[2] !== "first" && commandParams[2] !== "last" && (parseInt(Number(commandParams[2]), 10) < 1 || parseInt(Number(commandParams[2]), 10) > queue.length)) {
        await say(`the second parameter should be "first", "last" or position number between 1 and ${queue.length}`);
        return true;
      }
      if (!queue.length) {
        await say(`can't move entity, queue is empty`);
        return true;
      }
      if (queue.find(item => item.name.toLowerCase() === commandParams[1].toLowerCase())) {
        const date = queue.find(item => item.name.toLowerCase() !== commandParams[1].toLowerCase()).date;
        queue = queue.filter(item => item.name.toLowerCase() !== commandParams[1].toLowerCase());
        const queueEntry = { name: commandParams[1], date: date};
        switch (commandParams[2]) {
          case "first":
            queue.unshift(queueEntry);
            break;
          case "last":
            queue.push(queueEntry);
            break;
          default:
            const position = parseInt(Number(commandParams[2]), 10) - 1;
            queue.splice(position, 0, queueEntry);
            break;
        }
        await say(`<${commandParams[1]}> moved`);
      } else {
        await say(`failed, entity *${commandParams[1]}* not found in queue`);
      }
      await say(getStringifiedQueue());
      break;
    default:
      await say(`:red_circle:  *${command.text}* is not a valid option `);
  }
});
