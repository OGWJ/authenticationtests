const express = require('express');
const router = express.router();
const Connection = require('./dbConfig');

// request new validation token
// NOTE: need to consider lifespan of verification token in database
router.get('/verify/:userEmail', async (req, res) => {
    const userEmail = req.params.userEmail;
    if (!assertUserExists(userEmail) || assertUserVerifed(userEmail)) return res.sendStatus(403);

    const newToken = createNewVerificationToken();
    await updateUserVerificationToken(userEmail, newToken);

    res.status(201).send(newToken);
})

app.put('/verify', async (req, res) => {

    const userEmail = req.body.userEmail;
    if (!await assertUserExists(userEmail)) return res.sendStatus(403);

    const validToken = await getUserVerificationToken(userEmail);
    if (!validToken) return res.sendStatus(403);

    const requestToken = req.body.token;
    if (requestToken !== validToken) return res.sendStatus(401);

    verifyUser(userEmail);
    res.sendStatus(200);
})

// NOTE: Below account creation and deletion endpoints for testing purposes only
router.post('/testaccount', async (req, res) => {
    const bcrypt = require('bcrypt');
    const salt = parseInt(process.env.SALT_ROUNDS);
    const schema = {
        // should store emails in another or private collection database for only
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

module.exports = router;