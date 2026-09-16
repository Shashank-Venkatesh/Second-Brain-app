const http = require('node:http')
const crypto = require('node:crypto')
const fs = require('node:fs/promises')
const https = require('node:https')
const { URL, URLSearchParams } = require('node:url')

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me'

const requestToken = (parameters) => new Promise((resolve, reject) => {
  const body = new URLSearchParams(parameters).toString()
  const request = https.request(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, (response) => {
    let responseBody = ''
    response.setEncoding('utf8')
    response.on('data', (chunk) => { responseBody += chunk })
    response.on('end', () => {
      let payload
      try {
        payload = JSON.parse(responseBody)
      } catch {
        reject(new Error('Google returned an invalid token response.'))
        return
      }

      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new Error(payload.error_description || 'Google rejected the OAuth request.'))
        return
      }

      resolve(payload)
    })
  })

  request.on('error', () => reject(new Error('Could not reach Google to finish authentication.')))
  request.end(body)
})

const gmailRequest = (token, requestPath) => new Promise((resolve, reject) => {
  https.get(`${GMAIL_API}${requestPath}`, { headers: { Authorization: `Bearer ${token}` } }, (response) => {
    let responseBody = ''
    response.setEncoding('utf8')
    response.on('data', (chunk) => { responseBody += chunk })
    response.on('end', () => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new Error('Gmail could not return the selected messages.'))
        return
      }
      try {
        resolve(JSON.parse(responseBody))
      } catch {
        reject(new Error('Gmail returned an invalid message response.'))
      }
    })
  }).on('error', () => reject(new Error('Could not reach Gmail.')))
})

const readStoredToken = async ({ safeStorage, userDataPath }) => {
  const tokenPath = require('node:path').join(userDataPath, 'gmail-token.bin')
  const encryptedToken = await fs.readFile(tokenPath)
  return JSON.parse(safeStorage.decryptString(encryptedToken))
}

const headerValue = (headers, name) => headers.find((header) => header.name.toLowerCase() === name)?.value || ''

const syncGmailDomain = async ({ domain, folderPath, safeStorage, userDataPath }) => {
  if (!domain?.trim()) throw new Error('Choose a domain before importing.')
  if (!folderPath) throw new Error('Choose a local folder before importing.')
  const token = await readStoredToken({ safeStorage, userDataPath })
  const query = encodeURIComponent(`"${domain.trim()}"`)
  const list = await gmailRequest(token.access_token, `/messages?maxResults=25&q=${query}`)
  const messages = await Promise.all((list.messages || []).map(({ id }) => gmailRequest(token.access_token, `/messages/${id}?format=full`)))
  await fs.mkdir(folderPath, { recursive: true })
  const path = require('node:path')
  const results = await Promise.all(messages.map(async (message) => {
    const headers = message.payload?.headers || []
    const subject = headerValue(headers, 'Subject') || 'Untitled message'
    const sender = headerValue(headers, 'From')
    const date = headerValue(headers, 'Date')
    const safeName = subject.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 80) || message.id
    const fileName = `${safeName}-${message.id}.md`
    const filePath = path.join(folderPath, fileName)
    const content = `---\nsource: gmail\ndomain: ${domain.trim()}\nmessage_id: ${message.id}\n---\n\n# ${subject}\n\n- From: ${sender}\n- Date: ${date}\n\n${message.snippet || ''}\n`
    // `wx` fails on an existing file rather than overwriting it, which is how
    // imports stay idempotent. Track that outcome instead of discarding it so
    // callers get an accurate new-vs-already-had-it count.
    let isNew = true
    try {
      await fs.writeFile(filePath, content, { encoding: 'utf8', flag: 'wx' })
    } catch (error) {
      if (error.code === 'EEXIST') {
        isNew = false
      } else {
        throw error
      }
    }
    return { subject, fileName, isNew }
  }))
  const imported = results.filter((result) => result.isNew).length
  return {
    imported,
    skipped: results.length - imported,
    total: results.length,
    items: results.map(({ subject, fileName, isNew }) => ({ subject, fileName, isNew })),
  }
}

const authenticateGmail = async ({ clientId, clientSecret, shell, safeStorage, userDataPath }) => {
  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
  }

  const state = crypto.randomBytes(32).toString('hex')
  let callbackResolve
  let callbackReject
  const callbackPromise = new Promise((resolve, reject) => {
    callbackResolve = resolve
    callbackReject = reject
  })
  const server = http.createServer((request, response) => {
    const callbackUrl = new URL(request.url, 'http://127.0.0.1')
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    response.end('<h1>Authentication complete</h1><p>You can close this window and return to Second Brain.</p>')
    server.close()
    callbackResolve({
      code: callbackUrl.searchParams.get('code'),
      error: callbackUrl.searchParams.get('error'),
      description: callbackUrl.searchParams.get('error_description'),
      state: callbackUrl.searchParams.get('state'),
    })
  })
  server.on('error', () => callbackReject(new Error('Could not start the local OAuth callback.')))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

  const redirectUri = `http://127.0.0.1:${server.address().port}`
  const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authorizationUrl.search = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: GMAIL_SCOPE, access_type: 'offline', prompt: 'consent', state }).toString()
  await shell.openExternal(authorizationUrl.toString())

  const callback = await Promise.race([
    callbackPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Gmail authentication timed out.')), 5 * 60 * 1000)),
  ])
  if (callback.state !== state) throw new Error('OAuth state verification failed.')
  if (callback.error) throw new Error(callback.description || `Google denied access: ${callback.error}`)
  if (!callback.code) throw new Error('Google did not return an authorization code.')

  const token = await requestToken({ code: callback.code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' })
  if (!safeStorage.isEncryptionAvailable()) throw new Error('OS encryption is unavailable; Gmail tokens were not saved.')

  const tokenPath = require('node:path').join(userDataPath, 'gmail-token.bin')
  const encryptedToken = safeStorage.encryptString(JSON.stringify(token))
  await fs.writeFile(tokenPath, encryptedToken, { mode: 0o600 })
  return { connected: true }
}

module.exports = { authenticateGmail, syncGmailDomain }
