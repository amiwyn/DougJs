const configstore = require('configstore');
const sinon = require('sinon');
const bot = require('../src/bot');
const utils = require('../src/utils');
const commands = require('../src/commands');
const should = require('chai').should();

const config = new configstore(process.env.CONFIGKEY);
const toleranceMinutes = 60 * bot.tolerance;

describe('itsCoffeeTime', () => {
  it('should be morning coffetime', () => {
    let clock = sinon.useFakeTimers(new Date(2018, 1, 1, bot.morningCoffeeBreak, toleranceMinutes - 1));
    bot.itsCoffeeTime().should.be.true;
    clock.restore();
  });
  it('should not be morning coffetime upper bound', () => {
    let clock = sinon.useFakeTimers(new Date(2018, 1, 1, bot.morningCoffeeBreak, toleranceMinutes + 2));
    bot.itsCoffeeTime().should.be.false;
    clock.restore();
  });
  it('should not be morning coffetime lower bound', () => {
    let clock = sinon.useFakeTimers(new Date(2018, 1, 1, bot.morningCoffeeBreak - 1, 60 - (toleranceMinutes + 1)));
    bot.itsCoffeeTime().should.be.false;
    clock.restore();
  });
  it('should be afternoon coffetime', () => {
    let clock = sinon.useFakeTimers(new Date(2018, 1, 1, bot.afternoonCoffeeBreak, toleranceMinutes - 3));
    bot.itsCoffeeTime().should.be.true;
    clock.restore();
  });
  it('should not be afternoon coffetime upper bound', () => {
    let clock = sinon.useFakeTimers(new Date(2018, 1, 1, bot.afternoonCoffeeBreak, toleranceMinutes + 10));
    bot.itsCoffeeTime().should.be.false;
    clock.restore();
  });
  it('should not be afternoon coffetime lower bound', () => {
    let clock = sinon.useFakeTimers(new Date(2018, 1, 1, bot.afternoonCoffeeBreak - 1, 60 - (toleranceMinutes + 10)));
    bot.itsCoffeeTime().should.be.false;
    clock.restore();
  });
});

describe('generateRandomNumberBetween', () => {
  it('should return a number', () => {
    let number = utils.generateRandomNumberBetween(0, 10);
    number.should.be.a('number'); //wow
  });
  it('should be within range 0, 10', () => {
    let number = utils.generateRandomNumberBetween(0, 10);
    number.should.be.at.least(0);
    number.should.be.at.most(9);
  });
  it('should be equal to 0', () => {
    let number = utils.generateRandomNumberBetween(0, 1);
    number.should.be.equal(0);
  });
  it('should be within range [5, 10] repeated 50 times (lol)', () => {
    let number;
    for (let i = 0; i < 50; i++) {
      number = utils.generateRandomNumberBetween(5, 10);
      number.should.be.at.least(5);
      number.should.be.at.most(9);
    }
  });
});

// describe('isCoffeeParrotEmoji', () => {
//   it('should detect a coffeparrot', () => {
//     let message = { text: ':coffeeparrot:' };
//     utils.isCoffeeParrotEmoji(message).should.be.true;
//   });
//   it('should not detect a coffeparrot', () => {
//     let message = { text: 'Hello, this is Amanda :coffeeparrot:' };
//     utils.isCoffeeParrotEmoji(message).should.be.false;
//   });
//   it('should detect a string starting with coffeparrot', () => {
//     let message = { text: ':coffeeparrot: its coffee time!' };
//     utils.isCoffeeParrotEmoji(message).should.be.true;
//   });
// });

describe('getMissingElements', () => {
  it('should be returning empty array', () => {
    let a1 = [];
    let a2 = [];
    let res = [];
    utils.getMissingElements(a1, a2).should.deep.equal(res);
  });
  it('should be returning missing elements', () => {
    let a1 = [1, 2];
    let a2 = ['a', 'b'];
    let res = ['a', 'b'];
    utils.getMissingElements(a1, a2).should.deep.equal(res);
  });
  it('should be returning empty array since nothing is missing', () => {
    let a1 = ['a', 'b'];
    let a2 = ['a', 'b'];
    let res = [];
    utils.getMissingElements(a1, a2).should.deep.equal(res);
  });
});

describe('updateArray', () => {
  it('should be merging two arrays', () => {
    let a1 = [1, 2, 3];
    let a2 = [4, 5, 6];
    let res = [1, 2, 3, 4, 5, 6];
    utils.updateArray(a1, a2);
    a1.should.deep.equal(res);
  });
  it('should be removing duplicates', () => {
    let a1 = [1, 2, 3];
    let a2 = [2, 3, 1];
    let res = [1, 2, 3];
    utils.updateArray(a1, a2);
    a1.should.deep.equal(res);
  });
  it('should not change original array order', () => {
    let a1 = [1, 2, 4];
    let a2 = [2, 3, 4, 5];
    let res = [1, 2, 4, 3, 5];
    utils.updateArray(a1, a2);
    a1.should.deep.equal(res);
  });
});

describe('addToRoster', () => {
  it('should be adding to empty list', () => {
    config.set('roster', [])
    let expected = ['asdasd1'];
    commands.addToRoster('asdasd1');
    config.get('roster').should.deep.equal(expected);
  });
  it('should be adding to existing list', () => {
    config.set('roster', ['asdasd', 'eiurewirwe', 'asdjkljal'])
    let expected = ['asdasd', 'eiurewirwe', 'asdjkljal', 'newuser11'];
    commands.addToRoster('newuser11');
    config.get('roster').should.deep.equal(expected);
  });
});