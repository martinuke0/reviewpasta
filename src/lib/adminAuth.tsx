import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  getPassword: () => string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState<string | null>(null);

  // Check localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('admin-password');
    if (stored) {
      setPassword(stored);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (pwd: string): Promise<boolean> => {
    const { verifyAdminPassword } = await import('@/lib/d1Db');
    const valid = await verifyAdminPassword(pwd);

    if (valid) {
      setPassword(pwd);
      setIsAuthenticated(true);
      localStorage.setItem('admin-password', pwd);
      return true;
    }
    return false;
  };

  const logout = () => {
    setPassword(null);
    setIsAuthenticated(false);
    localStorage.removeItem('admin-password');
  };

  const getPassword = () => password;

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, getPassword }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
