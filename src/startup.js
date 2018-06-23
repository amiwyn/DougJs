const { IncomingWebhook, RTMClient, WebClient } = require('@slack/client');
const Configstore = require('configstore');
const express = require('express');
const bodyParser = require('body-parser');
const bot = require('./bot');
const auth = require('./auth-bot');

const config = new Configstore(process.env.CONFIGKEY);
const app = express();

app.listen(PORT, () => {
  console.log("HTTP server listening on", process.env.PORT);
  seedConfigs();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  auth.init(app);
  bot.start(app);
});

function seedConfigs() {
  if (!config.get('roster')) {
    config.set('roster', []);
  }

  if (!config.get('skippers')) {
    config.set('skippers', []);
  }

  if (!config.get('slurs')) {
    config.set('slurs', []);
  }
}

