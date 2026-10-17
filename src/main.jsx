import { MotionConfig } from 'framer-motion'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthProvider.jsx'
import { CityProvider } from './context/CityProvider.jsx'
import { ProfileProvider } from './context/ProfileProvider.jsx'
import { ThemeProvider } from './context/ThemeProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <ProfileProvider>
          <CityProvider>
            {/* Máy bật "Giảm chuyển động": framer-motion bỏ các chuyển động dịch/xoay/phóng, chỉ giữ mờ dần */}
            <MotionConfig reducedMotion="user">
              <App />
            </MotionConfig>
          </CityProvider>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
