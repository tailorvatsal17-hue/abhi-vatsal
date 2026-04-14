const Notification = require('../models/notification.model.js');

// Get notifications for customer/user
exports.getNotifications = (req, res) => {
    const userId = req.userId;
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    if (!userId) {
        return res.status(401).send({
            message: "Unauthorized"
        });
    }

    Notification.getForUser(userId, parseInt(limit), parseInt(offset), (err, data) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Error fetching notifications"
            });
        }

        res.send(data);
    });
};

// Get notifications for partner
exports.getPartnerNotifications = (req, res) => {
    const partnerId = req.partnerId;
    const limit = req.query.limit || 20;
    const offset = req.query.offset || 0;

    if (!partnerId) {
        return res.status(401).send({
            message: "Unauthorized"
        });
    }

    Notification.getForPartner(partnerId, parseInt(limit), parseInt(offset), (err, data) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Error fetching notifications"
            });
        }

        res.send(data);
    });
};

// Get unread notification count for customer/user
exports.getUnreadCount = (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).send({
            message: "Unauthorized"
        });
    }

    Notification.getUnreadCountForUser(userId, (err, count) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Error fetching unread count"
            });
        }

        res.send({ unreadCount: count });
    });
};

// Get unread notification count for partner
exports.getPartnerUnreadCount = (req, res) => {
    const partnerId = req.partnerId;

    if (!partnerId) {
        return res.status(401).send({
            message: "Unauthorized"
        });
    }

    Notification.getUnreadCountForPartner(partnerId, (err, count) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Error fetching unread count"
            });
        }

        res.send({ unreadCount: count });
    });
};

// Mark notification as read
exports.markAsRead = (req, res) => {
    const notificationId = req.params.id;

    if (!notificationId) {
        return res.status(400).send({
            message: "Notification ID is required"
        });
    }

    Notification.markAsRead(notificationId, (err, data) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Error marking notification as read"
            });
        }

        res.send({ message: "Notification marked as read" });
    });
};

// Mark all notifications as read for user
exports.markAllAsRead = (req, res) => {
    const userId = req.userId;

    if (!userId) {
        return res.status(401).send({
            message: "Unauthorized"
        });
    }

    Notification.markAllAsReadForUser(userId, (err, data) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Error marking notifications as read"
            });
        }

        res.send({ message: `Marked ${data.affected} notifications as read` });
    });
};

// Delete old notifications (admin/maintenance endpoint)
exports.cleanupOldNotifications = (req, res) => {
    const daysOld = req.query.daysOld || 30;

    Notification.deleteOldNotifications(parseInt(daysOld), (err, data) => {
        if (err) {
            return res.status(500).send({
                message: err.message || "Error deleting old notifications"
            });
        }

        res.send({ message: `Deleted ${data.deleted} notifications older than ${daysOld} days` });
    });
};
