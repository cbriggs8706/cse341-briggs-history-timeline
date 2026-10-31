const routes = require('express').Router()
const passport = require('../config/passport')

routes.get(
	'/google',
	passport.authenticate('google', {
		scope: ['profile', 'email'],
	}),
)

routes.get(
	'/google/callback',
	passport.authenticate('google', {
		failureRedirect: '/auth/login-failed',
	}),
	(req, res) => {
		res.redirect('/api-docs')
	},
)

routes.get('/login-failed', (req, res) => {
	return res.status(401).json({
		error: 'Google login failed or was cancelled. Try /auth/google again.',
	})
})

routes.get('/me', (req, res) => {
	res.set('Cache-Control', 'no-store')

	if (!req.isAuthenticated()) {
		return res.status(401).json({
			error: 'You must sign in first.',
		})
	}

	return res.status(200).json({
		id: req.user._id,
		displayName: req.user.displayName,
		email: req.user.email,
	})
})

routes.post('/logout', (req, res, next) => {
	req.logout((error) => {
		if (error) {
			return next(error)
		}

		req.session.destroy((error) => {
			if (error) {
				return next(error)
			}

			res.clearCookie('connect.sid', {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
			})

			return res.status(200).json({
				message: 'Logged out successfully.',
			})
		})
	})
})

routes.use((error, req, res, next) => {
	if (res.headersSent) {
		return next(error)
	}

	console.error('Authentication error:', error)

	return res.status(500).json({
		error: 'An unexpected authentication error occurred.',
	})
})

module.exports = routes
