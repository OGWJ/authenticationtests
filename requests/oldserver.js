require('dotenv').config();
const express = require('express');
const app = express();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');



app.use(express.json())

const pool = new Pool({
    user: 'root',
    database: 'userdb',
    password: 'rootpass',
    port: 5432
})

let refreshTokens = [];

app.post('/tokens', authenticateToken, (req, res) => {
    const refreshToken = req.body.token;
    if (refreshToken == null) return res.sendStatus(401);
    if (refreshTokens.includes(refreshToken)) return res.sendStatus(403);
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        const accessToken = generateAccessToken({ username: user.username });
        res.json({ accessToken });
    })
})

app.post('/users/register', async (req, res) => {

    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { username: req.body.username, password: hashedPassword };
        await pool.query(`INSERT INTO users VALUES ($1, $2);`, [user.username, user.password])
        res.status(201).send(user);
    } catch (err) {
        res.status(500).send();
    }

})

app.post('/users/register/verify', async (req, res) => {

    const providedRegistrationToken = req.body.token;
    const resp = await pool.query(`SELECT token 
                                   FROM unverfied_users 
                                   WHERE email = $1;`, [req.body.email]);
    const validToken = resp.rows[0].token;
    if (resp == null || providedRegistrationToken !== validToken) {
        return res.sendStatus(403)
    }
    const registeredUser = await registerUser(req.body.email);
    if (registeredUser == null) return res.sendStatus(500);
    return res.sendStatus(201);
})

app.post('/users/login', async (req, res) => {
    const resp = await pool.query(`SELECT password FROM users WHERE $1 = username;`, [req.body.username])
    // check for user not existing
    // if not exist
    // check if user is in unverified user table
    // send redirect
    const password = resp.rows[0].password;
    console.log(password);
    try {
        if (password == null || !await bcrypt.compare(req.body.password, password)) {
            res.status(401).send('Access Denied');
        } else {
            let user = { username: req.body.username };
            const accessToken = generateAccessToken(user);
            const refreshToken = generateRefreshToken(user);
            refreshTokens.push(refreshToken);
            res.status(200).json({ accessToken, refreshToken });
        }
    } catch (err) {
        console.warn(err);
        res.status(500).send('Internal Server Error')
    }
})

app.delete('/logout', (req, res) => {
    refreshTokens = refreshTokens.filter(token => token !== req.body.token);
    res.sendStatus(204);
})

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 15 });
}

function generateRefreshToken(user) {
    return jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);
}

function authenticateAccessToken(req, res, next) {
    const authHeader = request.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    })
}

function authenticateRegistrationToken(req, res, next) {
    // const authHeader = request.headers['authorization'];
    // const token = authHeader && authHeader.split(' ')[1];
    // if (token == null) return res.sendStatus(401);

    // jwt.verify(token, process.env.REGISTRATION_TOKEN_SECRET, (err, user) => {
    //     if (err) return res.sendStatus(403);
    //     req.user = user;
    //     next();
    // })
}

app.post('/email', async (req, res) => {
    try {
        await sendEmail(req.body.email);
    } catch (err) {
        console.warn(err);
    }

})

function genRegistrationToken(email) {
    return jwt.sign(email, process.env.REGISTRATION_TOKEN_SECRET,
        { expiresIn: process.env.REGISTRATION_TOKEN_EXPIRATION_SECONDS });
}

function genVerificationEmailHTML(token) {
    return `<a href='${process.env.CLIENT_URL}/${token}</a>'`;
}

async function sendEmail(recipientEmail) {
    let email = { email: recipientEmail }
    let registrationToken = genRegistrationToken(email);
    // MUST STORE REGISTRATION TOKEN SOMEWHERE
    // then send link to hit register/verify endpoint with token in req body
    // that endpoint will update user account to verified

    // NOTE: if using gmail here, must enable 'Less secure app access'

    let mailOptions = {
        from: process.env.AUTH_SERVER_EMAIL,
        to: recipientEmail,
        subject: 'Authentication Test',
        // text: 'Success',
        html: genVerificationEmailHTML(registrationToken),
        // NOTE: Possible danger here!
        pass: process.env.AUTH_SERVER_PASSWORD
    }

    let transporter = nodemailer.createTransport({
        service: process.env.AUTH_SERVER_EMAIL_SERVICE,
        // service: 'gmail',
        host: process.env.AUTH_SERVER_EMAIL_HOST,
        // host: "smtp.gmail.com",
        auth: {
            user: mailOptions.from,
            pass: mailOptions.pass
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log(error);
        else console.log(`Email send: ${info.response}`);
    })

}

sendEmail('owenglynwilliamjenkins@gmail.com')

app.listen(3000);