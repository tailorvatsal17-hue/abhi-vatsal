const Partner = require('../models/partner.model.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Signup
exports.signup = (req, res) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const { name, email, password, service_id, description, hourly_rate } = req.body;

    // Validate required fields
    if (!name || !email || !password || !service_id) {
        return res.status(400).send({
            message: "Missing required fields: name, email, password, service_id"
        });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%&])[A-Za-z\d!@#$%&]{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).send({
            message: "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        });
    }

    // Hash password
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            return res.status(500).send({
                message: "Error hashing password."
            });
        }

        // Create a Partner
        const partner = new Partner({
            name: name,
            email: email,
            password: hash,
            service_id: service_id,
            description: description || '',
            hourly_rate: hourly_rate || ''
        });

        // Save Partner in the database
        Partner.create(partner, (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: err.message || "Some error occurred while creating the Partner."
                });
            }
            res.status(200).send({
                message: "Partner registered successfully. Your account is pending admin approval.",
                partner: data
            });
        });
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

    Partner.findByEmail(email, (err, partner) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found Partner with email ${email}.`
                });
            } else {
                return res.status(500).send({
                    message: "Error retrieving Partner with email " + email
                });
            }
        }

        // Check partner approval status (must be approved)
        if (!partner.is_approved) {
            return res.status(403).send({
                message: "Partner account is pending approval. Please contact admin for approval."
            });
        }

        // Check if partner is suspended
        if (partner.is_suspended) {
            return res.status(403).send({
                message: "Your partner account has been suspended by admin."
            });
        }

        // Check password
        bcrypt.compare(password, partner.password, (err, result) => {
            if (result) {
                // Create a token with role information
                const token = jwt.sign(
                    { 
                        userId: partner.id,
                        id: partner.id,
                        email: partner.email,
                        role: 'partner',
                        type: 'partner',
                        partnerId: partner.id
                    }, 
                    process.env.JWT_SECRET || 'MyProject2026SecureKey',
                    { expiresIn: process.env.JWT_EXPIRATION || 86400 } // 24 hours
                );
                res.status(200).send({
                    id: partner.id,
                    email: partner.email,
                    name: partner.name,
                    role: 'partner',
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

// Get partner profile
exports.getProfile = (req, res) => {
    const partnerId = parseInt(req.params.id);
    
    // Authorization: Partner can only view their own profile
    if (req.partnerId !== partnerId) {
        return res.status(403).send({
            message: "Unauthorized: Cannot access other partners' profiles"
        });
    }
    
    Partner.findById(partnerId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Partner with id ${partnerId}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving Partner with id " + partnerId
                });
            }
        } else res.send(data);
    });
};

// Update partner profile
exports.updateProfile = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const partnerId = parseInt(req.params.id);
    
    // Authorization: Partner can only update their own profile
    if (req.partnerId !== partnerId) {
        return res.status(403).send({
            message: "Unauthorized: Cannot update other partners' profiles"
        });
    }

    Partner.updateById(
        partnerId,
        new Partner(req.body),
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Not found Partner with id ${partnerId}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Error updating Partner with id " + partnerId
                    });
                }
            } else res.send(data);
        }
    );
};

// Get partner bookings
exports.getBookings = (req, res) => {
    const partnerId = parseInt(req.params.id);
    
    // Authorization: Partner can only view their own bookings
    if (req.partnerId !== partnerId) {
        return res.status(403).send({
            message: "Unauthorized: Cannot access other partners' bookings"
        });
    }
    
    Partner.getBookings(partnerId, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving bookings."
            });
        else res.send(data);
    });
};

// Accept booking
exports.acceptBooking = (req, res) => {
    const bookingId = parseInt(req.params.id);
    
    // Verify booking belongs to this partner
    Partner.getBookingById(bookingId, (err, booking) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Booking not found with id ${bookingId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving booking"
            });
        }
        
        // Authorization: Verify booking belongs to authenticated partner
        if (booking.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot accept bookings for other partners"
            });
        }
        
        // Only allow accepting if status is 'Pending'
        if (booking.status !== 'Pending') {
            return res.status(400).send({
                message: `Cannot accept booking with status: ${booking.status}`
            });
        }
        
        Partner.updateBookingStatus(bookingId, 'Confirmed', (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: "Error accepting booking with id " + bookingId
                });
            }
            res.send({ message: "Booking accepted successfully." });
        });
    });
};

// Reject booking
exports.rejectBooking = (req, res) => {
    const bookingId = parseInt(req.params.id);
    
    // Verify booking belongs to this partner
    Partner.getBookingById(bookingId, (err, booking) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Booking not found with id ${bookingId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving booking"
            });
        }
        
        // Authorization: Verify booking belongs to authenticated partner
        if (booking.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot reject bookings for other partners"
            });
        }
        
        // Only allow rejecting if status is 'Pending'
        if (booking.status !== 'Pending') {
            return res.status(400).send({
                message: `Cannot reject booking with status: ${booking.status}`
            });
        }
        
        Partner.updateBookingStatus(bookingId, 'Cancelled', (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: "Error rejecting booking with id " + bookingId
                });
            }
            res.send({ message: "Booking rejected successfully." });
        });
    });
};

// Get partner dashboard
exports.getDashboard = (req, res) => {
    Partner.findById(req.userId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Partner with id ${req.userId}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving Partner"
                });
            }
        } else res.send(data);
    });
};

// Logout
exports.logout = (req, res) => {
    res.status(200).send({ 
        message: "Partner logged out successfully." 
    });
};
