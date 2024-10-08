const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [20, 'Name must have maximum 20 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email'],
    },
    photo: {
      type: String,
      default: '/default.png',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must have minimum 8 characters'],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Confirmation password is required'],
      validate: {
        // This works only on Create and Save not update
        validator: function (pc) {
          return pc === this.password;
        },
        message: 'Passwords are not the same',
      },
    },
    userActivationToken: String,
    userActivationExpires: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.virtual('cities', {
  ref: 'City',
  foreignField: 'user',
  localField: '_id',
});

userSchema.pre('save', async function (next) {
  // Check if password was modified
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm value
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // Update changedPasswordAt property for the user
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10,
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createToken = function (reason) {
  const token = crypto.randomBytes(32).toString('hex');

  if (reason === 'passwordReset') {
    this.passwordResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  }
  if (reason === 'userActivation') {
    this.userActivationToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    this.userActivationExpires = Date.now() + 30 * 24 * 60 * 60 * 1000;
  }

  return token;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
