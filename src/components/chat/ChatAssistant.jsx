import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useCity, useProfile } from '../../context/contexts'
import { useWeather } from '../../hooks/useWeather'
import { cn } from '../../lib/cn'
import { createStylistChat, sendToStylist, stylistErrorMessage } from '../../services/stylist'
import { CloseIcon, HangerIcon, RefreshIcon, SendIcon, SparkIcon } from '../icons'
import FormattedText from './FormattedText'

const QUICK_PROMPTS = [
  { label: 'Đi hẹn hò', text: 'Tối nay mình đi hẹn hò, nên mặc gì?' },
  { label: 'Đi đám cưới', text: 'Mình đi dự đám cưới bạn thân, nên mặc gì cho lịch sự?' },
  { label: 'Đi làm', text: 'Gợi ý trang phục đi làm văn phòng hôm nay.' },
  { label: 'Phỏng vấn', text: 'Mai mình đi phỏng vấn xin việc, nên mặc thế nào?' },
  { label: 'Dạo phố cuối tuần', text: 'Cuối tuần đi dạo phố, cà phê với bạn bè thì mặc gì?' },
]

let messageSeq = 0
const nextId = () => `m${(messageSeq += 1)}`

const welcomeMessage = (nickname) => ({
  id: 'welcome',
  role: 'assistant',
  text: `Chào **${nickname}**! Mình là trợ lý Tủ Đồ. Hãy kể hoàn cảnh của bạn (đi đâu, gặp ai, lúc nào), mình sẽ gợi ý trang phục hợp với dịp đó và thời tiết hôm nay.`,
})

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1" aria-label="Trợ lý đang trả lời">
      {[0, 1, 2].map((index) => (
        <motion.span
          key={index}
          className="h-1.5 w-1.5 rounded-full bg-muted"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: index * 0.15 }}
        />
      ))}
    </span>
  )
}

