import { ComponentType, ReactNode, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation } from 'wouter';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles = ['admin'] }: ProtectedRouteProps) {
  // Check localStorage directly first
  const checkSession = () => {
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth) {
      const authData = JSON.parse(adminAuth);
      const token = authData.token;
      const loginTime = new Date(authData.loginTime);
      const now = new Date();
      const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
      
      // Check if token exists and is not expired
      return token && hoursSinceLogin < 24;
    }
    return false;
  };

  const hasValidSession = checkSession();
  const { isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();

  // Check if we should redirect based on current location and auth state
  useEffect(() => {
    // Check if we need to redirect
    const handleRedirect = () => {
      if (!hasValidSession) {
        if (location !== '/admin/login') {
          setLocation('/admin/login');
        }
      } else if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        if (location !== '/') {
          setLocation('/');
        }
      }
    };

    handleRedirect();
  }, [hasValidSession, user, setLocation, location, allowedRoles]);

  // If we're authenticated and have the required role, render the children
  if (isAuthenticated && user && (allowedRoles.length === 0 || allowedRoles.includes(user.role))) {
    return <>{children}</>;
  }

  // Otherwise, don't render anything (the useEffect will handle the redirect)
  return null;
}

// Helper function to wrap components with ProtectedRoute
export function withProtectedRoute(Component: ComponentType<any>, allowedRoles: string[] = ['admin']) {
  return (props: any) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Component {...props} />
    </ProtectedRoute>
  );
}
