const routes = require('express').Router()

routes.use('/events', require('./events'))
routes.use('/societies', require('./societies'))
routes.use('/auth', require('./auth'))

module.exports = routes
