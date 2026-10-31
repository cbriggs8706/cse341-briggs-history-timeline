const mongodb = require('../db/connect')
const ObjectId = require('mongodb').ObjectId

const getAllEvents = async (req, res, next) => {
	/* #swagger.responses[200] = {
  description: 'All events.',
  schema: [{ $ref: '#/definitions/Event' }]
} */
	/* #swagger.responses[500] = {
	description: 'Unexpected database or server error.',
	schema: { $ref: '#/definitions/Error' }
} */
	try {
		const events = await mongodb.getDb().collection('events').find().toArray()

		return res.status(200).json(events)
	} catch (error) {
		console.error('Error fetching events:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while fetching events.',
		})
	}
}

const getEventById = async (req, res, next) => {
	/* #swagger.responses[200] = {
  description: 'The requested event.',
  schema: { $ref: '#/definitions/Event' }
} */
	/*
#swagger.parameters['id'] = {
	in: 'path',
	required: true,
	type: 'string',
	description: 'A 24-character hexadecimal MongoDB event ID.'
}
#swagger.responses[400] = {
	description: 'Invalid event ID.',
	schema: { $ref: '#/definitions/Error' }
}
#swagger.responses[404] = {
	description: 'Event not found.',
	schema: { $ref: '#/definitions/Message' }
}
#swagger.responses[500] = {
	description: 'Unexpected database or server error.',
	schema: { $ref: '#/definitions/Error' }
}
*/
	if (!ObjectId.isValid(req.params.id)) {
		return res.status(400).json({
			error: 'Invalid event ID. Use a 24-character hexadecimal MongoDB ID.',
		})
	}
	try {
		const userId = new ObjectId(req.params.id)

		const event = await mongodb
			.getDb()
			.collection('events')
			.findOne({ _id: userId })

		if (!event) {
			return res.status(404).json({ message: 'Event not found' })
		}

		return res.status(200).json(event)
	} catch (error) {
		console.error('Error fetching event:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while fetching the event.',
		})
	}
}

const validateEvent = (event) => {
	if (!event || typeof event !== 'object' || Array.isArray(event)) {
		return 'Request body must be an event object.'
	}

	const requiredTextFields = ['title', 'description', 'location', 'category']

	for (const field of requiredTextFields) {
		if (typeof event[field] !== 'string' || event[field].trim() === '') {
			return `${field} is required and must be a nonempty string.`
		}
	}

	if (!Number.isInteger(event.year)) {
		return 'year is required and must be an integer.'
	}

	if (
		event.month !== undefined &&
		(!Number.isInteger(event.month) || event.month < 1 || event.month > 12)
	) {
		return 'month must be an integer between 1 and 12.'
	}

	if (event.day !== undefined) {
		if (event.month === undefined) {
			return 'month is required when day is provided.'
		}

		const leapYear =
			event.year % 4 === 0 && (event.year % 100 !== 0 || event.year % 400 === 0)

		const daysInMonth = [
			31,
			leapYear ? 29 : 28,
			31,
			30,
			31,
			30,
			31,
			31,
			30,
			31,
			30,
			31,
		]

		if (
			!Number.isInteger(event.day) ||
			event.day < 1 ||
			event.day > daysInMonth[event.month - 1]
		) {
			return 'day must be a valid integer for the selected month and year.'
		}
	}

	return null
}

const createEvent = async (req, res) => {
	/*
#swagger.parameters['body'] = {
	in: 'body',
	required: true,
	description: 'Required: title, description, year, location, category. Month and day are optional. Day requires month.',
	schema: { $ref: '#/definitions/Event' }
}
#swagger.responses[201] = {
	description: 'Event created. Returns the MongoDB insert result.'
}
#swagger.responses[400] = {
	description: 'Missing required fields, invalid field types, or invalid date.',
	schema: { $ref: '#/definitions/Error' }
}
#swagger.responses[500] = {
	description: 'Unable to create the event or an unexpected database error.',
	schema: { $ref: '#/definitions/Error' }
}
*/

	const validationError = validateEvent(req.body)
	if (validationError) {
		return res.status(400).json({ error: validationError })
	}

	const event = {
		title: req.body.title,
		description: req.body.description,
		year: req.body.year,
		month: req.body.month,
		day: req.body.day,
		location: req.body.location,
		category: req.body.category,
	}
	try {
		const response = await mongodb.getDb().collection('events').insertOne(event)

		if (!response.acknowledged) {
			return res.status(500).json({
				error: 'Unable to create the event.',
			})
		}

		return res.status(201).json(response)
	} catch (error) {
		console.error('Error creating event:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while creating the event.',
		})
	}
}

