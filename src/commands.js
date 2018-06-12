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

  web.conversations.info({ channel: channelID })
    .then(info => {
      if (info.channel.name === "general") {
        return Promise.reject("you can't do this on #general channel");
      }
      config.set('channel', channelID);
      addToRoster(userid);
      return utils.userMention(userid) + " joined coffee break";
    })
    .then(message => {
      return rtm.sendMessage(message, channelID);
    })
    .then(() => res.send())
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

function addToRoster(userid) {
  let useridList = config.get('roster');
  utils.updateArray(useridList, [userid]);
  config.set('roster', useridList);
}

module.exports = {
  init,
  addToRoster
};