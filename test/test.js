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

// describe('addToRoster', () => {
//   it('should be adding to empty list', () => {
//     config.set('roster', [])
//     let expected = ['asdasd1'];
//     commands.addToRoster('asdasd1');
//     config.get('roster').should.deep.equal(expected);
//   });
//   it('should be adding to existing list', () => {
//     config.set('roster', ['asdasd', 'eiurewirwe', 'asdjkljal'])
//     let expected = ['asdasd', 'eiurewirwe', 'asdjkljal', 'newuser11'];
//     commands.addToRoster('newuser11');
//     config.get('roster').should.deep.equal(expected);
//   });
// });

describe('compareLists', () => {
  it('should detect the list have the same elements', () => {
    let a1 = [1, 2, 3];
    let a2 = [3, 2, 1];
    utils.compareLists(a1, a2).should.be.true;
  });
  it('should detect the list have the same elements', () => {
    let a1 = [1, 2, 3, 6, 4, 9];
    let a2 = [9, 3, 4, 2, 1, 6];
    utils.compareLists(a1, a2).should.be.true;
  });
  it('should detect the list dont have the same elements', () => {
    let a1 = [2, 3, 6, 4, 9, 7];
    let a2 = [9, 3, 4, 2, 1, 6];
    utils.compareLists(a1, a2).should.be.false;
  });
});

describe('trimLists', () => {
  it('should trim a list', () => {
    let a1 = [1, 2, 3];
    let a2 = [3, 2, 1];
    let expected = [];
    utils.trimLists(a1, a2).should.deep.equal(expected);
  });
  it('should not trim a list with an empty list', () => {
    let a1 = [1, 2, 3];
    let a2 = [];
    let expected = [1, 2, 3];
    utils.trimLists(a1, a2).should.deep.equal(expected);
  });
  it('should not trim the list', () => {
    let a1 = [4, 5, 6, 7, 8];
    let a2 = [1, 2, 3];
    let expected = [4, 5, 6, 7, 8];
    utils.trimLists(a1, a2).should.deep.equal(expected);
  });
  it('should correctly trim', () => {
    let a1 = [4, 5, 6, 7];
    let a2 = [1, 2, 3, 4, 5, 6];
    let expected = [7];
    utils.trimLists(a1, a2).should.deep.equal(expected);
  });
});

describe('formatTextTokens', () => {
  let userid = "123"
  let users = ['456']
  it('should return same string', () => {
    let text = "hello asd iqwo9if qfiqnfoqnf sfklasf";
    utils.formatTextTokens(text, userid, users).should.deep.equal(text);
  });
  it('should replace {user}', () => {
    let text = "hello this is {user}! nice to meet you";
    let expected = "hello this is <@123>! nice to meet you";
    utils.formatTextTokens(text, userid, users).should.deep.equal(expected);
  });
  it('should replace multiple times', () => {
    let text = "hello {user} {user} {user} {user}";
    let expected = "hello <@123> <@123> <@123> <@123>";
    utils.formatTextTokens(text, userid, users).should.deep.equal(expected);
  });
  it('should replace {random} token multiple times', () => {
    let text = "hello {user} {random} {user} {random}";
    let expected = "hello <@123> <@456> <@123> <@456>";
    utils.formatTextTokens(text, userid, users).should.deep.equal(expected);
  });
  it('should replace {random} token without the user', () => {
    let text = "hello {user} {random} {user} {random}";
    let expected = "hello <@123> <@456> <@123> <@456>";
    users = ['456', '123']
    utils.formatTextTokens(text, userid, users).should.deep.equal(expected);
  });
});

describe('userMention', () => {
  it('should return string incased with @<>', () => {
    let text = "test";
    let expected = "<@test>"
    utils.userMention(text).should.deep.equal(expected);
  });
});

describe('getUserIdFromCommandArgument', () => {
  it('should return a userid', () => {
    let text = "<@U1234567|user>";
    let expected = "U1234567"
    utils.getUserIdFromCommandArgument(text).should.deep.equal(expected);
  });
});

describe('reverseUserMention', () => {
  it('should return the string without the usermention', () => {
    let text = "<@U1234567> devrait commencer par ecrire dans le bon sens";
    let expected = "{user} devrait commencer par ecrire dans le bon sens";
    utils.reverseUserMention(text).should.deep.equal(expected);
  });
  it('should return the string without all the usermentions', () => {
    let text = "<@U1234567> devrait commencer par ecrire dans le bon sens <@U1234567>";
    let expected = "{user} devrait commencer par ecrire dans le bon sens {user}";
    utils.reverseUserMention(text).should.deep.equal(expected);
  });
});

describe('addUntilLimit', () => {
  it('should append an element', () => {
    let a1 = [1, 2, 3];
    let expected = [1, 2, 3, 4];
    utils.addUntilLimit(a1, 5, 4)
    a1.should.deep.equal(expected);
  });
  it('should append and shift when full', () => {
    let a1 = [1, 2, 3];
    let expected = [2, 3, 4];
    utils.addUntilLimit(a1, 3, 4)
    a1.should.deep.equal(expected);
  });
  it('should not add twice', () => {
    let a1 = [1, 2, 3];
    let expected = [1, 2, 3];
    utils.addUntilLimit(a1, 3, 3)
    a1.should.deep.equal(expected);
  });
});

describe('generateRandomUserMention', () => {
  it('should mention user 123', () => {
    let users = ['123', '123'];
    let expected = utils.userMention('123')
    utils.generateRandomUserMention(users).should.deep.equal(expected);
  });
});