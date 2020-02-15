const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const { config } = require('dotenv');
const Distributor = require('../models/Distributor');
const { authUser } = require('../middleware/auth');
const geocoder = require('../utils/geocoder');

config();

router.post(
	'/',
	authUser,
	[
		check('address', 'Delivery address is required').not().isEmpty(),
		check('quantity', 'The quantity of gas is required').notEmpty().isNumeric()
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ status: 'fail', errors: errors.array() });
		}

		const { id, fullName } = req.user;
		const { address, quantity } = req.body;

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

		if (distributors.length == 0) {
			return res
				.status(404)
				.send({ status: 'fail', message: 'No distributors available in your area at present.' });
		}

		res.status(200).send({ status: 'success', data: distributors });
	}

	// todo - notify distributor, create transaction on acceptance
);

module.exports = router;
