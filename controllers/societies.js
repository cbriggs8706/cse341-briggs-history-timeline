const mongodb = require('../db/connect')
const { ObjectId } = require('mongodb')

const validateSociety = (society) => {
	if (!society || typeof society !== 'object' || Array.isArray(society)) {
		return 'Request body must be a society object.'
	}

	const requiredTextFields = [
		'name',
		'description',
		'region',
		'government',
		'religiousLandscape',
		'historicalImpact',
	]

	for (const field of requiredTextFields) {
		if (typeof society[field] !== 'string' || society[field].trim() === '') {
			return `${field} is required and must be a nonempty string.`
		}
	}

	if (!Number.isInteger(society.startYear) || society.startYear === 0) {
		return 'startYear must be an integer other than zero.'
	}

	if (society.endYear !== undefined) {
		if (!Number.isInteger(society.endYear) || society.endYear === 0) {
			return 'endYear must be an integer other than zero.'
		}

		if (society.endYear < society.startYear) {
			return 'endYear cannot be earlier than startYear.'
		}
	}

	if (
		society.dateNotes !== undefined &&
		(typeof society.dateNotes !== 'string' || society.dateNotes.trim() === '')
	) {
		return 'dateNotes must be a nonempty string when provided.'
	}

	if (
		!Array.isArray(society.sources) ||
		society.sources.length === 0 ||
		!society.sources.every(
			(source) => typeof source === 'string' && source.trim() !== '',
		)
	) {
		return 'sources must be an array containing at least one nonempty reference.'
	}

	return null
}

const buildSociety = (body) => {
	const society = {
		name: body.name.trim(),
		description: body.description.trim(),
		startYear: body.startYear,
		region: body.region.trim(),
		government: body.government.trim(),
		religiousLandscape: body.religiousLandscape.trim(),
		historicalImpact: body.historicalImpact.trim(),
		sources: body.sources.map((source) => source.trim()),
	}

	if (body.endYear !== undefined) {
		society.endYear = body.endYear
	}

	if (body.dateNotes !== undefined) {
		society.dateNotes = body.dateNotes.trim()
	}

	return society
}

const isValidId = (id) => /^[a-fA-F0-9]{24}$/.test(id)

const getAllSocieties = async (req, res) => {
	/* #swagger.responses[200] = {
		description: 'All societies.',
		schema: [{ $ref: '#/definitions/Society' }]
	} */
	/* #swagger.responses[500] = {
		description: 'Unexpected database or server error.',
		schema: { $ref: '#/definitions/Error' }
	} */

	try {
		const societies = await mongodb
			.getDb()
			.collection('societies')
			.find()
			.toArray()

		return res.status(200).json(societies)
	} catch (error) {
		console.error('Error fetching societies:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while fetching societies.',
		})
	}
}

const getSocietyById = async (req, res) => {
	/* #swagger.responses[200] = {
		description: 'The requested society.',
		schema: { $ref: '#/definitions/Society' }
	} */
	/*
	#swagger.parameters['id'] = {
		in: 'path',
		required: true,
		type: 'string',
		description: 'A 24-character hexadecimal MongoDB society ID.'
	}
	#swagger.responses[400] = {
		description: 'Invalid society ID.',
		schema: { $ref: '#/definitions/Error' }
	}
	#swagger.responses[404] = {
		description: 'Society not found.',
		schema: { $ref: '#/definitions/Message' }
	}
	#swagger.responses[500] = {
		description: 'Unexpected database or server error.',
		schema: { $ref: '#/definitions/Error' }
	}
	*/

	if (!isValidId(req.params.id)) {
		return res.status(400).json({
			error: 'Invalid society ID. Use a 24-character hexadecimal MongoDB ID.',
		})
	}

	try {
		const society = await mongodb
			.getDb()
			.collection('societies')
			.findOne({ _id: new ObjectId(req.params.id) })

		if (!society) {
			return res.status(404).json({
				message: 'Society not found.',
			})
		}

		return res.status(200).json(society)
	} catch (error) {
		console.error('Error fetching society:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while fetching the society.',
		})
	}
}

