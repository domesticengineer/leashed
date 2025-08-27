const axios = require('axios');

// Vercel Serverless Function handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { serviceType, name, email, phone, date, time, 'g-recaptcha-response': recaptchaToken } = req.body;

  if (!recaptchaToken) {
    return res.status(400).json({ success: false, message: 'No reCAPTCHA token provided' });
  }

  try {
    const verificationResponse = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaToken,
        remoteip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const data = verificationResponse.data;

    if (!data.success) {
      return res.status(400).json({ success: false, message: 'reCAPTCHA verification failed: ' + (data['error-codes'] ? data['error-codes'].join(', ') : 'unknown error') });
    }

    if (data.score < 0.5) {
      return res.status(400).json({ success: false, message: 'reCAPTCHA score too low—please try again or contact support' });
    }

    if (data.action !== 'submit_request') {
      return res.status(400).json({ success: false, message: 'reCAPTCHA action mismatch' });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Server error during reCAPTCHA verification:', error);
    res.status(500).json({ success: false, message: 'Server error during verification' });
  }
};