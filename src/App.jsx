import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { HangerIcon } from './components/icons'
import TopBar from './components/topbar/TopBar'
import { useAuth } from './context/contexts'
import Home from './pages/Home'
import Welcome from './pages/Welcome'

// Chờ Firebase cho biết đã đăng nhập hay chưa (tránh chạy màn mở đầu rồi lại nhảy sang trang chính)
function Splash() {
  return (
    <div className="grid h-full place-items-center">
      <motion.div
        className="glass grid h-16 w-16 place-items-center rounded-full"
        animate={{ opacity: [0.45, 1, 0.45], scale: [0.96, 1, 0.96] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <HangerIcon className="h-7 w-7 text-accent" />
      </motion.div>
    </div>
  )
}

export default function App() {
  const { user, ready } = useAuth()
  // true khi màn mở đầu đã chạy xong trong phiên này: hiện thanh trên cùng và lần sau vào thẳng form
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="app-bg relative h-dvh w-full overflow-hidden">
      {ready ? (
        <>
          <TopBar visible={Boolean(user) || revealed} />
          <AnimatePresence mode="wait">
            {user ? (
              <Home key="home" user={user} />
            ) : (
              <Welcome key="welcome" skipIntro={revealed} onReveal={setRevealed} />
            )}
          </AnimatePresence>
        </>
      ) : (
        <Splash />
      )}
    </div>
  )
}
