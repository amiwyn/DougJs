const Configstore = require('configstore');
const store = require('./store');
const utils = require('./utils');
const bot = require('./bot');

const config = new Configstore(process.env.CONFIGKEY);
const GENERALCHANNEL = "general";
const WHITESPACE = " ";
const DOUG_ERRMSG = 'beep boop, its not working : ';
const VOTE_UP = '+1';
const VOTE_DOWN = '-1';
const FLAME_RECENT_LIMIT = 10;  

let rtm; 
let web;
let recentFlame = [];

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
  bot.expressApp.post('/cmd/cleanup', cleanupCommand);
  //bot.expressApp.post('/cmd/kick', kickCommand); gotta test this before anything
  rtm = api.rtm;
  web = api.web;

  rtm.on('reaction_added', reactionAdd);
  rtm.on('reaction_removed', reactionRemove);
}

function flameCommand(req, res) {
  let userid = utils.getUserIdFromCommandArgument(req.body.text);
  let channelid = req.body.channel_id;
  Promise.all([store.getRoster(), store.getSlurs()])
    .then(([users, slurs]) => {
      let message = utils.generateRandomInsult(slurs, userid, users)
      let msg = rtm.sendMessage(message, channelid)
      msg.text = message
      return msg
    })
    .then(msg => {
      msg.score = 0
      utils.addUntilLimit(recentFlame, FLAME_RECENT_LIMIT, msg)
      return web.reactions.add({ name: VOTE_UP, channel: channelid, timestamp: msg.ts})
        .then(() => web.reactions.add({ name: VOTE_DOWN, channel: channelid, timestamp: msg.ts}))
    })
    .then(() => res.send())
    .catch(error => {
      res.send(DOUG_ERRMSG + error);
    });
}

function reactionRemove(event) {
  setReaction(event, -1)
}

function reactionAdd(event) {
  setReaction(event, 1)
}

function setReaction(event, modifier) {
  if (isInvalidReaction(event)) {
    return;
  }

  let slur = recentFlame.find(elem => elem.ts === event.item.ts)
  if (!slur)
    return;

  if (event.reaction === VOTE_UP) {
    slur.score += modifier;
  } else {
    slur.score -= modifier;
  }
}

function isInvalidReaction(message) {
  return (message.user === rtm.activeUserId || (message.reaction !== VOTE_UP && message.reaction !== VOTE_DOWN))
}

function cleanupCommand(req, res) {
  let toRemove = [];
  isAdmin(req.body.user_id)
  .then(() => {
    recentFlame.forEach(msg => {
      if (msg.score < 0) {
        toRemove.push(utils.reverseUserMention(msg.text))
      }
    })
    if (toRemove.length === 0) { 
      throw "nothing to cleanup, all your slurs are clean :)"
    }
    return store.getSlurs();
  })
  .then(slurs => {
    slurs = utils.trimLists(slurs, toRemove)
    return store.setSlurs(slurs)
  })
  .then(() => {
    recentFlame = [];
    let attachments = utils.getDeletedSlursMessage(toRemove)
    web.chat.postMessage({ channel: req.body.channel_id, attachments });
    res.send()
  })
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function kickCommand(req, res) {
  isAdmin(req.body.user_id)
  .then(() => {
    let userid = utils.getUserIdFromCommandArgument(req.body.text);
    let channelId = req.body.channel_id;
    return store.removeFromRoster(userid);
  })
  .then(() => {
    let message = utils.userMention(userid) + " was kicked from the list :("
    rtm.sendMessage(message, channelId)
    res.send();
  })
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
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
      store.addToRoster(userid);
      return `${utils.userMention(userid)} joined coffee break`;
    })
    .then(message => rtm.sendMessage(message, channelID))
    .then(() => res.send())
    .catch(error => {
      res.send(DOUG_ERRMSG + error);
    });
}

function skipcoffeeCommand(req, res) {
  let userid = req.body.user_id;
  let channelId = req.body.channel_id;
  bot.skipUserWithMention(userid, channelId);
  res.send();
}

function configureCommand(req, res) {
  isAdmin(req.body.user_id)
    .then(() => {
      args = getArgsFromText(req.body.text);
      return bot.updateSettings(args.config, args.content);
    })
    .then(settings => res.send(settings))
    .catch(error => {
      res.send(DOUG_ERRMSG + error);
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
  isAdmin(req.body.user_id)
  .then(() => {
    bot.automata.handle('coffee-resolve');
    res.send();
  })
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
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
    res.send(DOUG_ERRMSG + error);
  });
}

function joinsomeoneCommand(req, res) {
  let channelId = req.body.channel_id;
  isAdmin(req.body.user_id)
  .then(() => {
    let userid = utils.getUserIdFromCommandArgument(req.body.text);
    store.addToRoster(userid);
    return `${utils.userMention(userid)} joined coffee break`;
  })
  .then(message => rtm.sendMessage(message, channelId))
  .then(() => res.send())
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function addslurCommand(req, res) {
  let slur = req.body.text;
  store.addSlur(slur)
    .then(() => res.send("slur added to the list"))
    .catch(error => {
      res.send(DOUG_ERRMSG + error);
    });
}

module.exports = {
  init,
};