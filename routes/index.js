const routes = require('express').Router()

routes.use('/events', require('./events'))

module.exports = routes
