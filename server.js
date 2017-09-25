const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');

const default_port = '3124';
const default_host = '0.0.0.0';

const app = express();
const server = http.createServer(app);

const port = process.env.PORT || default_port;
app.set('port', port);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('./routes'))

// Listen on provided port, on all network interfaces.
server.listen(port, default_host, () => {
	console.log(`unified-audio API running on localhost:${port}`)
});
