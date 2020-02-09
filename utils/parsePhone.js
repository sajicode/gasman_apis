const { PhoneNumberUtil, PhoneNumberFormat } = require('google-libphonenumber');
const phoneUtil = PhoneNumberUtil.getInstance();

module.exports = function parsePhoneNumber(phone) {
	const number = phoneUtil.parseAndKeepRawInput(phone, 'NG');
	return phoneUtil.format(number, PhoneNumberFormat.INTERNATIONAL).replace(/ +/g, '');
};
