import { motion } from 'framer-motion'
import { useState } from 'react'
import { COMPANIONS, OCCASIONS, SEASONS, contextSummary, labelOf, occasionFromText } from '../../data/outfitContexts'
import { cn } from '../../lib/cn'
import { isEmptyContext } from '../../services/contextStore'
import { ArrowRightIcon, SparkIcon, Spinner } from '../icons'
import ConfirmDialog from './ConfirmDialog'

const EMPTY = { occasion: null, occasionText: '', season: null, companion: null, companionText: '', note: '' }
const EASE = [0.22, 1, 0.36, 1]
const RISE = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } }

function Chips({ label, options, value, onChange, renderHint }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : option.id)}
            className={cn(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-colors',
              active ? 'border-accent bg-accent text-white' : 'border-line bg-white/60 hover:border-accent/50 dark:bg-white/[0.04]',
            )}
          >
            {option.label}
            {renderHint?.(option, active)}
          </button>
        )
      })}
    </div>
  )
}

function Question({ index, title, children }) {
  return (
    <motion.div variants={RISE} className="border-t border-line pt-3.5 first:border-t-0 first:pt-0">
      <p className="mb-2.5 text-sm font-semibold">
        <span className="mr-2 text-[11px] font-semibold tracking-[0.2em] text-accent">{String(index).padStart(2, '0')}</span>
        {title}
      </p>
      {children}
    </motion.div>
  )
}

const inputClass =
  'mt-2.5 h-10 w-full rounded-xl border border-line bg-white/70 px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60 dark:bg-white/[0.05]'

/**
 * Câu hỏi đầu phòng thử: dịp gì, mùa nào, đi cùng ai (+ ghi chú). Chưa gợi ý gì cho tới khi lưu.
 * Bỏ trống rồi bấm lưu, hoặc bấm "Gợi ý ngay" → hỏi lại trước khi hiện mọi gợi ý.
 */
// initial: hoàn cảnh đang dùng (khi bấm "Sửa hoàn cảnh") để sửa tiếp thay vì nhập lại từ đầu
export default function ContextForm({ nickname, initial, history, weatherHint, saving, onSubmit, onSuggestAll }) {
  const [form, setForm] = useState(() => ({ ...EMPTY, ...initial }))
  const [confirming, setConfirming] = useState(false)
  const set = (field) => (value) => setForm((current) => ({ ...current, [field]: value }))
  const guessed = !form.occasion ? occasionFromText(form.occasionText) : null

  const submit = (event) => {
    event.preventDefault()
    if (saving) return
    if (isEmptyContext(form)) setConfirming(true)
    else onSubmit(form)
  }

  return (
    <>
      <motion.form
        onSubmit={submit}
        className="glass flex max-h-full w-full flex-col overflow-hidden rounded-[28px]"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } } }}
      >
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-6 pb-4 pt-6 md:px-7 md:pt-7">
          <motion.p variants={RISE} className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">
            Phòng thử đồ
          </motion.p>
          <motion.h1 variants={RISE} className="mt-2 font-display text-[30px] leading-tight">
            Hôm nay {nickname} diện cho dịp nào?
          </motion.h1>
          <motion.p variants={RISE} className="mt-1.5 text-sm text-muted">
            Trả lời vài câu để Tủ Đồ gợi ý đúng ý bạn. Câu nào chưa chắc thì cứ để trống.
          </motion.p>

          {history.length > 0 && (
            <motion.div variants={RISE} className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted">Dùng lại:</span>
              {history.slice(0, 3).map((entry) => (
                <button
                  key={entry.savedAt}
                  type="button"
                  onClick={() => setForm({ ...EMPTY, ...entry })}
                  className="cursor-pointer rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
                >
                  {contextSummary(entry) || 'Ghi chú riêng'}
                </button>
              ))}
            </motion.div>
          )}

          <div className="mt-5 flex flex-col gap-3.5">
            <Question index={1} title="Hoàn cảnh bạn muốn đặt vào là gì?">
              <Chips label="Dịp" options={OCCASIONS} value={form.occasion} onChange={set('occasion')} />
              <input
                type="text"
                value={form.occasionText}
                onChange={(event) => set('occasionText')(event.target.value)}
                maxLength={120}
                placeholder="Hoặc tự kể: đi ăn tối kỷ niệm 1 năm, tiệc tất niên công ty…"
                aria-label="Tự kể hoàn cảnh"
                className={inputClass}
              />
              {guessed && <p className="mt-1.5 text-xs text-muted">Tủ Đồ hiểu là: <b className="text-ink">{labelOf(OCCASIONS, guessed)}</b></p>}
            </Question>

            <Question index={2} title="Đó là mùa nào?">
              <Chips
                label="Mùa"
                options={SEASONS}
                value={form.season}
                onChange={set('season')}
                renderHint={(option, active) => <span className={cn('ml-1 text-[11px]', active ? 'text-white/80' : 'text-muted')}>· {option.hint}</span>}
              />
              {weatherHint && !form.season && (
                <button
                  type="button"
                  onClick={() => set('season')(weatherHint.season)}
                  className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                >
                  <SparkIcon className="h-3.5 w-3.5" />
                  {weatherHint.text} → chọn mùa {labelOf(SEASONS, weatherHint.season).toLowerCase()}
                </button>
              )}
            </Question>

            <Question index={3} title="Hôm đó bạn đi cùng ai?">
              <Chips label="Đi cùng" options={COMPANIONS} value={form.companion} onChange={set('companion')} />
              <input
                type="text"
                value={form.companionText}
                onChange={(event) => set('companionText')(event.target.value)}
                maxLength={60}
                placeholder="Hoặc tự nhập: bố mẹ người yêu, khách hàng…"
                aria-label="Tự nhập người đi cùng"
                className={inputClass}
              />
            </Question>

            <Question index={4} title="Ghi chú thêm (không bắt buộc)">
              <input
                type="text"
                value={form.note}
                onChange={(event) => set('note')(event.target.value)}
                maxLength={200}
                placeholder="Ví dụ: đi xe máy, tiệc ngoài trời, công ty có dress code…"
                aria-label="Ghi chú thêm"
                className="h-10 w-full rounded-xl border border-line bg-white/70 px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60 dark:bg-white/[0.05]"
              />
            </Question>
          </div>

        </div>

        <motion.div variants={RISE} className="flex flex-wrap items-center justify-end gap-2.5 border-t border-line px-6 py-4 max-md:pr-[84px] md:px-7">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={saving}
            className="h-11 cursor-pointer rounded-xl border border-line px-5 text-sm font-medium transition-colors hover:border-accent/50 disabled:cursor-wait disabled:opacity-60"
          >
            Gợi ý ngay
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-ink px-5 text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {saving ? <Spinner className="h-4 w-4 animate-spin" /> : null}
            {saving ? 'Đang lưu…' : 'Lưu & xem gợi ý'}
            {!saving && <ArrowRightIcon className="h-4 w-4" />}
          </button>
        </motion.div>
      </motion.form>

      <ConfirmDialog
        open={confirming}
        title="Bạn có chắc chắn về điều này không?"
        message="Vì gợi ý có thể sẽ không đúng ý của bạn. Nếu xác nhận, Tủ Đồ sẽ hiện tất cả gợi ý cho mọi hoàn cảnh và mọi mùa."
        confirmLabel="Xác nhận"
        cancelLabel="Quay lại nhập"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false)
          onSuggestAll()
        }}
      />
    </>
  )
}
