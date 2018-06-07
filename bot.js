const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const Configstore = require('configstore');

const config = new Configstore("bot");
const token = config.get('bot').bot_access_token;

const slurs = ['fuck'];

const web = new WebClient(token);
const rtm = new RTMClient(token);

module.exports = {
  start() {
    if (this.started) {
      return;
    }
    rtm.start();
    rtm.on('message', onMessage);
    //more events
    started = true;
  },

  started : false
};

onMessage = (message) => {
  if (isNotFromSelfBot(message)) {

    rtm.sendMessage(slurs[0], message.channel)
    .then((res) => {
      console.log('sent msg id: ', res.ts);
    })
    .catch(console.error);
  }
};

isNotFromAnyBot = (msg) => {
  return !msg.subtype || msg.subtype !== 'bot_message';
}

isNotFromSelfBot = (msg) => {
  return !msg.subtype || msg.user !== rtm.activeUserId;
}