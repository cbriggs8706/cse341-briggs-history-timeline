const swaggerAutogen = require('swagger-autogen')()

const doc = {
	info: {
		title: 'Events API',
		description: 'Documentation for the events routes',
	},
	// host: 'localhost:8080',
	// schemes: ['http'],
	host: 'cse341-briggs-history-timeline.onrender.com',
	schemes: ['https'],
	definitions: {
		Event: {
			title: 'Fall of the Roman Empire',
			description: 'The fall of the Western Roman Empire',
			year: 476,
			month: 9,
			day: 4,
			location: 'Rome, Italy',
			category: 'History',
		},
	},
}

const outputFile = './swagger.json'
const routes = ['./routes/index.js']

swaggerAutogen(outputFile, routes, doc)
