const swaggerAutogen = require('swagger-autogen')()

const doc = {
	info: {
		title: 'Contacts API',
		description: 'Documentation for the contacts routes',
	},
	host: 'cse341-history-timeline.onrender.com',
	schemes: ['https'],
	definitions: {
		Contact: {
			firstName: 'John',
			lastName: 'Doe',
			email: 'john.doe@example.com',
			favoriteColor: 'blue',
			birthday: '1990-01-01',
		},
	},
}

const outputFile = './swagger.json'
const routes = ['./routes/index.js']

swaggerAutogen(outputFile, routes, doc)
