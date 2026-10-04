import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { Role } from '../types/user';

export function roleHome(role: Role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'DRIVER') return '/driver';
  return '/rider';
}

export function ProtectedRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (user.banned) {
    logout();
    return <Navigate to="/login?banned=true" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome(user.role)} replace />;
  }

  return <Outlet />;
}
