import { Navigate, Outlet, useLocation } from "react-router-dom";
import Auth from "../../utils/auth";

export function ProtectedRoute() {
  const location = useLocation();
  return Auth.loggedIn() ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}

export function GuestOnlyRoute() {
  return Auth.loggedIn() ? <Navigate to="/home" replace /> : <Outlet />;
}

export function AdminRoute() {
  if (!Auth.loggedIn()) return <Navigate to="/login" replace />;
  return Auth.isAdmin() ? <Outlet /> : <Navigate to="/" replace />;
}
