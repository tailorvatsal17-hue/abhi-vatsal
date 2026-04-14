// Middleware to require customer role
module.exports = (req, res, next) => {
  if (!req.role || req.role !== 'customer') {
    return res.status(403).send({
      message: "Access denied. Only customers can access this resource."
    });
  }
  next();
};
