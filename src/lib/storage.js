// Đọc/ghi localStorage an toàn: tab ẩn danh hoặc trình duyệt chặn lưu trữ sẽ không làm app lỗi

export function readString(key) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeString(key, value) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Không lưu được thì bỏ qua
  }
}

export function removeKey(key) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Không xoá được thì bỏ qua
  }
}

export function readJSON(key, fallback) {
  const raw = readString(key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  writeString(key, JSON.stringify(value))
}
