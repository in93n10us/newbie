import { render, screen, waitFor } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

// Mock dependencies
jest.mock('@auth0/auth0-react');
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

describe('ProtectedRoute Component', () => {
  const mockPush = jest.fn();
  const MockComponent = () => <div>Protected Content</div>;
  
  beforeEach(() => {
    // Reset all mocks before each test
    useAuth0.mockReset();
    useRouter.mockReset();
    mockPush.mockReset();

    // Default router mock implementation
    useRouter.mockImplementation(() => ({
      push: mockPush
    }));
  });

  it('should render wrapped component when authenticated', () => {
    useAuth0.mockImplementation(() => ({
      isAuthenticated: true,
      isLoading: false,
      user: { roles: ['user'] }
    }));

    render(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('should redirect to login when not authenticated', async () => {
    useAuth0.mockImplementation(() => ({
      isAuthenticated: false, 
      isLoading: false
    }));

    render(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/api/auth/login');
    });
  });

  it('should show loading state while authenticating', () => {
    useAuth0.mockImplementation(() => ({
      isLoading: true
    }));

    render(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should redirect if user lacks required role', async () => {
    useAuth0.mockImplementation(() => ({
      isAuthenticated: true,
      isLoading: false,
      user: { roles: ['basic'] }
    }));

    render(
      <ProtectedRoute requiredRoles={['admin']}>
        <MockComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('should render component if user has required role', () => {
    useAuth0.mockImplementation(() => ({
      isAuthenticated: true,
      isLoading: false,
      user: { roles: ['admin'] }
    }));

    render(
      <ProtectedRoute requiredRoles={['admin']}>
        <MockComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should handle missing user roles gracefully', async () => {
    useAuth0.mockImplementation(() => ({
      isAuthenticated: true,
      isLoading: false,
      user: {} // No roles defined
    }));

    render(
      <ProtectedRoute requiredRoles={['admin']}>
        <MockComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/unauthorized');
    });
  });

  it('should handle auth0 errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    useAuth0.mockImplementation(() => {
      throw new Error('Auth0 Error');
    });

    render(
      <ProtectedRoute>
        <MockComponent />
      </ProtectedRoute>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});