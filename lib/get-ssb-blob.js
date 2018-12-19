const debug = require('debug')('localhost').extend('ssb:blob')
const ssbUri = require('ssb-uri')
const pull = require('pull-stream')
const os = require('os')
const path = require('path')
const Blobs = require('multiblob')

debug.enabled = true

const blobs = Blobs({
  dir: path.join(os.homedir(), '.ssb', 'blobs'),
  alg: 'sha256'}
)

debug('loading')
module.exports = async (uri) => {
  debug('here we go')

  return new Promise((resolve, reject) => {
    const sl = ssbUri.toSigilLink(uri)
    debug(sl)
    pull(
      blobs.get(sl.replace('&', '')),
      pull.collect((err, ary) => {
        debug('collected')
        debug(err)
        const blob = ary[0]
        if (err) return reject(err)
        return resolve(blob)
      })
    )
  })
}
