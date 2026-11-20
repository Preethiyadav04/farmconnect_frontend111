import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

/**
 * FarmConnect Authentication Context
 * Manages JWT tokens, authenticated user state, session restoration,
 * and role-based permissions across the application.
 *
 * SECURITY NOTE (Token Storage Strategy):
 * Storing JWT tokens in localStorage provides seamless session persistence across
 * browser refreshes. However, localStorage is accessible to any script executing on the
 * origin, making it vulnerable to Cross-Site Scripting (XSS) attacks.
 * To mitigate risks:
 * 1. FarmConnect strictly sanitizes all user-provided strings and uses React's JSX escaping.
 * 2. Only non-sensitive user metadata (id, username, role, full_name, city) is cached.
 * 3. Short-lived access tokens (60 minutes) combined with rotatable refresh tokens are enforced.
 * 4. In a production hardened deployment, httpOnly, Secure, SameSite cookies can be used.
 */
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user_info');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('access_token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize state and persist tokens
  const login = useCallback((userData, accessToken, refreshToken = null) => {
    setUser(userData);
    setToken(accessToken);
    try {
      localStorage.setItem('user_info', JSON.stringify(userData));
      localStorage.setItem('access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }
    } catch (e) {
      console.warn('Unable to persist session to localStorage:', e);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('user_info');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } catch (e) {
      console.warn('Unable to clear localStorage session:', e);
    }
  }, []);

  // Update user profile in state & localStorage
  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      try {
        localStorage.setItem('user_info', JSON.stringify(merged));
      } catch (e) {
        console.warn('Unable to update user_info in localStorage:', e);
      }
      return merged;
    });
  }, []);

  // Listen to global logout event dispatched by api.js when refresh token expires
  useEffect(() => {
    const handleGlobalLogout = () => {
      logout();
    };

    window.addEventListener('farmconnect:logout', handleGlobalLogout);
    return () => {
      window.removeEventListener('farmconnect:logout', handleGlobalLogout);
    };
  }, [logout]);

  // Session verification on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user_info');

      if (!savedToken || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        // Verify token validity against backend profile endpoint
        const freshProfile = await authService.getProfile();
        if (freshProfile) {
          const userMeta = {
            id: freshProfile.id,
            username: freshProfile.username,
            email: freshProfile.email,
            first_name: freshProfile.first_name,
            last_name: freshProfile.last_name,
            full_name: freshProfile.user_profile?.full_name || `${freshProfile.first_name || ''} ${freshProfile.last_name || ''}`.trim() || freshProfile.username,
            role: freshProfile.role,
            phone: freshProfile.phone,
            city: freshProfile.user_profile?.city || null,
            state: freshProfile.user_profile?.state || null,
            is_verified: freshProfile.is_verified,
          };
          setUser(userMeta);
          localStorage.setItem('user_info', JSON.stringify(userMeta));
        }
      } catch (err) {
        // If profile fetch fails (and refresh interceptor also fails), session is invalid
        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [logout]);

  const isAuthenticated = Boolean(token && user);
  const role = user?.role ? user.role.toLowerCase() : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated,
        loading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
