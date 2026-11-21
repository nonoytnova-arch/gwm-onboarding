import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

// UI convenience only — every admin API route independently re-verifies the
// token and role server-side (see backend/middleware/authMiddleware.js),
// so this check is never the actual security boundary.
export default function AdminProtectedRoute({ children }) {
  const { admin } = useAdminAuth();
  if (!admin) return <Navigate to="/admin/login" replace />;
  return children;
}
