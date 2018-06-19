const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const Configstore = require('configstore');
const Finity = require('finity');
const utils = require('./utils');
const commands = require('./commands');

//TODO: trash configstore

const config = new Configstore(process.env.CONFIGKEY);
const currentCoffeeParrots = [];
const skippers = [];

const slurs = ['fuck you', 'bitch']

const GENERALCHANNEL = "general";

const SETTINGS = {
  coffeeTimeout: 30 * 1000,
  morningCoffeeBreak: 9,
  afternoonCoffeeBreak: 14,
  tolerance: 0.5 
}

const bot = createBotFiniteStateMachine();

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
        .on('coffee-fulfill').transitionTo('idle').withAction(sendGo)
        .on('coffee-cancel').transitionTo('idle')
        .on('coffee-postpone').transitionTo('coffee-postponed')
        .onTimeout(SETTINGS.coffeeTimeout).transitionTo('coffee-reminding')
      .state('coffee-reminding')
        .onEnter(calloutMissingPeople)
        .on('coffee-parrot-emoji').transitionTo('coffee-time').withAction(countParroteer)
        .on('coffee-cancel').transitionTo('idle')
        .on('coffee-postpone').transitionTo('coffee-postponed')
        .on('coffee-resolve').transitionTo('idle').withAction(sendGo)
      .state('coffee-postponed')
        .onEnter(() => console.log('bot is now postponing break time ...'))
        .on('coffee-postpone').selfTransition()
        .on('coffee-resume').transitionTo('coffee-time')//.withAction(resetCount)
        .on('coffee-cancel').transitionTo('idle')
      .state('flaming')
        .onEnter(() => console.log('roasting somebody'))
        .on('message').selfTransition().withAction(flame)
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

//ive decided that was really bad, TODO: rewrite this
function onMessage(message) {
  bot.handle('message', message);
  validate(message)
    .then(isNotFromChannelGeneral)
    .then(isNotPrivateMessage)
    .then(isNotFromSelf)
    .then(isCoffeeParrotEmoji)
    .then(isNotSkipper)
    .then(payload => {
      if (payload.valid) {
        bot.handle('coffee-parrot-emoji', message.user);
      }
    })
    .catch(console.error);
}

function validate(message) {
  return web.conversations.info({ channel: message.channel })
    .then(res => {
      return {
        valid: true,
        channel: res.channel,
        message,
        botId: rtm.activeUserId
       };
    });
}

function isNotPrivateMessage(payload) {
  payload.valid = payload.valid && !payload.channel.is_im;
  return payload;
}

function isNotFromChannelGeneral(payload) {
  payload.valid = payload.valid && payload.channel.name !== GENERALCHANNEL;
  return payload;
}

function isNotFromSelf(payload) {
  payload.valid = payload.valid && payload.message.user !== payload.botId;
  return payload;
}

function isCoffeeParrotEmoji(payload) {
  payload.valid = payload.valid && payload.message.text.startsWith(':coffeeparrot:');
  return payload;
}

function isNotSkipper(payload) {
  payload.valid = payload.valid && !(skippers.some(person => person === payload.message.user))
  return payload;
}

function countParroteer(from, to, context) {
  let userid = context.eventPayload;

  utils.updateArray(currentCoffeeParrots, [userid]);
  if (isEveryoneReady()) {
    bot.handle('coffee-fulfill');
  }
}

const isEveryoneReady = () => 
  utils.compareLists(utils.trimLists(config.get('roster'), skippers), currentCoffeeParrots)

function calloutMissingPeople() {
  console.log('bot is now reminding');
  let message = getMissingPeopleMessage();

  rtm.sendMessage(message, config.get('channel'))
    .catch(console.error);
}

function getMissingPeopleMessage() {
  let roster = config.get('roster');
  let missing = utils.trimLists(roster, currentCoffeeParrots);
  missing = utils.trimLists(missing, skippers);

  let message = `*${currentCoffeeParrots.length}/${roster.length - skippers.length}* - `;
  missing.forEach(person => message += utils.userMention(person) + " ");
  return message;
}

function itsCoffeeTime() {
  let isMorningBreak = utils.isHourWithinTolerance(SETTINGS.morningCoffeeBreak, SETTINGS.tolerance);
  let isAfternoonBreak = utils.isHourWithinTolerance(SETTINGS.afternoonCoffeeBreak, SETTINGS.tolerance);
  return isMorningBreak || isAfternoonBreak;
}

function sendGo(from, to, context) {
  currentCoffeeParrots.length = 0;
  skippers.length = 0;
  let message = '<!here> GO'
  rtm.sendMessage(message, config.get('channel'))
    .catch(console.error);
}

function updateSettings(configName, content) {
  //no validation whatsoever ¯\_(ツ)_/¯
  SETTINGS[configName] = content;
  return SETTINGS;
}

function flame(from, to, context) {
  let userid = context.eventPayload;
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
    this.updateSettings = updateSettings;
    this.automata = bot;
    this.addSkipper = skipper => utils.updateArray(skippers, [skipper]),
    bot.handle('start-bot');
  },

  itsCoffeeTime,
  morningCoffeeBreak: SETTINGS.morningCoffeeBreak, 
  afternoonCoffeeBreak: SETTINGS.afternoonCoffeeBreak, 
  tolerance: SETTINGS.tolerance
};