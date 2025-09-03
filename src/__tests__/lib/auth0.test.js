import { initAuth0, getSession } from '@auth0/nextjs-auth0';
import { auth0Config } from '../../../lib/auth0';

// Mock Auth0 modules
jest.mock('@auth0/nextjs-auth0', () => ({
  initAuth0: jest.fn(),
  getSession: jest.fn()
}));

describe('Auth0 Utility Functions', () => {
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset env vars
    process.env.AUTH0_SECRET = 'test-secret';
    process.env.AUTH0_BASE_URL = 'http://localhost:3000';
    process.env.AUTH0_ISSUER_BASE_URL = 'https://test.auth0.com';
    process.env.AUTH0_CLIENT_ID = 'test-client-id';
    process.env.AUTH0_CLIENT_SECRET = 'test-client-secret';
  });

  afterEach(() => {
    // Clean up env vars
    delete process.env.AUTH0_SECRET;
    delete process.env.AUTH0_BASE_URL;
    delete process.env.AUTH0_ISSUER_BASE_URL;
    delete process.env.AUTH0_CLIENT_ID;
    delete process.env.AUTH0_CLIENT_SECRET;
  });

  describe('auth0Config', () => {
    it('should have correct configuration from environment variables', () => {
      expect(auth0Config).toEqual({
        secret: 'test-secret',
        baseURL: 'http://localhost:3000',
        issuerBaseURL: 'https://test.auth0.com',
        clientID: 'test-client-id',
        clientSecret: 'test-client-secret',
        routes: {
          callback: '/api/auth/callback',
          login: '/api/auth/login',
          logout: '/api/auth/logout'
        }
      });
    });

    it('should handle missing environment variables', () => {
      delete process.env.AUTH0_SECRET;
      delete process.env.AUTH0_BASE_URL;
      
      expect(auth0Config.secret).toBeUndefined();
      expect(auth0Config.baseURL).toBeUndefined();
      expect(auth0Config.issuerBaseURL).toBeDefined();
    });
  });

  describe('initAuth0', () => {
    it('should initialize Auth0 with correct config', () => {
      initAuth0(auth0Config);
      
      expect(initAuth0).toHaveBeenCalledWith({
        secret: 'test-secret',
        baseURL: 'http://localhost:3000',
        issuerBaseURL: 'https://test.auth0.com',
        clientID: 'test-client-id',
        clientSecret: 'test-client-secret',
        routes: {
          callback: '/api/auth/callback',
          login: '/api/auth/login', 
          logout: '/api/auth/logout'
        }
      });
    });

    it('should throw error if required config is missing', () => {
      const invalidConfig = { ...auth0Config };
      delete invalidConfig.secret;
      
      expect(() => {
        initAuth0(invalidConfig);
      }).toThrow();
    });
  });

  describe('getSession', () => {
    const mockReq = {};
    const mockRes = {};

    it('should return session when user is authenticated', async () => {
      const mockSession = {
        user: { sub: 'test-user-id' },
        idToken: 'test-token'
      };
      
      getSession.mockResolvedValueOnce(mockSession);

      const session = await getSession(mockReq, mockRes);
      
      expect(session).toEqual(mockSession);
      expect(getSession).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it('should return null when user is not authenticated', async () => {
      getSession.mockResolvedValueOnce(null);

      const session = await getSession(mockReq, mockRes);
      
      expect(session).toBeNull();
    });

    it('should handle errors during session retrieval', async () => {
      getSession.mockRejectedValueOnce(new Error('Session error'));

      await expect(getSession(mockReq, mockRes))
        .rejects
        .toThrow('Session error');
    });
  });
});