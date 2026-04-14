const sql = require('./db.js');

const Notification = function(notification) {
    this.user_id = notification.user_id;
    this.partner_id = notification.partner_id;
    this.notification_type = notification.notification_type;
    this.title = notification.title;
    this.message = notification.message;
    this.related_id = notification.related_id;
    this.related_type = notification.related_type;
};

// Create a notification (log an event)
Notification.create = (notification, result) => {
    sql.query("INSERT INTO notifications SET ?", notification, (err, res) => {
        if (err) {
            console.log("error creating notification: ", err);
            result(err, null);
            return;
        }

        console.log("created notification: ", { id: res.insertId, ...notification });
        result(null, { id: res.insertId, ...notification });
    });
};

// Get all notifications for a user
Notification.getForUser = (userId, limit = 20, offset = 0, result) => {
    sql.query(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [userId, limit, offset],
        (err, res) => {
            if (err) {
                console.log("error fetching user notifications: ", err);
                result(err, null);
                return;
            }
            result(null, res);
        }
    );
};

// Get all notifications for a partner
Notification.getForPartner = (partnerId, limit = 20, offset = 0, result) => {
    sql.query(
        "SELECT * FROM notifications WHERE partner_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
        [partnerId, limit, offset],
        (err, res) => {
            if (err) {
                console.log("error fetching partner notifications: ", err);
                result(err, null);
                return;
            }
            result(null, res);
        }
    );
};

// Get unread notifications count for user
Notification.getUnreadCountForUser = (userId, result) => {
    sql.query(
        "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = false",
        [userId],
        (err, res) => {
            if (err) {
                console.log("error fetching unread count: ", err);
                result(err, null);
                return;
            }
            result(null, res[0] ? res[0].count : 0);
        }
    );
};

// Get unread notifications count for partner
Notification.getUnreadCountForPartner = (partnerId, result) => {
    sql.query(
        "SELECT COUNT(*) as count FROM notifications WHERE partner_id = ? AND is_read = false",
        [partnerId],
        (err, res) => {
            if (err) {
                console.log("error fetching unread count: ", err);
                result(err, null);
                return;
            }
            result(null, res[0] ? res[0].count : 0);
        }
    );
};

// Mark notification as read
Notification.markAsRead = (notificationId, result) => {
    sql.query(
        "UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = ?",
        [notificationId],
        (err, res) => {
            if (err) {
                console.log("error marking notification as read: ", err);
                result(err, null);
                return;
            }
            result(null, { id: notificationId, is_read: true });
        }
    );
};

// Mark all notifications as read for user
Notification.markAllAsReadForUser = (userId, result) => {
    sql.query(
        "UPDATE notifications SET is_read = true, read_at = NOW() WHERE user_id = ? AND is_read = false",
        [userId],
        (err, res) => {
            if (err) {
                console.log("error marking all as read: ", err);
                result(err, null);
                return;
            }
            result(null, { affected: res.affectedRows });
        }
    );
};

// Delete old notifications (cleanup older than 30 days)
Notification.deleteOldNotifications = (daysOld = 30, result) => {
    sql.query(
        "DELETE FROM notifications WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
        [daysOld],
        (err, res) => {
            if (err) {
                console.log("error deleting old notifications: ", err);
                result(err, null);
                return;
            }
            console.log(`deleted ${res.affectedRows} old notifications`);
            result(null, { deleted: res.affectedRows });
        }
    );
};

module.exports = Notification;
