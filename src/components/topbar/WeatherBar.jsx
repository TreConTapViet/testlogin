import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useRef, useState } from 'react'
import { useCity } from '../../context/contexts'
import { CITIES } from '../../data/cities'
import { useDismiss } from '../../hooks/useDismiss'
import { useWeather } from '../../hooks/useWeather'
import { cn } from '../../lib/cn'
import { ChevronDownIcon, PinIcon } from '../icons'
import WeatherIcon from './WeatherIcon'

export default function WeatherBar() {
  const { city, chooseCity: selectCity } = useCity()
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const { data, error, loading, retry } = useWeather(city)

  const close = useCallback(() => setOpen(false), [])
  useDismiss(rootRef, open, close)

  const chooseCity = (id) => {
    selectCity(id)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <div className="glass flex h-11 items-center rounded-full pl-1.5 pr-4 text-sm">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="true"
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-full px-2.5 font-medium transition-colors hover:bg-ink/5"
        >
          <PinIcon className="h-4 w-4 text-accent" />
          <span className="max-w-[130px] truncate">{city.name}</span>
          <ChevronDownIcon className={cn('h-3.5 w-3.5 text-muted transition-transform', open && 'rotate-180')} />
        </button>

        <span className="mx-2 h-5 w-px bg-line" aria-hidden="true" />

        {loading && (
          <span className="flex items-center gap-2" aria-label="Đang tải thời tiết">
            <span className="h-5 w-5 animate-pulse rounded-full bg-ink/10" />
            <span className="h-3 w-16 animate-pulse rounded-full bg-ink/10" />
          </span>
        )}

        {error && (
          <button type="button" onClick={retry} className="cursor-pointer text-xs text-muted hover:text-accent">
            Chưa tải được thời tiết · Thử lại
          </button>
        )}

        {data && (
          <>
            <div
              className="flex items-center gap-1.5"
              title={`${data.text} · Cảm giác như ${data.feelsLike}° · Độ ẩm ${data.humidity}%`}
            >
              <WeatherIcon kind={data.kind} isDay={data.isDay} className="h-6 w-6" />
              <span className="text-base font-semibold tabular-nums">{data.temp}°</span>
              <span className="hidden max-w-[110px] truncate text-xs text-muted lg:inline">{data.text}</span>
            </div>
            {data.hours.length > 0 && (
              <ol className="ml-3 hidden items-center gap-3 border-l border-line pl-3 xl:flex" aria-label="Dự báo theo giờ">
                {data.hours.map((hour) => (
                  <li key={hour.label} className="flex flex-col items-center leading-none">
                    <span className="text-[10px] text-muted">{hour.label}</span>
                    <WeatherIcon kind={hour.kind} isDay={hour.isDay} className="my-0.5 h-4 w-4" />
                    <span className="text-[11px] font-medium tabular-nums">{hour.temp}°</span>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key="cities"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="glass thin-scroll absolute left-0 top-[calc(100%+8px)] z-50 max-h-[min(60vh,420px)] w-60 origin-top-left overflow-y-auto rounded-2xl p-1.5"
          >
            <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Chọn thành phố</p>
            <ul>
              {CITIES.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => chooseCity(item.id)}
                    aria-current={item.id === city.id ? 'true' : undefined}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-ink/5',
                      item.id === city.id && 'bg-accent/10 font-medium text-accent',
                    )}
                  >
                    {item.name}
                    {item.id === city.id && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
