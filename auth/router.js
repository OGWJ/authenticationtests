const express = require('express');
const router = express.router();
const {
    sendEmail,
    verificationEmailTemplate,
    recoveryEmailTemplate,
    securityBreachEmailTemplate,
    emailType } = require('./email');
const Connection = require('./dbConfig');
const { createNewToken, assertUserExists, assertUserVerifed } = require('./verification');
const { updateUserRecoveryToken, assertValidRecoveryTokenExists, invalidateToken } = require('./recovery');

// –––––––––––––––––––––––––––––– Verification –––––––––––––––––––––––––––––– //

router.get('/verify/:userEmail', async (req, res) => {
    const userEmail = req.params.userEmail;
    if (!assertUserExists(userEmail) || assertUserVerifed(userEmail)) return res.sendStatus(403);

    const newToken = createNewVerificationToken();
    await updateUserVerificationToken(userEmail, newToken);

    res.status(201).send(newToken);
})

router.put('/verify', async (req, res) => {

    const userEmail = req.body.userEmail;
    if (!await assertUserExists(userEmail)) return res.sendStatus(403);

    const validToken = await getUserVerificationToken(userEmail);
    if (!validToken) return res.sendStatus(403);

    const requestToken = req.body.token;
    if (requestToken !== validToken) return res.sendStatus(401);

    verifyUser(userEmail);
    res.sendStatus(200);
})

// –––––––––––––––––––––––––––––– End of Verification –––––––––––––––––––––––––––––– //

// –––––––––––––––––––––––––––––– Recovery –––––––––––––––––––––––––––––– //

// NOTE: should make assertions middleware and return res.sendStatus from them
// e.g.
const checkUser = async (req, res, next) => {
    // assertUserExists(req.body.user);
    // assertUserVerified(req.body.user);
    next();
}

router.get('/recovery', checkUser, async (req, res) => {
    // Send a new recovery code to a user's email
    const user = req.body.userName;
    await assertUserExists(user);
    await assertUserVerifed(user);
    // might be worth checking if user has recently requested a recovery token
    // i.e. user.recovery.timeRequested
    // to deter spamming of server with recoveryCode requests
    const recoveryCode = createNewToken();
    await updateUserRecoveryToken(user, recoveryCode);
    const text = recoveryEmailTemplate(user, recoveryCode);
    await sendEmail(req.body.email, emailType.RECOVERY, text);
    res.send(200);
})

router.post('/recovery', async (req, res) => {
    // Verify a recovery code 
    const user = req.body.userName;
    await assertUserExists(user);
    await assertUserVerifed(user);
    await assertIsValidRecoveryToken(req.body.token);

    // log user in
    // hit change password endpoint with new password and session token

    await invalidateToken(user);
    res.send(200);
})

// –––––––––––––––––––––––––––––– End of Recovery –––––––––––––––––––––––––––––– //

// –––––––––––––––––––––––––––––– DEBUG: Account Creation / Deletion –––––––––––––––––––––––––––––– //

router.post('/testaccount', async (req, res) => {
    const bcrypt = require('bcrypt');
    const salt = parseInt(process.env.SALT_ROUNDS);
    const schema = {
        // should store emails in plain-text or two-way hash in 
        // another or private collection database for only
        // GDPR compliance and account recovery
        email: bcrypt.hashSync(req.body.email, salt),
        password: bcrypt.hashSync(req.body.password, salt),
        name: req.body.name,
        isVerified: false,
        verificationToken: null
    }

    const resp = await Connection.collection.insertOne(schema);
    res.sendStatus(201);
})

router.delete('/testaccount', async (req, res) => {
    const resp = Connection.collection.deleteOne({ name: req.body.name });
    res.sendStatus(204);
})

router.put('/testaccount', async (req, res) => {
    // Change username, email or password
    // takes valid session token to authenticate they are logged in
    // maybe some other security token if this can be intercepted

})

// –––––––––––––––––––––––––––––– End of DEBUG: Account Creation / Deletion –––––––––––––––––––––––––––––– //

module.exports = router;