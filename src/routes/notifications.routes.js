
const router = require('express').Router();

const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

router.use(protect);

function formatNotif(notification) {
  return {
    id: notification._id.toString(),
    userId: notification.userId.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    severity: notification.severity,
    isRead: notification.isRead,
    isDismissed: notification.isDismissed,
    meta: notification.meta,
    createdAt: notification.createdAt,
  };
}

// GET /api/ccoin/notifications
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      data: notifications.map(formatNotif),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// PATCH /api/ccoin/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found',
      });
    }

    notification.isRead = true;

    await notification.save();

    res.json({
      data: formatNotif(notification),
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

// PATCH /api/ccoin/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      {
        userId: req.user._id,
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      data: null,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: 'Server error',
    });
  }
});

module.exports = router;
