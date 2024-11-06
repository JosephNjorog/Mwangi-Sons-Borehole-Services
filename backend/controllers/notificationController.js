const Notification = require('../models/Notification');
const ErrorResponse = require('../utils/errorResponse');

class NotificationController {
  // @desc    Get user notifications
  // @route   GET /api/v1/notifications
  // @access  Private
  async getUserNotifications(req, res, next) {
    try {
      const notifications = await Notification.find({
        user: req.user.id,
        isDeleted: false
      })
        .sort('-createdAt')
        .limit(50);

      // Update last checked timestamp
      await User.findByIdAndUpdate(req.user.id, {
        lastNotificationCheck: Date.now()
      });

      res.status(200).json({
        success: true,
        count: notifications.length,
        data: notifications
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Mark notification as read
  // @route   PUT /api/v1/notifications/:id/mark-read
  // @access  Private
  async markNotificationRead(req, res, next) {
    try {
      const notification = await Notification.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!notification) {
        return next(new ErrorResponse('Notification not found', 404));
      }

      notification.isRead = true;
      await notification.save();

      res.status(200).json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  }

  // @desc    Create notification (internal use)
  // @access  Private
  async createNotification(data) {
    try {
      const notification = await Notification.create({
        user: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        reference: {
          model: data.referenceModel,
          id: data.referenceId
        }
      });

      // Emit socket event if user is online
      if (global.io) {
        global.io.to(data.userId.toString()).emit('notification', notification);
      }

      return notification;
    } catch (error) {
      console.error('Notification creation failed:', error);
    }
  }

  // @desc    Delete notification
  // @route   DELETE /api/v1/notifications/:id
  // @access  Private
  async deleteNotification(req, res, next) {
    try {
      const notification = await Notification.findOne({
        _id: req.params.id,
        user: req.user.id
      });

      if (!notification) {
        return next(new ErrorResponse('Notification not found', 404));
      }

      notification.isDeleted = true;
      await notification.save();

      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();