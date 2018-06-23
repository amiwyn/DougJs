const Configstore = require('configstore');
const utils = require('./utils');
const bot = require('./bot');

const config = new Configstore(process.env.CONFIGKEY);
const GENERALCHANNEL = "general";
const WHITESPACE = " ";
let rtm; 
let web;

//TODO: more commands
function init(api) {
  bot.expressApp.post('/cmd/joincoffee', joincoffeeCommand); //TODO: make join command remove user from skippers
  bot.expressApp.post('/cmd/skipcoffee', skipcoffeeCommand);
  bot.expressApp.post('/cmd/listcoffee', console.log);
  bot.expressApp.post('/cmd/flame', flameCommand); 
  bot.expressApp.post('/cmd/mercy', mercyCommand);
  bot.expressApp.post('/cmd/cancelcoffee', console.log);
  bot.expressApp.post('/cmd/postpone', console.log);
  bot.expressApp.post('/cmd/configure', configureCommand);
  bot.expressApp.post('/cmd/resolve', resolveCommand);
  bot.expressApp.post('/cmd/skipsomeone', skipsomeoneCommand);
  bot.expressApp.post('/cmd/joinsomeone', joinsomeoneCommand);
  bot.expressApp.post('/cmd/addslur', addslurCommand);
  rtm = api.rtm;
  web = api.web;
}

function flameCommand(req, res) {
  let userid = getUserIdFromCommandArgument(req.body.text);
  let channelid = req.body.channel_id;
  let message = "fuck you, " + utils.userMention(userid);
  rtm.sendMessage(message, channelid);
  res.send();
}

function mercyCommand(req, res) {
  let userid = req.body.user_id;
  bot.handle('beg-mercy', userid);
}

function joincoffeeCommand(req, res) {
  let userid = req.body.user_id;
  let channelID = req.body.channel_id;

  web.conversations.info({ channel: channelID })
    .then(info => {
      if (info.channel.name === GENERALCHANNEL) {
        return Promise.reject("you can't do this on #general channel");
      }
      config.set('channel', channelID);
      addToRoster(userid);
      return `${utils.userMention(userid)} joined coffee break`;
    })
    .then(message => rtm.sendMessage(message, channelID))
    .then(() => res.send())
    .catch(error => {
      res.send(`beep boop, its not working : ${error}`);
    });
}

function skipcoffeeCommand(req, res) {
  let userid = req.body.user_id;
  let channelId = req.body.channel_id;
  skipUserWithMention(userid, channelId);
  res.send();
}

function addToRoster(userid) {
  let useridList = config.get('roster');
  utils.updateArray(useridList, [userid]);
  config.set('roster', useridList);
}

function configureCommand(req, res) {
  isAdmin(req.body.user_id)
    .then(() => {
      args = getArgsFromText(req.body.text);
      return bot.updateSettings(args.config, args.content);
    })
    .then(settings => res.send(settings))
    .catch(error => {
      res.send(`beep boop, its not working : ${error}`);
    });
}

const isAdmin = (userid) => 
  web.users.info({ user: userid })
    .then(info => !info.user.is_admin ? Promise.reject("you are not an admin") : undefined)


function getArgsFromText(text) {
  let tokens = text.split(WHITESPACE);
  return {
    config: tokens[0],
    content: tokens[1]
  }
}

function resolveCommand(req, res) {
  bot.automata.handle('coffee-resolve');
  res.send();
}

function skipsomeoneCommand(req, res) {
  isAdmin(req.body.user_id)
  .then(() => {
    let userid = utils.getUserIdFromCommandArgument(req.body.text);
    let channelId = req.body.channel_id;
    bot.skipUserWithMention(userid, channelId);
    res.send();
  })
  .catch(error => {
    res.send(`beep boop, its not working : ${error}`);
  });
}

function joinsomeoneCommand(req, res) {
  let channelId = req.body.channel_id;
  isAdmin(req.body.user_id)
  .then(() => {
    let userid = utils.getUserIdFromCommandArgument(req.body.text);
    addToRoster(userid);
    return `${utils.userMention(userid)} joined coffee break`;
  })
  .then(message => rtm.sendMessage(message, channelId))
  .then(() => res.send())
  .catch(error => {
    res.send(`beep boop, its not working : ${error}`);
  });
}

module.exports = {
  init,
  addToRoster
};