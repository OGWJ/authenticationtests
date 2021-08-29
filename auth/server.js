const express = require('express');
const cors = require('cors');
require('dotenv').config();
const Connection = require('./dbConfig');
const router = require('./router');

const app = express();
app.use(cors());
app.use(express.json());
app.use('', router);

Connection.open()
    .then(app.listen(parseInt(process.env.PORT)))