const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['BOREHOLE_DRILLING', 'MAINTENANCE', 'REPAIR', 'CONSULTATION']
  },
  location: {
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    }
  },
  specifications: {
    desiredDepth: {
      type: Number,
      required: true
    },
    groundCondition: String,
    waterTableDepth: Number,
    propertySize: String,
    additionalRequirements: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'],
    default: 'PENDING'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  estimatedCost: {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  schedule: {
    requestedDate: Date,
    confirmedDate: Date,
    estimatedDuration: Number // in days
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for location-based queries
serviceRequestSchema.index({ 'location.coordinates': '2dsphere' });

// Update the updatedAt timestamp before saving
serviceRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add status history
serviceRequestSchema.methods.addStatusHistory = function(status, note) {
  this.statusHistory.push({
    status,
    note,
    timestamp: Date.now()
  });
  this.status = status;
};

// Method to calculate progress percentage
serviceRequestSchema.methods.calculateProgress = function() {
  const statusWeights = {
    'PENDING': 0,
    'APPROVED': 20,
    'IN_PROGRESS': 60,
    'COMPLETED': 100,
    'CANCELLED': 0,
    'ON_HOLD': this.statusHistory[this.statusHistory.length - 2]?.status || 0
  };
  
  return statusWeights[this.status];
};

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);
module.exports = ServiceRequest;