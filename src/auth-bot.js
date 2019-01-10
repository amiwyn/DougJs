const Configstore = require('configstore');
const request = require('request-promise');
const express = require('express');
const bot = require('./bot');

const clientId = '373519414260.374791955143'; //tmp
const clientSecret = process.env.SLACK_SECRET;
const config = new Configstore(process.env.CONFIGKEY);

module.exports = {
  init: (app) => {    
    app.get('/addbot', (req, res) => {
      res.send(`<a href="https://slack.com/oauth/authorize?scope=bot&client_id=${clientId}"><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>`);
    });
    
    app.get('/oauth', (req, res) => {
      authenticateBot(req.query.code)
        .then((response) => {
          res.send(response);
          bot.start(app);
        })
        .catch((error) => {
          res.status(500);
          res.send({ "Error": error });
        });
    });
  }
}

function authenticateBot (querycode) {
  return new Promise((resolve, reject) => {
    if (!querycode) {
      reject("Query code is required");
    }

    let slack_access = createAuthUrl(querycode);
    request(slack_access)
      .then(body => {
        saveBodyConfigs(body);
        resolve("bot's added, yo");
      })
      .catch(reject);
  });
}

function createAuthUrl (querycode) {
  return {
    url: "https://slack.com/api/oauth.access",
    qs: { code: querycode,
          client_id: clientId,
          client_secret: clientSecret
        },
    method: 'GET',
  };
}

function saveBodyConfigs (body) {
  let bodyJSON = JSON.parse(body)
  if (bodyJSON.ok) {
    saveConfigs(bodyJSON);
  }
  else {
    throw bodyJSON.error;
  }
}

function saveConfigs (conf) {
  config.all = conf;
};