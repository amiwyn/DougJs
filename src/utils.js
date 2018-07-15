exports.generateRandomNumberBetween = (low, up) =>
  Math.floor(Math.random() * (up - low) + low);

exports.getMissingElements = (mainArray, compareArray) =>
  compareArray.reduce(((acc, elem) => mainArray.some(dup => dup == elem) ? acc : acc.concat(elem)), []);

exports.updateArray = (original, data) => {
  let nodups = exports.getMissingElements(original, data);
  original.push(...nodups);
}

exports.userMention = userid => `<@${userid}>`;

exports.log = {
  promiseError: (from, to, context) => console.error(context.error),
  eventError: (event, state) => console.error(`unhandled event ${event} in state ${state}`)
}

exports.isHourWithinTolerance = (hour, tolerance) => {
  let date = new Date();
  let currentHour = date.getHours();
  currentHour += date.getMinutes() / 60.0;
  return hour - tolerance < currentHour == currentHour < hour + tolerance;
}

exports.compareLists = (list1, list2) =>
  list1.every(elem1 => list2.some(elem2 => elem1 === elem2))

exports.trimLists = (list1, list2) =>
  list1.filter(elem1 => !list2.some(elem2 => elem1 === elem2))

exports.getUserIdFromCommandArgument = text => {
  let tokens = text.split("|");
  let id = tokens[0].substring(2);
  if (id.length === 0) {
    throw "invalid userid"
  }
  return id;
}

exports.generateRandomInsult = (slurs, userid) => {
  let id = exports.generateRandomNumberBetween(0, slurs.length);
  return exports.formatTextWithUser(slurs[id], userid);
}

exports.formatTextWithUser = (text, userid) => text.replace("{user}", exports.userMention(userid))