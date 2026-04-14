// Import express.js
const express = require("express");
const cors = require('cors');

// Create express app
var app = express();

// Set Pug as the view engine
app.set('view engine', 'pug');
app.set('views', 'app/views');

// Image helper functions for Pug templates
const getImageUrl = (imageUrl, type = 'service') => {
  const fallbacks = {
    service: 'https://via.placeholder.com/400x300?text=Service',
    partner: 'https://via.placeholder.com/400x300?text=Professional',
    customer: 'https://via.placeholder.com/150x150?text=Profile',
    category: 'https://via.placeholder.com/200x200?text=Category',
    work: 'https://via.placeholder.com/400x300?text=Portfolio'
  };

  if (!imageUrl || imageUrl.trim() === '') {
    return fallbacks[type] || fallbacks.service;
  }
  if (imageUrl.startsWith('/') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  return '/' + imageUrl;
};

const parseWorkImages = (workImages) => {
  if (!workImages) return [];
  return workImages
    .split(',')
    .map(img => img.trim())
    .filter(img => img.length > 0)
    .map(img => getImageUrl(img, 'work'));
};

// Make helpers available to all Pug templates
app.locals.getImageUrl = getImageUrl;
app.locals.parseWorkImages = parseWorkImages;

// Add cors and body-parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add static files location
app.use(express.static("static"));

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
        let query = "SELECT * FROM partners";
        let params = [];
        if (serviceId) {
            query += " WHERE service_id = ?";
            params.push(serviceId);
        }
        const partners = await db.query(query, params);
        res.render("partners", { title: "Find Professionals", partners });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching partners");
    }
});
app.get("/booking", (req, res) => {
    res.render("booking", { title: "Book a Service" });
});

app.get("/login", (req, res) => {
    res.render("login", { title: "Login" });
});

app.get("/signup", (req, res) => {
    res.render("signup", { title: "Sign Up" });
});

app.get("/otp", (req, res) => {
    res.render("otp", { title: "OTP Verification" });
});

app.get("/profile", (req, res) => {
    res.render("profile", { title: "My Profile" });
});

// Create a route for root - /api/test
app.get("/partner/login", (req, res) => {
    res.render("partner_login", { title: "Partner Login" });
});

app.get("/partner/signup", async (req, res) => {
    try {
        const services = await db.query("SELECT * FROM services");
        res.render("partner_signup", { title: "Become a Partner", services });
    } catch (err) {
        res.render("partner_signup", { title: "Become a Partner", services: [] });
    }
});

app.get("/partner/dashboard", (req, res) => {
    res.render("partner_dashboard", { title: "Partner Dashboard" });
});

app.get("/partner/profile", (req, res) => {
    res.render("partner_profile", { title: "Partner Profile" });
});

app.get("/partner/bookings", (req, res) => {
    res.render("partner_bookings", { title: "Partner Bookings" });
});

app.get("/admin", (req, res) => {
    res.render("admin_login", { title: "Admin Login" });
});

app.get("/admin/dashboard", (req, res) => {
    res.render("admin_dashboard", { title: "Admin Dashboard" });
});

app.get("/admin/users", (req, res) => {
    res.render("admin_users", { title: "Manage Users" });
});

app.get("/admin/partners", (req, res) => {
    res.render("admin_partners", { title: "Manage Partners" });
});

app.get("/admin/services", async (req, res) => {
    try {
        const services = await db.query("SELECT * FROM services");
        res.render("admin_services", { title: "Manage Services", services });
    } catch (err) {
        res.render("admin_services", { title: "Manage Services", services: [] });
    }
});

app.get("/admin/bookings", (req, res) => {
    res.render("admin_bookings", { title: "Manage Bookings" });
});

// Import the routes from the routes folder
require("./routes/auth.routes.js")(app);
require("./routes/partner.routes.js")(app);
require("./routes/admin.routes.js")(app);
require("./routes/service.routes.js")(app);
require("./routes/booking.routes.js")(app);
require("./routes/profile.routes.js")(app);
require("./routes/notification.routes.js")(app);

// 404 Not Found middleware - Must come AFTER all routes
app.use((req, res) => {
    res.status(404).render('404', { 
        title: '404 Not Found',
        requestedUrl: req.originalUrl 
    });
});

// Global Error Handler middleware - Must come LAST
app.use((err, req, res, next) => {
    console.error('Error:', err);
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).render('500', { 
        title: 'Server Error',
        message: message,
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// Start server on port from environment or default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, function(){
    console.log(`Server running at http://127.0.0.1:${PORT}/`);
});

module.exports = app;
