const User = require('../models/user.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createOTP, verifyOTP, sendOTPMock, logUserNotification, notificationEvents, getNotificationText } = require('../services/otp-notification.service.js');

// Signup
exports.signup = (req, res) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const { email, password } = req.body;

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&])[A-Za-z\d!@#$%&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).send({
            message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        });
    }

    // Check if user already exists
    User.findByEmail(email, (err, data) => {
        if (data) {
            return res.status(400).send({
                message: "You already have an account. Please login."
            });
        }

        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                return res.status(500).send({
                    message: "Error hashing password."
                });
            }

            // Create a User
            const user = new User({
                email: email,
                password: hash
            });

            // Save User in the database
            User.create(user, (err, data) => {
                if (err) {
                    return res.status(500).send({
                        message: err.message || "Some error occurred while creating the User."
                    });
                }

                // Generate and send OTP
                createOTP(email, (err, otp) => {
                    if (err) {
                        console.error("OTP Creation Error:", err);
                        return res.status(500).send({
                            message: "Error generating OTP. Please try again.",
                            error: err.message
                        });
                    }

                    if (!otp) {
                        return res.status(500).send({
                            message: "Failed to generate OTP code."
                        });
                    }

                    // Mock send OTP (console output for development)
                    sendOTPMock(email, otp);

                    // Log OTP sent notification (with error handling)
                    logUserNotification(data.id, notificationEvents.OTP_SENT, {
                        title: 'Verification Code Sent',
                        message: 'Check your email for the OTP code to verify your account.'
                    }, (notifErr) => {
                        if (notifErr) {
                            console.error("Notification logging error:", notifErr);
                            // Don't fail the signup because notification logging failed
                        }
                    });

                    res.status(200).send({ 
                        message: "OTP sent to your email.",
                        userId: data.id,
                        email: email
                    });
                });
            });
        });
    });
};

// OTP Verification
exports.verifyOtp = (req, res) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const { email, otp } = req.body;

    verifyOTP(email, otp, (err, isValid) => {
        if (err) {
            return res.status(500).send({
                message: "Error verifying OTP."
            });
        }

        if (isValid) {
            // Mark user as verified
            User.findByEmail(email, (err, user) => {
                if (err || !user) {
                    return res.status(404).send({
                        message: "User not found."
                    });
                }

                // Update user verification status
                User.updateVerification(user.id, true, (err) => {
                    if (err) {
                        console.error("Verification update error:", err);
                        return res.status(500).send({
                            message: "Error updating verification status."
                        });
                    }

                    // Log signup verified notification (with error handling)
                    logUserNotification(user.id, notificationEvents.SIGNUP_VERIFIED, {
                        title: 'Account Verified Successfully',
                        message: 'Your account has been verified. You can now log in.'
                    }, (notifErr) => {
                        if (notifErr) {
                            console.error("Notification logging error:", notifErr);
                        }
                    });

                    res.status(200).send({ 
                        message: "OTP verified successfully. Your account is now active. Please login." 
                    });
                });
            });
        } else {
            res.status(400).send({
                message: "Invalid or expired OTP."
            });
        }
    });
};

// Login
exports.login = (req, res) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const { email, password } = req.body;

    User.findByEmail(email, (err, user) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found User with email ${email}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error retrieving User with email " + email
                });
            }
        }
        
        // User must be verified before login
        if (!user || !user.is_verified) {
            return res.status(403).send({
                message: "Account not verified. Please verify with OTP first."
            });
        }
        
        // Check if user is blocked
        if (user.is_blocked) {
            return res.status(403).send({
                message: "Your account has been blocked by admin."
            });
        }
        
        // Check password
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                // Create a token with role information
                const token = jwt.sign(
                    { 
                        userId: user.id,
                        id: user.id,
                        email: user.email,
                        role: 'customer',
                        type: 'customer'
                    }, 
                    process.env.JWT_SECRET || 'MyProject2026SecureKey',
                    { expiresIn: process.env.JWT_EXPIRATION || 86400 } // 24 hours
                );
                res.status(200).send({
                    id: user.id,
                    email: user.email,
                    role: 'customer',
                    accessToken: token
                });
            } else {
                res.status(401).send({
                    message: "Invalid Password!"
                });
            }
        });
    });
};

// Logout
exports.logout = (req, res) => {
    // Since we're using JWT, logout is handled client-side (token removal)
    // Server-side: invalidate token on blacklist if needed (optional)
    res.status(200).send({ 
        message: "Logged out successfully." 
    });
};
