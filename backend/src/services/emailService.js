/**
 * emailService.js — Development Stub
 *
 * Live Resend API integration has been disabled for local development.
 * The OTP is printed directly to the backend terminal (stdout) so
 * developers can verify accounts without needing email delivery.
 *
 * To re-enable live email, replace this file with the Resend axios
 * integration and ensure RESEND_API_KEY is set in the environment.
 */

/**
 * Stub implementation — logs the OTP to the terminal instead of
 * dispatching a real email via Resend or any other SMTP provider.
 *
 * @param {string} toEmail  - The recipient's email address (used for logging)
 * @param {string} otpCode  - The 6-digit OTP code
 */
const sendVerificationEmail = async (toEmail, otpCode) => {
  // ── DEV MODE: No external API call is made ───────────────────────────────
  // The OTP is printed to the terminal. Check your `npm run dev` / `npm start`
  // console to read the code and paste it into the verification screen.
  console.log(`\n╔═══════════════════════════════════════╗`);
  console.log(`║  DEV OTP for ${toEmail.padEnd(23)} ║`);
  console.log(`║  Code : ${otpCode}                        ║`);
  console.log(`╚═══════════════════════════════════════╝\n`);
};

module.exports = { sendVerificationEmail };
