import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hydrate auth status from sessionStorage on initial render
  useEffect(() => {
    try {
      const storedToken = sessionStorage.getItem('token');
      const storedUser = authService.getCurrentUser();
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
    } catch (err) {
      console.error('Failed to parse active user session:', err);
      // Clean up corrupt session
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const data = await authService.login(username, password);
      if (data.access_token) {
        setToken(data.access_token);
        const me = await authService.getMe();
        const preferredLanguage = me.preferred_language || 'English';
        const role = me.role || 'employee';
        const userData = { username, preferredLanguage, role };
        setUser(userData);
        sessionStorage.setItem('user', JSON.stringify(userData));
      }
      return data;
    } catch (err) {
      console.error('Login action failure:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUserLanguage = async (language) => {
    try {
      await authService.updateLanguage(language);
      const newUserData = { ...user, preferredLanguage: language };
      setUser(newUserData);
      sessionStorage.setItem('user', JSON.stringify(newUserData));
    } catch (err) {
      console.error('Failed to update language', err);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    try {
      const data = await authService.register(email, password);
      return data;
    } catch (err) {
      console.error('Registration action failure:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUserLanguage,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
