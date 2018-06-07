const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const Configstore = require('configstore');

const config = new Configstore("bot");
const slurs = ['fuck'];

let rtm;
let web;

module.exports = {
  start() {
    if (this.started) {
      return;
    }

    let token = config.get('bot').bot_access_token;
    web = new WebClient(token);
    rtm = new RTMClient(token);

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