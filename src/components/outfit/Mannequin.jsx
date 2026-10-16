import { motion } from 'framer-motion'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import MannequinFigure from './MannequinFigure'
import { CX, GROUND, VIEW, blendPose, clamp, computeFrame, isLoopPose, poseValues } from './rig'

const POSE_MS = 650
const HOP_MS = 460
const easeInOut = (p) => (p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2)

/**
 * Ma-nơ-canh người que mặc đồ, chuyển tư thế mượt và xoay 0–180° theo motion value `turn`
 * (kéo ngang trên hình để xoay). bounce đổi giá trị → nhún nhẹ một nhịp (khi vừa thay đồ).
 */
export default function Mannequin({ body, worn, pose, turn, hair = null, bounce = 0, interactive = true, className }) {
  const uid = `mq${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const [frame, setFrame] = useState(() => computeFrame(body, poseValues(pose, body, 0), turn.get()))
  const [dragging, setDragging] = useState(false)
  const live = useRef({ pose, body, values: null, from: null, start: 0, hop: 0, dirty: true })
  const drag = useRef(null)

  // Đổi tư thế: nội suy từ tư thế đang hiển thị sang tư thế mới
  useEffect(() => {
    const anim = live.current
    if (anim.pose !== pose) {
      anim.from = anim.values
      anim.start = performance.now()
      anim.pose = pose
    }
    anim.body = body
    anim.dirty = true
  }, [pose, body])

  useEffect(() => {
    if (bounce) live.current.hop = performance.now()
  }, [bounce])

  // Một vòng rAF duy nhất: chỉ tính lại khung hình khi có thay đổi hoặc đang chuyển động
  useEffect(() => {
    const unsubscribe = turn.on('change', () => {
      live.current.dirty = true
    })
    let raf = 0
    const loop = (now) => {
      const anim = live.current
      const looping = isLoopPose(anim.pose)
      if (anim.dirty || anim.from || anim.hop || looping) {
        anim.dirty = false
        let values = poseValues(anim.pose, anim.body, now / 1000)
        if (anim.from) {
          const progress = Math.min(1, (now - anim.start) / POSE_MS)
          values = blendPose(anim.from, values, easeInOut(progress))
          if (progress >= 1) anim.from = null
        }
        if (anim.hop) {
          const progress = (now - anim.hop) / HOP_MS
          if (progress < 1) values = { ...values, bob: values.bob - 11 * Math.sin(Math.PI * progress) }
          else anim.hop = 0
        }
        anim.values = values
        setFrame(computeFrame(anim.body, values, turn.get()))
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      unsubscribe()
    }
  }, [turn])

  const onPointerDown = (event) => {
    if (!interactive || event.button !== 0) return
    turn.stop()
    drag.current = { x: event.clientX, start: turn.get(), width: event.currentTarget.getBoundingClientRect().width }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
  }
  const onPointerMove = (event) => {
    const state = drag.current
    if (!state) return
    // Kéo hết bề ngang khung hình ≈ xoay 180°
    turn.set(clamp(state.start + ((event.clientX - state.x) / Math.max(state.width, 1)) * 220, 0, 180))
  }
  const endDrag = (event) => {
    if (!drag.current) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(false)
  }

  return (
    <motion.div
      className={cn('text-ink', className)}
      animate={{ scaleY: [1, 1.007, 1] }}
      transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      style={{ originY: 1 }}
    >
      <svg
        viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
        className={cn('h-full w-full touch-none select-none', interactive && (dragging ? 'cursor-grabbing' : 'cursor-grab'))}
        role="img"
        shapeRendering="geometricPrecision"
        aria-label="Ma-nơ-canh đang mặc bộ đồ bạn chọn. Kéo ngang để xoay."
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <g transform={`translate(${CX} ${GROUND}) scale(${body.scale}) translate(${-CX} ${-GROUND})`}>
          <MannequinFigure f={frame} worn={worn} uid={uid} hair={hair} />
        </g>
      </svg>
    </motion.div>
  )
}
