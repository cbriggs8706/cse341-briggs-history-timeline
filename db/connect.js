const dotenv = require('dotenv')
dotenv.config()

const MongoClient = require('mongodb').MongoClient

let _db

const initDb = (callback) => {
	if (_db) {
		console.warn('Trying to init DB again!')
		return callback(null, _db)
	}
	MongoClient.connect(process.env.MONGO_DB_CONNECTION_STRING)
		.then((client) => {
			_db = client.db('cse341-history-timeline')
			callback(null, _db)
		})
		.catch((err) => {
			callback(err)
		})
}

const getDb = () => {
	if (!_db) {
		throw Error('Db not initialized')
	}
	return _db
}

module.exports = {
	initDb,
	getDb,
}
