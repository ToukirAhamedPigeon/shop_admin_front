'use client'

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAppSelector } from '@/hooks/useRedux'

interface RouteProgressProps {
  color?: string
  darkColor?: string
  delay?: number // optional delay for smoother effect
}

export default function RouteProgress({
  color = '#3b82f6',     // default for light mode
  darkColor = '#ffffff', // white for dark mode
  delay = 200,
}: RouteProgressProps) {
  const location = useLocation()
  const { current: theme } = useAppSelector((state) => state.theme)

  useEffect(() => {
    const styleTagId = 'nprogress-custom-style'
    let styleTag = document.getElementById(styleTagId) as HTMLStyleElement | null

    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = styleTagId
      document.head.appendChild(styleTag)
    }

    const barColor = theme === 'dark' ? darkColor : color
    styleTag.innerHTML = `
      #nprogress .bar {
        background: ${barColor} !important;
      }
      #nprogress .peg {
        box-shadow: 0 0 10px ${barColor}, 0 0 5px ${barColor} !important;
      }
      #nprogress .spinner-icon {
        border-top-color: ${barColor} !important;
        border-left-color: ${barColor} !important;
      }
    `

    // Start progress on route change
    nprogress.start()

    const timeout = setTimeout(() => {
      nprogress.done()
    }, delay)

    return () => {
      clearTimeout(timeout)
    }
  }, [location, theme, color, darkColor, delay])

  return null
}
