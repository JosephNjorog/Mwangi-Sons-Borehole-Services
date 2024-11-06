const ServiceRequest = require('../models/ServiceRequest');
const ErrorResponse = require('../utils/errorResponse');
const geocoder = require('../utils/geocoder');

class ServiceRequestController {
  // @desc    Create new service request
  // @route   POST /api/v1/service-requests
  // @access  Private
  async createServiceRequest(req, res, next) {
    try {
      // Add user to request body
      req.body.user = req.user.id;

      // Geocode location
      if (req.body.address) {
        const location = await geocoder.geocode(req.body.address);
        req.body.location = {
          coordinates: [location[0].longitude, location[0].latitude],
          address: {
            street: location[0].streetName,
            city: location[0].city,
            state: location[0].stateCode,
            postalCode: location[0].zipcode,
            country: location[0].countryCode
          }
        };
      }

      const serviceRequest = await ServiceRequest.create(req.body);

      // Send notification to admin
      await sendAdminNotification({
        type: 'NEW_SERVICE_REQUEST',
        serviceRequestId: serviceRequest._id,
        userId: req.user.id
      });

      res.status(201).json({
        success: true,
        data: serviceRequest
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get all user's service requests
  // @route   GET /api/v1/service-requests
  // @access  Private
  async getServiceRequests(req, res, next) {
    try {
      const serviceRequests = await ServiceRequest.find({ user: req.user.id })
        .populate('comments.user', 'firstName lastName')
        .sort('-createdAt');

      res.status(200).json({
        success: true,
        count: serviceRequests.length,
        data: serviceRequests
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Get single service request
  // @route   GET /api/v1/service-requests/:id
  // @access  Private
  async getServiceRequest(req, res, next) {
    try {
      const serviceRequest = await ServiceRequest.findOne({
        _id: req.params.id,
        user: req.user.id
      }).populate('comments.user', 'firstName lastName');

      if (!serviceRequest) {
        return next(new ErrorResponse('Service request not found', 404));
      }

      res.status(200).json({
        success: true,
        data: serviceRequest
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Update service request
  // @route   PUT /api/v1/service-requests/:id
  // @access  Private
  async updateServiceRequest(req, res, next) {
    try {
      let serviceRequest = await ServiceRequest.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!serviceRequest) {
        return next(new ErrorResponse('Service request not found', 404));
      }

      // Check if request can be updated
      if (serviceRequest.status !== 'PENDING') {
        return next(new ErrorResponse('Service request cannot be updated after approval', 400));
      }

      // Update location if address is provided
      if (req.body.address) {
        const location = await geocoder.geocode(req.body.address);
        req.body.location = {
          coordinates: [location[0].longitude, location[0].latitude],
          address: {
            street: location[0].streetName,
            city: location[0].city,
            state: location[0].stateCode,
            postalCode: location[0].zipcode,
            country: location[0].countryCode
          }
        };
      }

      serviceRequest = await ServiceRequest.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        data: serviceRequest
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Add comment to service request
  // @route   POST /api/v1/service-requests/:id/comments
  // @access  Private
  async addComment(req, res, next) {
    try {
      const serviceRequest = await ServiceRequest.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!serviceRequest) {
        return next(new ErrorResponse('Service request not found', 404));
      }

      const comment = {
        user: req.user.id,
        content: req.body.content
      };

      serviceRequest.comments.push(comment);
      await serviceRequest.save();

      res.status(200).json({
        success: true,
        data: serviceRequest
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Upload attachments
  // @route   POST /api/v1/service-requests/:id/attachments
  // @access  Private
  async uploadAttachments(req, res, next) {
    try {
      const serviceRequest = await ServiceRequest.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!serviceRequest) {
        return next(new ErrorResponse('Service request not found', 404));
      }

      if (!req.files) {
        return next(new ErrorResponse('Please upload a file', 400));
      }

      const file = req.files.file;

      // Check file size
      if (file.size > process.env.MAX_FILE_SIZE) {
        return next(new ErrorResponse('File size cannot exceed 10MB', 400));
      }

      // Create custom filename
      file.name = `attachment_${serviceRequest._id}${path.parse(file.name).ext}`;

      // Upload file to S3 or local storage
      const uploadResult = await uploadFile(file);

      serviceRequest.attachments.push({
        name: file.name,
        url: uploadResult.url,
        type: file.mimetype
      });

      await serviceRequest.save();

      res.status(200).json({
        success: true,
        data: serviceRequest
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceRequestController();