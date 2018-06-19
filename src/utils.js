function generateRandomNumberBetween(low, up) {
  return Math.floor(Math.random() * (up - low) + low);
}

function updateArray(original, data) {
  let nodups = getMissingElements(original, data);
  original.push(...nodups);
}

function getMissingElements(mainArray, compareArray) {
  return compareArray.reduce(((acc, elem) => mainArray.some(dup => dup == elem) ? acc : acc.concat(elem)), []);
}

function userMention(userid) {
  return `<@${userid}>`;
}

function promiseError(from, to, context) { 
  console.error(context.error) 
}

function eventError(event, state) { 
  console.error(`unhandled event ${event} in state ${state}`); 
}

function isHourWithinTolerance(hour, tolerance) {
  let date = new Date();
  let currentHour = date.getHours();
  currentHour += date.getMinutes() / 60.0;
  return hour - tolerance < currentHour == currentHour < hour + tolerance; 
}

const compareLists = (list1, list2) => 
  list1.every(elem1 => list2.some(elem2 => elem1 === elem2))


const trimLists = (list1, list2) => 
  list1.filter(elem1 => !list2.some(elem2 => elem1 === elem2))

module.exports = {
  isHourWithinTolerance,
  generateRandomNumberBetween,
  updateArray,
  getMissingElements,
  userMention,
  compareLists,
  trimLists,
  log : {
    promiseError,
    eventError
  }
};