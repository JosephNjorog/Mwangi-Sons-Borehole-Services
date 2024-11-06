const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const serviceRequestController = require('../controllers/serviceRequestController');
const { protect, verifyEmail, rateLimiter, sanitizeData } = require('../middleware/auth');

// User Authentication Routes
router.post(
  '/auth/register',
  rateLimiter,
  sanitizeData,
  userController.register
);

router.post(
  '/auth/login',
  rateLimiter,
  sanitizeData,
  userController.login
);

router.post(
  '/auth/forgotpassword',
  rateLimiter,
  sanitizeData,
  userController.forgotPassword
);

router.put(
  '/auth/resetpassword/:resettoken',
  rateLimiter,
  sanitizeData,
  userController.resetPassword
);

router.get(
  '/auth/verify-email/:token',
  verifyEmail,
  (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  }
);

// Protected User Profile Routes
router.use(protect); // Apply protection middleware to all routes below

router.get(
  '/profile',
  userController.getProfile
);

router.put(
  '/profile',
  sanitizeData,
  userController.updateProfile
);

router.put(
  '/profile/password',
  sanitizeData,
  userController.updatePassword
);

// Service Request Routes
router.route('/service-requests')
  .post(sanitizeData, serviceRequestController.createServiceRequest)
  .get(serviceRequestController.getServiceRequests);

router.route('/service-requests/:id')
  .get(serviceRequestController.getServiceRequest)
  .put(sanitizeData, serviceRequestController.updateServiceRequest)
  .delete(serviceRequestController.deleteServiceRequest);

router.post(
  '/service-requests/:id/comments',
  sanitizeData,
  serviceRequestController.addComment
);

router.post(
  '/service-requests/:id/attachments',
  serviceRequestController.uploadAttachments
);

// Payment Routes
router.post(
  '/payments/calculate-charges',
  sanitizeData,
  paymentController.calculateCharges
);

router.post(
  '/payments/process',
  sanitizeData,
  paymentController.processPayment
);

router.get(
  '/payments/history',
  paymentController.getPaymentHistory
);

// Service Status Routes
router.get(
  '/service-requests/:id/status',
  serviceRequestController.getServiceStatus
);

router.get(
  '/service-requests/:id/timeline',
  serviceRequestController.getServiceTimeline
);

// Notifications Routes
router.get(
  '/notifications',
  notificationController.getUserNotifications
);

router.put(
  '/notifications/:id/mark-read',
  notificationController.markNotificationRead
);

// Export router
module.exports = router;