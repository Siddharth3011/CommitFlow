const mongoose = require('mongoose');

const verificationOTPSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300, // 300 seconds = 5 minutes TTL
  },
});

const VerificationOTP = mongoose.model('VerificationOTP', verificationOTPSchema);

module.exports = VerificationOTP;
