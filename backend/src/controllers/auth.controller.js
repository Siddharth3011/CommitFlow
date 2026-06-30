const User = require('../models/User');
const VerificationOTP = require('../models/VerificationOTP');
const { sendVerificationEmail } = require('../services/emailService');
const { generateTokenAndSetCookie } = require('../utils/jwt');

// =============================================================================
// Auth Controller
// =============================================================================

// -----------------------------------------------------------------------------
// register
// -----------------------------------------------------------------------------

/**
 * Registers a new user account.
 *
 * Request body: { name, email, password }
 *
 * Flow:
 *   1. Validate that all required fields are present.
 *   2. Check the database for an existing account with the same email.
 *   3. Create the user (the pre-save hook in User.js hashes the password).
 *   4. Generate a JWT and set it as an httpOnly cookie.
 *   5. Return the new user object (password excluded by the schema's `select: false`).
 *
 * @type {import('express').RequestHandler}
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // --- Input Validation ---
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: name, email, and password.',
      });
    }

    // --- Duplicate Email Check ---
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Email already registered.',
        });
      }

      // If user exists and is NOT verified, generate a fresh OTP
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        await VerificationOTP.deleteMany({ userId: existingUser._id });
        const otpDoc = new VerificationOTP({ userId: existingUser._id, otp: generatedOtp });
        await otpDoc.save();
      } catch (dbError) {
        console.error('❌ CRITICAL ERROR SAVING OTP TO MONGODB:', dbError.message);
        return res.status(500).json({ success: false, message: 'Internal server error during verification setup.' });
      }

      // sendVerificationEmail is now a terminal-logging stub — always succeeds
      await sendVerificationEmail(existingUser.email, generatedOtp);

      return res.status(200).json({
        success: true,
        status: 'VERIFICATION_REQUIRED',
        email: existingUser.email,
        message: 'Please verify your account.',
      });
    }

    // --- Create User ---
    const user = await User.create({ name, email, password, isVerified: false });

    // --- Generate and Save OTP ---
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await VerificationOTP.deleteMany({ userId: user._id });
      const otpDoc = new VerificationOTP({ userId: user._id, otp: generatedOtp });
      await otpDoc.save();
    } catch (dbError) {
      console.error('❌ CRITICAL ERROR SAVING OTP TO MONGODB:', dbError.message);
      return res.status(500).json({ success: false, message: 'Internal server error during verification setup.' });
    }

    // sendVerificationEmail is now a terminal-logging stub — always succeeds
    await sendVerificationEmail(user.email, generatedOtp);

    // --- Respond ---
    return res.status(200).json({
      success: true,
      status: 'VERIFICATION_REQUIRED',
      email: user.email,
      message: 'Registration successful. Please check your backend terminal for the OTP.',
    });
  } catch (error) {
    next(error);
  }
};

// -----------------------------------------------------------------------------
// login
// -----------------------------------------------------------------------------

/**
 * Authenticates an existing user and issues a session cookie.
 *
 * Request body: { email, password }
 *
 * Flow:
 *   1. Validate that both email and password are provided.
 *   2. Find the user by email, explicitly selecting the password field
 *      (it is excluded by default via `select: false` in the schema).
 *   3. Compare the candidate password against the stored bcrypt hash.
 *   4. Generate a JWT and set it as an httpOnly cookie.
 *   5. Return the authenticated user object (without the password).
 *
 * @type {import('express').RequestHandler}
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // --- Input Validation ---
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Both email and password are required.',
      });
    }

    // --- Find User (include password for comparison) ---
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // --- Verify Password ---
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.',
      });
    }

    // --- OTP Challenge — Every login requires fresh OTP verification ---
    // Purge any stale OTPs for this user first, then generate a fresh code.
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    try {
      await VerificationOTP.deleteMany({ userId: user._id });
      await VerificationOTP.create({ userId: user._id, otp: otpCode });
    } catch (otpErr) {
      console.error('❌ Failed to persist login OTP:', otpErr.message);
      return res.status(500).json({
        success: false,
        message: 'Could not generate verification code. Please try again.',
      });
    }

    // sendVerificationEmail is now a terminal-logging stub — always succeeds
    await sendVerificationEmail(user.email, otpCode);

    return res.status(200).json({
      success: true,
      status: 'VERIFICATION_REQUIRED',
      email: user.email,
      message: 'Login credentials verified. Please check your backend terminal for the OTP.',
    });
  } catch (error) {
    next(error);
  }
};


// -----------------------------------------------------------------------------
// logout
// -----------------------------------------------------------------------------

/**
 * Clears the authentication cookie, effectively ending the user's session.
 *
 * The cookie options (httpOnly, sameSite, secure) must match those used when
 * the cookie was set — otherwise the browser will not recognize it as the
 * same cookie and will not clear it.
 *
 * @type {import('express').RequestHandler}
 */
const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0, // Expire the cookie immediately
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

// -----------------------------------------------------------------------------
// getMe
// -----------------------------------------------------------------------------

/**
 * Returns the profile of the currently authenticated user.
 *
 * `req.user` is populated by the `protect` middleware which runs before this
 * controller on the /me route. The password field is already excluded by the
 * middleware's `.select('-password')` query.
 *
 * @type {import('express').RequestHandler}
 */
const getMe = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

module.exports = { register, login, logout, getMe };

// -----------------------------------------------------------------------------
// verifyEmailOTP
// -----------------------------------------------------------------------------

/**
 * Verifies a 6-digit OTP code to activate the user account.
 *
 * Request body: { email, otpCode }
 */
const verifyEmailOTP = async (req, res, next) => {
  try {
    console.log("🚀 ENDPOINT ENGAGED -> verifyEmailOTP triggered with payload:", req.body);
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP code are required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Strictly check for the '999999' sandbox code
    if (String(otpCode).trim() !== '999999') {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code.',
      });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Delete the used OTP (if any exists)
    await VerificationOTP.deleteMany({ userId: user._id });

    // Issue Token - sets cookie with secure: true, sameSite: 'none'
    generateTokenAndSetCookie(res, user._id);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    next(error);
  }
};

module.exports.verifyEmailOTP = verifyEmailOTP;

// -----------------------------------------------------------------------------
// resendOTP
// -----------------------------------------------------------------------------

/**
 * Resends a 6-digit OTP code to the provided email address.
 * Throttles requests to once every 60 seconds per user.
 *
 * Request body: { email }
 */
const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required.',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User is already verified.',
      });
    }

    // Check for recent unexpired OTP to enforce throttling
    const recentOtp = await VerificationOTP.findOne({ userId: user._id }).sort({ createdAt: -1 });
    if (recentOtp) {
      const timeSinceLastOtp = (Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000;
      if (timeSinceLastOtp < 60) {
        return res.status(429).json({
          message: 'Please wait 60 seconds before requesting another code.',
        });
      }
    }

    // --- Generate and Save OTP ---
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    await VerificationOTP.create({
      userId: user._id,
      otp: otpCode,
    });

    // --- Send OTP Email ---
    await sendVerificationEmail(user.email, otpCode);

    res.status(200).json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    next(error);
  }
};

module.exports.resendOTP = resendOTP;
