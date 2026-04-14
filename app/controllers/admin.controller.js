const Admin = require('../models/admin.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

    // Always use database for admin verification
    Admin.findByEmail(email, (err, admin) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found Admin with email ${email}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error retrieving Admin with email " + email
                });
            }
        }
        
        // Check password
        bcrypt.compare(password, admin.password, (err, result) => {
            if (result) {
                // Create a token with role information
                const token = jwt.sign(
                    { 
                        userId: admin.id,
                        id: admin.id,
                        email: admin.email,
                        role: 'admin',
                        type: 'admin'
                    }, 
                    process.env.JWT_SECRET || 'MyProject2026SecureKey',
                    { expiresIn: process.env.JWT_EXPIRATION || 86400 } // 24 hours
                );
                res.status(200).send({
                    id: admin.id,
                    email: admin.email,
                    role: 'admin',
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

// Get all users
exports.getAllUsers = (req, res) => {
    Admin.getAllUsers((err, data) => {
        if (err)
            return res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving users."
            });
        else res.send(data);
    });
};

// Get all partners
exports.getAllPartners = (req, res) => {
    Admin.getAllPartners((err, data) => {
        if (err)
            return res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving partners."
            });
        else res.send(data);
    });
};

// Approve partner
exports.approvePartner = (req, res) => {
    Admin.approvePartner(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found Partner with id ${req.params.id}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error updating Partner with id " + req.params.id
                });
            }
        }
        res.send({ message: "Partner was approved successfully." });
    });
};

// Update partner
exports.updatePartner = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const partner = {
        description: req.body.description,
        pricing: req.body.pricing,
        is_approved: req.body.is_approved
    };

    Admin.updatePartner(
        req.params.id,
        partner,
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Not found Partner with id ${req.params.id}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Error updating Partner with id " + req.params.id
                    });
                }
            } else res.send(data);
        }
    );
};

// Create service
exports.createService = (req, res) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    const { name, description, image } = req.body;

    const service = { name, description, image };

    Admin.createService(service, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Service."
            });
        else res.send(data);
    });
};

// Update service
exports.updateService = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    const service = {
        name: req.body.name,
        description: req.body.description,
        image: req.body.image
    };

    Admin.updateService(
        req.params.id,
        service,
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Not found Service with id ${req.params.id}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Error updating Service with id " + req.params.id
                    });
                }
            } else res.send(data);
        }
    );
};

// Delete service
exports.deleteService = (req, res) => {
    Admin.deleteService(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Service with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Could not delete Service with id " + req.params.id
                });
            }
        } else res.send({ message: `Service was deleted successfully!` });
    });
};

// Get all bookings
exports.getAllBookings = (req, res) => {
    Admin.getAllBookings((err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving bookings."
            });
        else res.send(data);
    });
};

// Cancel booking
exports.cancelBooking = (req, res) => {
    Admin.cancelBooking(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Booking with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error updating Booking with id " + req.params.id
                });
            }
        } else res.send({ message: "Booking was cancelled successfully." });
    });
};

// Update booking status
exports.updateBookingStatus = (req, res) => {
    Admin.updateBookingStatus(req.params.id, req.body.status, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Booking with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error updating Booking with id " + req.params.id
                });
            }
        } else res.send({ message: "Booking status was updated successfully." });
    });
};

// Get admin dashboard statistics
exports.getDashboard = (req, res) => {
    Admin.getStatistics((err, stats) => {
        if (err) {
            res.status(500).send({
                message: "Error retrieving dashboard statistics"
            });
        } else res.send(stats);
    });
};

// Logout
exports.logout = (req, res) => {
    res.status(200).send({ 
        message: "Admin logged out successfully." 
    });
};

// Block a user - prevents login
exports.blockUser = (req, res) => {
    const { userId, reason } = req.body;

    if (!userId) {
        res.status(400).send({
            message: "User ID is required."
        });
        return;
    }

    const blockReason = reason || "Blocked by admin";

    Admin.blockUser(userId, blockReason, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `User with id ${userId} not found.`
                });
            } else {
                res.status(500).send({
                    message: "Error blocking user with id " + userId
                });
            }
        } else res.send({ message: "User was blocked successfully." });
    });
};

// Unblock a user - restores login access
exports.unblockUser = (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        res.status(400).send({
            message: "User ID is required."
        });
        return;
    }

    Admin.unblockUser(userId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `User with id ${userId} not found.`
                });
            } else {
                res.status(500).send({
                    message: "Error unblocking user with id " + userId
                });
            }
        } else res.send({ message: "User was unblocked successfully." });
    });
};

// Suspend a partner - prevents booking acceptance
exports.suspendPartner = (req, res) => {
    const { partnerId, reason } = req.body;

    if (!partnerId) {
        res.status(400).send({
            message: "Partner ID is required."
        });
        return;
    }

    const suspendReason = reason || "Suspended by admin";

    Admin.suspendPartner(partnerId, suspendReason, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Partner with id ${partnerId} not found.`
                });
            } else {
                res.status(500).send({
                    message: "Error suspending partner with id " + partnerId
                });
            }
        } else res.send({ message: "Partner was suspended successfully." });
    });
};

// Restore a partner - allows booking acceptance again
exports.restorePartner = (req, res) => {
    const { partnerId } = req.body;

    if (!partnerId) {
        res.status(400).send({
            message: "Partner ID is required."
        });
        return;
    }

    Admin.restorePartner(partnerId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Partner with id ${partnerId} not found.`
                });
            } else {
                res.status(500).send({
                    message: "Error restoring partner with id " + partnerId
                });
            }
        } else res.send({ message: "Partner was restored successfully." });
    });
};
