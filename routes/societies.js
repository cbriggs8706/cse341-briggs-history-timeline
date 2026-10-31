const routes = require('express').Router()
const societiesController = require('../controllers/societies')

routes.get('/', societiesController.getAllSocieties)
routes.get('/:id', societiesController.getSocietyById)
routes.post('/', societiesController.createSociety)
routes.put('/:id', societiesController.updateSociety)
routes.delete('/:id', societiesController.deleteSociety)

module.exports = routes
