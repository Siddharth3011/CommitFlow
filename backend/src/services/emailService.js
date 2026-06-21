const nodemailer = require('nodemailer');

// Set up the transporter pointing to Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // Use SSL/TLS directly for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Prevents local network SSL handshake drops
  },
});

/**
 * Sends a clean, themed HTML email with the 6-digit OTP code to the provided email address.
 * 
 * @param {string} toEmail - The recipient's email address
 * @param {string} otpCode - The 6-digit OTP code to embed in the email
 */
const sendVerificationEmail = async (toEmail, otpCode) => {
  const mailOptions = {
    from: `"CommitFlow Security" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'CommitFlow - Verify Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-w-md mx-auto; padding: 20px; border: 1px solid #334155; border-radius: 8px; background-color: #0b0f19; color: #f8fafc;">
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
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail}`);
  } catch (error) {
    console.error("Nodemailer SMTP Error:", error);
    throw new Error('Failed to send verification email. Please try again.');
  }
};

module.exports = {
  sendVerificationEmail,
};
