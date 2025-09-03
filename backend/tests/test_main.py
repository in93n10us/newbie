import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app'; // Adjust import path as needed

describe('FastAPI Server Tests', () => {
  let server;

  beforeAll(async () => {
    server = app.listen(8000);
  });

  afterAll(async () => {
    await server.close();
  });

  describe('Server Setup', () => {
    test('server is running and accepting connections', async () => {
      const response = await request(server).get('/');
      expect(response.status).toBe(200);
    });

    test('server returns correct CORS headers', async () => {
      const response = await request(server)
        .get('/')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toBe('GET,POST,PUT,DELETE,OPTIONS');
    });
  });

  describe('Health Check Endpoint', () => {
    test('health check returns 200', async () => {
      const response = await request(server).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'healthy' });
    });
  });

  describe('Error Handling', () => {
    test('returns 404 for non-existent routes', async () => {
      const response = await request(server).get('/not-found');
      expect(response.status).toBe(404);
    });

    test('returns 405 for invalid methods', async () => {
      const response = await request(server).delete('/');
      expect(response.status).toBe(405);
    });

    test('handles internal server errors gracefully', async () => {
      // Simulate error by passing invalid data
      const response = await request(server)
        .post('/api/data')
        .send({ invalid: 'data' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('API Rate Limiting', () => {
    test('enforces rate limits', async () => {
      // Make multiple rapid requests
      const requests = Array(10).fill().map(() => 
        request(server).get('/')
      );
      
      const responses = await Promise.all(requests);
      const tooManyRequests = responses.some(r => r.status === 429);
      
      expect(tooManyRequests).toBe(true);
    });
  });

  describe('Security Headers', () => {
    test('includes security headers', async () => {
      const response = await request(server).get('/');
      
      expect(response.headers).toMatchObject({
        'x-content-type-options': 'nosniff',
        'x-frame-options': 'DENY',
        'x-xss-protection': '1; mode=block'
      });
    });
  });

  describe('Environment Configuration', () => {
    test('loads environment variables correctly', () => {
      expect(process.env.NODE_ENV).toBeDefined();
      expect(process.env.PORT).toBeDefined();
    });

    test('uses fallback values when env vars missing', () => {
      delete process.env.PORT;
      expect(app.get('port')).toBe(8000); // Default port
    });
  });

  describe('Request Validation', () => {
    test('validates request bodies', async () => {
      const response = await request(server)
        .post('/api/data')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('errors');
    });

    test('sanitizes request parameters', async () => {
      const response = await request(server)
        .get('/api/data')
        .query({ id: '<script>alert(1)</script>' });
      
      expect(response.status).toBe(400);
    });
  });
});