const createSociety = async (req, res) => {
	/*
	#swagger.parameters['body'] = {
		in: 'body',
		required: true,
		description: 'Required: name, description, startYear, region, government, religiousLandscape, historicalImpact, sources. Optional: endYear, dateNotes. Use negative years for BCE and positive years for CE; year zero is not allowed. Sources must contain at least one nonempty reference. Extra fields are ignored.',
		schema: { $ref: '#/definitions/Society' }
	}
	#swagger.responses[201] = {
		description: 'Society created. Returns the stored society with its MongoDB ID.',
		schema: { $ref: '#/definitions/Society' }
	}
	#swagger.responses[400] = {
		description: 'Missing required fields, invalid field types, or invalid year range.',
		schema: { $ref: '#/definitions/Error' }
	}
	#swagger.responses[500] = {
		description: 'Unable to create the society or an unexpected database error.',
		schema: { $ref: '#/definitions/Error' }
	}
	*/

	const validationError = validateSociety(req.body)

	if (validationError) {
		return res.status(400).json({ error: validationError })
	}

	try {
		const society = buildSociety(req.body)
		const result = await mongodb
			.getDb()
			.collection('societies')
			.insertOne(society)

		if (!result.acknowledged) {
			return res.status(500).json({
				error: 'Unable to create the society.',
			})
		}

		return res.status(201).json({
			_id: result.insertedId,
			...society,
		})
	} catch (error) {
		console.error('Error creating society:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while creating the society.',
		})
	}
}

const updateSociety = async (req, res) => {
	/*
	#swagger.parameters['id'] = {
		in: 'path',
		required: true,
		type: 'string',
		description: 'A 24-character hexadecimal MongoDB society ID.'
	}
	#swagger.parameters['body'] = {
		in: 'body',
		required: true,
		description: 'Replaces the society while preserving its MongoDB ID. Required: name, description, startYear, region, government, religiousLandscape, historicalImpact, sources. Optional: endYear, dateNotes. Omitted optional fields are removed. Use negative years for BCE and positive years for CE; year zero is not allowed. Extra fields are ignored.',
		schema: { $ref: '#/definitions/Society' }
	}
	#swagger.responses[200] = {
		description: 'Society updated successfully.',
		schema: { $ref: '#/definitions/Message' }
	}
	#swagger.responses[400] = {
		description: 'Invalid society ID or invalid society data.',
		schema: { $ref: '#/definitions/Error' }
	}
	#swagger.responses[404] = {
		description: 'Society not found.',
		schema: { $ref: '#/definitions/Message' }
	}
	#swagger.responses[500] = {
		description: 'Unexpected database or server error.',
		schema: { $ref: '#/definitions/Error' }
	}
	*/

	if (!isValidId(req.params.id)) {
		return res.status(400).json({
			error: 'Invalid society ID. Use a 24-character hexadecimal MongoDB ID.',
		})
	}

	const validationError = validateSociety(req.body)

	if (validationError) {
		return res.status(400).json({ error: validationError })
	}

	try {
		const society = buildSociety(req.body)
		const result = await mongodb
			.getDb()
			.collection('societies')
			.replaceOne({ _id: new ObjectId(req.params.id) }, society)

		if (result.matchedCount === 0) {
			return res.status(404).json({
				message: 'Society not found.',
			})
		}

		return res.status(200).json({
			message: 'Society updated successfully.',
		})
	} catch (error) {
		console.error('Error updating society:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while updating the society.',
		})
	}
}

const deleteSociety = async (req, res) => {
	/*
	#swagger.parameters['id'] = {
		in: 'path',
		required: true,
		type: 'string',
		description: 'A 24-character hexadecimal MongoDB society ID.'
	}
	#swagger.responses[200] = {
		description: 'Society deleted successfully.',
		schema: { $ref: '#/definitions/Message' }
	}
	#swagger.responses[400] = {
		description: 'Invalid society ID.',
		schema: { $ref: '#/definitions/Error' }
	}
	#swagger.responses[404] = {
		description: 'Society not found.',
		schema: { $ref: '#/definitions/Message' }
	}
	#swagger.responses[500] = {
		description: 'Unexpected database or server error.',
		schema: { $ref: '#/definitions/Error' }
	}
	*/

	if (!isValidId(req.params.id)) {
		return res.status(400).json({
			error: 'Invalid society ID. Use a 24-character hexadecimal MongoDB ID.',
		})
	}

	try {
		const result = await mongodb
			.getDb()
			.collection('societies')
			.deleteOne({ _id: new ObjectId(req.params.id) })

		if (result.deletedCount === 0) {
			return res.status(404).json({
				message: 'Society not found.',
			})
		}

		return res.status(200).json({
			message: 'Society deleted successfully.',
		})
	} catch (error) {
		console.error('Error deleting society:', error)

		return res.status(500).json({
			error: 'An unexpected error occurred while deleting the society.',
		})
	}
}

module.exports = {
	getAllSocieties,
	getSocietyById,
	createSociety,
	updateSociety,
	deleteSociety,
}
