import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

const API_URL = process.env.REACT_APP_API_URL; // Use env variable

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');  // <-- Define error state

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_URL}/login`, {
      email,
      password
    });

    const { token, user } = res.data;
    const userData = { ...user, token };

    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const register = async ({ name, email, password }) => {
    try {
      const res = await axios.post(`${API_URL}/register`, {
        name,
        email,
        password
      });

      const { token, user } = res.data;
      const userData = { ...user, token };

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');  // <-- Set error message here
      console.error('Registration error:', err.response?.data || err);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
