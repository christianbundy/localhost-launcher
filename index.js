const Koa = require('koa');
const fs = require('fs')
const path = require('path')
const debug = require('debug')('localhost')

debug.enabled = true

const app = new Koa();
const port = 8000

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8')

const schemes = {
  ssb: (uri) => {
    return `in the future this should show ${uri} from Scuttlebutt`
  },
  dat: (uri) => {
    return `in the future this should show ${uri} from Dat`
  }
}

app.use(async ctx => {
  const s = ctx.request.query.s

  if (s && s.startsWith('web+')) {
    debug('web+')
    const redirect ='/' + s.replace('web+', '')
    debug('redirecting to %s', redirect)
    ctx.status = 302;
    return ctx.redirect(redirect);
  } else if (ctx.request.path === '/') {
    debug('home')
    return ctx.body = indexHtml;
  } else {
    debug('else')
    const uri = ctx.request.path.replace('/', '')

    let handler

    const handled = Object.keys(schemes).some(scheme => {
      const prefix = `${scheme}:`
      const match = uri.startsWith(prefix)
      if (match) {
        handler = schemes[scheme]
      }

      return match
    })

    if (handled) {
      return ctx.body = handler(uri)
    } else {
      ctx.status = 301;
      return ctx.redirect('/');
    }
  }
});

app.listen(port);
debug(`start app by opening http://localhost:${port}`)
