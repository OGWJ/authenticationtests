require('dotenv').config();
const nodemailer = require('nodemailer');

const emailType = {
    VERIFICATION: 'verification',
    RECOVERY: 'recovery',
    SECURITY_BREACH: 'security_breach'
}

const verificationEmailTemplate = (userName, verificationtoken) => {
    return `Hi ${userName}! 
            Thanks for choosing to use the Habit Smasher app.
            Here is your verification code: ${verificationtoken}
            It is valid for ${(process.env.VERIFICATION_CODE_LIFESPAN_MS / 100 / 60)} minutes.
            Happy Smashing.`
}

const recoveryEmailTemplate = (userName, recoveryCode) => {
    return `Hi ${userName}! 
            Here is your recovery code: ${recoveryCode}
            It is valid for ${(process.env.RECOVERY_CODE_LIFESPAN_MS / 100 / 60)} minutes.
            Happy Smashing.`
}

const securityBreachEmailTemplate = () => {
    return `Dear user,
            Regrettably we must inform you that our encrypted database has been compromised.
            Please change your passwords immediately to protect your account.`
}

async function sendEmail(recipient, subject, text) {

    let mailOptions = {
        from: process.env.AUTH_SERVER_EMAIL,
        pass: process.env.AUTH_SERVER_PASSWORD,
        to: recipient,
        subject: subject,
        text: text
    }

    let transporter = nodemailer.createTransport({
        service: process.env.AUTH_SERVER_EMAIL_SERVICE, // e.g. 'gmail'
        host: process.env.AUTH_SERVER_EMAIL_HOST, // e.g. 'smtp.gmail.com'
        auth: {
            user: mailOptions.from,
            pass: mailOptions.pass
        }
    });

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) { console.log(error); return }
        // Maybe do something here
        console.log(`Email sent: ${info.response}`);
    })
}

module.exports = {
    sendEmail,
    verificationEmailTemplate,
    recoveryEmailTemplate,
    securityBreachEmailTemplate,
    emailType
};