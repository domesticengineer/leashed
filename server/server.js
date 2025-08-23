// FILE: server.js

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 3000;

// --- IMPORTANT: Store your secret key securely! ---
// Use environment variables in production.
// DO NOT commit this key to a public repository.
const RECAPTCHA_SECRET_KEY = 'YOUR_SECRET_KEY_HERE';

// Middleware
app.use(cors()); // Allows requests from your frontend
app.use(express.json()); // Parses incoming JSON requests

// The route that your form will submit to
app.post('/submit-request', async (req, res) => {
    const {
        serviceType, name, email, phone, date, time,
        'g-recaptcha-response': recaptchaToken
    } = req.body;

    // 1. Verify the reCAPTCHA token
    try {
        const verificationURL = `https://www.google.com/recaptcha/api/siteverify?secret=${6Le8P68rAAAAAJA4oMjCdtVNJEHQ8bz0k5F8vwKb}&response=${recaptchaToken}`;

        const verificationResponse = await axios.post(verificationURL);
        const { success } = verificationResponse.data;

        if (!success) {
            return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed.' });
        }

        // 2. If verification is successful, proceed with your logic
        console.log('reCAPTCHA verified successfully. Processing request...');

        // This is where your original Zapier webhook logic goes
        const zapierWebhookURL = 'https://hooks.zapier.com/hooks/catch/23951258/uuwnymh/';
        const start = `${date}T${time}:00`;
        const end = new Date(start);
        end.setHours(end.getHours() + 1);

        const eventData = {
            id: `event${Date.now()}`,
            title: `Requested: ${serviceType}`,
            start,
            end: end.toISOString(),
            advocateId: null,
            clientId: 'public',
            status: 'pending',
            public: false,
            name, email, phone
        };

        // Send data to Zapier
        await axios.post(zapierWebhookURL, eventData);
        console.log('Request forwarded to Zapier.');
        
        // 3. Send a success response back to the front-end
        res.json({ success: true, message: 'Request submitted successfully!' });

    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
