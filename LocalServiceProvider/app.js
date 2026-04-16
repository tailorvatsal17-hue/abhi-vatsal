// Import express.js
const express = require("express");
const cors = require('cors');

// Create express app
var app = express();

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', './views');

// Add cors and body-parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add static files location
app.use(express.static("./public"));
app.use("/documents", express.static("./uploads/documents"));

// Get the functions in the db.js file to use
const db = require('./services/db');

// Main routes for Pug views
app.get("/", async function(req, res) {
    try {
        const categories = await db.query("SELECT * FROM service_categories");
        res.render("index", { categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching categories");
    }
});

app.get("/category/:id", async function(req, res) {
    try {
        const categoryId = req.params.id;
        const category = await db.query("SELECT * FROM service_categories WHERE id = ?", [categoryId]);
        const services = await db.query("SELECT * FROM services WHERE category_id = ?", [categoryId]);
        res.render("category_services", { 
            title: category[0] ? category[0].name : "Services",
            category: category[0],
            services 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching services for category");
    }
});

app.get("/services", async function(req, res) {
    try {
        const services = await db.query("SELECT s.*, c.name as category_name FROM services s JOIN service_categories c ON s.category_id = c.id");
        res.render("services", { title: "All Services", services });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching services");
    }
});

app.get("/partners", async function(req, res) {
    try {
        const serviceId = req.query.service_id;
        const categoryId = req.query.category_id;
        const search = req.query.search;
        const maxPrice = req.query.max_price;
        const minPrice = req.query.min_price;
        const minRating = req.query.min_rating;
        
        const categories = await db.query("SELECT * FROM service_categories");

        // We'll use the Service model search logic if any filters are present
        if (serviceId || categoryId || search || maxPrice || minPrice || minRating) {
            const Service = require('./models/service.model.js');
            const filters = {
                service_id: serviceId,
                category_id: categoryId,
                keyword: search,
                max_price: maxPrice,
                min_price: minPrice,
                min_rating: minRating
            };
            
            Service.search(filters, (err, partners) => {
                if (err) {
                    console.error("Search error in route:", err);
                    return res.render("partners", { title: "Find Professionals", partners: [], categories });
                }
                res.render("partners", { title: "Find Professionals", partners, categories });
            });
        } else {
            const partners = await db.query("SELECT * FROM partners WHERE is_approved = 1");
            res.render("partners", { title: "Find Professionals", partners, categories });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching partners");
    }
});

app.get("/partners/:id", async function(req, res) {
    try {
        const partnerId = req.params.id;
        const partners = await db.query("SELECT p.*, s.name as service_name FROM partners p JOIN services s ON p.service_id = s.id WHERE p.id = ?", [partnerId]);
        if (partners.length === 0) {
            return res.status(404).send("Partner not found");
        }
        const partner = partners[0];
        const reviews = await db.query("SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON r.user_id = u.id WHERE r.partner_id = ?", [partnerId]);
        const extraServices = await db.query("SELECT ps.*, s.name as service_name FROM partner_services ps JOIN services s ON ps.service_id = s.id WHERE ps.partner_id = ?", [partnerId]);
        res.render("partner_profile_view", { title: partner.name + " Profile", partner, reviews, extraServices });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching partner details");
    }
});
app.get("/booking", async (req, res) => {
    try {
        const partnerId = req.query.partner_id;
        const serviceId = req.query.service_id;
        
        if (!partnerId || !serviceId) {
            return res.redirect("/partners");
        }

        const partners = await db.query("SELECT p.*, s.name as service_name FROM partners p JOIN services s ON p.service_id = s.id WHERE p.id = ?", [partnerId]);
        if (partners.length === 0) {
            return res.status(404).send("Partner not found");
        }
        
        const partner = partners[0];
        let basePrice = parseFloat(partner.pricing) || 100.00;

        // If the requested service is not the primary one, check partner_services table
        if (partner.service_id != serviceId) {
            const extraService = await db.query("SELECT price, s.name as service_name FROM partner_services ps JOIN services s ON ps.service_id = s.id WHERE ps.partner_id = ? AND ps.service_id = ?", [partnerId, serviceId]);
            if (extraService.length > 0) {
                basePrice = parseFloat(extraService[0].price);
                partner.service_name = extraService[0].service_name; // Update display name
            }
        }
        
        const cost = {
            serviceCost: basePrice,
            handlingFee: 0, // Will be updated by JS or on final confirm
            tax: basePrice * 0.02,
            totalCost: basePrice + (basePrice * 0.02)
        };

        res.render("booking", { title: "Book a Service", partner, cost, serviceId });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading booking page");
    }
});

app.get("/login", (req, res) => {
    res.render("user/login", { title: "Login" });
});

app.get("/signup", (req, res) => {
    res.render("user/signup", { title: "Sign Up" });
});

app.get("/otp", (req, res) => {
    res.render("user/otp", { title: "OTP Verification" });
});

app.get("/profile", (req, res) => {
    res.render("profile", { title: "My Profile" });
});

app.get("/booking-details", (req, res) => {
    res.render("booking_details", { title: "Booking Details" });
});

// Create a route for root - /api/test
app.get("/partner/login", (req, res) => {
    res.render("partner/login", { title: "Partner Login" });
});

app.get("/partner/signup", async (req, res) => {
    try {
        const services = await db.query("SELECT * FROM services");
        res.render("partner/signup", { title: "Become a Partner", services });
    } catch (err) {
        res.render("partner/signup", { title: "Become a Partner", services: [] });
    }
});

app.get("/partner/dashboard", (req, res) => {
    res.render("partner/partner_dashboard", { title: "Partner Dashboard" });
});

app.get("/partner/profile", (req, res) => {
    res.render("partner/partner_profile", { title: "Partner Profile" });
});

app.get("/partner/bookings", (req, res) => {
    res.render("partner/partner_bookings", { title: "Partner Bookings" });
});

app.get("/partner/documents", (req, res) => {
    res.render("partner/upload_documents", { title: "Upload Documents" });
});

app.get("/partner/services", async (req, res) => {
    try {
        const services = await db.query("SELECT * FROM services");
        res.render("partner/manage_services", { title: "Manage Services", services });
    } catch (err) {
        res.render("partner/manage_services", { title: "Manage Services", services: [] });
    }
});

app.get("/admin", (req, res) => {
    res.render("admin/admin_login", { title: "Admin Login" });
});

app.get("/admin/dashboard", (req, res) => {
    res.render("admin/admin_dashboard", { title: "Admin Dashboard" });
});

app.get("/admin/users", (req, res) => {
    res.render("admin/admin_users", { title: "Manage Users" });
});

app.get("/admin/partners", (req, res) => {
    res.render("admin/admin_partners", { title: "Manage Partners" });
});

app.get("/admin/withdrawals", (req, res) => {
    res.render("admin/admin_withdrawals", { title: "Manage Withdrawals" });
});

app.get("/admin/payments", (req, res) => {
    res.render("admin/admin_payments", { title: "Track Payments" });
});

app.get("/admin/categories", (req, res) => {
    res.render("admin/admin_categories", { title: "Manage Categories" });
});

app.get("/admin/disputes", (req, res) => {
    res.render("admin/admin_disputes", { title: "Manage Disputes" });
});

app.get("/admin/analytics", (req, res) => {
    res.render("admin/admin_analytics", { title: "Analytics" });
});

app.get("/admin/services", async (req, res) => {
    try {
        const services = await db.query("SELECT s.*, c.name as category_name FROM services s LEFT JOIN service_categories c ON s.category_id = c.id");
        const categories = await db.query("SELECT * FROM service_categories");
        res.render("admin/admin_services", { title: "Manage Services", services, categories });
    } catch (err) {
        res.render("admin/admin_services", { title: "Manage Services", services: [], categories: [] });
    }
});

app.get("/admin/bookings", (req, res) => {
    res.render("admin/admin_bookings", { title: "Manage Bookings" });
});

// Import the routes from the routes folder
require("./routes/auth.routes.js")(app);
require("./routes/partner.routes.js")(app);
require("./routes/admin.routes.js")(app);
require("./routes/service.routes.js")(app);
require("./routes/booking.routes.js")(app);
require("./routes/profile.routes.js")(app);
require("./routes/payment.routes.js")(app);
require("./routes/review.routes.js")(app);
require("./routes/withdrawal.routes.js")(app);
require("./routes/chat.routes.js")(app);
require("./routes/dispute.routes.js")(app);

// Start server on port 3000
app.listen(3000,function(){
    console.log(`Server running at http://127.0.0.1:3000/`);
});

module.exports = app;
