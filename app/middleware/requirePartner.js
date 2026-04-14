// Middleware to require partner role
module.exports = (req, res, next) => {
  if (!req.role || req.role !== 'partner') {
    return res.status(403).send({
      message: "Access denied. Only partners can access this resource."
    });
  }
  next();
};
