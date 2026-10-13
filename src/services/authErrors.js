const MESSAGES = {
  'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
  'auth/missing-email': 'Vui lòng nhập email.',
  'auth/missing-password': 'Vui lòng nhập mật khẩu.',
  'auth/email-already-in-use': 'Email này đã được đăng ký. Bạn hãy đăng nhập nhé.',
  'auth/weak-password': 'Mật khẩu cần ít nhất 6 ký tự.',
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/invalid-login-credentials': 'Email hoặc mật khẩu không đúng.',
  'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
  'auth/user-not-found': 'Email hoặc mật khẩu không đúng.',
  'auth/user-disabled': 'Tài khoản này đã bị vô hiệu hoá.',
  'auth/too-many-requests': 'Bạn thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại.',
  'auth/network-request-failed': 'Lỗi kết nối mạng. Kiểm tra Internet rồi thử lại.',
  'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập Google. Hãy cho phép popup rồi thử lại.',
  'auth/operation-not-allowed': 'Phương thức đăng nhập này chưa được bật trong Firebase Console.',
  'auth/unauthorized-domain': 'Tên miền này chưa được cấp quyền trong Firebase Authentication.',
  'auth/account-exists-with-different-credential':
    'Email này đã đăng ký bằng cách khác. Hãy đăng nhập bằng email và mật khẩu.',
  'auth/invalid-api-key': 'Cấu hình Firebase chưa đúng (API key).',
  'auth/configuration-not-found': 'Dự án Firebase chưa bật Authentication.',
}

// Người dùng tự đóng popup Google: không cần báo lỗi
const SILENT_CODES = new Set(['auth/popup-closed-by-user', 'auth/cancelled-popup-request', 'auth/user-cancelled'])

function messageFor(code) {
  if (code && MESSAGES[code]) return MESSAGES[code]
  if (code?.startsWith('auth/api-key-not-valid')) return MESSAGES['auth/invalid-api-key']
  return 'Đã có lỗi xảy ra. Vui lòng thử lại.'
}

export class AuthError extends Error {
  constructor(code) {
    super(messageFor(code))
    this.name = 'AuthError'
    this.code = code
    this.silent = SILENT_CODES.has(code)
  }
}

export function toAuthError(error) {
  if (error instanceof AuthError) return error
  if (!error?.code) console.error(error)
  return new AuthError(error?.code)
}
