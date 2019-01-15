const Koa = require('koa')
const debug = require('debug')('localhost')
const fs = require('fs')
const path = require('path')
const Dat = require('dat')
const os = require('os')
const parse = require('parse-dat-url')
const mkdirp = require('mkdirp')

const getSsbMsg = require('./lib/get-ssb-msg')
const getSsbBlob = require('./lib/get-ssb-blob')

debug.enabled = true

const app = new Koa()
const port = 8000

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')

const schemes = {
  'ssb:blob': getSsbBlob,
  'ssb:message': getSsbMsg,
  'dat': async (id) => {
    return new Promise((resolve, reject) => {
      const parsedId = parse(id)
      const key = parsedId.host
      const dest = path.join(os.homedir(), '.localhost', 'dat', key)
      const fullPath = path.join(dest, parsedId.path)
      debug('filesystem path: %s', fullPath)

      mkdirp.sync(dest)

      fs.access(fullPath, fs.constants.R_OK, (err) => {
        if (err) {
          if (err.code !== 'ENOENT') {
            debug(err)
          }

          Dat(dest, { key, sparse: true }, function (err, dat) {
            if (err) return reject(err)

            dat.joinNetwork(err => {
              if (err) return reject(err)

              dat.archive.readFile(parsedId.path, function (err, content) {
                if (err) return reject(err)

                const data = content.toString('utf-8')

                resolve(data)
                dat.leave()
              })
            })
          })
        } else {
          fs.readFile(fullPath, { encoding: 'utf-8' }, (err, data) => {
            if (err) return reject(err)

            resolve(data)
          })
        }
      })

      return `in the future this should show ${id} from Dat`
    })
  }
}

app.use(async (ctx, next) => {
  const s = ctx.request.query.s

  if (s && s.startsWith('web+')) {
    debug('web+')
    const redirect = '/' + s.replace('web+', '')
    debug('redirecting to %s', redirect)
    ctx.status = 302
    ctx.redirect(redirect)
    return next()
  } else if (ctx.request.path === '/') {
    debug('homepage requested')
    ctx.response.body = indexHtml
    return next()
  } else {
    debug('something else requested')
    const uri = ctx.request.path.replace('/', '')

    let handler

    const handled = Object.keys(schemes).some(scheme => {
      const prefix = `${scheme}:`
      debug(prefix)
      const match = uri.startsWith(prefix)
      if (match) {
        debug('found a match: %s', scheme)
        handler = schemes[scheme]
      }

      return match
    })

    if (handled) {
      debug('handling now')
      const data = await handler(uri)

      if (typeof data !== 'string') {
        ctx.response.set('Content-Disposition', `inline; filename=${uri}`)
      }
      ctx.response.body = data
      return next()
    } else {
      debug('redirecting now')
      ctx.status = 301
      ctx.redirect('/')
      return next()
    }
  }
})

app.listen(port)
debug(`start app by opening http://localhost:${port}`)
