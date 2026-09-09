'use strict'
// response
// external modules
const fs = require('fs')
const path = require('path')
// core
const config = require('./config')
const logger = require('./logger')
const models = require('./models')
const noteUtil = require('./web/note/util')
const errors = require('./errors')

// public
const response = {
  showIndex,
  showLogin,
  githubActions,
  gitlabActions
}

function showLogin (req, res, next) {
  if (req.isAuthenticated()) {
    const redirectUrl = req.session.returnTo && req.session.returnTo.startsWith('/') && !req.session.returnTo.startsWith('//')
      ? req.session.returnTo
      : config.serverURL + '/'
    delete req.session.returnTo
    return res.redirect(redirectUrl)
  }

  if (req.query.returnTo) {
    const rawReturnTo = req.query.returnTo
    if (rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')) {
      req.session.returnTo = rawReturnTo
    }
  }

  const data = {
    signin: false,
    infoMessage: req.flash('info'),
    errorMessage: req.flash('error'),
    returnTo: req.session.returnTo || ''
  }

  res.render('login.ejs', data)
}

function extractSnippet (content, maxLength = 140) {
  if (!content || typeof content !== 'string') return ''
  let text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/^[\s#>\-*+~_|=]+/gm, ' ')
    .replace(/[*_~`#|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length > maxLength) {
    text = text.slice(0, maxLength).trim() + '...'
  }
  return text
}

async function showIndex (req, res, next) {
  const authStatus = req.isAuthenticated()
  let deleteToken = ''

  const Op = models.Sequelize.Op
  let whereCondition

  if (!authStatus) {
    whereCondition = {
      permission: { [Op.in]: ['freely', 'editable', 'locked'] }
    }
  } else {
    whereCondition = {
      [Op.or]: [
        { permission: { [Op.in]: ['freely', 'editable', 'locked', 'protected', 'limited'] } },
        {
          permission: 'private',
          ownerId: req.user.id
        }
      ]
    }
  }

  try {
    if (authStatus) {
      const currentUser = await models.User.findOne({ where: { id: req.user.id } })
      if (currentUser) {
        deleteToken = currentUser.deleteToken
      }
    }

    const notes = await models.Note.findAll({
      where: whereCondition,
      order: [
        ['lastchangeAt', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: 60,
      include: [
        {
          model: models.User,
          as: 'owner',
          attributes: ['id', 'profile']
        }
      ]
    })

    const catalogNotes = notes.map(note => {
      let authorName = 'Cộng đồng'
      let authorPhoto = null
      if (note.owner && note.owner.profile) {
        try {
          const profile = typeof note.owner.profile === 'string' ? JSON.parse(note.owner.profile) : note.owner.profile
          authorName = profile.displayName || profile.username || profile.name || 'Thành viên'
          authorPhoto = profile.photo || null
        } catch (e) {
          authorName = 'Thành viên'
        }
      }

      const snippet = extractSnippet(note.content)

      return {
        id: note.alias || note.shortid || note.id,
        title: note.title || 'Ghi chú không tiêu đề',
        snippet: snippet || 'Không có nội dung mô tả',
        permission: note.permission,
        viewcount: note.viewcount || 0,
        lastchangeAt: note.lastchangeAt || note.createdAt,
        authorName,
        authorPhoto,
        isOwner: authStatus && note.ownerId === req.user.id
      }
    })

    let trashedNotes = []
    if (authStatus && req.user && req.user.id) {
      try {
        const rawTrashed = await models.Note.findAll({
          where: {
            ownerId: req.user.id,
            deletedAt: { [models.Sequelize.Op.ne]: null }
          },
          paranoid: false,
          order: [['deletedAt', 'DESC']]
        })
        trashedNotes = rawTrashed.map(note => {
          const snippet = extractSnippet(note.content)
          return {
            id: note.alias || note.shortid || note.id,
            title: note.title || 'Ghi chú không tiêu đề',
            snippet: snippet || 'Không có nội dung mô tả',
            permission: note.permission,
            viewcount: note.viewcount || 0,
            deletedAt: note.deletedAt,
            isOwner: true
          }
        })
      } catch (trashErr) {
        logger.error('Error querying trashed notes:', trashErr)
      }
    }

    const data = {
      signin: authStatus,
      user: req.user || null,
      notes: catalogNotes,
      trashedNotes: trashedNotes || [],
      infoMessage: req.flash('info'),
      errorMessage: req.flash('error'),
      imprint: fs.existsSync(path.join(config.docsPath, 'imprint.md')),
      privacyStatement: fs.existsSync(path.join(config.docsPath, 'privacy.md')),
      termsOfUse: fs.existsSync(path.join(config.docsPath, 'terms-of-use.md')),
      deleteToken,
      cspNonce: res.locals.nonce
    }

    res.render('index.ejs', data)
  } catch (err) {
    logger.error('Error in showIndex:', err)
    res.render('index.ejs', {
      signin: authStatus,
      user: req.user || null,
      notes: [],
      trashedNotes: [],
      infoMessage: req.flash('info'),
      errorMessage: req.flash('error'),
      imprint: false,
      privacyStatement: false,
      termsOfUse: false,
      deleteToken
    })
  }
}

function githubActions (req, res, next) {
  const noteId = req.params.noteId
  noteUtil.findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'gist':
        githubActionGist(req, res, note)
        break
      default:
        res.redirect(config.serverURL + '/' + noteId)
        break
    }
  })
}

function githubActionGist (req, res, note) {
  const code = req.query.code
  const state = req.query.state
  const sessionsState = req.session.githubGistState
  const redirectUri = req.session.githubGistRedirectUri
  delete req.session.githubGistState
  delete req.session.githubGistRedirectUri
  if (!code || !state || sessionsState !== state) {
    return errors.errorForbidden(res)
  }

  const data = {
    client_id: config.github.clientID,
    client_secret: config.github.clientSecret,
    code,
    redirect_uri: redirectUri
  }
  const authUrl = 'https://github.com/login/oauth/access_token'
  fetch(authUrl, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  }).then(resp => {
    if (!resp.ok) {
      throw new Error('forbidden')
    }
    return resp.json()
  }).then(body => {
    const accessToken = body.access_token
    if (!accessToken) {
      throw new Error('forbidden')
    }
    const content = note.content
    const title = models.Note.decodeTitle(note.title)
    const filename = title.replace('/', ' ') + '.md'
    const gist = {
      files: {}
    }
    gist.files[filename] = {
      content
    }
    const gistUrl = 'https://api.github.com/gists'
    return fetch(gistUrl, {
      method: 'POST',
      body: JSON.stringify(gist),
      headers: {
        'User-Agent': 'HedgeDoc',
        Authorization: 'token ' + accessToken,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    })
  }).then(resp => {
    if (resp.status !== 201) {
      throw new Error('forbidden')
    }
    return resp.json()
  }).then(body => {
    res.setHeader('referer', '')
    res.redirect(body.html_url)
  }).catch(error => {
    if (error.message === 'forbidden') {
      return errors.errorForbidden(res)
    }
    logger.error('GitHub Gist auth failed: ' + error)
    return errors.errorInternalError(res)
  })
}

function gitlabActions (req, res, next) {
  const noteId = req.params.noteId
  noteUtil.findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'projects':
        gitlabActionProjects(req, res, note)
        break
      default:
        res.redirect(config.serverURL + '/' + noteId)
        break
    }
  })
}

function gitlabActionProjects (req, res, note) {
  if (req.isAuthenticated()) {
    models.User.findOne({
      where: {
        id: req.user.id
      }
    }).then(function (user) {
      if (!user) {
        return errors.errorNotFound(res)
      }
      const ret = {
        baseURL: config.gitlab.baseURL,
        version: config.gitlab.version,
        accesstoken: user.accessToken,
        profileid: user.profileid,
        projects: []
      }
      const apiUrl = `${config.gitlab.baseURL}/api/${config.gitlab.version}/projects?membership=yes&per_page=100&access_token=${user.accessToken}`
      fetch(apiUrl).then(resp => {
        if (!resp.ok) {
          res.send(ret)
          return Promise.reject(new Error('HTTP request returned not okay-ish status'))
        }
        return resp.json()
      }).then(body => {
        ret.projects = body
        return res.send(ret)
      }).catch(err => {
        logger.error('gitlab action projects failed: ', err)
      })
    }).catch(function (err) {
      logger.error('gitlab action projects failed: ' + err)
      return errors.errorInternalError(res)
    })
  } else {
    return errors.errorForbidden(res)
  }
}

module.exports = response
