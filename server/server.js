require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const app = express();

app.use(cors({
    origin: ['https://domesticengineer.github.io', 'https://stayleashed.com']
}));
app.use(express.json());

app.post('/submit-request', async (req, res) => {
    const { serviceType, name, email, phone, date, time, 'g-recaptcha-response': recaptchaToken } = req.body;

    try {
        const verificationResponse = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            new URLSearchParams({
                secret: RECAPTCHA_SECRET_KEY,
                response: recaptchaToken,
                remoteip: req.ip
            }),
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            }
        );

        if (!verificationResponse.data.success) {
            return res.json({ success: false, message: 'reCAPTCHA verification failed' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error:', error);
        res.json({ success: false, message: 'Server error' });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});