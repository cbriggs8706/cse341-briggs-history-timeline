const routes = require('express').Router()

routes.use('/events', require('./events'))
routes.use('/societies', require('./societies'))

module.exports = routes
