// OTP and Notification Helper Functions
// Centralized utilities for OTP generation, validation, and event logging

const sql = require('../models/db.js');
const Notification = require('../models/notification.model.js');

// ============================================================================
// OTP Functions
// ============================================================================

/**
 * Generate a random 6-digit OTP
 * @returns {string} OTP code
 */
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and store OTP for an email
 * @param {string} email - Email address
 * @param {function} callback - Callback (err, otp)
 */
const createOTP = (email, callback) => {
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Delete any existing OTPs for this email
    sql.query("DELETE FROM otps WHERE email = ?", [email], (err) => {
        if (err) {
            console.log("error deleting old OTP: ", err);
            callback(err, null);
            return;
        }

        // Insert new OTP
        sql.query(
            "INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)",
            [email, otp, expiresAt],
            (err, res) => {
                if (err) {
                    console.log("error creating OTP: ", err);
                    callback(err, null);
                    return;
                }
                console.log(`OTP created for ${email}: ${otp}`);
                callback(null, otp);
            }
        );
    });
};

/**
 * Verify OTP for an email (checks expiry)
 * @param {string} email - Email address
 * @param {string} otp - OTP code to verify
 * @param {function} callback - Callback (err, isValid)
 */
const verifyOTP = (email, otp, callback) => {
    sql.query(
        "SELECT * FROM otps WHERE email = ? AND otp = ? AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1",
        [email, otp],
        (err, res) => {
            if (err) {
                console.log("error verifying OTP: ", err);
                callback(err, false);
                return;
            }

            if (res.length > 0) {
                // OTP is valid - delete it
                sql.query("DELETE FROM otps WHERE email = ? AND otp = ?", [email, otp], (delErr) => {
                    if (delErr) console.log("error deleting OTP: ", delErr);
                });
                console.log(`OTP verified for ${email}`);
                callback(null, true);
            } else {
                console.log(`OTP verification failed for ${email}`);
                callback(null, false);
            }
        }
    );
};

/**
 * Mock/console OTP sender for development (no real email sending)
 * In production, integrate with email service (Nodemailer, SendGrid, etc)
 * @param {string} email - Email address
 * @param {string} otp - OTP code
 */
const sendOTPMock = (email, otp) => {
    // In development: log to console
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📧 OTP MOCK EMAIL (Development)`);
    console.log(`${'='.repeat(60)}`);
    console.log(`To: ${email}`);
    console.log(`Subject: Your OTP Code for Local Service Provider`);
    console.log(`${'='.repeat(60)}`);
    console.log(`\nHello,\n`);
    console.log(`Your OTP code is: ${otp}`);
    console.log(`\nThis code will expire in 5 minutes.\n`);
    console.log(`Do not share this code with anyone.\n`);
    console.log(`${'='.repeat(60)}\n`);
};

// ============================================================================
// Notification Functions
// ============================================================================

/**
 * Log a notification event for a customer
 * @param {number} userId - User ID
 * @param {string} type - Notification type (e.g., 'signup_verified', 'booking_created')
 * @param {object} data - { title, message, related_id, related_type }
 * @param {function} callback - Callback (err, result)
 */
const logUserNotification = (userId, type, data, callback) => {
    const notification = {
        user_id: userId,
        partner_id: null,
        notification_type: type,
        title: data.title || type,
        message: data.message || '',
        related_id: data.related_id || null,
        related_type: data.related_type || null
    };

    Notification.create(notification, (err, res) => {
        if (err) {
            console.log(`error logging notification for user ${userId}: `, err);
            if (callback) callback(err, null);
            return;
        }
        console.log(`notification logged for user ${userId}: ${type}`);
        if (callback) callback(null, res);
    });
};

/**
 * Log a notification event for a partner
 * @param {number} partnerId - Partner ID
 * @param {string} type - Notification type
 * @param {object} data - { title, message, related_id, related_type }
 * @param {function} callback - Callback (err, result)
 */
const logPartnerNotification = (partnerId, type, data, callback) => {
    const notification = {
        user_id: null,
        partner_id: partnerId,
        notification_type: type,
        title: data.title || type,
        message: data.message || '',
        related_id: data.related_id || null,
        related_type: data.related_type || null
    };

    Notification.create(notification, (err, res) => {
        if (err) {
            console.log(`error logging notification for partner ${partnerId}: `, err);
            if (callback) callback(err, null);
            return;
        }
        console.log(`notification logged for partner ${partnerId}: ${type}`);
        if (callback) callback(null, res);
    });
};

// ============================================================================
// Notification Event Helpers
// ============================================================================

const notificationEvents = {
    // Auth events
    OTP_SENT: 'otp_sent',
    SIGNUP_VERIFIED: 'signup_verified',
    LOGIN_FAILED: 'login_failed',

    // Booking events
    BOOKING_CREATED: 'booking_created',
    BOOKING_ACCEPTED: 'booking_accepted',
    BOOKING_REJECTED: 'booking_rejected',
    BOOKING_COMPLETED: 'booking_completed',
    BOOKING_CANCELLED: 'booking_cancelled',

    // Payment events
    PAYMENT_SUCCESS: 'payment_success',
    PAYMENT_FAILED: 'payment_failed',

    // Job events
    JOB_STATUS_UPDATED: 'job_status_updated'
};

/**
 * Helper to generate notification titles and messages
 */
const getNotificationText = (eventType, data) => {
    const messages = {
        [notificationEvents.OTP_SENT]: {
            title: 'Verification Code Sent',
            message: `An OTP has been sent to your email. Use it to verify your account.`
        },
        [notificationEvents.SIGNUP_VERIFIED]: {
            title: 'Account Verified',
            message: `Your account has been successfully verified. You can now log in and use all features.`
        },
        [notificationEvents.BOOKING_CREATED]: {
            title: 'Booking Created',
            message: `Your booking for ${data?.serviceName || 'service'} has been created. Partner will respond soon.`
        },
        [notificationEvents.BOOKING_ACCEPTED]: {
            title: 'Booking Accepted',
            message: `Your booking for ${data?.serviceName || 'service'} has been accepted by ${data?.partnerName || 'the partner'}.`
        },
        [notificationEvents.BOOKING_REJECTED]: {
            title: 'Booking Rejected',
            message: `Your booking for ${data?.serviceName || 'service'} has been rejected by the partner.`
        },
        [notificationEvents.BOOKING_COMPLETED]: {
            title: 'Booking Completed',
            message: `Your booking for ${data?.serviceName || 'service'} has been completed.`
        },
        [notificationEvents.PAYMENT_SUCCESS]: {
            title: 'Payment Successful',
            message: `Payment of £${data?.amount || '0'} has been processed successfully.`
        },
        [notificationEvents.JOB_STATUS_UPDATED]: {
            title: 'Job Status Updated',
            message: `Your job status has been updated to: ${data?.status || 'pending'}`
        }
    };

    return messages[eventType] || {
        title: 'Notification',
        message: 'You have a new notification.'
    };
};

module.exports = {
    // OTP functions
    generateOTP,
    createOTP,
    verifyOTP,
    sendOTPMock,

    // Notification functions
    logUserNotification,
    logPartnerNotification,
    notificationEvents,
    getNotificationText,

    // Models
    Notification
};
