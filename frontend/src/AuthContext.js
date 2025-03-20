import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { urn, accessToken, name, designation }

  const loginWithLinkedIn = () => {
    console.log('Initiating LinkedIn login');
    window.location.href = 'http://localhost:5000/api/linkedin-login';
  };

  const setAuthenticatedUser = async (userUrn, accessToken) => {
    console.log('Setting authenticated user with user_urn:', userUrn);
    try {
      const response = await axios.get('http://localhost:5000/api/me', {
        params: { user_urn: userUrn },
      });
      console.log('Profile response from /api/me:', response.data);
      const { name, designation } = response.data;
      if (!name) {
        console.warn('No name in response, using fallback');
      }
      setUser({ urn: userUrn, accessToken, name: name || 'Unknown User', designation: designation || 'No Designation' });
    } catch (error) {
      console.error('Error fetching profile:', error.response?.data || error.message);
      setUser({ urn: userUrn, accessToken, name: 'Unknown User', designation: 'No Designation' });
    }
  };

  const logout = () => {
    console.log('Logging out');
    setUser(null);
  };

  console.log('AuthProvider render - user:', user);

  return (
    <AuthContext.Provider value={{ user, loginWithLinkedIn, setAuthenticatedUser, logout }}>
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