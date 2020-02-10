const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { config } = require('dotenv');
const User = require('../models/User');
const parsePhone = require('../utils/parsePhone');
const mailer = require('../utils/mailer');
const { getToken } = require('../middleware/auth');

config();
/* Create a User */

router.post(
	'/',
	[
		check('fullName', 'Full name is required').not().isEmpty(),
		check('email', 'Please include a valid email').isEmail(),
		check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
		check('phone', 'Please enter a valid phone number').isLength({ min: 11 })
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		let { fullName, email, password, phone } = req.body;

		phone = phone.replace('+2340', '+234');

		phone = parsePhone(phone);

		try {
			const user = {
				fullName,
				email,
				password,
				phone,
				emailVerified: false
			};

			const salt = await bcrypt.genSalt(10);

			user.password = await bcrypt.hash(password, salt);

			const newUser = await User.create(user);

			const { token } = (await getToken(newUser)) || '';

			res.status(200).send({ status: 'success', data: { ...newUser.toJSON(), token } });

			const mailData = {
				subject: 'Thanks for choosing GasMan',
				body: 'You will receive a link shortly',
				recipient: newUser.email
			};

			mailer(mailData);
		} catch (err) {
			console.error(err.message);
			if (err.code === 11000) {
				return res.status(400).send({ status: 'fail', message: 'User already exists' });
			} else {
				res.status(500).send({ status: 'fail', message: err.message });
			}
		}
	}
);

/* GET all users */

router.get('/', async (req, res) => {
	// todo check auth
	// if (req.user.role !== 'admin') {
	// 	res.status(403).send({
	// 		status: 'fail',
	// 		message: 'Unauthorized request.'
	// 	});
	// }

	try {
		const users = await User.find({}).select('-password');
		res.status(200).send({
			status: 'success',
			data: users
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send({
			status: 'fail',
			message: 'Server error.'
		});
	}
});

/* GET One User */
router.get('/:id', async (req, res) => {
	const { id } = req.params;

	// todo check auth
	// if (req.user.id !== id && req.user.role !== 'admin') {
	// 	return res.status(403).send({
	// 		status: 'fail',
	// 		message: 'Unauthorized request.'
	// 	});
	// }

	try {
		const user = await User.findById(id).select('-password');
		res.status(200).send({
			status: 'success',
			data: user
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send({
			status: 'fail',
			message: 'Server error'
		});
	}
});

router.put('/:id', async (req, res) => {
	const { id } = req.params;
	const { fullName, phone, email, password } = req.body;

	// Build user object
	const userFields = {};
	if (fullName) userFields.fullName = fullName;
	if (phone) userFields.phone = phone;
	if (email) userFields.email = email;
	if (password) {
		const salt = await bcrypt.genSalt(10);
		hashedPassword = await bcrypt.hash(password, salt);

		userFields.password = hashedPassword;
	}

	userFields.updatedAt = Date.now();

	try {
		let user = await User.findById(id);

		if (!user) return res.status(404).send({ status: 'fail', message: 'User not found' });

		// todo validate requesting user

		user = await User.findByIdAndUpdate(id, { $set: userFields }, { new: true });

		res.status(200).send({ status: 'success', data: user });
	} catch (err) {
		console.error(err.message);
		res.status(500).send({ status: 'fail', message: 'Internal server error' });
	}
});

router.delete('/:id', async (req, res) => {
	const { id } = req.params;
	try {
		const user = await User.findById(id);

		if (!user) return res.status(404).send({ status: 'fail', message: 'User not found' });

		//* validate requesting user

		await User.findByIdAndRemove(id);

		res.status(200).send({ status: 'success', message: 'User removed' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send({ status: 'fail', message: 'Internal Server Error' });
	}
});

module.exports = router;
