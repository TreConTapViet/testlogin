import { useCallback, useMemo, useState } from 'react'
import { CITIES, DEFAULT_CITY_ID } from '../data/cities'
import { readString, writeString } from '../lib/storage'
import { CityContext } from './contexts'

const CITY_KEY = 'weather:city'

// Thành phố đang chọn dùng chung cho thanh thời tiết và trợ lý AI
export function CityProvider({ children }) {
  const [cityId, setCityId] = useState(() => readString(CITY_KEY) ?? DEFAULT_CITY_ID)
  const city = CITIES.find((item) => item.id === cityId) ?? CITIES[0]

  const chooseCity = useCallback((id) => {
    setCityId(id)
    writeString(CITY_KEY, id)
  }, [])

  const value = useMemo(() => ({ city, chooseCity }), [city, chooseCity])
  return <CityContext value={value}>{children}</CityContext>
}
