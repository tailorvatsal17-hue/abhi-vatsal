/**
 * View Routes
 * 
 * These routes render Pug templates for the web application.
 * - User-facing pages (home, services, partners, booking)
 * - Authentication pages (login, signup, OTP)
 * - Partner pages (dashboard, profile, bookings)
 * - Admin pages (dashboard, management)
 * 
 * All business logic is in controllers or services, not here.
 */

const db = require('../services/db');

module.exports = (app) => {
  /**
   * ============================================================
   * PUBLIC PAGES
   * ============================================================
   */

  // Homepage - Display service categories
  app.get('/', async (req, res, next) => {
    try {
      const categories = await db.query('SELECT * FROM service_categories');
      res.render('index', { categories });
    } catch (err) {
      next(err); // Pass to error handler
    }
  });

  // Category Services - Show services in a category
  app.get('/category/:id', async (req, res, next) => {
    try {
      const categoryId = req.params.id;
      const [category] = await db.query(
        'SELECT * FROM service_categories WHERE id = ?',
        [categoryId]
      );
      const services = await db.query(
        'SELECT * FROM services WHERE category_id = ?',
        [categoryId]
      );
      res.render('category_services', {
        title: category ? category.name : 'Services',
        category: category || {},
        services
      });
    } catch (err) {
      next(err); // Pass to error handler
    }
  });

  // All Services - Display all services across categories
  app.get('/services', async (req, res, next) => {
    try {
      const services = await db.query(
        'SELECT s.*, c.name as category_name FROM services s JOIN service_categories c ON s.category_id = c.id'
      );
      res.render('services', { title: 'All Services', services });
    } catch (err) {
      next(err); // Pass to error handler
    }
  });

  // Partners List - Show partners with optional filtering
  app.get('/partners', async (req, res, next) => {
    try {
      const serviceId = req.query.service_id;
      let query = 'SELECT * FROM partners';
      let params = [];

      if (serviceId) {
        query += ' WHERE service_id = ?';
        params.push(serviceId);
      }

      const partners = await db.query(query, params);
      res.render('partners', { title: 'Find Professionals', partners });
    } catch (err) {
      next(err); // Pass to error handler
    }
  });

  // Booking Page - Display booking form
  app.get('/booking', (req, res) => {
    res.render('booking', { title: 'Book a Service' });
  });

  /**
   * ============================================================
   * USER AUTHENTICATION PAGES
   * ============================================================
   */

  // User Login
  app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
  });

  // User Signup
  app.get('/signup', (req, res) => {
    res.render('signup', { title: 'Sign Up' });
  });

  // OTP Verification
  app.get('/otp', (req, res) => {
    res.render('otp', { title: 'OTP Verification' });
  });

  // User Profile
  app.get('/profile', (req, res) => {
    res.render('profile', { title: 'My Profile' });
  });

  /**
   * ============================================================
   * PARTNER PAGES
   * ============================================================
   */

  // Partner Login
  app.get('/partner/login', (req, res) => {
    res.render('partner_login', { title: 'Partner Login' });
  });

  // Partner Signup
  app.get('/partner/signup', async (req, res, next) => {
    try {
      const services = await db.query('SELECT * FROM services');
      res.render('partner_signup', { title: 'Become a Partner', services });
    } catch (err) {
      // Fallback on error
      res.render('partner_signup', { title: 'Become a Partner', services: [] });
    }
  });

  // Partner Dashboard
  app.get('/partner/dashboard', (req, res) => {
    res.render('partner_dashboard', { title: 'Partner Dashboard' });
  });

  // Partner Profile
  app.get('/partner/profile', (req, res) => {
    res.render('partner_profile', { title: 'Partner Profile' });
  });

  // Partner Bookings
  app.get('/partner/bookings', (req, res) => {
    res.render('partner_bookings', { title: 'Partner Bookings' });
  });

  /**
   * ============================================================
   * ADMIN PAGES
   * ============================================================
   */

  // Admin Login
  app.get('/admin', (req, res) => {
    res.render('admin_login', { title: 'Admin Login' });
  });

  // Admin Dashboard
  app.get('/admin/dashboard', (req, res) => {
    res.render('admin_dashboard', { title: 'Admin Dashboard' });
  });

  // Manage Users
  app.get('/admin/users', (req, res) => {
    res.render('admin_users', { title: 'Manage Users' });
  });

  // Manage Partners
  app.get('/admin/partners', (req, res) => {
    res.render('admin_partners', { title: 'Manage Partners' });
  });

  // Manage Services
  app.get('/admin/services', async (req, res, next) => {
    try {
      const services = await db.query('SELECT * FROM services');
      res.render('admin_services', { title: 'Manage Services', services });
    } catch (err) {
      // Fallback on error
      res.render('admin_services', { title: 'Manage Services', services: [] });
    }
  });

  // Manage Bookings
  app.get('/admin/bookings', (req, res) => {
    res.render('admin_bookings', { title: 'Manage Bookings' });
  });
};
