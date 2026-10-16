import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { HangerIcon } from '../components/icons'
import ProfileEditor from '../components/profile/ProfileEditor'
import ShopEntrance from '../components/profile/ShopEntrance'
import { useProfile } from '../context/contexts'

function Loading() {
  return (
    <motion.div
      className="absolute inset-0 grid place-items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.span
        className="glass grid h-16 w-16 place-items-center rounded-full"
        animate={{ opacity: [0.45, 1, 0.45] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        <HangerIcon className="h-7 w-7 text-accent" />
      </motion.span>
    </motion.div>
  )
}

/**
 * Bước vào hồ sơ: nhân viên cửa hàng mở cửa chào đón → trang hồ sơ.
 * Nhận user qua props để khi đăng xuất, hiệu ứng thoát vẫn còn dữ liệu hiển thị.
 */
export default function ProfilePage({ user, onBack, onOpenOutfit }) {
  const { profile, status } = useProfile()
  const [stage, setStage] = useState('entrance')
  // Đã có hồ sơ thì cảnh chào đón rút gọn
  const [returning] = useState(() => Boolean(profile))

  return (
    <motion.main
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.4 } }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)', transition: { duration: 0.45 } }}
    >
      <AnimatePresence mode="wait">
        {stage === 'entrance' ? (
          <ShopEntrance key="entrance" nickname={user.nickname} returning={returning} onDone={() => setStage('editor')} />
        ) : status === 'loading' ? (
          <Loading key="loading" />
        ) : (
          <ProfileEditor
            key="editor"
            user={user}
            profile={profile}
            loadFailed={status === 'error'}
            onBack={onBack}
            onOpenOutfit={onOpenOutfit}
          />
        )}
      </AnimatePresence>
    </motion.main>
  )
}
