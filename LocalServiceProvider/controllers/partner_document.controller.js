const PartnerDocument = require("../models/partner_document.model.js");
const Partner = require("../models/partner.model.js");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/documents");
    },
    filename: (req, file, cb) => {
        cb(null, req.userId + "-" + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    }
}).single("document");

exports.uploadDocument = (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            return res.status(400).send({ message: err.message });
        }

        if (!req.file) {
            return res.status(400).send({ message: "Please upload a file!" });
        }

        const newDocument = new PartnerDocument({
            partner_id: req.userId,
            document_type: req.body.document_type || "General",
            document_url: "/documents/" + req.file.filename,
            status: "Under Review"
        });

        PartnerDocument.create(newDocument, (err, data) => {
            if (err) {
                res.status(500).send({ message: "Some error occurred while saving document." });
            } else {
                res.status(201).send(data);
            }
        });
    });
};

exports.getPartnerDocuments = (req, res) => {
    const partnerId = req.params.id || req.userId;
    PartnerDocument.findByPartnerId(partnerId, (err, data) => {
        if (err) {
            res.status(500).send({ message: "Error retrieving documents." });
        } else {
            res.send(data);
        }
    });
};

// Admin: Verify/Reject Document
exports.verifyDocument = (req, res) => {
    const { id, status } = req.body; // status: 'Verified' or 'Rejected'

    PartnerDocument.findById(id, (err, doc) => {
        if (err || !doc) {
            return res.status(404).send({ message: "Document not found." });
        }

        PartnerDocument.updateStatus(id, status, (err, data) => {
            if (err) {
                return res.status(500).send({ message: "Error updating status." });
            }

            // If verified, maybe update partner status or send email
            Partner.findById(doc.partner_id, (err, partner) => {
                if (partner) {
                    const transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'tailorvatsal17@gmail.com',
                            pass: 'hzzw xsat yulx ouph'
                        }
                    });

                    const mailOptions = {
                        from: 'tailorvatsal17@gmail.com',
                        to: partner.email,
                        subject: `Verification Document ${status}`,
                        text: `Hello ${partner.name}, your uploaded document (${doc.document_type}) has been ${status.toLowerCase()} by the admin.`
                    };

                    transporter.sendMail(mailOptions);
                }
            });

            res.send({ message: `Document has been ${status.toLowerCase()}.` });
        });
    });
};
