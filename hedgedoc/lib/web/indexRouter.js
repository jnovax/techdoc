'use strict'

const models = require('../models')
const response = require('../response')

async function getTrashedNotes (userId) {
  if (!userId) return []
  return models.Note.findAll({
    where: {
      ownerId: userId,
      deletedAt: { [models.Sequelize.Op.ne]: null }
    },
    paranoid: false,
    order: [['deletedAt', 'DESC']]
  })
}

// Hook into response.showIndex to provide trashedNotes to index.ejs
if (response && response.showIndex) {
  const originalShowIndex = response.showIndex
  response.showIndex = async function (req, res, next) {
    const originalRender = res.render.bind(res)
    res.render = async function (view, data, fn) {
      if (view === 'index.ejs' && data) {
        try {
          let trashedNotes = []
          if (req.isAuthenticated && req.isAuthenticated()) {
            trashedNotes = await models.Note.findAll({
              where: {
                ownerId: req.user.id,
                deletedAt: { [models.Sequelize.Op.ne]: null }
              },
              paranoid: false,
              order: [['deletedAt', 'DESC']]
            })
          }
          data.trashedNotes = trashedNotes || []
        } catch (e) {
          data.trashedNotes = []
        }
      }
      return originalRender(view, data, fn)
    }
    return originalShowIndex.call(this, req, res, next)
  }
}

module.exports = {
  getTrashedNotes
}
