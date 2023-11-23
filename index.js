const express = require('express');
const app = express();
require('dotenv').config();

const acb = require('./acb');


const port = process.env.PORT;

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/acb/', acb);

app.listen(port, () => {})