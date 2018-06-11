const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const Configstore = require('configstore');
const Finity = require('finity');
const utils = require('./utils');
const commands = require('./commands');

//TODO: move configs into commands and configstore
const coffeeTimeout = 3 * 1000; //time in ms before the bot reminds about the coffee break
const morningCoffeeBreak = 9; //time in hours
const afternoonCoffeeBreak = 14; //time in hours
const tolerance = 0.25; //tolerance factor the bot has in hours for coffee time (ex: 14h +- 15 mins)

const config = new Configstore(process.env.CONFIGKEY);
const bot = createBotFiniteStateMachine();
const currentCoffeeParrots = [];

let rtm;
let web;

function createBotFiniteStateMachine() {
  //TODO: add global error state and recovery mechanics
  //TODO: refactor auth process with FSM (possibly as a submachine)
  return Finity
    .configure()
      .initialState('not-started')
        .on('start-bot').transitionTo('starting')
      .state('starting')
        .do(startBot)
          .onSuccess().transitionTo('idle')
          .onFailure().transitionTo('not-started').withAction(utils.log.promiseError)
      .state('idle')
        .onEnter(() => console.log('bot is now idle'))
        .on('coffee-parrot-emoji').transitionTo('coffee-time')
          .withCondition(itsCoffeeTime)
          .withAction(countParroteer)
        .on('flame-command').transitionTo('flaming')
      .state('coffee-time')
        .onEnter(() => console.log('bot is now in coffee time state'))
        .on('coffee-parrot-emoji').selfTransition().withAction(countParroteer)
        .on('coffee-fulfill').transitionTo('idle')
        .on('coffee-cancel').transitionTo('idle')
        .on('coffee-postpone').transitionTo('coffee-postponed')
        .onTimeout(coffeeTimeout).transitionTo('coffee-reminding')
      .state('coffee-reminding')
        .onEnter(calloutMissingPeople)
        .on('coffee-parrot-emoji').transitionTo('coffee-time').withAction(countParroteer)
        .on('coffee-cancel').transitionTo('idle')
        .on('coffee-postpone').transitionTo('coffee-postponed')
      .state('coffee-postponed')
        .onEnter(() => console.log('bot is now postponing break time ...'))
        .on('coffee-postpone').selfTransition()
        .on('coffee-resume').transitionTo('coffee-time')//.withAction(resetCount)
        .on('coffee-cancel').transitionTo('idle')
      .state('flaming')
        .onEnter(() => console.log('roasting somebody'))
        .on('beg-mercy').transitionTo('idle')
      .global()
        .onUnhandledEvent(utils.log.eventError)
    .start(); 
}

function startBot() {
  return new Promise((resolve, reject) => {
    if (!config.get('bot')) {
      reject("Configs corrupted or empty: couldn't find bot object");
      return;
    }

    let token = config.get('bot').bot_access_token;

    if (!token) {
      reject("Configs corrupted: couldn't find bot access token");
      return;
    }

    web = new WebClient(token);
    rtm = new RTMClient(token);

    rtm.start();
    rtm.on('ready', () => commands.init({rtm, web}));
    rtm.on('message', onMessage);
    console.log('bot started');
    resolve();
  });
}

function onMessage(message) {
  if (isFromSelfBot(message)) {
    return;
  }

  if (utils.isCoffeeParrotEmoji(message)) {
    bot.handle('coffee-parrot-emoji', message.user);
  }
}

function isFromSelfBot(msg) {
  return msg.user === rtm.activeUserId;
}

function countParroteer(from, to, context) {
  let userid = context.eventPayload;
  utils.updateArray(currentCoffeeParrots, [userid]);
  if (isEveryoneReady()) {
    bot.handle('coffee-fulfill');
    config.set('skippers', []);
  }
}

function isEveryoneReady() {
  //TODO: check everyone one by one instead of this shit
  return currentCoffeeParrots.length === config.get('roster').length - config.get('skippers').length;
}

function calloutMissingPeople() {
  console.log('bot is now reminding');
  let message = getMissingPeopleMessage();

  rtm.sendMessage(message, config.get('channel'))
    .catch(console.error);
}

function getMissingPeopleMessage() {
  let roster = config.get('roster');
  let missing = utils.getMissingElements(currentCoffeeParrots, roster);
  let message = `*${currentCoffeeParrots.length}/${roster.length}* - `;
  missing.forEach(person => message += utils.userMention(person) + " ");
  return message;
}

function itsCoffeeTime() {
  let date = new Date();
  let hour = date.getHours();
  hour += date.getMinutes() / 60.0;
  let isMorningBreak = morningCoffeeBreak - tolerance < hour == hour < morningCoffeeBreak + tolerance; 
  let isAfternoonBreak = afternoonCoffeeBreak - tolerance < hour == hour < afternoonCoffeeBreak + tolerance;
  return isMorningBreak || isAfternoonBreak;
  //return true;
}

// function sendRandomSlur(channel) {
//   return new Promise((resolve, reject) => {
//     try {
//       let slur = getRandomSlur();
//     }
//     catch(error) {
//       reject(error);
//     }

//     rtm.sendMessage(slur, channel)
//     .then((res) => {
//       resolve('sent msg id: '+ res.ts);
//     })
//     .catch(reject);
//   });
// }

// function getRandomSlur() {
//   let slurs = getSlurs();
//   let index = utils.generateRandomNumberBetween(0, slurs.length);
//   return slurs[index];
// }

// function getSlurs() {
//   if (!config.get('slurs')) {
//     throw "Cannot obtain slurs in configs";
//   }
//   return config.get('slurs');
// }

//gotta work on those exports
module.exports = {
  start: (webserver) => {
    this.expressApp = webserver;
    bot.handle('start-bot');
  },
  
  automata : bot,
  itsCoffeeTime,
  morningCoffeeBreak, 
  afternoonCoffeeBreak, 
  tolerance
};