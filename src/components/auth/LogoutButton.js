import { useAuth0 } from '@auth0/auth0-react';
import React from 'react';

/**
 * LogoutButton Component
 * 
 * A reusable button component that handles user logout through Auth0.
 * Triggers the Auth0 logout flow and redirects to home page after logout.
 * 
 * @component
 * @example
 * return (
 *   <LogoutButton className="custom-class" />
 * )
 */
const LogoutButton = ({ className = '' }) => {
  const { logout, isAuthenticated, isLoading } = useAuth0();

  /**
   * Handles the logout action
   * Redirects to home page after successful logout
   */
  const handleLogout = () => {
    try {
      logout({
        returnTo: window.location.origin,
        clientId: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Could integrate with error reporting service here
    }
  };

  // Don't render button if user is not authenticated or auth is still loading
  if (!isAuthenticated || isLoading) {
    return null;
  }

  return (
    <button
      onClick={handleLogout}
      className={`px-4 py-2 text-sm font-medium text-white bg-red-600 
        hover:bg-red-700 rounded-md transition-colors duration-200 
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        ${className}`}
      aria-label="Logout"
      type="button"
    >
      Logout
    </button>
  );
};

export default LogoutButton;