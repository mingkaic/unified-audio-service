const bodyParser = require('body-parser');
const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(require('./routes'))
