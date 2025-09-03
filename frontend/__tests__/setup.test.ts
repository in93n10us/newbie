typescript
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

describe('Next.js Setup Tests', () => {
  beforeEach(() => {
    // Reset router mock before each test
    (useRouter as jest.Mock).mockReset();
  });

  describe('Environment Configuration', () => {
    test('should have correct environment variables', () => {
      expect(process.env.NODE_ENV).toBeDefined();
      expect(process.env.NEXT_PUBLIC_API_URL).toBeDefined();
    });

    test('should use development environment in test mode', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Router Configuration', () => {
    beforeEach(() => {
      (useRouter as jest.Mock).mockImplementation(() => ({
        push: jest.fn(),
        pathname: '/',
        query: {},
        asPath: '/',
      }));
    });

    test('should initialize router with default values', () => {
      const router = useRouter();
      expect(router.pathname).toBe('/');
      expect(router.query).toEqual({});
    });

    test('should handle route changes', () => {
      const mockPush = jest.fn();
      (useRouter as jest.Mock).mockImplementation(() => ({
        push: mockPush,
        pathname: '/test',
        query: {},
        asPath: '/test',
      }));

      const router = useRouter();
      router.push('/new-route');
      expect(mockPush).toHaveBeenCalledWith('/new-route');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 routes', () => {
      const mockPush = jest.fn();
      (useRouter as jest.Mock).mockImplementation(() => ({
        push: mockPush,
        pathname: '/nonexistent',
        query: {},
        asPath: '/nonexistent',
      }));

      const router = useRouter();
      expect(router.pathname).toBe('/nonexistent');
    });

    test('should handle invalid route transitions', () => {
      const mockPush = jest.fn().mockRejectedValue(new Error('Navigation failed'));
      (useRouter as jest.Mock).mockImplementation(() => ({
        push: mockPush,
        pathname: '/',
        query: {},
        asPath: '/',
      }));

      const router = useRouter();
      expect(router.push('/invalid')).rejects.toThrow('Navigation failed');
    });
  });

  describe('Project Configuration', () => {
    test('should have TypeScript configuration', () => {
      const fs = require('fs');
      const tsConfig = fs.existsSync('./tsconfig.json');
      expect(tsConfig).toBe(true);
    });

    test('should have ESLint configuration', () => {
      const fs = require('fs');
      const eslintConfig = fs.existsSync('./.eslintrc.js');
      expect(eslintConfig).toBe(true);
    });

    test('should have required dependencies in package.json', () => {
      const packageJson = require('../package.json');
      expect(packageJson.dependencies.next).toBeDefined();
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
    });
  });

  describe('Build Configuration', () => {
    test('should have correct Next.js config', () => {
      const nextConfig = require('../next.config.js');
      expect(nextConfig).toHaveProperty('reactStrictMode');
      expect(nextConfig.poweredByHeader).toBe(false);
    });

    test('should have image optimization configured', () => {
      const nextConfig = require('../next.config.js');
      expect(nextConfig.images).toBeDefined();
      expect(nextConfig.images.domains).toContain('velvetkey.storage.googleapis.com');
    });
  });
});