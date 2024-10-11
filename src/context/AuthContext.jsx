import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';  // We are using axios for convenience

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

  const getUsers = async () => {
    try {
      // Fetch the users.json file from the public directory
      const response = await axios.get('/users.json');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  };

  const login = async (email, password, onClose) => {
    try {
      const users = await getUsers();
      const user = users.find((user) => user.email === email);

      if (user && user.password === password) {
        setIsLoggedIn(true);
        setUserId(user.id);
        alert('Successfully logged in!');
        onClose();
      } else {
        alert('Invalid email or password');
      }
    } catch (error) {
      console.error('Error during login:', error);
      alert('Error during login');
    }
  };

  const register = async (email, password, onClose) => {
    try {
      const users = await getUsers();
      const existingUser = users.find((user) => user.email === email);

      if (existingUser) {
        alert('User already registered');
      } else {
        const newUser = { id: users.length + 1, email, password };
        users.push(newUser);

        // For a static website, you can't modify users.json dynamically
        // So we just simulate a successful registration
        setIsLoggedIn(true);
        setUserId(newUser.id);
        alert('Successfully registered!');
        onClose();
      }
    } catch (error) {
      console.error('Error during registration:', error);
      alert('Error during registration');
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUserId(null);
    alert('Successfully logged out!');
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userId, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
