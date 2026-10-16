import { cn } from '../lib/cn'
import { HangerIcon } from './icons'

// Có onClick thì logo (móc áo + chữ "Tủ Đồ") là nút về trang chính
export default function Logo({ className, onClick }) {
  const content = (
    <>
      <span className="glass grid h-11 w-11 place-items-center rounded-full transition-transform group-hover:scale-105">
        <HangerIcon className="h-5 w-5 text-accent" />
      </span>
      <span className="font-display text-[22px] font-semibold tracking-tight">Tủ Đồ</span>
    </>
  )

  if (!onClick) return <div className={cn('flex items-center gap-2.5', className)}>{content}</div>

  return (
    <button
      type="button"
      onClick={onClick}
      title="Về trang chính"
      aria-label="Tủ Đồ — về trang chính"
      className={cn('group flex cursor-pointer items-center gap-2.5', className)}
    >
      {content}
    </button>
  )
}
