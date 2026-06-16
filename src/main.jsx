import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/global.css'   // 전역 디자인 토큰 + 공통 스타일 (가장 먼저 로드)
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
