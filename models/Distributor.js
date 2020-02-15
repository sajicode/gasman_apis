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
		streetNumber: String,
		streetName: String,
		lga: String,
		state: String,
		formattedAddress: String
	},
	transactions: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: 'transaction'
		}
	],
	createdAt: {
		type: Date,
		default: Date.now
	},
	updatedAt: {
		type: Date,
		default: Date.now
	}
});

// todo update location cordinates on distributor update
DistributorSchema.pre('save', async function(next) {
	try {
		if (this.isModified('address')) {
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
			next();
		}
	} catch (error) {
		console.log('geocoder error', error);
	}
});

module.exports = mongoose.model('distributor', DistributorSchema);
