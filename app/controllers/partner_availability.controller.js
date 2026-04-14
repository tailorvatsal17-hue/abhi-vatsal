const PartnerAvailability = require('../models/partner_availability.model.js');

// Create and Save a new PartnerAvailability
exports.create = (req, res) => {
    // Validate request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    // Ensure partner_id is from the authenticated user
    const partner_id = req.partnerId; // Assuming req.partnerId is set by authJwt middleware

    // Create a PartnerAvailability
    const partnerAvailability = new PartnerAvailability({
        partner_id: partner_id,
        available_date: req.body.available_date,
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        status: req.body.status || "Available" // Default to 'Available'
    });

    // Save PartnerAvailability in the database
    PartnerAvailability.create(partnerAvailability, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the PartnerAvailability."
            });
        else res.status(201).send(data);
    });
};

// Retrieve all PartnerAvailability for a partner from the database.
exports.findAllByPartner = (req, res) => {
    const partner_id = req.partnerId; // Assuming req.partnerId is set by authJwt middleware

    PartnerAvailability.findByPartnerId(partner_id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `No availability found for partner with id ${partner_id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving availability for partner with id " + partner_id
                });
            }
        } else res.send(data);
    });
};

// Find a single PartnerAvailability with an id
exports.findOne = (req, res) => {
    const availabilityId = parseInt(req.params.id);
    
    PartnerAvailability.findById(availabilityId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found PartnerAvailability with id ${availabilityId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving PartnerAvailability with id " + availabilityId
            });
        }
        
        // Authorization: Partner can only view their own availability
        if (data.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot access other partners' availability"
            });
        }
        
        res.send(data);
    });
};

// Update a PartnerAvailability identified by the id in the request
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const availabilityId = parseInt(req.params.id);
    
    // First verify ownership
    PartnerAvailability.findById(availabilityId, (err, existingData) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found PartnerAvailability with id ${availabilityId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving PartnerAvailability with id " + availabilityId
            });
        }
        
        // Authorization: Partner can only update their own availability
        if (existingData.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot update other partners' availability"
            });
        }
        
        PartnerAvailability.updateById(
            availabilityId,
            new PartnerAvailability(req.body),
            (err, data) => {
                if (err) {
                    return res.status(500).send({
                        message: "Error updating PartnerAvailability with id " + availabilityId
                    });
                }
                res.send(data);
            }
        );
    });
};

// Delete a PartnerAvailability with the specified id in the request
exports.delete = (req, res) => {
    const availabilityId = parseInt(req.params.id);
    
    // First verify ownership
    PartnerAvailability.findById(availabilityId, (err, existingData) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found PartnerAvailability with id ${availabilityId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving PartnerAvailability with id " + availabilityId
            });
        }
        
        // Authorization: Partner can only delete their own availability
        if (existingData.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot delete other partners' availability"
            });
        }
        
        PartnerAvailability.remove(availabilityId, (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: "Could not delete PartnerAvailability with id " + availabilityId
                });
            }
            res.send({ message: `PartnerAvailability was deleted successfully!` });
        });
    });
};
