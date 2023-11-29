const express = require('express');
const app = express();
require('dotenv').config();

const connectDB = require('./config/db');

connectDB();

const acb = require('./api/ACB');
const timo = require('./api/TIMO');
const mb = require('./api/MB');


const port = process.env.PORT;

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


app.use('/acb/', acb);
app.use('/timo/', timo);    
app.use('/mb/', mb);

app.listen(port, () => {})