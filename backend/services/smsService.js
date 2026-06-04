const sendSMS = async ({ to, message }) => {
  try {
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.log('Twilio not configured, skipping SMS');
      return { success: false, error: 'SMS not configured' };
    }

    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

    const sms = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to
    });

    console.log('SMS sent:', sms.sid);
    return { success: true, sid: sms.sid };
  } catch (error) {
    console.error('SMS error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendSMS;
