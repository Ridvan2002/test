import React, { createContext, useContext, useState } from 'react';
import api from '../utils/api'; // Assuming you have an Axios instance

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null); // Store userId

  const login = async (email, password, onClose) => {
    try {
      const response = await api.post('/login', { email, password });
      if (response.status === 200) {
        setIsLoggedIn(true);
        setUserId(response.data.userId); // Store userId after successful login
        alert('Successfully logged in!');
        onClose();
      }
    } catch (error) {
      alert('Invalid email or password');
    }
  };

  const register = async (email, password, onClose) => {
    try {
      const response = await api.post('/register', { email, password });
      if (response.status === 201) {
        setIsLoggedIn(true);
        setUserId(response.data.userId); // Store userId after successful registration
        alert('Successfully registered!');
        onClose();
      }
    } catch (error) {
      alert('User already registered or error during registration');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserId(null); // Clear userId on logout
    alert('Successfully logged out!');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
