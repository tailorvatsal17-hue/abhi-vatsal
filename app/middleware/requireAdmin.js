// Middleware to require admin role
module.exports = (req, res, next) => {
  if (!req.role || req.role !== 'admin') {
    return res.status(403).send({
      message: "Access denied. Only admins can access this resource."
    });
  }
  next();
};
