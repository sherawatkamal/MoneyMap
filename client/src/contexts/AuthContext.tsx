import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email?: string;
  full_name?: string;
  phone?: string;
  age?: number;
  occupation?: string;
  annual_income?: number;
  financial_goal?: string;
  risk_tolerance?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (googleToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken) {
      setToken(savedToken);
      
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      // Always try to fetch fresh user data from backend
      const fetchUserProfile = async () => {
        try {
          const profileResponse = await fetch('http://localhost:5001/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${savedToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            // Token might be expired, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Keep existing user data if fetch fails
        }
        setLoading(false);
      };
      
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:5001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        
        // Fetch user profile data from backend
        try {
          const profileResponse = await fetch('http://localhost:5001/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            // Fallback to basic user object if profile fetch fails
            const userData: User = {
              id: 1,
              username: email,
              email: email,
              full_name: email.split('@')[0],
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
          // Fallback to basic user object
          const userData: User = {
            id: 1,
            username: email,
            email: email,
            full_name: email.split('@')[0],
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        }
        
        return true;
      } else {
        console.error('Login failed:', data.msg);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginWithGoogle = async (googleToken: string): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:5001/google-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: googleToken }),
      });

      const data = await response.json();

      if (response.ok && data.access_token) {
        setToken(data.access_token);
        localStorage.setItem('token', data.access_token);
        
        // Fetch user profile data from backend
        try {
          const profileResponse = await fetch('http://localhost:5001/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${data.access_token}`,
              'Content-Type': 'application/json',
            },
          });

          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (profileError) {
          console.error('Error fetching user profile:', profileError);
        }
        
        return true;
      } else {
        console.error('Google login failed:', data.msg);
        return false;
      }
    } catch (error) {
      console.error('Google login error:', error);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        // Call logout endpoint to blacklist the token
        await fetch('http://localhost:5001/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout API error:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state and storage
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    token,
    login,
    loginWithGoogle,
    logout,
    isAuthenticated,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
