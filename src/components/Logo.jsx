import { cn } from '../lib/cn'
import { HangerIcon } from './icons'

export default function Logo({ className }) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <span className="glass grid h-11 w-11 place-items-center rounded-full">
        <HangerIcon className="h-5 w-5 text-accent" />
      </span>
      <span className="font-display text-[22px] font-semibold tracking-tight">Tủ Đồ</span>
    </div>
  )
}
