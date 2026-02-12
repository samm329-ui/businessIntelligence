// components/ui/EnhancedTooltip.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

interface EnhancedTooltipProps {
  content: React.ReactNode
  children?: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export function EnhancedTooltip({ content, children, position = 'top' }: EnhancedTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const scrollX = window.scrollX || window.pageXOffset
      const scrollY = window.scrollY || window.pageYOffset

      let x = rect.left + rect.width / 2 + scrollX
      let y = rect.top + scrollY

      switch (position) {
        case 'top':
          y -= 10
          break
        case 'bottom':
          y += rect.height + 10
          break
        case 'left':
          x -= 10
          break
        case 'right':
          x += rect.width + 10
          break
      }

      setCoords({ x, y })
    }
  }

  useEffect(() => {
    if (isVisible) {
      updatePosition()
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isVisible])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={() => {
          updatePosition()
          setIsVisible(true)
        }}
        onMouseLeave={() => setIsVisible(false)}
        className="inline-flex"
      >
        {children || (
          <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <Info className="h-3 w-3" />
          </button>
        )}
      </div>

      {isVisible && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed z-[99999] pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
            transform: position === 'top' ? 'translate(-50%, -100%)' :
                      position === 'bottom' ? 'translate(-50%, 0)' :
                      position === 'left' ? 'translate(-100%, -50%)' :
                      'translate(0, -50%)'
          }}
        >
          <div className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-lg p-4 shadow-2xl max-w-sm max-h-[80vh] overflow-y-auto">
            {content}
          </div>
          {/* Arrow */}
          <div
            className="absolute w-2 h-2 bg-card/95 border-white/10 rotate-45"
            style={{
              [position === 'top' ? 'bottom' :
               position === 'bottom' ? 'top' :
               position === 'left' ? 'right' : 'left']: '-4px',
              [position === 'top' || position === 'bottom' ? 'left' : 'top']: '50%',
              transform: position === 'top' || position === 'bottom'
                ? 'translateX(-50%)'
                : 'translateY(-50%)'
            }}
          />
        </div>,
        document.body
      )}
    </>
  )
}

export default EnhancedTooltip
