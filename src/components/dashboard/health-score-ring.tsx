'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

interface HealthScoreRingProps {
  score: number
  size?: number
  strokeWidth?: number
}

export default function HealthScoreRing({ score, size = 120, strokeWidth = 8 }: HealthScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (animatedScore / 100) * circumference

  const getColor = (s: number) => {
    if (s < 40) return '#f43f5e'
    if (s < 60) return '#f59e0b'
    if (s < 75) return '#eab308'
    return '#10b981'
  }

  const getGlow = (s: number) => {
    if (s < 40) return 'drop-shadow(0 0 8px rgba(244, 63, 94, 0.4))'
    if (s < 60) return 'drop-shadow(0 0 8px rgba(245, 158, 11, 0.4))'
    return 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.4))'
  }

  useEffect(() => {
    const duration = 1500
    const start = Date.now()
    const animate = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(eased * score))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [score])

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ filter: getGlow(score), transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-white/5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={getColor(score)} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold counter-animate" style={{ color: getColor(score) }}>{animatedScore}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5">/ 100</span>
      </div>
    </div>
  )
}