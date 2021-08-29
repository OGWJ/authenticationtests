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
        // For extra security, we COULD hash the emails.
        // PROs: If database is breached, plain-text emails are not associated with personal user habits
        // CONs: Much slower lookup times see ln.121 and cannot contact users via email after signup.
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
    client.connect(async err => {
        const collection = client.db(DB_NAME).collection(COLLECTION_NAME)

        // The extra security offered by hashing user emails makes lookup (e.g. for login or any fetch) infinitely more expensive
        // This will take O(n)+b instead of O(1) time because it must traverse the list and compare each hash.

        // LEGACY:
        // const allUsers = await collection.find({}).toArray();

        // for (user of allUsers) {
        //     if (bcrypt.compareSync(req.body.email, user.email)) {
        //         console.log('found target... removing')
        //         await collection.deleteOne({ _id: user._id });
        //     }
        // }

        client.close();
    });
    res.sendStatus(204);
})

module.exports = router;