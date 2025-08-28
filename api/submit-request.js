require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const app = express();

app.use(cors({
    origin: ['https://domesticengineer.github.io', 'https://stayleashed.com', '*.app.github.dev']
}));
app.use(express.json());

app.post('/submit-request', async (req, res) => {
    const { serviceType, name, email, phone, date, time, 'g-recaptcha-response': recaptchaToken } = req.body;

    if (!recaptchaToken) {
        return res.json({ success: false, message: 'No reCAPTCHA token provided' });
    }

    try {
    const verificationResponse = await axios.post(
        'https://www.google.com/recaptcha/api/siteverify',
        new URLSearchParams({
            secret: RECAPTCHA_SECRET_KEY,
            response: recaptchaToken, // Correct variable name
            remoteip: req.ip
        }),
        {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        }
    );

    const { success, error_codes } = verificationResponse.data;

    if (!success) {
        console.error('reCAPTCHA errors:', error_codes);
        return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.' });
    }

        if (data.score < 0.5) {
            return res.json({ success: false, message: 'reCAPTCHA score too low—please try again or contact support' });
        }

        if (data.action !== 'submit_request') {
            return res.json({ success: false, message: 'reCAPTCHA action mismatch' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Server error during reCAPTCHA verification:', error);
        res.json({ success: false, message: 'Server error during verification' });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});