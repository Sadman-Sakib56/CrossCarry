import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // App খোলার সময় token থাকলে user কে verify করা, যাতে reload এ logout না হয়
  useEffect(() => {
    const initAuth = async () => {
      if (!localStorage.getItem('token')) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  // API থেকে 401 এলে (token মেয়াদ শেষ) নিজে থেকেই logout
  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener('cc:unauthorized', onUnauthorized);
    return () => window.removeEventListener('cc:unauthorized', onUnauthorized);
  }, []);

  // error এর সম্পূর্ণ object ছুঁড়ে দেওয়া হয়, যাতে page গুলো `code` দিয়ে বাংলা/English message বেছে নিতে পারে
  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const refreshUser = useCallback(async () => {
    const res = await api.get('/users/me');
    setUser(res.data);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
