const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const authURL = process.env.AUTH_URL;

const getToken = (attrs) => {
	return axios
		.post(`${authURL}/token`, attrs)
		.then((response) => {
			if (response.status !== 200) {
				console.error(Date(), 'Could not relay to auth service');
				return {
					status: 'fail',
					message: 'Connection error'
				};
			}

			return response.data;
		})
		.catch((err) => {
			console.error(Date(), err.message);
			return {
				status: 'fail',
				message: err.message
			};
		});
};

module.exports = {
	getToken
};
