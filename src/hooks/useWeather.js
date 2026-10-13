import { useEffect, useState } from 'react'
import { fetchWeather } from '../services/weather'

const REFRESH_MS = 10 * 60 * 1000

// Bộ nhớ đệm theo thành phố: đổi qua lại giữa các thành phố không phải tải lại ngay
const cache = new Map()

export function useWeather(city) {
  const [result, setResult] = useState({ cityId: null, data: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const load = () => {
      fetchWeather(city, controller.signal)
        .then((data) => {
          cache.set(city.id, { data, at: Date.now() })
          if (!controller.signal.aborted) setResult({ cityId: city.id, data, error: null })
        })
        .catch((error) => {
          if (!controller.signal.aborted) setResult({ cityId: city.id, data: null, error })
        })
    }
    const cached = cache.get(city.id)
    if (attempt > 0 || !cached || Date.now() - cached.at > REFRESH_MS) load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      controller.abort()
      clearInterval(timer)
    }
  }, [city, attempt])

  const own = result.cityId === city.id ? result : null
  // Lần tải lại bị lỗi thì vẫn hiện số liệu cũ trong bộ nhớ đệm
  const data = own?.data ?? cache.get(city.id)?.data ?? null
  const error = data ? null : (own?.error ?? null)

  return { data, error, loading: !data && !error, retry: () => setAttempt((count) => count + 1) }
}
