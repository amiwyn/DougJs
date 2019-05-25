const utils = require('./utils');
const bot = require('./bot');

const GENERALCHANNEL = "general";
const WHITESPACE = " ";
const DOUG_ERRMSG = 'beep boop, its not working : ';
const VOTE_UP = '+1';
const VOTE_DOWN = '-1';
const FLAME_RECENT_LIMIT = 10;  

const GAB_ID = "UB619L16W";

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
  bot.expressApp.post('/cmd/kick', kickCommand);
  //bot.expressApp.post('/cmd/listall', listallCommand);
  bot.expressApp.post('/cmd/viewcredit', viewcreditCommand);
  bot.expressApp.post('/cmd/give', giveCommand);
  bot.expressApp.post('/cmd/stats', statsCommand);
  bot.expressApp.post('/cmd/wholast', wholastCommand);
  bot.expressApp.post('/cmd/myslurs', myslursCommand);
  bot.expressApp.post('/cmd/test', testCommand);
  rtm = api.rtm;
  web = api.web;

  rtm.on('reaction_added', reactionAdd);
  rtm.on('reaction_removed', reactionRemove);
}

function flameCommand(req, res) {
  let userid = utils.getUserIdFromCommandArgument(req.body.text);
  let channelid = req.body.channel_id;
  let args = req.body.text.split(WHITESPACE);
  let requesterId = req.body.user_id
  let flame;

  if (args.length > 1) {
    let slurid = args[1];
    flame = specificFlame(userid, channelid, slurid, requesterId);
  }
  else {
    flame = randomFlame(userid, channelid);
  }

  flame.then(msg => {
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

function specificFlame(userid, channelid, slurid, requesterId) {
  return Promise.all([bot.store.getRoster(), bot.store.getSlur(slurid)])
  .then(([users, slur]) => {
    let message = utils.formatTextTokens(slur.text, userid, users)
    return removeCredits(requesterId, 5)
    .then(() => rtm.sendMessage(message, channelid).then(msg => {
      msg.text = message
      msg.slur = slur
      return msg
    }))
  })
  
  removeCredits(requesterId, 5)
}

function randomFlame(userid, channelid) {
  return Promise.all([bot.store.getRoster(),  bot.store.getSlurs()])
  .then(([users, slurs]) => {
    activeslurs = slurs.filter(slur => slur.active)
    let [message, slur] = utils.generateRandomInsult(activeslurs, userid, users)
    while (recentFlame.some(newSlur => newSlur.id === slur.id)) {
      [message, slur] = utils.generateRandomInsult(activeslurs, userid, users)
    }

    return rtm.sendMessage(message, channelid).then(msg => {
      msg.text = message
      msg.slur = slur
      return msg
    })
  })
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
    console.log(req.body.user_id + " attempted a cleanup")
    toRemove = recentFlame.filter(msg => msg.score < 0)
    if (toRemove.length === 0) { 
      throw "nothing to cleanup, all your slurs are clean :)"
    }
    return toRemove;
  })
  .then(slurs => {
    tasks = slurs.map(slur => bot.store.removeSlur(slur.slur.id))
    slurs.forEach(slur => {
      tasks.push(bot.store.getUser(slur.slur.createdBy).then(user => {
        user.credits = parseInt(user.credits) - 1
        return bot.store.updateUser(user)
      }))
    });
    return Promise.all(tasks)
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
    return bot.store.removeFromRoster(userid).then(() => userid);
  })
  .then(userid => {
    let channelId = req.body.channel_id;
    let message = utils.userMention(userid) + " was kicked from the coffee list :("
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
  console.log("joincoffee : " + channelID);

  web.conversations.info({ channel: channelID })
    .then(info => {
      if (info.channel.name === GENERALCHANNEL) {
        return Promise.reject("you can't do this on #general channel");
      }
      bot.store.setChannel(channelID);
      bot.store.addToRoster(userid);
      bot.store.addUser(userid);

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
    bot.store.addToRoster(userid);
    bot.store.addUser(userid);

    return `${utils.userMention(userid)} joined coffee break`;
  })
  .then(message => rtm.sendMessage(message, channelId))
  .then(() => res.send())
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function addslurCommand(req, res) {
  let userid = req.body.user_id
  let slur = req.body.text;
  console.log("user " + userid + " added slur: " + slur)

  bot.store.getUser(req.body.user_id)
  .then(user => addCredits(user, 1))
  .then(() => bot.store.addSlur(slur, userid))
  .then(() => res.send("you gained 1 rupee :gem:"))
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function listallCommand(req, res) {
  isAdmin(req.body.user_id)
  .then(bot.store.getSlurs)
  .then(slurs => slurs.filter(slur => slur.active).map(slur => slur.text))
  .then(slurs => res.send(slurs))
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function viewcreditCommand(req, res) {
  bot.store.getUser(req.body.user_id)
  .then(user => res.send("You have " + user.credits + " rupees :gem:"))
}

function giveCommand(req, res) {
  let args = req.body.text.split(WHITESPACE);
  let amount = parseInt(args[1])
  let receiver = utils.getUserIdFromCommandArgument(args[0])

  if (!Number.isInteger(amount)) {
    res.send(DOUG_ERRMSG + "please stop trying to break me :sweat:");
    return
  }
  
  removeCredits(req.body.user_id, amount)
  .then(() => bot.store.getUser(receiver))
  .then(user => addCredits(user, amount))
  .then(() => {
    let message = utils.userMention(req.body.user_id) + " gave " + amount + " rupees to " + utils.userMention(receiver)
    console.log(message)
    return rtm.sendMessage(message, req.body.channel_id)
  })
  .then(() => res.send())
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function removeCredits(userid, amount) {
  return bot.store.getUser(userid)
  .then(user => removeCreditsUser(user, amount))
}

function removeCreditsUser(user, amount) {
  if (user.id !== 'UAZJY4AMR') {
    if (amount < 0) {
        throw "nice try, sly human."
    }

    if (user.credits - amount < 0) {
      throw "you don't have enough money. - You have " + user.credits + " :gem: and you need " + amount + " :gem:."
    }
  }

  user.credits = parseInt(user.credits) - parseInt(amount)
  return bot.store.updateUser(user)
}

function addCredits(user, amount) {
  user.credits = parseInt(user.credits) + parseInt(amount)
  return bot.store.updateUser(user)
}

function statsCommand(req, res) {
  let userid = req.body.user_id
  if (req.body.text.length > 1) {
    userid = utils.getUserIdFromCommandArgument(req.body.text)
  }

  Promise.all([bot.store.getUser(userid), bot.store.getSlursFrom(userid), web.users.info({ user: userid })])
  .then(([user, slurs, info]) => {
    let attachments = utils.getStatsMessage(user, info, slurs.length)

    if (user.id === GAB_ID) {
      attachments = utils.getStatsMessageGab(user, info, slurs.length)
    }

    web.chat.postMessage({ channel: req.body.channel_id, attachments });
    res.send()
  })
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function wholastCommand(req, res)  {
  let lastSlur = recentFlame[recentFlame.length -1]
  removeCredits(req.body.user_id, 1)
  .then(() => bot.store.getSlur(lastSlur.slur.id))
  .then(slur => {
    return bot.store.getUser(slur.createdBy)})
  .then(user => res.send(utils.userMention(user.id) + " created that slur. -You paid 1 rupee :gem:"))
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function myslursCommand(req, res)  {
  bot.store.getSlursFrom(req.body.user_id)
  .then(slurs => slurs.filter(slur => slur.active).reduce((acc, val) => acc + val.id + " - " + val.text + " \n", ""))
  .then(message => res.send(message))
  .catch(error => {
    res.send(DOUG_ERRMSG + error);
  });
}

function testCommand(req, res) {
  //bot.store.removeAllUsers();
  // bot.store.getUsers().then(users => Promise.all(users.map(user => {
  //   user.credits = 20
  //   bot.store.updateUser(user)
  // })))
  // .catch(console.log);
  //bot.store.getSlurs().then(console.log)
  //bot.store.getTest(6207147167711232).then(console.log)
  //bot.store.purgeInactive()
  //bot.store.removeSlur(4867664006610944)
  //bot.store.removeCredits(req.body.user_id, 30)
  //bot.store.getUser(req.body.user_id).then(user => addCredits(user, 4000))
  res.send("done")
}

module.exports = {
  init,
};