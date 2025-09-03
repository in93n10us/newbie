import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import LoginButton from '../../../components/auth/LoginButton';

// Mock Auth0 hook
jest.mock('@auth0/auth0-react');

describe('LoginButton Component', () => {
  const mockLoginWithRedirect = jest.fn();
  
  beforeEach(() => {
    // Reset mocks before each test
    useAuth0.mockReset();
    mockLoginWithRedirect.mockReset();
    
    // Default mock implementation
    useAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('renders login button with default text', () => {
    render(<LoginButton />);
    expect(screen.getByRole('button')).toHaveTextContent('Log In');
  });

  it('renders login button with custom text', () => {
    render(<LoginButton buttonText="Custom Login" />);
    expect(screen.getByRole('button')).toHaveTextContent('Custom Login');
  });

  it('applies custom className when provided', () => {
    render(<LoginButton className="custom-class" />);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('triggers login flow when clicked', async () => {
    render(<LoginButton />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1);
  });

  it('disables button during loading state', () => {
    useAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: false,
      isLoading: true
    });

    render(<LoginButton />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('calls onLoginSuccess callback after successful login', async () => {
    const onLoginSuccess = jest.fn();
    
    useAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: true,
      isLoading: false
    });

    render(<LoginButton onLoginSuccess={onLoginSuccess} />);
    
    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onLoginError callback when login fails', async () => {
    const onLoginError = jest.fn();
    const mockError = new Error('Login failed');
    
    mockLoginWithRedirect.mockRejectedValue(mockError);

    render(<LoginButton onLoginError={onLoginError} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onLoginError).toHaveBeenCalledWith(mockError);
    });
  });

  it('hides button when user is already authenticated', () => {
    useAuth0.mockReturnValue({
      loginWithRedirect: mockLoginWithRedirect,
      isAuthenticated: true,
      isLoading: false
    });

    render(<LoginButton />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles login with custom options', async () => {
    const customOptions = {
      redirectUri: 'http://custom-redirect.com',
      screen_hint: 'signup'
    };

    render(<LoginButton loginOptions={customOptions} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockLoginWithRedirect).toHaveBeenCalledWith(customOptions);
  });

  it('renders with correct accessibility attributes', () => {
    render(<LoginButton />);
    const button = screen.getByRole('button');
    
    expect(button).toHaveAttribute('aria-label', 'Log In');
    expect(button).toHaveAttribute('type', 'button');
  });
});