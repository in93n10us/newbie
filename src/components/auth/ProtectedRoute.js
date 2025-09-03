import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

/**
 * Higher-order component that protects routes requiring authentication
 * Redirects to login if user is not authenticated
 * @param {React.Component} WrappedComponent - Component to be protected
 * @param {Object} options - Additional options for route protection
 * @param {string[]} options.requiredRoles - Array of roles required to access the route
 * @returns {React.Component} Protected component
 */
const ProtectedRoute = (WrappedComponent, options = {}) => {
  const ProtectedComponent = (props) => {
    const { isAuthenticated, isLoading, user } = useAuth0();
    const router = useRouter();

    useEffect(() => {
      // Wait for Auth0 to finish loading
      if (!isLoading) {
        // Redirect to login if not authenticated
        if (!isAuthenticated) {
          router.push({
            pathname: '/login',
            query: { returnTo: router.asPath }
          });
          return;
        }

        // Check for required roles if specified
        if (options.requiredRoles && options.requiredRoles.length > 0) {
          const userRoles = user?.['https://velvetkey.app/roles'] || [];
          const hasRequiredRole = options.requiredRoles.some(role => 
            userRoles.includes(role)
          );

          if (!hasRequiredRole) {
            router.push('/unauthorized');
            return;
          }
        }
      }
    }, [isAuthenticated, isLoading, user, router]);

    // Show loading state while Auth0 initializes
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    // Render nothing while redirecting
    if (!isAuthenticated) {
      return null;
    }

    // Render protected component if authenticated and authorized
    return <WrappedComponent {...props} />;
  };

  // Copy static methods and display name
  ProtectedComponent.displayName = `ProtectedRoute(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ProtectedComponent;
};

export default ProtectedRoute;