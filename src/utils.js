function isCoffeeParrotEmoji(msg) {
  return msg.text.startsWith(':coffeeparrot:');
}

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

module.exports = {
  isCoffeeParrotEmoji,
  generateRandomNumberBetween,
  updateArray,
  getMissingElements,
  userMention,
  log : {
    promiseError,
    eventError
  }
};