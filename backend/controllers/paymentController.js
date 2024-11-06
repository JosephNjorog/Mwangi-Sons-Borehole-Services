const Payment = require('../models/Payment');
const ServiceRequest = require('../models/ServiceRequest');
const ErrorResponse = require('../utils/errorResponse');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

class PaymentController {
  // @desc    Calculate service charges
  // @route   POST /api/v1/payments/calculate-charges
  // @access  Private
  async calculateCharges(req, res, next) {
    try {
      const { serviceRequestId } = req.body;

      const serviceRequest = await ServiceRequest.findOne({
        _id: serviceRequestId,
        user: req.user.id
      });

      if (!serviceRequest) {
        return next(new ErrorResponse('Service request not found', 404));
      }

      // Calculate charges based on service parameters
      const baseCharge = process.env.BASE_DRILLING_CHARGE || 1000;
      const depthCharge = (serviceRequest.depth || 0) * process.env.PER_METER_CHARGE;
      const equipmentCharge = calculateEquipmentCharge(serviceRequest.equipment);
      
      const subtotal = baseCharge + depthCharge + equipmentCharge;
      const tax = subtotal * (process.env.TAX_RATE || 0.16);
      const total = subtotal + tax;

      res.status(200).json({
        success: true,
        data: {
          breakdown: {
            baseCharge,
            depthCharge,
            equipmentCharge,
            subtotal,
            tax,
            total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Process payment
  // @route   POST /api/v1/payments/process
  // @access  Private
  async processPayment(req, res, next) {
    try {
      const { serviceRequestId, paymentMethod, amount } = req.body;

      const serviceRequest = await ServiceRequest.findOne({
        _id: serviceRequestId,
        user: req.user.id
      });

      if (!serviceRequest) {
        return next(new ErrorResponse('Service request not found', 404));
      }

      let paymentResult;

      // Process payment based on payment method
      switch (paymentMethod) {
        case 'stripe':
          paymentResult = await processStripePayment(amount, req.body.token);
          break;
        case 'mpesa':
          paymentResult = await processMpesaPayment(amount, req.body.phoneNumber);
          break;
        default:
          return next(new ErrorResponse('Invalid payment method', 400));
      }

      // Create payment record
      const payment = await Payment.create({
        user: req.user.id,
        serviceRequest: serviceRequestId,
        amount,
        paymentMethod,
        transactionId: paymentResult.transactionId,
        status: 'completed',
        metadata: paymentResult
      });

      // Update service request status
      serviceRequest.paymentStatus = 'paid';
      serviceRequest.status = 'APPROVED';
      await serviceRequest.save();

      // Send payment confirmation
      await sendPaymentConfirmation({
        user: req.user,
        payment,
        serviceRequest
      });

      res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get payment history
  // @route   GET /api/v1/payments/history
  // @access  Private
  async getPaymentHistory(req, res, next) {
    try {
      const payments = await Payment.find({ user: req.user.id })
        .populate('serviceRequest', 'serviceType status')
        .sort('-createdAt');

      res.status(200).json({
        success: true,
        count: payments.length,
        data: payments
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper function to calculate equipment charges
  calculateEquipmentCharge(equipment) {
    const charges = {
      'standard': 500,
      'premium': 1000,
      'specialized': 1500
    };
    return charges[equipment] || 0;
  }

  // Process Stripe payment
  async processStripePayment(amount, token) {
    try {
      const charge = await stripe.charges.create({
        amount: amount * 100, // Convert to cents
        currency: 'usd',
        source: token,
        description: 'Borehole drilling service payment'
      });

      return {
        transactionId: charge.id,
        status: charge.status,
        metadata: charge
      };
    } catch (error) {
      throw new ErrorResponse('Payment processing failed', 400);
    }
  }

  // Process M-Pesa payment
  async processMpesaPayment(amount, phoneNumber) {
    try {
      // Implement M-Pesa integration here
      const mpesaResult = await initiateMpesaPayment(amount, phoneNumber);
      
      return {
        transactionId: mpesaResult.transactionId,
        status: mpesaResult.status,
        metadata: mpesaResult
      };
    } catch (error) {
      throw new ErrorResponse('M-Pesa payment processing failed', 400);
    }
  }
}

module.exports = new PaymentController();