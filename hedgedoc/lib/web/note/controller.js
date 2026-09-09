'use strict'

const models = require('../../models')
const logger = require('../../logger')
const config = require('../../config')
const errors = require('../../errors')
const realtime = require('../../realtime')

const noteUtil = require('./util')
const noteActions = require('./actions')

exports.publishNoteActions = function (req, res, next) {
  noteUtil.findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'download':
        exports.downloadMarkdown(req, res, note)
        break
      case 'edit':
        res.redirect(config.serverURL + '/' + (note.alias ? note.alias : models.Note.encodeNoteId(note.id)) + '?both')
        break
      default:
        res.redirect(config.serverURL + '/s/' + note.shortid)
        break
    }
  })
}

exports.showPublishNote = function (req, res, next) {
  const include = [{
    model: models.User,
    as: 'owner'
  }, {
    model: models.User,
    as: 'lastchangeuser'
  }]
  noteUtil.findNote(req, res, function (note) {
    // force to use short id
    const shortid = req.params.shortid
    if ((note.alias && shortid !== note.alias) || (!note.alias && shortid !== note.shortid)) {
      return res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
    }
    note.increment('viewcount').then(function (note) {
      if (!note) {
        return errors.errorNotFound(res)
      }
      noteUtil.getPublishData(req, res, note, (data) => {
        res.set({
          'Cache-Control': 'private' // only cache by client
        })
        return res.render('pretty.ejs', data)
      })
    }).catch(function (err) {
      logger.error(err)
      return errors.errorInternalError(res)
    })
  }, include)
}

exports.showNote = function (req, res, next) {
  noteUtil.findNote(req, res, function (note) {
    // force to use note id
    const noteId = req.params.noteId
    const id = models.Note.encodeNoteId(note.id)
    if ((note.alias && noteId !== note.alias) || (!note.alias && noteId !== id)) {
      return res.redirect(config.serverURL + '/' + (note.alias || id))
    }
    const body = note.content
    const extracted = models.Note.extractMeta(body)
    const meta = models.Note.parseMeta(extracted.meta)
    let title = models.Note.decodeTitle(note.title)
    title = models.Note.generateWebTitle(meta.title || title)
    const opengraph = models.Note.parseOpengraph(meta, title)
    res.set({
      'Cache-Control': 'private', // only cache by client
      'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
    })
    return res.render('hedgedoc.ejs', {
      title,
      opengraph
    })
  }, null, true)
}

exports.createFromPOST = function (req, res, next) {
  if (config.disableNoteCreation) {
    return errors.errorForbidden(res)
  }
  let body = ''
  if (req.body && req.body.length > config.documentMaxLength) {
    return errors.errorTooLong(res)
  } else if (typeof req.body === 'string') {
    body = req.body
  }
  body = body.replace(/[\r]/g, '')
  return noteUtil.newNote(req, res, body)
}

exports.doAction = function (req, res, next) {
  const noteId = req.params.noteId
  noteUtil.findNote(req, res, function (note) {
    const action = req.params.action
    switch (action) {
      case 'publish':
      case 'pretty': // pretty deprecated
        res.redirect(config.serverURL + '/s/' + (note.alias || note.shortid))
        break
      case 'slide':
        res.redirect(config.serverURL + '/p/' + (note.alias || note.shortid))
        break
      case 'download':
        exports.downloadMarkdown(req, res, note)
        break
      case 'info':
        noteActions.getInfo(req, res, note)
        break
      case 'gist':
        noteActions.createGist(req, res, note)
        break
      case 'revision':
        noteActions.getRevision(req, res, note)
        break
      default:
        return res.redirect(config.serverURL + '/' + noteId)
    }
  })
}

exports.downloadMarkdown = function (req, res, note) {
  const body = note.content
  let filename = models.Note.decodeTitle(note.title)
  filename = encodeURIComponent(filename)
  res.set({
    'Access-Control-Allow-Origin': '*', // allow CORS as API
    'Access-Control-Allow-Headers': 'Range',
    'Access-Control-Expose-Headers': 'Cache-Control, Content-Encoding, Content-Range',
    'Content-Type': 'text/markdown; charset=UTF-8',
    'Cache-Control': 'private',
    'Content-disposition': 'attachment; filename=' + filename + '.md',
    'X-Robots-Tag': 'noindex, nofollow' // prevent crawling
  })
  res.send(body)
}

function findNoteWithParanoid (noteId, paranoid, callback) {
  if (!noteId) return callback(null, null)
  if (models.Note.checkNoteIdValid(noteId)) {
    return models.Note.findOne({
      where: { id: noteId },
      paranoid
    }).then(note => callback(null, note)).catch(err => callback(err, null))
  }
  models.Note.parseNoteId(noteId, function (err, id) {
    if (err) return callback(err, null)
    if (!id) {
      return models.Note.findOne({
        where: {
          [models.Sequelize.Op.or]: [
            { alias: noteId },
            { shortid: noteId }
          ]
        },
        paranoid
      }).then(note => callback(null, note)).catch(err => callback(err, null))
    }
    models.Note.findOne({
      where: { id },
      paranoid
    }).then(note => callback(null, note)).catch(err => callback(err, null))
  })
}

exports.trashNote = function (req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const noteId = req.params.noteId
  findNoteWithParanoid(noteId, true, function (err, note) {
    if (err) {
      logger.error(err)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!note) {
      return res.status(404).json({ error: 'Note not found' })
    }
    if (note.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    note.destroy().then(function () {
      if (realtime && realtime.io) {
        try {
          realtime.io.to(note.id).emit('delete')
          if (note.alias) {
            realtime.io.to(note.alias).emit('delete')
          }
        } catch (e) {
          logger.error('Failed to broadcast socket delete:', e)
        }
      }
      return res.json({ success: true, message: 'Đã chuyển tài liệu vào thùng rác' })
    }).catch(function (err) {
      logger.error(err)
      return res.status(500).json({ error: 'Internal server error' })
    })
  })
}

exports.restoreNote = function (req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const noteId = req.params.noteId
  findNoteWithParanoid(noteId, false, function (err, note) {
    if (err) {
      logger.error(err)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!note) {
      return res.status(404).json({ error: 'Note not found' })
    }
    if (note.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    note.restore().then(function () {
      return res.json({ success: true, message: 'Đã khôi phục tài liệu thành công' })
    }).catch(function (err) {
      logger.error(err)
      return res.status(500).json({ error: 'Internal server error' })
    })
  })
}

exports.forceDeleteNote = function (req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  const noteId = req.params.noteId
  findNoteWithParanoid(noteId, false, function (err, note) {
    if (err) {
      logger.error(err)
      return res.status(500).json({ error: 'Internal server error' })
    }
    if (!note) {
      return res.status(404).json({ error: 'Note not found' })
    }
    if (note.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }
    note.destroy({ force: true }).then(function () {
      return res.json({ success: true, message: 'Đã xóa vĩnh viễn tài liệu' })
    }).catch(function (err) {
      logger.error(err)
      return res.status(500).json({ error: 'Internal server error' })
    })
  })
}

