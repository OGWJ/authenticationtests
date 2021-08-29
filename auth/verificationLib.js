const Connection = require('./dbConfig');
const crypto = require('crypto');

async function verifyUser(name) {
    invalidateVerificationToken(name);
    updateUserVerificationStatus(name);
}

function createNewVerificationToken() {
    return crypto.randomBytes(60).toString('hex');
}

async function assertUserExists(name) {
    if (!await Connection.collection.findOne({ name: name })) return false;
    return true;
}

async function getUserVerificationToken(name) {
    return await Connection.collection.findOne({ name: name }).verificationToken;
}

async function invalidateVerificationToken(name) {
    return await Connection.collection.updateOne({ name: name }, { $set: { verificationToken: null } });
}

async function updateUserVerificationStatus(name) {
    return await Connection.collection.updateOne({ name: name }, { $set: { isVerified: true } });
}

async function assertUserVerifed(name) {
    return await dbUserCollection.findOne({ name: name }).isVerified;
}

async function updateUserVerificationToken(name, newToken) {
    return await Connection.collection.updateOne({ name: name }, { $set: { verificationToken: newToken } });
}

module.exports = {
    verifyUser,
    assertUserExists,
    assertUserVerifed,
    createNewVerificationToken,
    getUserVerificationToken,
    updateUserVerificationToken
}