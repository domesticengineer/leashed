const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { serviceType, name, email, phone, date, time, 'g-recaptcha-response': recaptchaToken } = req.body;

  if (!recaptchaToken) {
    console.log('No reCAPTCHA token provided');
    return res.status(400).json({ success: false, message: 'No reCAPTCHA token provided' });
  }

  try {
    console.log('Sending reCAPTCHA verification with token:', recaptchaToken);
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
    console.log('reCAPTCHA response:', JSON.stringify(data));

    if (!data.success) {
      const errorMsg = 'reCAPTCHA verification failed: ' + (data['error-codes'] ? data['error-codes'].join(', ') : 'unknown error');
      console.log(errorMsg);
      return res.status(400).json({ success: false, message: errorMsg });
    }

    if (data.score < 0.3) {
      console.log('reCAPTCHA score too low:', data.score);
      return res.status(400).json({ success: false, message: 'reCAPTCHA score too low—please try again or contact support' });
    }

    if (data.action !== 'submit_request') {
      console.log('reCAPTCHA action mismatch:', data.action);
      return res.status(400).json({ success: false, message: 'reCAPTCHA action mismatch' });
    }

    console.log('reCAPTCHA success, score:', data.score);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Server error during reCAPTCHA verification:', error.message);
    res.status(500).json({ success: false, message: 'Server error: ' + error.message });
  }
};