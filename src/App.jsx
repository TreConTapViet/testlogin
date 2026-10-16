import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import ChatAssistant from './components/chat/ChatAssistant'
import { HangerIcon } from './components/icons'
import TopBar from './components/topbar/TopBar'
import { useAuth } from './context/contexts'
import Home from './pages/Home'
import OutfitPage from './pages/OutfitPage'
import ProfilePage from './pages/ProfilePage'
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
  // Trang đang mở sau khi đăng nhập; gắn với uid để đăng nhập lại luôn về trang chính
  const [view, setView] = useState({ uid: null, page: 'home' })
  const page = user && view.uid === user.uid ? view.page : 'home'
  const openPage = (next) => setView({ uid: user.uid, page: next })

  return (
    <div className="app-bg relative h-dvh w-full overflow-hidden">
      {ready ? (
        <>
          {/* Đã đăng nhập: bấm logo móc áo để về trang chính */}
          <TopBar visible={Boolean(user) || revealed} onHome={user ? () => openPage('home') : undefined} />
          <AnimatePresence mode="wait">
            {user ? (
              page === 'profile' ? (
                <ProfilePage key="profile" user={user} onBack={() => openPage('home')} onOpenOutfit={() => openPage('outfit')} />
              ) : page === 'outfit' ? (
                <OutfitPage key="outfit" user={user} onBack={() => openPage('home')} onOpenProfile={() => openPage('profile')} />
              ) : (
                <Home key="home" user={user} onOpenProfile={() => openPage('profile')} onOpenOutfit={() => openPage('outfit')} />
              )
            ) : (
              <Welcome key="welcome" skipIntro={revealed} onReveal={setRevealed} />
            )}
          </AnimatePresence>
          {/* key theo uid: đổi tài khoản thì cuộc trò chuyện cũ không còn */}
          <AnimatePresence>{user && <ChatAssistant key={user.uid} user={user} />}</AnimatePresence>
        </>
      ) : (
        <Splash />
      )}
    </div>
  )
}