const updateEvent = async (req, res) => {
	/*
#swagger.parameters['id'] = {
	in: 'path',
	required: true,
	type: 'string',
	description: 'A 24-character hexadecimal MongoDB event ID.'
}
#swagger.parameters['body'] = {
	in: 'body',
	required: true,
	description: 'Required: title, description, year, location, category. Month and day are optional; omitted values remain unchanged. Extra fields are ignored.',
	schema: { $ref: '#/definitions/Event' }
}
#swagger.responses[200] = {
	description: 'Event updated successfully.',
	schema: { $ref: '#/definitions/Message' }
}
#swagger.responses[400] = {
	description: 'Invalid event ID or invalid event data.',
	schema: { $ref: '#/definitions/Error' }
}
#swagger.responses[404] = {
	description: 'Event not found.',
	schema: { $ref: '#/definitions/Message' }
}
#swagger.responses[500] = {
	description: 'Unexpected database or server error.',
	schema: { $ref: '#/definitions/Error' }
}
*/
	const validationError = validateEvent(req.body)
	if (validationError) {
		return res.status(400).json({ error: validationError })
	}
	if (!ObjectId.isValid(req.params.id)) {
		return res.status(400).json({
			error: 'Invalid event ID. Use a 24-character hexadecimal MongoDB ID.',
		})
	}
	const userId = new ObjectId(req.params.id)
	const event = {
		title: req.body.title,
		description: req.body.description,
		year: req.body.year,
		location: req.body.location,
		category: req.body.category,
	}

	if (req.body.month !== undefined) {
		event.month = req.body.month
	}

	if (req.body.day !== undefined) {
		event.day = req.body.day
	}
	try {
		const result = await mongodb
			.getDb()
			.collection('events')
			.updateOne({ _id: userId }, { $set: event })

		if (result.matchedCount === 0) {
			return res.status(404).json({ message: 'Event not found' })
		}

		return res.status(200).json({
			message: 'Event updated successfully',
		})
	} catch (error) {
		console.error('Error updating event:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while updating the event.',
		})
	}
}

const deleteEvent = async (req, res) => {
	/*
#swagger.parameters['id'] = {
	in: 'path',
	required: true,
	type: 'string',
	description: 'A 24-character hexadecimal MongoDB event ID.'
}
#swagger.responses[200] = {
	description: 'Event deleted successfully.',
	schema: { $ref: '#/definitions/Message' }
}
#swagger.responses[400] = {
	description: 'Invalid event ID.',
	schema: { $ref: '#/definitions/Error' }
}
#swagger.responses[404] = {
	description: 'Event not found.',
	schema: { $ref: '#/definitions/Message' }
}
#swagger.responses[500] = {
	description: 'Unexpected database or server error.',
	schema: { $ref: '#/definitions/Error' }
}
*/
	if (!ObjectId.isValid(req.params.id)) {
		return res.status(400).json({
			error: 'Invalid event ID. Use a 24-character hexadecimal MongoDB ID.',
		})
	}
	const userId = new ObjectId(req.params.id)
	try {
		const result = await mongodb
			.getDb()
			.collection('events')
			.deleteOne({ _id: userId })

		if (result.deletedCount === 0) {
			return res.status(404).json({ message: 'Event not found' })
		}

		return res.status(200).json({
			message: 'Event deleted successfully',
		})
	} catch (error) {
		console.error('Error deleting event:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while deleting the event.',
		})
	}
}

module.exports = {
	getAllEvents: getAllEvents,
	getEventById: getEventById,
	createEvent: createEvent,
	updateEvent: updateEvent,
	deleteEvent: deleteEvent,
}
