const mongodb = require('../db/connect')
const ObjectId = require('mongodb').ObjectId

const getAllEvents = async (req, res, next) => {
	/* #swagger.responses[200] = {
  description: 'All events.',
  schema: [{ $ref: '#/definitions/Event' }]
} */
	const results = await mongodb.getDb().collection('events').find()
	results.toArray().then((lists) => {
		res.setHeader('Content-Type', 'application/json')
		res.status(200).json(lists)
	})
}

const getEventById = async (req, res, next) => {
	/* #swagger.responses[200] = {
  description: 'The requested event.',
  schema: { $ref: '#/definitions/Event' }
} */
	const userId = new ObjectId(req.params.id)
	const result = await mongodb
		.getDb()
		.collection('events')
		.find({ _id: userId })
	result.toArray().then((lists) => {
		res.setHeader('Content-Type', 'application/json')
		res.status(200).json(lists[0])
	})
}

const createEvent = async (req, res) => {
	/* #swagger.parameters['body'] = {
  in: 'body',
  required: true,
  description: 'The event to create.',
  schema: { $ref: '#/definitions/Event' }
	
} */
	const event = {
		title: req.body.title,
		description: req.body.description,
		year: req.body.year,
		month: req.body.month,
		day: req.body.day,
		location: req.body.location,
		category: req.body.category,
	}
	const response = await mongodb.getDb().collection('events').insertOne(event)
	if (response.acknowledged) {
		res.status(201).json(response)
	} else {
		res
			.status(500)
			.json(response.error || 'Some error occurred while creating the event.')
	}
}

const updateEvent = async (req, res) => {
	/* #swagger.parameters['body'] = {
  in: 'body',
  required: true,
  description: 'The event to update.',
  schema: { $ref: '#/definitions/Event' }
	
} */
	const userId = new ObjectId(req.params.id)
	const event = req.body
	const result = await mongodb
		.getDb()
		.collection('events')
		.updateOne({ _id: userId }, { $set: event })
	if (result.matchedCount === 0) {
		return res.status(404).json({ message: 'Event not found' })
	}
	res.status(200).json({ message: 'Event updated successfully' })
}

const deleteEvent = async (req, res) => {
	const userId = new ObjectId(req.params.id)
	const result = await mongodb
		.getDb()
		.collection('events')
		.deleteOne({ _id: userId })
	if (result.deletedCount === 0) {
		return res.status(404).json({ message: 'Event not found' })
	}
	res.status(200).json({ message: 'Event deleted successfully' })
}

module.exports = {
	getAllEvents: getAllEvents,
	getEventById: getEventById,
	createEvent: createEvent,
	updateEvent: updateEvent,
	deleteEvent: deleteEvent,
}
