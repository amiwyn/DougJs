const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const Configstore = require('configstore');
const filestream = require('fs');

require('./auth-bot');

const config = new Configstore("bot");
const token = config.get('bot').bot_access_token;
const web = new WebClient(token);
const rtm = new RTMClient(token);

var channels = [];
var slurs = ['fuck'];

rtm.start();

web.channels.list()
  .then((list) => {
    channels = list;
  });

rtm.on('message', (message) => {
  if (isNotFromSelfBot(message)) {

    rtm.sendMessage(slurs[0], message.channel)
    .then((res) => {
      console.log('sent msg id: ', res.ts);
    })
    .catch(console.error);
  }
});

let isNotFromAnyBot = (msg) => {
  return !msg.subtype || msg.subtype !== 'bot_message';
}

let isNotFromSelfBot = (msg) => {
  return !msg.subtype || msg.user !== rtm.activeUserId;
}