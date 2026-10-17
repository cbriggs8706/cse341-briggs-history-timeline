const express = require('express')
const mongodb = require('./db/connect')
const swaggerUi = require('swagger-ui-express')
const apiDocument = require('./swagger.json')

const port = process.env.PORT || 8080
const app = express()
const cors = require('cors')

app.use(
	cors({
		origin: 'https://cse341-contacts-frontend.netlify.app',
	}),
)
app.use(express.json())
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(apiDocument))
app.use('/', require('./routes'))

mongodb.initDb((err) => {
	if (err) {
		console.log(err)
	} else {
		app.listen(port)
		console.log(`Connected to DB and listening on ${port}`)
	}
})
