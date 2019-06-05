const env = require('../knexfile')
const knex = require('knex')(env.development)

exports.getSlurs = () => {
  return knex('slurs').then(slurs => slurs.map(slur => toLowercaseObject(slur)))
}

exports.addSlur = (text, userid) => {
  return knex('slurs').where('text', text).then(result => {
    if (result.length !== 0) {
      throw "That slur already exist. (nice try JS)"
    }

    return knex('slurs')
      .insert({
        text: text,
        createdBy: userid,
        active: true
      }).then()
  })
}

exports.batchAddSlurs = slurs => {
  return knex.batchInsert('slurs', slurs)
}

exports.removeSlur = id => {
  return knex('slurs')
    .where('id', id)
    .update('active', false)
}

exports.getSlur = id => {
  return knex('slurs').where('id', id).then(slurs => toLowercaseObject(slurs[0]))
}

exports.getSlursFrom = userid => {
  return knex('slurs').where('createdBy', userid).then(slurs => slurs.map(slur => toLowercaseObject(slur)))
}

exports.purgeInactive = () => {
  return knex('slurs').where('active', false).del()
}

exports.removeAllUsers = () => {
  return knex('users').del()
}

exports.getRoster = () => {
  return knex('roster').then(users => users.map(user => user.Id))
}

exports.addToRoster = userid => {
  return knex('roster')
    .insert({
      id: userid
    }).then()
}

exports.removeFromRoster = userid => {
  return knex('roster').where('id', userid).del()
}

exports.addUser = userid => {
  return knex('users').where('id', userid).then(data => {
    if (data.length === 0) {
      return knex('roster')
        .insert({
          id: userid,
          credits: 10
        }).then()
    }
  })
}

exports.getUser = userid => {
  return knex('users').where('id', userid).then(data => toLowercaseObject(data[0]))
}

exports.getUsers = () => {
  return knex('users').then(users => users.map(user => toLowercaseObject(user)))
}

exports.updateUser = userdata => {
  return knex('users').where('id', userdata.id).update(userdata)
}

exports.batchAddUser = users => {
  return knex.batchInsert('users', users)
}

exports.setChannel = channelid => {
  return knex('channels').where('id', 1).update('channel', channelid)
}

exports.getChannel = () => {
  return knex('channels').where('id', 1).then(data => data[0].Channel)
}

exports.getToken = () => {
  return knex('channels').where('id', 1).then(data => data[0].Token)
}

exports.getSigningSecret = () => {
  return knex('secrets').where('id', 'slack-signing').then(data => data[0].Secret);
}

exports.getClientSecret = () => {
  return knex('secrets').where('id', 'client-secret').then(data => data[0].Secret);
}

function toLowercaseObject(obj) {
  var key, keys = Object.keys(obj)
  var n = keys.length
  var newobj = {}
  while (n--) {
    key = keys[n]
    newobj[key.charAt(0).toLowerCase() + key.slice(1)] = obj[key]
  }
  return newobj
}