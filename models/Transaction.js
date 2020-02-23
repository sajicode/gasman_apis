const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');

const TransactionSchema = new mongoose.Schema({
	paymentMethod: {
		type: String,
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
	completed: {
		type: Boolean,
		default: false
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
		streetNumber: String,
		streetName: String,
		lga: String,
		state: String,
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
		formattedAddress: loc[0].formattedAddress,
		streetNumber: loc[0].streetNumber || 'N/A',
		streetName: loc[0].streetName || 'N/A',
		lga: loc[0].administrativeLevels.level2long || 'N/A',
		state: loc[0].administrativeLevels.level1long || 'N/A'
	};
});

module.exports = mongoose.model('transaction', TransactionSchema);
