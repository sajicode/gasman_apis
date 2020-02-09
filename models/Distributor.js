const mongoose = require('mongoose');
const geocoder = require('../utils/geocoder');

const DistributorSchema = new mongoose.Schema({
	fullName: {
		type: String,
		required: true,
		trim: true
	},
	email: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	phone: {
		type: String,
		required: true,
		unique: true,
		trim: true
	},
	password: {
		type: String,
		required: true
	},
	photo: {
		type: String,
		required: true,
		trim: true
	},
	deliveryVehicle: {
		type: String,
		trim: true,
		required: true
	},
	emailVerified: {
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

DistributorSchema.pre('save', async function(next) {
	const loc = await geocoder.geocode(this.address);
	this.location = {
		type: 'Point',
		coordinates: [ loc[0].longitude, loc[0].latitude ],
		formattedAddress: loc[0].formattedAddress
	};

	// Do not save address
	this.address = undefined;
});

module.exports = mongoose.model('distributor', DistributorSchema);
