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

const getCellContent = (str, max, space = " ") => {
  if(str.length < max) {
    const chars = max - str.length;
    return str + space.repeat(chars);
  }
  return str;
}

const getStringifiedQueue = () => {
  if (!queue.length) { 
    return; 
  }
  const header =
      "```| " + `${getCellContent("time", 10)}| ${getCellContent("name", 30)}|\n` +
      getCellContent("", 45, "=");
  const divider = getCellContent("", 45, "-");
  let response = [];
  queue.forEach(item => response.push(`| ${getCellContent(getTimeDifferenceInMinutes(item.date), 10)}| ${getCellContent(item.name, 30)}|\n${divider}`));

  return [header, ...response, "```"].join("\n");
}



const getStringifiedLog = () => {
  if (!log.length) { 
    return; 
  }
  const header =
      "```| " + `${getCellContent("time", 25)}| ${getCellContent("user", 30)}| ${getCellContent("action", 40)}|\n` +
      getCellContent("", 102, "=");
  const divider = getCellContent("", 102, "-");
  let response = [];
  log.forEach(item => {
    const date = item.date.toISOString().split("T")[0];
    const time = item.date.toISOString().split("T")[1].split(".")[0];
    response.push(`| ${getCellContent(`${date} - ${time}`, 25)}| ${getCellContent(item.user, 30)}| ${getCellContent(item.command, 40)}|\n${divider}`)
  });
  return [header, ...response, "```"].join('\n');
}

app.event('app_home_opened', ({ event, say }) => {
  say(`Hello, <@${event.user}>! You can check available commands using /queue help`);
});

app.event('app_mentioned', ({ event, say }) => {
  say(`I'm here, <@${event.user}>!`)
});

app.command('/queue', async ({ command, ack, respond }) => {
  await ack();
  await respond(command.text);
  log.push({ command: command.text, user: command.user_name, date: new Date()});
  const commandParams = command.text.split(' ');
  if(commandParams[1] && !commandParams[1].startsWith('@')) {
    await respond(`Error: Name of entity shoud start with @ symbol`);
    return;
  }

  switch (commandParams[0]) {
    case "help":
      await respond(`
> *list* - show current queue\n
> *add @entity* - add your entity to the queue\n
> *move @entity position* - move entity to specific position (first, last, number)\n
> *remove @entity* - remove your entity from the queue\n
> *log* - show log\n
    `);
      break;
    case "list":
      if (!queue.length) {
        await respond(`queue is empty`);
        return true;
      }
      await respond(getStringifiedQueue());
      break;
    case "log":
      if (!log.length) {
        await respond(`log is empty`);
        return true;
      }
      await respond(getStringifiedLog());
      break;
    case "add":
      if (queue.find(item => item.name.toLowerCase() === commandParams[1].toLowerCase())) {
        await respond(`<${commandParams[1]}> is already in the queue`);
        return;
      }
      queue.push({ name: commandParams[1], date: new Date()});
      await respond(`<${commandParams[1]}> added`);
      await respond(getStringifiedQueue())
      break;
    case "remove":
      if (!queue.length) {
        await respond(`queue is empty`);
        return true;
      }
      if (queue.find(item => item.name.toLowerCase() === commandParams[1].toLowerCase())) {
        queue = queue.filter(item => item.name.toLowerCase() !== commandParams[1].toLowerCase());
        await respond(`<${commandParams[1]}> removed`);
        await respond(`<${queue[0].name}> is in the first position of queue`);
      } else {
        await respond(`failed, entity *${commandParams[1]}* not found in queue`);
      }
      await respond(getStringifiedQueue());
      break;
    case "move":
      if (commandParams[2] !== "first" && commandParams[2] !== "last" && (parseInt(Number(commandParams[2]), 10) < 1 || parseInt(Number(commandParams[2]), 10) > queue.length)) {
        await respond(`the second parameter should be "first", "last" or position number between 1 and ${queue.length}`);
        return true;
      }
      if (!queue.length) {
        await respond(`can't move entity, queue is empty`);
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
        await respond(`<${commandParams[1]}> moved`);
      } else {
        await respond(`failed, entity *${commandParams[1]}* not found in queue`);
      }
      await respond(getStringifiedQueue());
      break;
    default:
      await respond(`:red_circle:  *${command.text}* is not a valid option `);
  }
});
