const { config } = require('dotenv');
const NodeGeocoder = require('node-geocoder');

config();

const options = {
	provider: process.env.GEOCODER_PROVIDER,

	// Optional depending on the providers
	httpAdapter: 'https',
	apiKey: process.env.GEOCODER_API_KEY,
	formatter: null
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
