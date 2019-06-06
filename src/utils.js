exports.generateRandomNumberBetween = (low, up) =>
  Math.floor(Math.random() * (up - low) + low);

exports.getMissingElements = (mainArray, compareArray) =>
  compareArray.reduce(((acc, elem) => mainArray.some(dup => dup == elem) ? acc : acc.concat(elem)), []);

exports.updateArray = (original, data) => {
  let nodups = exports.getMissingElements(original, data);
  original.push(...nodups);
}

exports.addUntilLimit = (array, limit, element) => {
  exports.updateArray(array, [element]);
  if (array.length > limit) {
    array.shift()
  }
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

exports.generateRandomInsult = (slurs, userid, users) => {
  let id = exports.generateRandomNumberBetween(0, slurs.length);
  return [exports.formatTextTokens(slurs[id].text, userid, users), slurs[id]];
}

exports.formatTextTokens = (text, userid, users) => {
  text = text.replace(/{user}/g, exports.userMention(userid))
  return text.replace(/{random}/g, exports.generateRandomUserMention(users, userid))
}

exports.incrementFat = (text, number) => {
  return text.replace(/350\++/g, number)
}

exports.reverseUserMention = (message) => {
  return message.replace(/<@[a-z0-9]*>/gi, '{user}')
}

exports.getDeletedSlursMessage = (slurs) => {
  return [{
    "fallback": "The following slurs have been cleaned up",
    "color": "#e05f28",
    "pretext": "The following slurs have been cleaned up",
    "fields": slurs.map(slur => ({
      "title": slur.text,
      "short": false
    }))
  }]
}

exports.getStatsMessage = (user, info, slurCount) => {
  return [{
    "fallback": "Stats of " + exports.userMention(user.id),
    "color": "#" + info.user.color,
    "pretext": "Stats of " + exports.userMention(user.id),
    "fields": [
      {
        "title": ":bearded_person: Full name : " + info.user.profile.real_name,
        "short": false
      },
      {
        "title": ":robot_face: User ID : " + user.id,
        "short": false
      },
      // {
      //   "title": ":manon: Info : " + info.user.profile.status_text,
      //   "short": false
      // },
      {
        "title": ":moustache: Rank : " + (info.user.is_admin ? "Admin" : "Member"),
        "short": false
      },
      {
        "title": ":rupee: Rupees : " + user.credits,
        "short": false
      },
      {
        "title": ":see_no_evil: Slurs added : " + (slurCount == 0 ? "0 (what a shame)" : slurCount),
        "short": false
      },
  ]
  }]
}

exports.getStatsMessageGab = (user, info, slurCount) => {
  return [{
    "fallback": "Stats of " + exports.userMention(user.id),
    "color": "#" + info.user.color,
    "pretext": "Stats of " + exports.userMention(user.id),
    "fields": [
      {
        "title": ":bearded_person: Full name : " + info.user.profile.real_name,
        "short": false
      },
      {
        "title": ":robot_face: User ID : " + user.id,
        "short": false
      },
      // {
      //   "title": ":manon: Info : " + info.user.profile.status_text,
      //   "short": false
      // },
      {
        "title": ":moustache: Rank : " + (info.user.is_admin ? "Admin" : "Member"),
        "short": false
      },
      {
        "title": ":pika: Rupees : " + [...Array(user.credits).keys()].reduce((acc, val) => acc + ":rupee:", ""),
        "short": false
      },
      {
        "title": ":see_no_evil: Slurs added : " + (slurCount == 0 ? "0 (what a shame)" : slurCount),
        "short": false
      },
  ]
  }]
}

exports.generateRandomUserMention = (users, userid) => {
  users = users.filter(elem => elem !== userid);
  let id = exports.generateRandomNumberBetween(0, users.length);
  return exports.userMention(users[id]);
}