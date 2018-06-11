const Configstore = require('configstore');
const utils = require('./utils');
const bot = require('./bot');

const config = new Configstore(process.env.CONFIGKEY);
let rtm; 
let web;

//TODO: more commands
function init(api) {
  bot.expressApp.post('/cmd/joincoffee', joincoffeeCommand);
  bot.expressApp.post('/cmd/skipcoffee', skipcoffeeCommand);
  bot.expressApp.post('/cmd/listcoffee', console.log);
  bot.expressApp.post('/cmd/flame', console.log);
  bot.expressApp.post('/cmd/cancelcoffee', console.log);
  bot.expressApp.post('/cmd/postpone', console.log);
  rtm = api.rtm;
  web = api.web;
}

function joincoffeeCommand(req, res) {
  let userid = req.body.user_id;
  let channelID = req.body.channel_id;

  setCoffeeChannel(channelID)
    .then(() => {
      addToRoster(userid);
      let message = utils.userMention(userid) + " joined coffee break";
      rtm.sendMessage(message, channelID)
        .catch(console.error);
      res.send();
    })
    .catch(error => {
      res.send("beep boop, its not working : " + error);
    });
}

function skipcoffeeCommand(req, res) {
  let userid = req.body.user_id;
  let channelID = req.body.channel_id;
  let skippers = config.get('skippers');
  utils.updateArray(skippers, [userid]);
  config.set('skippers', skippers);
  let message = utils.userMention(userid) + " will skip coffee break";
  rtm.sendMessage(message, channelID)
    .catch(console.error);
  res.send();
}

function setCoffeeChannel(channelID) {
  return new Promise((resolve, reject) => {
    web.conversations.info({ channel: channelID })
      .then(res => {
        if (!res.channel.name) {
          reject('could not find channel name');
          return;
        }
        if (res.channel.name === "general") {
          reject("you can't do this on #general channel");
          return;
        }
        config.set('channel', channelID);
        resolve();
      })
      .catch(reject);
  });
}

function addToRoster(userid) {
  let useridList = config.get('roster');
  utils.updateArray(useridList, [userid]);
  config.set('roster', useridList);
}

module.exports = {
  init,
  addToRoster
};