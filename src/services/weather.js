// Có VITE_WEATHER_KEY thì dùng WeatherAPI.com; chưa có thì dùng Open-Meteo (miễn phí, không cần key)
const WEATHER_API_KEY = import.meta.env.VITE_WEATHER_KEY
const HOURS_AHEAD = 5

// ----- Mã điều kiện của WeatherAPI.com -----
const WA_RAIN = new Set([
  1063, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246,
])
const WA_SNOW = new Set([
  1066, 1069, 1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264,
])
const WA_STORM = new Set([1087, 1273, 1276, 1279, 1282])
const WA_FOG = new Set([1030, 1135, 1147])

function kindFromWeatherApi(code) {
  if (code === 1000) return 'clear'
  if (code === 1003) return 'partly'
  if (WA_RAIN.has(code)) return 'rain'
  if (WA_STORM.has(code)) return 'storm'
  if (WA_SNOW.has(code)) return 'snow'
  if (WA_FOG.has(code)) return 'fog'
  return 'cloud'
}

// ----- Mã WMO của Open-Meteo -----
function describeWmo(code) {
  if (code === 0) return { kind: 'clear', text: 'Trời quang' }
  if (code === 1) return { kind: 'partly', text: 'Ít mây' }
  if (code === 2) return { kind: 'partly', text: 'Mây rải rác' }
  if (code === 3) return { kind: 'cloud', text: 'Nhiều mây' }
  if (code === 45 || code === 48) return { kind: 'fog', text: 'Sương mù' }
  if (code >= 51 && code <= 57) return { kind: 'rain', text: 'Mưa phùn' }
  if (code === 61 || code === 80) return { kind: 'rain', text: 'Mưa nhẹ' }
  if (code === 63 || code === 81) return { kind: 'rain', text: 'Mưa vừa' }
  if (code === 65 || code === 82) return { kind: 'rain', text: 'Mưa to' }
  if (code === 66 || code === 67) return { kind: 'rain', text: 'Mưa lạnh' }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { kind: 'snow', text: 'Có tuyết' }
  if (code >= 95) return { kind: 'storm', text: 'Có dông' }
  return { kind: 'cloud', text: 'Nhiều mây' }
}

// "2026-10-13 15:00" hoặc "2026-10-13T15:00" -> "15h"
const hourLabel = (localTime) => `${Number(localTime.slice(11, 13))}h`

async function getJSON(url, signal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Weather HTTP ${response.status}`)
  return response.json()
}

async function fromWeatherApi(city, signal) {
  const params = new URLSearchParams({
    key: WEATHER_API_KEY,
    q: `${city.lat},${city.lon}`,
    days: '2',
    lang: 'vi',
    aqi: 'no',
    alerts: 'no',
  })
  const { location, current, forecast } = await getJSON(`https://api.weatherapi.com/v1/forecast.json?${params}`, signal)
  const hours = forecast.forecastday
    .flatMap((day) => day.hour)
    .filter((hour) => hour.time_epoch > location.localtime_epoch)
    .slice(0, HOURS_AHEAD)
    .map((hour) => ({
      label: hourLabel(hour.time),
      temp: Math.round(hour.temp_c),
      kind: kindFromWeatherApi(hour.condition.code),
      isDay: hour.is_day === 1,
    }))
  return {
    temp: Math.round(current.temp_c),
    feelsLike: Math.round(current.feelslike_c),
    humidity: current.humidity,
    text: current.condition.text,
    kind: kindFromWeatherApi(current.condition.code),
    isDay: current.is_day === 1,
    hours,
  }
}

async function fromOpenMeteo(city, signal) {
  const params = new URLSearchParams({
    latitude: String(city.lat),
    longitude: String(city.lon),
    current: 'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,weather_code',
    hourly: 'temperature_2m,weather_code,is_day',
    timezone: 'auto',
    forecast_days: '2',
  })
  const { current, hourly } = await getJSON(`https://api.open-meteo.com/v1/forecast?${params}`, signal)
  // Giờ địa phương cùng định dạng nên so sánh chuỗi là đủ
  const start = hourly.time.findIndex((time) => time > current.time)
  const hours =
    start === -1
      ? []
      : hourly.time.slice(start, start + HOURS_AHEAD).map((time, offset) => {
          const index = start + offset
          return {
            label: hourLabel(time),
            temp: Math.round(hourly.temperature_2m[index]),
            kind: describeWmo(hourly.weather_code[index]).kind,
            isDay: hourly.is_day[index] === 1,
          }
        })
  const now = describeWmo(current.weather_code)
  return {
    temp: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature),
    humidity: current.relative_humidity_2m,
    text: now.text,
    kind: now.kind,
    isDay: current.is_day === 1,
    hours,
  }
}

export function fetchWeather(city, signal) {
  return WEATHER_API_KEY ? fromWeatherApi(city, signal) : fromOpenMeteo(city, signal)
}
