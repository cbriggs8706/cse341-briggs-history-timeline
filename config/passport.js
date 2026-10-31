const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const { ObjectId } = require('mongodb')
const mongodb = require('../db/connect')

passport.use(
	new GoogleStrategy(
		{
			clientID: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
			callbackURL: process.env.GOOGLE_CALLBACK_URL,
			state: true,
		},
		async (accessToken, refreshToken, profile, done) => {
			try {
				const users = mongodb.getDb().collection('users')

				await users.updateOne(
					{ googleId: profile.id },
					{
						$set: {
							displayName: profile.displayName,
							email: profile.emails?.[0]?.value || null,
							lastLoginAt: new Date(),
						},
						$setOnInsert: {
							googleId: profile.id,
							createdAt: new Date(),
						},
					},
					{ upsert: true },
				)

				const user = await users.findOne({
					googleId: profile.id,
				})

				return done(null, user)
			} catch (error) {
				return done(error)
			}
		},
	),
)

passport.serializeUser((user, done) => {
	done(null, user._id.toString())
})

passport.deserializeUser(async (id, done) => {
	try {
		if (!ObjectId.isValid(id)) {
			return done(null, false)
		}

		const user = await mongodb
			.getDb()
			.collection('users')
			.findOne({ _id: new ObjectId(id) })

		return done(null, user || false)
	} catch (error) {
		return done(error)
	}
})

module.exports = passport
