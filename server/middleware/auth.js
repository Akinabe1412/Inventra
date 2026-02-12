const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  // Get token from header
  const token = req.header('Authorization')?.replace('Bearer ', '');

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'No token, authorization denied' 
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ 
      success: false,
      error: 'Token is not valid' 
    });
  }
};

// Optional: role-based authorization
module.exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false, 
        error: 'Access denied: insufficient permissions'
      });
    }
    next();
  };
};
