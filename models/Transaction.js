const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');

const TransactionSchema = new mongoose.Schema({
	paymentMethod: {
		type: String,
		required: true,
		trim: true
	},
	distributor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'distributor'
	},
	customer: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'user'
	},
	amount: {
		type: Number,
		required: true
	},
	quantity: {
		type: Number,
		required: true
	},
	address: {
		type: String,
		required: [ true, 'Please add an address' ]
	},
	location: {
		type: {
			type: String,
			enum: [ 'Point' ]
		},
		coordinates: {
			type: [ Number ],
			index: '2dsphere'
		},
		formattedAddress: String
	},
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

TransactionSchema.pre('save', async function(next) {
	const loc = await geocoder.geocode(this.address);
	this.location = {
		type: 'Point',
		coordinates: [ loc[0].longitude, loc[0].latitude ],
		formattedAddress: loc[0].formattedAddress
	};

	// Do not save address
	this.address = undefined;
});

module.exports = mongoose.model('transaction', TransactionSchema);
