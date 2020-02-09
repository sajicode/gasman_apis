const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
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
	emailVerified: {
		type: Boolean,
		default: false
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

module.exports = mongoose.model('user', UserSchema);
