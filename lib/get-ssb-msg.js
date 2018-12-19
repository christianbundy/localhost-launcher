const debug = require('debug')('localhost').extend('ssb:message')
const ssbClient = require('ssb-client')
const ssbUri = require('ssb-uri')

debug.enabled = true

module.exports = async (uri) => {
  debug('starting ssb client')

  return new Promise((resolve, reject) => {
    ssbClient((err, ssbServer) => {
      debug('inside')
      if (err) return reject(err)
      debug('no error inside')

      const sl = ssbUri.toSigilLink(uri)
      debug(sl)

      debug('starting promise')
      ssbServer.get(sl, (err, res) => {
        debug('callback')
        if (err) return reject(err)

        return resolve(JSON.stringify(res, null, 2))
      })
    })
  })
}
