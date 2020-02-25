const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { config } = require('dotenv');
const Distributor = require('../models/Distributor');
const Transaction = require('../models/Transaction');
const { authUser } = require('../middleware/auth');
const geocoder = require('../utils/geocoder');
const { notifyVendor, cancelRequest, emitRequest, acknowledgeRequest } = require('../utils/notifyVendor');

config();

const pricePerKg = process.env.PRICE_PER_KG;

router.post(
	'/',
	authUser,
	[
		check('address', 'Delivery address is required').not().isEmpty().isString(),
		check('quantity', 'The quantity of gas is required').notEmpty().isNumeric(),
		check('payment_method', 'Select a payment method').notEmpty().isString()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const { id, deviceID } = req.user;
		const { address, quantity, payment_method } = req.body;

		const location = await geocoder.geocode(address);

		//* get coordinates with geocoder
		// let coordinates = [location[0].longitude, location[0].latitude];
		let longitude = location[0].longitude;
		let latitude = location[0].latitude;

		const distributors = await Distributor.aggregate([
			{
				$geoNear: {
					near: {
						type: 'Point',
						coordinates: [ parseFloat(longitude), parseFloat(latitude) ]
					},
					distanceField: 'dist.calculated',
					maxDistance: 200000,
					spherical: true
				}
			}
		]);

		//* create transaction
		const transaction = {
			paymentMethod: payment_method,
			user: id,
			amount: pricePerKg * quantity,
			quantity,
			address
		};

		const newTransaction = await Transaction.create(transaction);

		if (distributors.length == 0) {
			return res
				.status(404)
				.send({ status: 'fail', message: 'No distributors available in your area at present.' });
		}

		await notifyVendor(distributors, newTransaction);
		await cancelRequest(deviceID, distributors.length * 30000);

		res.status(200).send({ status: 'success', data: distributors });
	}

	// todo - notify distributor, create transaction on acceptance
);

router.post(
	'/acknowledge',
	[
		check('distributor_id', 'Distributor ID is required').not().isEmpty().isString(),
		check('transaction_id', 'Transaction ID is required').notEmpty().isString()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const { distributor_id, transaction_id } = req.body;

		// emitRequest('acknowledged', { distributor_id, transaction_id });
		let data = {
			distributor_id,
			transaction_id
		};

		try {
			let result = await acknowledgeRequest(data);
			res.status(200).send({ status: 'success', data: result });
		} catch (error) {
			console.error(error);
			res.status(500).send({ status: 'fail', message: error });
		}
	}
);

module.exports = router;
