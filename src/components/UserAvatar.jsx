import { AVATARS } from '../data/avatars'
import { cn } from '../lib/cn'
import ClothIcon from './clothes/ClothIcon'
import { CLOTHES_BY_ID } from './clothes/catalog'

/**
 * Ảnh đại diện: ảnh Google (tài khoản Google) → avatar người dùng tự chọn → chữ cái đầu biệt danh.
 * className quyết định kích thước, initialClass cỡ chữ của chữ cái đầu.
 */
export default function UserAvatar({ user, className, initialClass = 'text-sm' }) {
  // Avatar người dùng đã chọn được ưu tiên, kể cả với tài khoản Google
  const avatar = AVATARS.find((option) => option.id === user.avatar)
  if (!avatar && user.provider === 'google' && user.photoURL) {
    return <img src={user.photoURL} alt="" referrerPolicy="no-referrer" className={cn('shrink-0 rounded-full object-cover', className)} />
  }
  if (avatar && CLOTHES_BY_ID[avatar.id]) {
    return (
      <span className={cn('grid shrink-0 place-items-center rounded-full', className)} style={{ background: avatar.bg }}>
        <ClothIcon item={CLOTHES_BY_ID[avatar.id]} className="h-[70%] w-[70%]" />
      </span>
    )
  }
  // Array.from để không cắt đôi emoji/ký tự đặc biệt
  const initial = (Array.from((user.nickname || user.email || '?').trim())[0] ?? '?').toUpperCase()
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full bg-accent font-semibold text-white', initialClass, className)}>
      {initial}
    </span>
  )
}
