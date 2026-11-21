import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem('gwm_admin_user');
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email, password) {
    const result = await api.adminLogin(email, password);
    localStorage.setItem('gwm_admin_token', result.token);
    localStorage.setItem('gwm_admin_user', JSON.stringify(result.admin));
    setAdmin(result.admin);
    return result;
  }

  function logout() {
    localStorage.removeItem('gwm_admin_token');
    localStorage.removeItem('gwm_admin_user');
    setAdmin(null);
  }

  return (
    <AdminAuthContext.Provider value={{ admin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
