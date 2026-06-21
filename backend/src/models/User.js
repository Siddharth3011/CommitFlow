const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// =============================================================================
// User Schema
// =============================================================================

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long.'],
      maxlength: [50, 'Name cannot exceed 50 characters.'],
    },

    email: {
      type: String,
      required: [true, 'Email address is required.'],
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address.',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [6, 'Password must be at least 6 characters long.'],
      // Exclude the password field from all query results by default.
      // To access it explicitly, use .select('+password') in a query.
      select: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  }
);

// =============================================================================
// Pre-Save Hook — Password Hashing
// =============================================================================

/**
 * Hashes the user's password with bcrypt before persisting to the database.
 * This hook only runs when the password field has been modified, which prevents
 * re-hashing an already-hashed password on every document save (e.g. on a
 * profile name update).
 */
userSchema.pre('save', async function (next) {
  // 'this' refers to the current document being saved
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// Instance Method — comparePassword
// =============================================================================

/**
 * Compares a plain-text candidate password against the stored bcrypt hash.
 * Used during login to validate user credentials.
 *
 * @param {string} candidatePassword - The raw password submitted by the user.
 * @returns {Promise<boolean>} Resolves to true if the passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
