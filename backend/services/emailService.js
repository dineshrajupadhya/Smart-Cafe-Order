const { Resend } = require('resend');

const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('Email skipped: RESEND_API_KEY not set');
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const resend = new Resend(apiKey);
    const fromAddress = 'Smart Cafe <onboarding@resend.dev>';
    const recipient = process.env.EMAIL_TO || to;

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [recipient],
      subject,
      html
    });

    if (error) {
      console.error('Resend error:', error.message);
      return { success: false, error: error.message };
    }

    console.log('Email sent:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Email error:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = sendEmail;
