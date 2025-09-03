'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'

interface RouteProgressProps {
  color?: string // Tailwind or HEX color like '#f00' or 'bg-blue-500'
}

export default function RouteProgress({ color = '#3b82f6' }: RouteProgressProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Dynamically inject style for bar color
    const styleTagId = 'nprogress-custom-style'
    let styleTag = document.getElementById(styleTagId) as HTMLStyleElement | null
    if (!styleTag) {
      styleTag = document.createElement('style')
      styleTag.id = styleTagId
      document.head.appendChild(styleTag)
    }
    styleTag.innerHTML = `
      #nprogress .bar {
        background: ${color} !important;
      }
    `

    nprogress.start()
    const timeout = setTimeout(() => {
      nprogress.done()
    }, 300)

    return () => {
      clearTimeout(timeout)
    }
  }, [pathname, color])

  return null
}
