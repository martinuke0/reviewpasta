import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/lib/adminAuth';

export function AdminProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuth();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
