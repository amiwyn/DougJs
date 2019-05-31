const crypto = require('crypto')
const qs = require('qs')
const store = require('./store');

let slackSigningSecret = "doug"
store.getSigningSecret()
.then(secret => slackSigningSecret = secret)
.catch(console.error)

let requestVerification = (req, res, next) => {
  let slackSignature = req.headers['x-slack-signature']
  let requestBody = qs.stringify(req.body, {format : 'RFC1738'})
  let timestamp = req.headers['x-slack-request-timestamp']
  let time = Math.floor(new Date().getTime()/1000)
   
  if (Math.abs(time - timestamp) > 300) {
    return res.status(400).send('the request is not fresh')
  }

  if (!slackSignature) {
    return res.status(400).send('no slack signature')
  }

  let sigBasestring = 'v0:' + timestamp + ':' + requestBody
  let dougSignature = 'v0=' + crypto.createHmac('sha256', slackSigningSecret).update(sigBasestring, 'utf8').digest('hex')
  
  if (crypto.timingSafeEqual(Buffer.from(dougSignature, 'utf8'), Buffer.from(slackSignature, 'utf8'))) {
    next()
  } 
  else {
    return res.status(400).send('Verification failed')
  }
}

module.exports.verify = requestVerification