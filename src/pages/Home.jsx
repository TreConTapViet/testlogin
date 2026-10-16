import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, ClockIcon, ShirtIcon, SparkIcon, UserIcon } from '../components/icons'
import FloatingClothes from '../components/scene/FloatingClothes'
import { useViewport } from '../hooks/useViewport'
import { TOP_BAR_HEIGHT } from '../lib/scene'

// Lối vào các phần; phần chưa có nhãn cta sẽ làm ở bước sau
const FEATURES = [
  { id: 'outfit', title: 'Phối đồ', description: 'Tự do thay trang phục cho ma-nơ-canh của bạn.', Icon: ShirtIcon, cta: 'Vào phòng thử' },
  { id: 'ai', title: 'Gợi ý từ AI', description: 'Kể hoàn cảnh: hẹn hò, đám cưới, đi làm…', Icon: SparkIcon },
  { id: 'history', title: 'Lịch sử phối đồ', description: 'Xem lại những bộ đồ bạn đã lưu.', Icon: ClockIcon },
  { id: 'profile', title: 'Hồ sơ của tôi', description: 'Chiều cao, cân nặng và phong cách.', Icon: UserIcon, cta: 'Mở hồ sơ' },
]

const EASE = [0.22, 1, 0.36, 1]
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } } }
const RISE = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } } }

function greetingFor(hour) {
  if (hour >= 5 && hour < 11) return 'Chào buổi sáng'
  if (hour >= 11 && hour < 13) return 'Chào buổi trưa'
  if (hour >= 13 && hour < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

function FeatureCard({ feature, onSelect }) {
  const { Icon } = feature
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      variants={RISE}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.98 }}
      className="glass group flex cursor-pointer flex-col items-start rounded-3xl p-5 text-left"
    >
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent/12 text-accent">
        <Icon className="h-5 w-5" />
      </span>
      <span className="mt-6 text-[15px] font-semibold">{feature.title}</span>
      <span className="mt-1.5 text-[13px] leading-snug text-muted">{feature.description}</span>
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-accent">
        {feature.cta ?? 'Sắp ra mắt'}
        <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </motion.button>
  )
}

/**
 * Màn hình chính sau khi đăng nhập.
 * Nhận user qua props (không đọc từ context) để khi đăng xuất, hiệu ứng thoát vẫn còn dữ liệu hiển thị.
 */
export default function Home({ user, onOpenProfile, onOpenOutfit }) {
  const stageRef = useRef(null)
  const { width, height } = useViewport()
  const [now] = useState(() => new Date())
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(timer)
  }, [toast])

  const dateLabel = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)

  return (
    <motion.main
      ref={stageRef}
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0, scale: 0.94, filter: 'blur(10px)' }}
      animate={{
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        transition: { duration: 0.9, ease: EASE },
        transitionEnd: { filter: 'none' },
      }}
      exit={{ opacity: 0, scale: 0.97, filter: 'blur(8px)', transition: { duration: 0.5 } }}
    >
      <FloatingClothes
        width={width}
        height={height}
        top={TOP_BAR_HEIGHT}
        clearWidth={860}
        origin={null}
        constraintsRef={stageRef}
        // Màn hình hẹp: quần áo nằm sau nội dung nên làm mờ đi cho dễ đọc
        className="z-0 max-md:opacity-30"
      />

      {/* my-auto: căn giữa khi vừa màn hình; chỉ khi màn hình quá thấp (điện thoại) mới cuộn được */}
      <div
        className="thin-scroll pointer-events-none relative z-10 flex h-full flex-col items-center overflow-y-auto px-6 pb-8"
        style={{ paddingTop: TOP_BAR_HEIGHT }}
      >
        <motion.div
          className="pointer-events-auto my-auto flex w-full max-w-[820px] flex-col items-center text-center"
          variants={STAGGER}
          initial="hidden"
          animate="show"
        >
          <motion.p variants={RISE} className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            {dateLabel}
          </motion.p>
          <motion.h1 variants={RISE} className="mt-4 font-display text-5xl leading-[1.12] md:text-6xl">
            {greetingFor(now.getHours())},
            <br />
            <em className="text-accent">{user.nickname}</em>
          </motion.h1>
          <motion.p variants={RISE} className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
            Hôm nay bạn muốn diện gì? Kể cho tủ đồ nghe hoàn cảnh của bạn, mình sẽ gợi ý bộ trang phục hợp với dịp đó
            và thời tiết hôm nay.
          </motion.p>
          <motion.div variants={STAGGER} className="mt-10 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onSelect={() => {
                  if (feature.id === 'outfit') onOpenOutfit()
                  else if (feature.id === 'profile') onOpenProfile()
                  else setToast({ id: Date.now(), text: `“${feature.title}” sẽ có ở bước tiếp theo, sắp ra mắt!` })
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            role="status"
            className="glass absolute bottom-8 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-3 text-sm"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3 }}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  )
}
