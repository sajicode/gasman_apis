const nodemailer = require('nodemailer');

function mailer({ subject, body, recipient }) {
	const output = `
    <h3>Welcome</h3>
    <p>${body}</p>
    `;

	let transporter = nodemailer.createTransport({
		host: process.env.MAILER_HOST,
		port: process.env.MAILER_PORT,
		secure: false,
		requireTLS: true,
		auth: {
			user: process.env.MAILER_USER,
			pass: process.env.MAILER_PASSWORD
		}
	});

	let mailOptions = {
		from: '"GasMan" <adc1e84b5a7a6e>',
		to: recipient,
		subject: subject,
		html: output
	};

	transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			return console.log(error);
		}
		console.log(`Email sent ${info.messageId}`);
		console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
	});
}

module.exports = mailer;
