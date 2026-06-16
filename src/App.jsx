// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext"; // 추가
import ProtectedRoute from "./routes/ProtectedRoute"; // 추가
import LoginPage from "./pages/LoginPage";
import MainPage from "./pages/MainPage";

function App() {
  return (
    <AuthProvider> {/* 1. 앱 전체를 인증 컨텍스트로 감싸준다 */}
      <Router>
        <Routes>
          {/* 누구나 접근 가능한 페이지 */}
          <Route path="/login" element={<LoginPage />} />
          
          {/* 2. 로그인한 사람만 접근 가능한 페이지 (방패로 감싸기) */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainPage />
              </ProtectedRoute>
            } 
          />
          

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;