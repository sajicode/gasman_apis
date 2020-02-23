const socket = require('../config/socket');
const Transaction = require('../models/Transaction');

//todo
function emitRequest(listener, data) {
	socket.io().on('connection', (socket) => {
		console.log('socket connected');
		socket.emit(listener, data);
	});
}
const notifyVendor = async (vendorList, transaction) => {
	console.log('called notify');
	if (vendorList.length > 1) {
		emitRequest(`request-${vendorList[0].deviceID}`, transaction);
		for (let i = 1; i < vendorList.length; i++) {
			setTimeout(async () => {
				//todo use Redis to track acknowledged status
				const latestTransaction = await Transaction.findById(transaction._id);
				if (latestTransaction.distributor === null) {
					emitRequest(`request-${vendorList[0].deviceID}`, transaction);
				} else {
					return;
				}
			}, 30000);
		}
	} else {
		console.log('called emitter');
		console.log(vendorList[0].deviceID);
		emitRequest(`request-${vendorList[0].deviceID}`, transaction);
	}
};

const acknowledgeRequest = async (data) => {
	const { distributor_id, transaction_id } = data;

	try {
		let transaction = await Transaction.findById(transaction_id).populate('user');

		if (!transaction) {
			emitRequest(errors, `Transaction ${transaction_id} does not exist`);
			return;
		}

		console.log(transaction);
		transaction = Transaction.findByIdAndUpdate(
			transaction_id,
			{ $set: { distributor: distributor_id } },
			{ new: true }
		)
			.populate('user')
			.populate('distributor');

		console.log(transaction);
		emitRequest(`accepted-${transaction.user.deviceID}`, transaction);
	} catch (error) {
		emitRequest(errors, error.message);
	}
};

//* cancel request if no vendor
const cancelRequest = (deviceId, timeout) => {
	setTimeout(() => {
		socket.io().on('connection', (socket) => {
			socket.emit(`no-vendor-${deviceId}`, 'Sorry, there are no distributors around your location at this time');
		});
	}, timeout);
};

module.exports = {
	notifyVendor,
	cancelRequest,
	acknowledgeRequest,
	emitRequest
};
