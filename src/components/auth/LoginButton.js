import { useAuth0 } from '@auth0/auth0-react';
import { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * A reusable login button component that handles Auth0 authentication
 * @param {Object} props - Component props
 * @param {string} props.buttonText - Custom text to display on the button
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onLoginSuccess - Callback function called after successful login
 * @param {Function} props.onLoginError - Callback function called if login fails
 */
const LoginButton = ({
  buttonText = 'Log In',
  className = '',
  onLoginSuccess,
  onLoginError
}) => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handles the login process
   */
  const handleLogin = async () => {
    try {
      setIsProcessing(true);
      await loginWithRedirect({
        appState: { returnTo: window.location.pathname }
      });
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      console.error('Login failed:', error);
      if (onLoginError) {
        onLoginError(error);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render button if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={handleLogin}
      disabled={isLoading || isProcessing}
      className={`login-button ${className} ${
        (isLoading || isProcessing) ? 'loading' : ''
      }`}
      aria-busy={isLoading || isProcessing}
    >
      {isLoading || isProcessing ? 'Please wait...' : buttonText}
    </button>
  );
};

LoginButton.propTypes = {
  buttonText: PropTypes.string,
  className: PropTypes.string,
  onLoginSuccess: PropTypes.func,
  onLoginError: PropTypes.func
};

export default LoginButton;

// Default styles
const styles = `
  .login-button {
    padding: 8px 16px;
    border-radius: 4px;
    border: none;
    background-color: #000;
    color: #fff;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s ease;
  }

  .login-button:hover:not(:disabled) {
    background-color: #333;
  }

  .login-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .login-button.loading {
    position: relative;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}