/** Bong bóng trợ lý AI ở góc dưới bên phải (chỉ hiện khi đã đăng nhập). */
export default function ChatAssistant({ user }) {
  const { city } = useCity()
  const { data: weather } = useWeather(city)
  const { profile } = useProfile()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(() => [welcomeMessage(user.nickname)])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const chatRef = useRef(null)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  // Luôn cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [messages, open])

  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus({ preventScroll: true })
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const updateMessage = (id, patch) =>
    setMessages((current) => current.map((message) => (message.id === id ? { ...message, ...patch } : message)))

  const send = async (raw) => {
    const text = raw.trim()
    if (!text || streaming) return
    const userId = nextId()
    const replyId = nextId()
    setMessages((current) => [
      ...current,
      { id: userId, role: 'user', text },
      { id: replyId, role: 'assistant', text: '', pending: true },
    ])
    setInput('')
    setStreaming(true)
    try {
      if (!chatRef.current) chatRef.current = createStylistChat()
      const reply = await sendToStylist(
        chatRef.current,
        text,
        // Bối cảnh cho AI: hồ sơ, giờ hiện tại, thời tiết + dự báo vài giờ tới
        { nickname: user.nickname, city: city.name, weather, profile, now: new Date() },
        (partial) => updateMessage(replyId, { text: partial, pending: false }),
      )
      if (!reply.trim()) {
        updateMessage(replyId, { text: 'Mình chưa có gợi ý cho câu này, bạn kể rõ hơn hoàn cảnh nhé.', pending: false })
      }
    } catch (error) {
      console.error('Trợ lý AI lỗi:', error)
      updateMessage(replyId, { text: stylistErrorMessage(error), pending: false, error: true, retry: { text, userId } })
    } finally {
      setStreaming(false)
    }
  }

  const retry = (message) => {
    setMessages((current) => current.filter((item) => item.id !== message.id && item.id !== message.retry.userId))
    send(message.retry.text)
  }

  const resetChat = () => {
    if (streaming) return
    chatRef.current = null
    setMessages([welcomeMessage(user.nickname)])
    inputRef.current?.focus()
  }

  const handleKeyDown = (event) => {
    // Enter gửi, Shift+Enter xuống dòng; bỏ qua khi bộ gõ tiếng Việt đang ghép chữ
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      send(input)
    }
  }

  const showQuickPrompts = messages.length === 1

  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[45]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { delay: 0.8, duration: 0.5 } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      <AnimatePresence>
        {open && (
          <motion.section
            key="panel"
            role="dialog"
            aria-label="Trợ lý phối đồ AI"
            className="glass pointer-events-auto absolute bottom-24 right-4 flex h-[min(580px,calc(100dvh-150px))] w-[min(390px,calc(100vw-32px))] origin-bottom-right flex-col overflow-hidden rounded-3xl md:right-6"
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            // Nền gần như đặc để chữ dễ đọc khi quần áo trôi phía sau
            style={{ background: 'color-mix(in oklab, var(--bg) 92%, transparent)' }}
          >
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white">
                <HangerIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Trợ lý Tủ Đồ</p>
                <p className="truncate text-xs text-muted">
                  {weather ? `Gợi ý theo thời tiết ${city.name} · ${weather.temp}° ${weather.text}` : 'Gợi ý theo hoàn cảnh & thời tiết'}
                </p>
              </div>
              <button
                type="button"
                onClick={resetChat}
                disabled={streaming}
                title="Cuộc trò chuyện mới"
                aria-label="Cuộc trò chuyện mới"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:cursor-wait disabled:opacity-50"
              >
                <RefreshIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Đóng trợ lý"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </header>

            <div ref={listRef} className="thin-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.map((message) => (
                <div key={message.id} className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed',
                      message.role === 'user'
                        ? 'rounded-br-md bg-ink text-bg'
                        : message.error
                          ? 'rounded-bl-md bg-red-500/10 text-red-700 dark:text-red-300'
                          : 'rounded-bl-md bg-white/80 text-ink shadow-sm dark:bg-white/[0.07]',
                    )}
                  >
                    {message.pending ? (
                      <TypingDots />
                    ) : message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.text}</p>
                    ) : (
                      <FormattedText text={message.text} />
                    )}
                    {message.error && (
                      <button
                        type="button"
                        onClick={() => retry(message)}
                        disabled={streaming}
                        className="mt-1.5 cursor-pointer text-xs font-semibold underline underline-offset-2 disabled:opacity-50"
                      >
                        Thử lại
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {showQuickPrompts && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt.label}
                      type="button"
                      onClick={() => send(prompt.text)}
                      className="cursor-pointer rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                    >
                      {prompt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form
              className="flex items-end gap-2 border-t border-line p-3"
              onSubmit={(event) => {
                event.preventDefault()
                send(input)
              }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                maxLength={800}
                placeholder="Kể hoàn cảnh của bạn…"
                aria-label="Tin nhắn cho trợ lý"
                className="thin-scroll max-h-28 min-h-10 flex-1 resize-none rounded-2xl border border-line bg-white/75 px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-accent/60 dark:bg-white/[0.06]"
                style={{ fieldSizing: 'content' }}
              />
              <button
                type="submit"
                disabled={streaming || !input.trim()}
                aria-label="Gửi"
                className="grid h-10 w-10 shrink-0 cursor-pointer place-items-center rounded-full bg-accent text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <SendIcon className="h-[18px] w-[18px]" />
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? 'Đóng trợ lý phối đồ' : 'Mở trợ lý phối đồ AI'}
        className="group pointer-events-auto absolute bottom-6 right-4 grid h-14 w-14 cursor-pointer place-items-center rounded-full bg-accent text-white shadow-[0_12px_30px_-8px_color-mix(in_oklab,var(--accent)_70%,transparent)] md:right-6"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
      >
        {!open && <span className="absolute inset-0 animate-ping rounded-full bg-accent/40 [animation-duration:2.4s]" />}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'close' : 'open'}
            initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
            transition={{ duration: 0.18 }}
          >
            {open ? <CloseIcon className="h-6 w-6" /> : <SparkIcon className="h-6 w-6" />}
          </motion.span>
        </AnimatePresence>
        {!open && (
          <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-bg opacity-0 shadow-md transition-opacity group-hover:opacity-100">
            Hỏi trợ lý phối đồ
          </span>
        )}
      </motion.button>
    </motion.div>
  )
}
