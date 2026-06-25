'use client'

import { PawPrint } from 'lucide-react'

const PAWS = [
  { top: '12%', left: '8%',  size: 28, rot: '-18deg', delay: '0s',   dur: '7s' },
  { top: '24%', left: '88%', size: 22, rot: '14deg',  delay: '1.2s', dur: '6s' },
  { top: '62%', left: '14%', size: 20, rot: '8deg',   delay: '0.6s', dur: '8s' },
  { top: '74%', left: '78%', size: 32, rot: '-10deg', delay: '2s',   dur: '6.5s' },
  { top: '44%', left: '94%', size: 18, rot: '22deg',  delay: '0.3s', dur: '7.5s' },
  { top: '85%', left: '40%', size: 24, rot: '-6deg',  delay: '1.6s', dur: '7s' },
]

export function FloatingPaws() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {PAWS.map((p, i) => (
        <span
          key={i}
          className="animate-float absolute text-brand-green/25"
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.dur,
            // @ts-expect-error custom property used by the float-y keyframes
            '--paw-rot': p.rot,
          }}
        >
          <PawPrint style={{ width: p.size, height: p.size }} />
        </span>
      ))}
    </div>
  )
}
