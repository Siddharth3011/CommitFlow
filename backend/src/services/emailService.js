const axios = require('axios');

/**
 * Sends a clean, themed HTML email with the 6-digit OTP code to the provided
 * email address using the Resend HTTPS API.
 *
 * Resend bypasses SMTP port restrictions on Render and other cloud providers
 * by routing all mail delivery over standard HTTPS (port 443).
 *
 * @param {string} toEmail - The recipient's email address
 * @param {string} otpCode - The 6-digit OTP code to embed in the email
 */
const sendVerificationEmail = async (toEmail, otpCode) => {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not defined in environment variables.');
  }

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px; border: 1px solid #334155; border-radius: 8px; background-color: #0b0f19; color: #f8fafc;">
      <h2 style="color: #6366f1; text-align: center; margin-bottom: 24px;">CommitFlow Account Verification</h2>
      <p style="font-size: 16px; margin-bottom: 16px;">Hello,</p>
      <p style="font-size: 16px; margin-bottom: 24px;">
        Thank you for signing up for CommitFlow! To complete your registration and activate your workspace, please use the following 6-digit verification code:
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <span style="display: inline-block; padding: 12px 24px; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #10b981; background-color: #1e293b; border-radius: 6px; border: 1px solid #334155;">
          ${otpCode}
        </span>
      </div>
      <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-bottom: 32px;">
        This code will expire in 5 minutes. If you did not create an account, you can safely ignore this email.
      </p>
      <hr style="border: 0; border-top: 1px solid #334155; margin-bottom: 24px;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">
        &copy; ${new Date().getFullYear()} CommitFlow. All rights reserved.
      </p>
    </div>
  `;

  const payload = {
    from: 'CommitFlow Security <onboarding@resend.dev>',
    to: [toEmail],
    subject: 'CommitFlow - Verify Your Account',
    html: htmlBody,
  };

  const response = await axios.post('https://api.resend.com/emails', payload, {
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`✅ Verification email dispatched via Resend to ${toEmail}. ID: ${response.data?.id}`);
};

module.exports = {
  sendVerificationEmail,
};
