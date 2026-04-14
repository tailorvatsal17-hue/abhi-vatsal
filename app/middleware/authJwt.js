const jwt = require("jsonwebtoken");

// Verify JWT token and extract user information
const verifyToken = (req, res, next) => {
  const token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!"
    });
  }

  // Remove 'Bearer ' prefix if present
  const tokenValue = token.startsWith("Bearer ") ? token.slice(7) : token;

  jwt.verify(tokenValue, process.env.JWT_SECRET || 'MyProject2026SecureKey', (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized! Token expired or invalid."
      });
    }
    
    // Attach user info to request
    req.userId = decoded.userId || decoded.id;
    req.role = decoded.role;
    req.userType = decoded.type;
    
    // For partners: set partnerId to the same value (partner ID = user ID in JWT)
    if (decoded.role === 'partner') {
      req.partnerId = decoded.userId || decoded.id;
    }
    
    next();
  });
};

const authJwt = {
  verifyToken: verifyToken
};

module.exports = authJwt;
