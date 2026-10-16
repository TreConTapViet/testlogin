import { AnimatePresence, motion } from 'framer-motion'
import { useImperativeHandle, useRef } from 'react'

// Người que không mặt có khớp (khung 100x200, mặt đất y = 196), tư thế gốc nhìn sang phải.
// Mỗi khung hình, cảnh chào đón gọi apply(pose) để xoay các khớp bằng thuộc tính transform của SVG.
const BODY_WIDTH = 12
const LIMB_WIDTH = 9
const GROUND = 196
const HIP = 112
const SHOULDER = 60
const NECK = 50
const ELBOW = 94
const KNEE = 152

function applyPose(nodes, pose) {
  const set = (name, value) => nodes[name]?.setAttribute('transform', value)
  // Co giãn quanh bàn chân để nhân vật "đặt" xuống mặt đất
  set('root', `translate(0 ${pose.jump}) translate(50 ${GROUND}) scale(${pose.sx} ${pose.sy}) translate(-50 ${-GROUND})`)
  // Bóng nhỏ lại khi nhảy lên
  set('shadow', `translate(50 ${GROUND}) scale(${Math.max(0.55, 1 + Math.min(0, pose.jump) / 40)} 1) translate(-50 ${-GROUND})`)
  set('torso', `rotate(${pose.lean} 50 ${HIP})`)
  set('head', `rotate(${pose.head} 50 ${NECK})`)
  set('uaA', `rotate(${pose.uaA} 50 ${SHOULDER})`)
  set('faA', `rotate(${pose.faA} 50 ${ELBOW})`)
  set('uaB', `rotate(${pose.uaB} 50 ${SHOULDER})`)
  set('faB', `rotate(${pose.faB} 50 ${ELBOW})`)
  set('thA', `rotate(${pose.thA} 50 ${HIP})`)
  set('shA', `rotate(${pose.shA} 50 ${KNEE})`)
  set('thB', `rotate(${pose.thB} 50 ${HIP})`)
  set('shB', `rotate(${pose.shB} 50 ${KNEE})`)
}

// Một chi gồm 2 đoạn nối nhau tại khớp giữa (khuỷu tay / đầu gối)
function Limb({ upperRef, lowerRef, top, joint, end }) {
  return (
    <g ref={upperRef}>
      <line x1="50" y1={top} x2="50" y2={joint} strokeWidth={LIMB_WIDTH} />
      <g ref={lowerRef}>
        <line x1="50" y1={joint} x2="50" y2={end} strokeWidth={LIMB_WIDTH} />
      </g>
    </g>
  )
}

/**
 * Người que kiểu hoạt hình: đầu tròn đặc không mặt, nét dày bo tròn. Màu lấy theo currentColor.
 * mirrored = true: lật gương để nhìn sang trái.
 */
export function StickFigure({ ref, mirrored = false, className }) {
  const shadow = useRef(null)
  const root = useRef(null)
  const torso = useRef(null)
  const head = useRef(null)
  const uaA = useRef(null)
  const faA = useRef(null)
  const uaB = useRef(null)
  const faB = useRef(null)
  const thA = useRef(null)
  const shA = useRef(null)
  const thB = useRef(null)
  const shB = useRef(null)

  useImperativeHandle(
    ref,
    () => ({
      apply: (pose) =>
        applyPose(
          {
            shadow: shadow.current,
            root: root.current,
            torso: torso.current,
            head: head.current,
            uaA: uaA.current,
            faA: faA.current,
            uaB: uaB.current,
            faB: faB.current,
            thA: thA.current,
            shA: shA.current,
            thB: thB.current,
            shB: shB.current,
          },
          pose,
        ),
    }),
    [],
  )

  return (
    <svg viewBox="0 0 100 200" overflow="visible" className={className} aria-hidden="true" focusable="false">
      <g transform={mirrored ? 'translate(100 0) scale(-1 1)' : undefined}>
        <ellipse ref={shadow} cx="50" cy={GROUND} rx="24" ry="4" fill="#000" opacity="0.13" />
        <g ref={root} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
          <Limb upperRef={thB} lowerRef={shB} top={HIP} joint={KNEE} end={190} />
          <Limb upperRef={thA} lowerRef={shA} top={HIP} joint={KNEE} end={190} />
          <g ref={torso}>
            <Limb upperRef={uaB} lowerRef={faB} top={SHOULDER} joint={ELBOW} end={124} />
            <line x1="50" y1={NECK} x2="50" y2={HIP} strokeWidth={BODY_WIDTH} />
            <g ref={head}>
              <circle cx="50" cy="32" r="18" fill="currentColor" stroke="none" />
            </g>
            <Limb upperRef={uaA} lowerRef={faA} top={SHOULDER} joint={ELBOW} end={124} />
          </g>
        </g>
      </g>
    </svg>
  )
}

/** Bong bóng thoại trên đầu nhân viên: ba chấm (đang nói) rồi mặt cười niềm nở. */
export function SpeechBubble({ mood }) {
  return (
    <div className="relative rounded-2xl bg-white px-3.5 py-2.5 shadow-lg dark:bg-[#2c2a38]">
      <AnimatePresence mode="wait" initial={false}>
        {mood === 'typing' ? (
          <motion.span
            key="typing"
            className="flex h-7 items-center gap-1.5 px-1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.18 }}
          >
            {[0, 1, 2].map((index) => (
              <motion.span
                key={index}
                className="h-2 w-2 rounded-full bg-[#9a8f84]"
                animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.15 }}
              />
            ))}
          </motion.span>
        ) : (
          <motion.svg
            key="smile"
            viewBox="0 0 40 40"
            className="h-7 w-7"
            initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 18 }}
            aria-hidden="true"
          >
            <circle cx="20" cy="20" r="18" fill="#ffd36e" />
            <path d="M11 17 Q14 13 17 17 M23 17 Q26 13 29 17" fill="none" stroke="#5a3a1a" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M11 23 Q20 33 29 23 Z" fill="#7a3f2c" />
            <circle cx="10" cy="24" r="3" fill="#f29b8b" opacity="0.7" />
            <circle cx="30" cy="24" r="3" fill="#f29b8b" opacity="0.7" />
          </motion.svg>
        )}
      </AnimatePresence>
      <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white dark:bg-[#2c2a38]" />
    </div>
  )
}
