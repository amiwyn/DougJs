const { Datastore } = require('@google-cloud/datastore');

const datastore = new Datastore();

exports.getSlurs = () => {
  const query = datastore.createQuery('slur');
  return datastore.runQuery(query).then(data => data[0].map(slur => {
    slur.id = slur[datastore.KEY].id
    return slur
  }));
}

exports.addSlur = (text, userid) => {
  const query = datastore.createQuery('slur').filter('text', text);
  return datastore.runQuery(query).then(result => {
    if (result[0].length !== 0) {
      throw "That slur already exist. (nice try JS)"
    }

    const key = datastore.key('slur');
    const entity = {
      key: key,
      data: {
        text: text,
        createdBy: userid,
        createdOn: new Date(),
        active: true
      } 
    };
    return datastore.save(entity);
  })
}

exports.removeSlur = id => {
  const key = datastore.key(['slur', parseInt(id)]);
  return datastore.get(key).then(([slur]) => {
    slur.active = false
    return datastore.save({ key: key, data: slur });
  })
}

exports.getSlur = id => {
  const key = datastore.key(['slur', parseInt(id)]);
  return datastore.get(key).then(([slur]) =>{
    slur.id = slur[datastore.KEY].id
    return slur
  });
}

exports.getSlursFrom = userid => {
  const query = datastore.createQuery('slur').filter('createdBy', userid)
  return datastore.runQuery(query).then(data => data[0].map(slur => {
    slur.id = slur[datastore.KEY].id
    return slur
  }));
}

exports.removeAllSlurs = () => {
  return exports.getSlurs().then(data => Promise.all(data.map(slur => datastore.delete(slur.id))))
}

exports.removeSpecific = text => {
  const query = datastore.createQuery('slur').filter('text', text);
  return datastore.runQuery(query).then(data => data[0].map(slur => {
    slur.id = slur[datastore.KEY]
    return slur
  }))
  .then(data => Promise.all(data.map(slur => datastore.delete(slur.id))))
}

exports.purgeInactive = () => {
  const query = datastore.createQuery('slur').filter('active', false);
  return datastore.runQuery(query).then(data => data[0].map(slur => {
    slur.id = slur[datastore.KEY]
    return slur
  }))
  .then(data => Promise.all(data.map(slur => datastore.delete(slur.id))))
}

exports.removeAllUsers = () => {
  const query = datastore.createQuery('user');
  return datastore.runQuery(query).then(([data]) => Promise.all(data.map(user => datastore.delete(datastore.key(['user', user.id])))))
}

exports.getRoster = () => {
  const query = datastore.createQuery('roster');
  return datastore.runQuery(query).then(data => data[0].map(user => user.id))
}

exports.addToRoster = userid => {
  const key = datastore.key(['roster', userid]);
  const entity = {
    key: key,
    data: {
      id: userid
    } 
  };

  return datastore.save(entity);
}

exports.removeFromRoster = userid => {
  const key = datastore.key(['roster', userid]);
  return datastore.delete(key);
}

exports.addUser = userid => {
  const key = datastore.key(['user', userid]);
  return datastore.get(key).then(([data]) => {
    if (data === undefined) {
      const entity = {
        key: key,
        data: {
          id: userid,
          credits: 10
        } 
      };
      return datastore.save(entity);
    }
  });
}

exports.getUser = userid => {
  const key = datastore.key(['user', userid])
  return datastore.get(key).then(([data]) => data);
}

exports.getUsers = () => {
  const query = datastore.createQuery('user');
  return datastore.runQuery(query).then(([data]) => data)
}

exports.updateUser = (userdata) => {
  const key = datastore.key(['user', userdata.id]);
  return datastore.get(key).then(([user]) => {
    if (user === undefined) {
      throw "I couldn't find that guy."
    }
    return datastore.save({ key: key, data: userdata });
  });
}

exports.setChannel = channelid => {
  const key = datastore.key(['channel', 1])
  return datastore.get(key).then(data => {
    data[0].channel = channelid
    const entity = {
      key: key,
      data: data[0] 
    };
    return datastore.save(entity);
  })
}

exports.getChannel = () => {
  const key = datastore.key(['channel', 1])
  return datastore.get(key).then(data => data[0].channel);
}

exports.getToken = () => {
  const key = datastore.key(['channel', 1])
  return datastore.get(key).then(data => data[0].token);
}