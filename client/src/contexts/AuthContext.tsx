import { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'wouter';

interface AuthContextType {
  isAuthenticated: boolean;
  user: any | null;
  login: (token: string, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      // Check adminAuth first since it contains more data
      const adminAuth = localStorage.getItem('adminAuth');
      if (adminAuth) {
        const authData = JSON.parse(adminAuth);
        
        // Check if token exists and is not expired
        const token = authData.token;
        if (token) {
          // Check if login time is within the last 24 hours
          const loginTime = new Date(authData.loginTime);
          const now = new Date();
          const hoursSinceLogin = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLogin < 24) {
            // Token is still valid within 24 hours
            setIsAuthenticated(true);
            setUser(authData.user);
          } else {
            // Token expired, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('adminAuth');
            setIsAuthenticated(false);
            setUser(null);
          }
        }
      } else {
        // Check old token format
        const token = localStorage.getItem('token');
        if (token) {
          setIsAuthenticated(true);
          setUser({ 
            id: '1',
            email: 'admin@example.com',
            role: 'admin',
            name: 'Admin User'
          });
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (token: string, userData: any) => {
    // Store both token keys
    localStorage.setItem('token', token);
    localStorage.setItem('adminAuth', JSON.stringify({
      token,
      user: userData,
      role: userData?.role,
      loginTime: new Date().toISOString()
    }));
    setIsAuthenticated(true);
    setUser(userData);
    // Wait a bit to ensure the state updates before redirecting
    await new Promise(resolve => setTimeout(resolve, 100));
    setLocation('/admin/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setLocation('/');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
