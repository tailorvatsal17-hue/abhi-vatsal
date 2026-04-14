module.exports = app => {
    const router = require('express').Router();
    const notification = require('../controllers/notification.controller.js');
    const { verifyToken } = require('../middleware/authJwt');
    const requireCustomer = require('../middleware/requireCustomer');
    const requirePartner = require('../middleware/requirePartner');

    // Customer notification routes
    router.get('/customer/notifications', verifyToken, requireCustomer, notification.getNotifications);
    router.get('/customer/notifications/unread', verifyToken, requireCustomer, notification.getUnreadCount);
    router.put('/customer/notifications/:id/read', verifyToken, requireCustomer, notification.markAsRead);
    router.put('/customer/notifications/read-all', verifyToken, requireCustomer, notification.markAllAsRead);

    // Partner notification routes
    router.get('/partner/notifications', verifyToken, requirePartner, notification.getPartnerNotifications);
    router.get('/partner/notifications/unread', verifyToken, requirePartner, notification.getPartnerUnreadCount);
    router.put('/partner/notifications/:id/read', verifyToken, requirePartner, notification.markAsRead);
    router.put('/partner/notifications/read-all', verifyToken, requirePartner, notification.markAllAsRead);

    app.use('/api/notifications', router);
};
