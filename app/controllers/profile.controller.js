const Profile = require('../models/profile.model.js');

// Get user profile
exports.getProfile = (req, res) => {
    const profileId = parseInt(req.params.id);
    const userId = req.userId; // From JWT token

    // Authorization check
    if (profileId !== userId) {
        return res.status(403).send({
            message: "Access denied. You can only view your own profile."
        });
    }

    Profile.getProfile(profileId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found User with id ${profileId}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving User with id " + profileId
                });
            }
        } else res.send(data);
    });
};

// Update user profile
exports.updateProfile = (req, res) => {
    const profileId = parseInt(req.params.id);
    const userId = req.userId; // From JWT token

    // Validate Request
    if (!req.body) {
        return res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    // Authorization check
    if (profileId !== userId) {
        return res.status(403).send({
            message: "Access denied. You can only update your own profile."
        });
    }

    Profile.updateProfile(profileId, req.body, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found User with id ${profileId}.`
                });
            } else {
                res.status(500).send({
                    message: "Error updating User with id " + profileId
                });
            }
        } else res.send(data);
    });
};

// Get user addresses
exports.getAddresses = (req, res) => {
    const userId = parseInt(req.params.id);
    const authUserId = req.userId; // From JWT token

    // Authorization check
    if (userId !== authUserId) {
        return res.status(403).send({
            message: "Access denied. You can only view your own addresses."
        });
    }

    Profile.getAddresses(userId, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving addresses."
            });
        } else res.send(data);
    });
};

// Add user address
exports.addAddress = (req, res) => {
    const userId = parseInt(req.params.id);
    const authUserId = req.userId; // From JWT token

    // Validate request
    if (!req.body) {
        return res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    // Authorization check
    if (userId !== authUserId) {
        return res.status(403).send({
            message: "Access denied. You can only add addresses to your own profile."
        });
    }

    // Validate address fields
    const { address, city, state, zip_code } = req.body;
    if (!address || !city || !state || !zip_code) {
        return res.status(400).send({
            message: "Please provide all required fields: address, city, state, zip_code"
        });
    }

    const newAddress = {
        user_id: userId,
        address,
        city,
        state,
        zip_code
    };

    Profile.addAddress(newAddress, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while creating the Address."
            });
        } else {
            res.status(201).send(data);
        }
    });
};

// Update user address
exports.updateAddress = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    Profile.updateAddress(
        req.params.id,
        req.body,
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Not found Address with id ${req.params.id}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Error updating Address with id " + req.params.id
                    });
                }
            } else res.send(data);
        }
    );
};

// Delete user address
exports.deleteAddress = (req, res) => {
    Profile.deleteAddress(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Address with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Could not delete Address with id " + req.params.id
                });
            }
        } else res.send({ message: `Address was deleted successfully!` });
    });
};

// Get user bookings
exports.getBookings = (req, res) => {
    const userId = parseInt(req.params.id);
    const authUserId = req.userId; // From JWT token

    // Authorization check
    if (userId !== authUserId) {
        return res.status(403).send({
            message: "Access denied. You can only view your own bookings."
        });
    }

    Profile.getBookings(userId, (err, data) => {
        if (err) {
            res.status(500).send({
                message: err.message || "Some error occurred while retrieving bookings."
            });
        } else {
            res.send(data);
        }
    });
};
