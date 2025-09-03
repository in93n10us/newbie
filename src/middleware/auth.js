const jwt = require('jsonwebtoken');
const { getSession } = require('@auth0/nextjs-auth0');

/**
 * Middleware for validating JWT tokens and protecting API routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Get Auth0 session
    const session = await getSession(req, res);
    
    if (!session) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No valid session found'
      });
    }

    // Validate access token
    const token = session.accessToken;
    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'No access token found'
      });
    }

    try {
      // Verify token with Auth0 public key
      const decoded = jwt.verify(token, process.env.AUTH0_SECRET);
      
      // Add user info to request
      req.user = {
        sub: decoded.sub,
        email: decoded.email,
        permissions: decoded.permissions || []
      };

      // Check token expiration
      const now = Date.now().valueOf() / 1000;
      if (typeof decoded.exp !== 'undefined' && decoded.exp < now) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired'
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token'
      });
    }

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred while authenticating the request'
    });
  }
};

/**
 * Middleware for checking specific permissions
 * @param {string[]} requiredPermissions - Array of required permissions
 * @returns {Function} Middleware function
 */
const checkPermissions = (requiredPermissions) => {
  return (req, res, next) => {
    try {
      const userPermissions = req.user?.permissions || [];
      
      const hasAllPermissions = requiredPermissions.every(
        permission => userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Error checking permissions'
      });
    }
  };
};

module.exports = {
  authMiddleware,
  checkPermissions
};