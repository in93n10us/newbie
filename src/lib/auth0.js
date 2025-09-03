import { initAuth0 } from '@auth0/nextjs-auth0';
import { getSession } from '@auth0/nextjs-auth0';

/**
 * Auth0 configuration object with environment variables
 */
export const auth0Config = {
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.AUTH0_BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  routes: {
    callback: '/api/auth/callback',
    login: '/api/auth/login',
    logout: '/api/auth/logout'
  },
  session: {
    absoluteDuration: 24 * 60 * 60, // 24 hours
    rolling: true,
    rollingDuration: 2 * 60 * 60 // 2 hours
  }
};

/**
 * Initialize Auth0 instance with configuration
 */
export const auth0 = initAuth0(auth0Config);

/**
 * Get the current authenticated user session
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Promise<Object|null>} Session object or null if not authenticated
 */
export const getAuthSession = async (req, res) => {
  try {
    const session = await getSession(req, res);
    return session;
  } catch (error) {
    console.error('Error getting auth session:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export const isAuthenticated = async (req, res) => {
  const session = await getAuthSession(req, res);
  return !!session;
};

/**
 * Get user profile from session
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @returns {Promise<Object|null>} User profile object or null
 */
export const getUserProfile = async (req, res) => {
  try {
    const session = await getAuthSession(req, res);
    if (!session) return null;
    
    return {
      id: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      picture: session.user.picture,
      emailVerified: session.user.email_verified
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

/**
 * Handle Auth0 errors
 * @param {Error} error - Auth0 error object
 * @returns {Object} Error details
 */
export const handleAuth0Error = (error) => {
  console.error('Auth0 Error:', error);
  
  return {
    error: true,
    message: error.message || 'Authentication error occurred',
    code: error.code || 'unknown_error',
    status: error.status || 500
  };
};

/**
 * Get required authentication scopes for different app features
 */
export const AUTH_SCOPES = {
  EVENT_CREATE: 'create:events',
  EVENT_MANAGE: 'manage:events',
  PROFILE_READ: 'read:profile',
  PROFILE_UPDATE: 'update:profile'
};

/**
 * Check if user has required scopes
 * @param {Object} session - User session object
 * @param {Array<string>} requiredScopes - Array of required scope strings
 * @returns {boolean} True if user has all required scopes
 */
export const hasRequiredScopes = (session, requiredScopes) => {
  if (!session || !session.user) return false;
  
  const userScopes = session.user.scope?.split(' ') || [];
  return requiredScopes.every(scope => userScopes.includes(scope));
};

export default auth0;