const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const { config } = require('dotenv');
const Distributor = require('../models/Distributor');
const parsePhone = require('../utils/parsePhone');
const mailer = require('../utils/mailer');
const { getToken } = require('../middleware/auth');

config();
/* Create a Distributor */

router.post(
	'/',
	[
		check('fullName', 'Full name is required').not().isEmpty(),
		check('email', 'Please include a valid email').isEmail(),
		check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
		check('phone', 'Please enter a valid phone number').isLength({ min: 11 }),
		check('photo', 'Please upload a picture').not().isEmpty(),
		check('deliveryVehicle', 'Please enter a delivery vehicle').not().isEmpty(),
		check('address', 'Please enter an address').not().isEmpty()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		let { fullName, email, password, phone, photo, deliveryVehicle, address } = req.body;

		phone = phone.replace('+2340', '+234');

		phone = parsePhone(phone);

		try {
			const distributor = {
				fullName,
				email,
				password,
				phone,
				photo,
				deliveryVehicle,
				address,
				emailVerified: false
			};

			const salt = await bcrypt.genSalt(10);

			distributor.password = await bcrypt.hash(password, salt);

			const newDistributor = await Distributor.create(distributor);

			const { token } = (await getToken(newDistributor)) || '';

			res.status(200).send({ status: 'success', data: { ...newDistributor.toJSON(), token } });

			const mailData = {
				subject: 'Thanks for choosing to be a GasMan',
				body: 'You will receive a link shortly',
				recipient: newDistributor.email
			};

			mailer(mailData);
		} catch (err) {
			console.error(err.message);
			if (err.code === 11000) {
				return res.status(400).send({ status: 'fail', message: 'Distributor already exists' });
			} else {
				res.status(500).send({ status: 'fail', message: err.message });
			}
		}
	}
);

/* Dsitributor login */
router.post(
	'/login',
	[
		check('email', 'Please include a valid email').isEmail(),
		check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const { email, password } = req.body;

		try {
			let distributor = await Distributor.findOne({ email });

			if (!distributor) {
				return res.status(400).send({ status: 'fail', message: 'Distributor does not exist' });
			}

			const isMatch = await bcrypt.compare(password, distributor.password);

			if (!isMatch) {
				return res.status(400).send({ status: 'fail', message: 'Invalid credentials' });
			}

			const { token } = (await getToken(distributor)) || '';

			res.status(200).send({ status: 'success', data: { ...distributor.toJSON(), token } });

			// * sign auth token
		} catch (err) {
			console.error(err.message);
			res.status(500).send({ status: 'fail', message: 'Invalid credentials' });
		}
	}
);

/* GET all distributors */

router.get('/', async (req, res) => {
	// todo check auth
	// if (req.user.role !== 'admin') {
	// 	res.status(403).send({
	// 		status: 'fail',
	// 		message: 'Unauthorized request.'
	// 	});
	// }

	try {
		const distributors = await Distributor.find({}).select('-password');
		res.status(200).send({
			status: 'success',
			data: distributors
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send({
			status: 'fail',
			message: 'Server error.'
		});
	}
});

/* GET One Distributor */
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
		const distributor = await Distributor.findById(id).select('-password');
		res.status(200).send({
			status: 'success',
			data: distributor
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send({
			status: 'fail',
			message: 'Server error'
		});
	}
});

/* Update One Distributor */
router.put('/:id', async (req, res) => {
	const { id } = req.params;
	const { fullName, phone, email, password, photo, deliveryVehicle, address } = req.body;

	// Build distributor object
	const distributorFields = {};
	if (fullName) distributorFields.fullName = fullName;
	if (phone) distributorFields.phone = phone;
	if (email) distributorFields.email = email;
	if (password) {
		const salt = await bcrypt.genSalt(10);
		hashedPassword = await bcrypt.hash(password, salt);

		distributorFields.password = hashedPassword;
	}
	if (photo) distributorFields.photo = photo;
	if (deliveryVehicle) distributorFields.deliveryVehicle = deliveryVehicle;
	if (address) distributorFields.address = address;

	distributorFields.updatedAt = Date.now();

	try {
		let distributor = await Distributor.findById(id);

		if (!distributor) return res.status(404).send({ status: 'fail', message: 'Distributor not found' });

		// todo validate requesting user

		distributor = await Distributor.findOneAndUpdate({ _id: id }, { $set: distributorFields }, { new: true });

		res.status(200).send({ status: 'success', data: distributor });
	} catch (err) {
		console.error(err.message);
		res.status(500).send({ status: 'fail', message: 'Internal server error' });
	}
});

/* Delete One Distrinutor */
router.delete('/:id', async (req, res) => {
	const { id } = req.params;
	try {
		const distributor = await Distributor.findById(id);

		if (!distributor) return res.status(404).send({ status: 'fail', message: 'Distributor not found' });

		//* validate requesting user

		await Distributor.findByIdAndRemove(id);

		res.status(200).send({ status: 'success', message: 'Distributor removed' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send({ status: 'fail', message: 'Internal Server Error' });
	}
});

module.exports = router;
