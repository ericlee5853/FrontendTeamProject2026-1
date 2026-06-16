// src/routes/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useAuth();

  if (!user) {
    // 로그인 안 된 유저라면 강제로 로그인 페이지로
    return <Navigate to="/login" replace />;
  }

  // 로그인 된 유저라면 원래 가려던 페이지(children)
  return children;
}