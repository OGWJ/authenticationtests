const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
require('dotenv').config();
const Connection = require('./dbConfig');
const router = require('./router');

const app = express();
app.use(cors());
app.use(express.json());
app.use('', router);

Connection.open()
    .then(app.listen(3000))

async function verifyUser(userEmail) {
    invalidateVerificationToken(userEmail);
    updateUserVerificationStatus(userEmail);
}

function createNewVerificationToken() {
    return crypto.randomBytes(60).toString('hex');
}

async function assertUserExists(userEmail) {
    if (!await Connection.collection.findOne({ email: userEmail })) return false;
    return true;
}

async function getUserVerificationToken(userEmail) {
    return await Connection.collection.findOne({ email: userEmail }).verificationToken;
}

async function invalidateVerificationToken(userEmail) {
    return await Connection.collection.updateOne({ email: userEmail }, { $set: { verificationToken: null } });
}

async function updateUserVerificationStatus(userEmail) {
    return await Connection.collection.updateOne({ email: userEmail }, { $set: { isVerified: true } });
}

async function assertUserVerifed(userEmail) {
    return await dbUserCollection.findOne({ email: userEmail }).isVerified;
}

async function updateUserVerificationToken(userEmail, newToken) {
    return await Connection.collection.updateOne({ email: userEmail }, { $set: { verificationToken: newToken } });
}
