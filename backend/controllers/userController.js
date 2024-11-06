const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

class UserController {
  // @desc    Register user
  // @route   POST /api/v1/auth/register
  // @access  Public
  async register(req, res, next) {
    try {
      const { firstName, lastName, email, phoneNumber, password, address } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
      if (existingUser) {
        return next(new ErrorResponse('User already exists with this email or phone number', 400));
      }

      // Create user
      const user = await User.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        address
      });

      // Generate verification token
      const verificationToken = user.generateVerificationToken();
      await user.save();

      // Send verification email
      const verificationUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${verificationToken}`;
      await sendEmail({
        email: user.email,
        subject: 'Email Verification - Uzima Borehole System',
        message: `Please click the link to verify your email: ${verificationUrl}`
      });

      // Send response with token
      sendTokenResponse(user, 201, res);
    } catch (error) {
      next(error);
    }
  }

  // @desc    Login user
  // @route   POST /api/v1/auth/login
  // @access  Public
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Validate email & password
      if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
      }

      // Check for user
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401));
      }

      // Check if password matches
      const isMatch = await user.matchPassword(password);
      if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
      }

      // Update last login
      user.lastLogin = Date.now();
      await user.save();

      sendTokenResponse(user, 200, res);
    } catch (error) {
      next(error);
    }
  }

  // @desc    Forgot password
  // @route   POST /api/v1/auth/forgotpassword
  // @access  Public
  async forgotPassword(req, res, next) {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return next(new ErrorResponse('No user found with that email', 404));
      }

      // Get reset token
      const resetToken = user.generateResetPasswordToken();
      await user.save();

      // Create reset url
      const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/resetpassword/${resetToken}`;

      try {
        await sendEmail({
          email: user.email,
          subject: 'Password Reset - Uzima Borehole System',
          message: `You are receiving this email because you requested a password reset. Please click: ${resetUrl}`
        });

        res.status(200).json({ success: true, message: 'Reset email sent' });
      } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();

        return next(new ErrorResponse('Email could not be sent', 500));
      }
    } catch (error) {
      next(error);
    }
  }

  // @desc    Reset password
  // @route   PUT /api/v1/auth/resetpassword/:resettoken
  // @access  Public
  async resetPassword(req, res, next) {
    try {
      // Get hashed token
      const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpiry: { $gt: Date.now() }
      });

      if (!user) {
        return next(new ErrorResponse('Invalid or expired reset token', 400));
      }

      // Set new password
      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();

      sendTokenResponse(user, 200, res);
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update user profile
  // @route   PUT /api/v1/auth/profile
  // @access  Private
  async updateProfile(req, res, next) {
    try {
      const fieldsToUpdate = {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        phoneNumber: req.body.phoneNumber,
        address: req.body.address
      };

      const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token
    });
};

module.exports = new UserController();