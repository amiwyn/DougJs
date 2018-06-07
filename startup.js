const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const Configstore = require('configstore');
const bot = require('./bot');
const auth = require('./auth-bot');

const config = new Configstore("bot");

auth.init();

if (config.has('bot')) {
    bot.start();
}
else {
    console.log("no configs found, add the bot to a server please");
}