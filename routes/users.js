const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { config } = require('dotenv');
const User = require('../models/User');
const parsePhone = require('../utils/parsePhone');

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

			res.status(200).send({ status: 'success', data: newUser });
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

module.exports = router;
