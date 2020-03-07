const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const payment_url = process.env.PAYMENT_URL;
const wallet_url = `${payment_url}/create-wallet`;

const createWallet = (user_id) => {
	return axios
		.post(wallet_url, { userID: user_id })
		.then((response) => {
			if (response.status !== 200) {
				console.error(Date(), 'Could not relay to payments service');
				return {
					status: 'fail',
					message: 'Connection error'
				};
			}

			return response.data;
		})
		.catch((err) => {
			console.error(Date(), err);
			return {
				status: 'fail',
				message: err.message
			};
		});
};

module.exports = {
	createWallet
};
