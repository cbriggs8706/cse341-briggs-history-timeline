require('dotenv').config()

const express = require('express')
const mongodb = require('./db/connect')
const swaggerUi = require('swagger-ui-express')
const apiDocument = require('./swagger.json')
const session = require('express-session')
const { MongoStore } = require('connect-mongo')
const passport = require('./config/passport')

const port = process.env.PORT || 8080
const app = express()
app.set('trust proxy', 1)
const cors = require('cors')

app.use(
	cors({
		origin: 'https://cse341-contacts-frontend.netlify.app',
	}),
)
app.use(express.json())
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		store: MongoStore.create({
			mongoUrl: process.env.MONGO_DB_CONNECTION_STRING,
			dbName: 'cse341-history-timeline',
			collectionName: 'sessions',
		}),
		cookie: {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 24 * 60 * 60 * 1000,
		},
	}),
)

app.use(passport.initialize())
app.use(passport.session())

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
