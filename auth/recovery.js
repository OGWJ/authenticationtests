require('dotenv').config();
const Connection = require('./dbConfig');

async function getUserRecoveryRequestedTime(name) {
    return await Connection.collection.findOne({ name: name }).recovery.timeRequested;
}

async function getUserRecoveryCode(name) {
    return await Connection.collection.findOne({ name: name }).recovery.code;
}

async function assertValidRecoveryTokenExists(name) {
    const code = await getUserRecoveryCode(name);
    const time = await getUserRecoveryRequestedTime(name);
    if ((!code || !time) || isTokenExpired(time)) return false;
    return true;
}

async function isTokenExpired(timeRequested) {
    const now = new Date().getTime;
    const then = new Date(timeRequested).getTime();
    const diff = now - then;
    const lifespan = process.env.RECOVERY_CODE_LIFESPAN_MS;
    if (diff > lifespan) return false;
    return true;
}

async function invalidateToken(name) {
    return await Connection.collection.updateOne({ name: name }, { $set: { "recovery.code": null } });
}

async function updateUserRecoveryToken(name, newToken) {
    return await Connection.collection.updateOne({ name: name }, { $set: { "recovery.code": newToken, "recovery.timeRequested": new Date() } });
}

module.exports = {
    assertValidRecoveryTokenExists,
    invalidateToken,
    updateUserRecoveryToken
}