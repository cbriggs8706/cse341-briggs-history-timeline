const routes = require('express').Router()
const eventsController = require('../controllers/events')

routes.get('/', eventsController.getAllEvents)
routes.get('/:id', eventsController.getEventById)
routes.post('/', eventsController.createEvent)
routes.put('/:id', eventsController.updateEvent)
routes.delete('/:id', eventsController.deleteEvent)

module.exports = routes
