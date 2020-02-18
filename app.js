let createError = require('http-errors');
let express = require('express');
const path = require('path');
const logger = require('morgan');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

let indexRouter = require('./routes/index');
let usersRouter = require('./routes/users');
let distributorRouter = require('./routes/distributors');
let requestRouter = require('./routes/request');

dotenv.config();

connectDB();

const app = express();

//* initialise socket
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(logger('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function(socket) {
	socket.emit('news', { hello: 'world' });
	socket.on('test event', function(data) {
		console.log(data);
	});
});

app.use('/gasman/', indexRouter);
app.use('/gasman/users', usersRouter);
app.use('/gasman/distributors', distributorRouter);
app.use('/gasman/request', requestRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.send({ status: 'fail', message: err.message });
});
const port = process.env.PORT;
server.listen(port, () => console.log(`Server listening on port ${port}`));

// module.exports = app;
