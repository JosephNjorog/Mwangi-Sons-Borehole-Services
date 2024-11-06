const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  serviceRequest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceRequest',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CASH']
  },
  status: {
    type: String,
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  transactionId: {
    type: String,
    unique: true
  },
  paymentDetails: {
    cardLast4: String,
    cardBrand: String,
    bankName: String,
    accountLast4: String,
    mobileNumber: String,
    providerReference: String
  },
  billingAddress: {
    street: String,
    city: String,
    state: String,
    postalCode: String,
    country: String
  },
  metadata: {
    type: Map,
    of: String
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  refundDetails: {
    amount: Number,
    reason: String,
    refundedAt: Date,
    refundTransactionId: String
  },
  receiptUrl: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate unique transaction ID
paymentSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    this.transactionId = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
  }
  next();
});

// Method to update payment status
paymentSchema.methods.updateStatus = async function(status, note) {
  this.status = status;
  this.statusHistory.push({
    status,
    note,
    timestamp: Date.now()
  });
  await this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = async function(amount, reason) {
  if (this.status !== 'COMPLETED') {
    throw new Error('Cannot refund payment that is not completed');
  }
  
  this.refundDetails = {
    amount,
    reason,
    refundedAt: Date.now(),
    refundTransactionId: 'REF' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
  };
  
  await this.updateStatus('REFUNDED', `Refunded ${amount} ${this.currency} - ${reason}`);
};

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;