import { motion } from 'framer-motion'
import { ArrowRightIcon } from '../icons'

// Lời chào hiện ra khi cửa tủ vừa mở
export default function Greeting({ onContinue }) {
  return (
    <motion.div
      className="my-auto flex flex-col items-center px-2 text-center"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, y: -12, transition: { duration: 0.25 } }}
    >
      <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">Xin chào</span>
      <h1 className="mt-3 font-display text-[34px] leading-[1.15]">
        Tủ đồ của bạn
        <br />
        <em className="font-medium">đã mở cửa</em>
      </h1>
      <p className="mt-4 max-w-[270px] text-sm leading-relaxed text-muted">
        Quần áo vừa “bung” ra khắp nơi! Đăng nhập để cùng chọn trang phục hợp với hoàn cảnh và thời tiết hôm nay nhé.
      </p>
      <motion.button
        type="button"
        onClick={onContinue}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="group mt-7 inline-flex h-12 cursor-pointer items-center gap-2 rounded-full bg-ink pl-6 pr-5 text-sm font-semibold text-bg shadow-lg"
      >
        Ấn để đăng nhập
        <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </motion.button>
      <span className="mt-3 text-xs text-muted">hoặc tạo tài khoản mới chỉ trong vài giây</span>
    </motion.div>
  )
}
