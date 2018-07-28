const Configstore = require('configstore');
const utils = require('./utils');

const config = new Configstore(process.env.CONFIGKEY);

exports.seedConfigs = () => {
  return new Promise((resolve, reject) => {
    if (!config.get('roster')) {
      config.set('roster', []);
    }

    if (!config.get('skippers')) {
      config.set('skippers', []);
    }

    if (!config.get('slurs')) {
      config.set('slurs', []);
    }
    resolve();
  });
}

exports.getSlurs = () => {
  return new Promise((resolve, reject) => {
    resolve(config.get('slurs'));
  });
}

exports.setSlurs = slurs => {
  return new Promise((resolve, reject) => {
    config.set('slurs', slurs)
    resolve();
  });
}

exports.addSlur = slur => {
  return new Promise((resolve, reject) => {
    let slurs = config.get('slurs');
    utils.updateArray(slurs, [slur]);
    config.set('slurs', slurs);
    resolve();
  });
}

exports.getRoster = () => {
  return new Promise((resolve, reject) => {
    resolve(config.get('roster'));
  });
}

exports.addToRoster = userid => {
  return new Promise((resolve, reject) => {
    let useridList = config.get('roster');
    utils.updateArray(useridList, [userid]);
    config.set('roster', useridList);
    resolve();
  });
}

exports.removeFromRoster = userid => {
  return new Promise((resolve, reject) => {
    let useridList = config.get('roster');
    useridList = utils.filter(user => user === userid);
    config.set('roster', useridList);
    resolve();
  });
}