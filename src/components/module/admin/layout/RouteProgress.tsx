'use client'

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAppSelector } from '@/hooks/useRedux'

interface RouteProgressProps {
  color?: string // Tailwind or HEX color for light mode
  darkColor?: string // HEX or Tailwind color for dark mode
}

export default function RouteProgress({
  color = '#3b82f6',      // default light blue
  darkColor = '#60a5fa',  // default slightly brighter for dark
}: RouteProgressProps) {
  const location = useLocation()
  const { current: theme } = useAppSelector((state) => state.theme)

  useEffect(() => {
    // Dynamically inject style for bar color
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
    `

    nprogress.start()
    const timeout = setTimeout(() => {
      nprogress.done()
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [location, color, darkColor, theme])

  return null
}
