import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLayout() {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>Submissions</NavLink>
        <NavLink to="/admin/expiry" className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}>Expiry Dashboard</NavLink>
        <button className="admin-nav-link" onClick={handleLogout} style={{ textAlign: 'left', background: 'none', border: 'none', width: '100%' }}>
          Logout ({admin?.name})
        </button>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
