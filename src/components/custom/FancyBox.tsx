'use client'

import { useState, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'

type SingleImageProps = {
  src: string
  alt: string
  className?: string
  onClick?: () => void
  isQRCode?: boolean
  title?: string
  description?: string | React.ReactNode
}

type GroupImageProps = {
  slides: { src: string; title?: string; description?: string }[]
  openIndex: number
  onClose: () => void
  mode: 'group'
}

export default function Fancybox(props: SingleImageProps | GroupImageProps) {
  /* ---------------- GROUP MODE ---------------- */
  if ('mode' in props && props.mode === 'group') {
    return (
      <Lightbox
        open
        close={() => {
      setOpen(false)
    }}
        index={props.openIndex}
        slides={props.slides.map(slide => ({
          src: slide.src,
          description: slide.title
            ? `<strong>${slide.title}</strong><br/>${slide.description ?? ''}`
            : slide.description ?? '',
        }))}
      />
    )
  }

  /* ---------------- SINGLE MODE ---------------- */
  const {
    src,
    alt,
    className,
    onClick,
    isQRCode,
    title,
    description,
  } = props as SingleImageProps

  const [open, setOpen] = useState(false)
  const qrRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!qrRef.current) return

    const qrContent = qrRef.current.innerHTML
    const printWindow = window.open('', '', 'width=600,height=600')
    if (!printWindow) return

    printWindow.document.write(`
    <html>
      <head>
        <title>Print QR Code</title>
        <style>
          body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            font-family: sans-serif;
          }
          .print-container {
            display: flex;
            flex-direction: column; /* ✅ Stack items vertically */
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          img {
            max-width: 100%;
            height: auto;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          ${qrContent}
        </div>
      </body>
    </html>
  `)

    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    printWindow.close()
  }

  return (
    <>
      {/* Thumbnail */}
      <img
        src={src}
        alt={alt}
        width={200}
        height={200}
        className={`${className ?? ''} cursor-pointer object-cover`}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onClick ? onClick() : setOpen(true)
        }}
      />

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src }]}
        render={{
          slide: () => (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`flex flex-col items-center justify-center min-h-[80vh] ${
                isQRCode ? 'bg-white p-6' : 'bg-black p-6'
              }`}
            >
              <div ref={isQRCode ? qrRef : undefined}>
                <img
                  src={src}
                  alt={alt}
                  width={isQRCode ? 300 : 600}
                  height={isQRCode ? 300 : 600}
                  className="object-contain mx-auto"
                />
                <br />
                {/* 🔹 Title & Description */}
                {(title || description) && (
                  <div className="mt-4 text-center">
                    {title && (
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-500">
                        {title}
                      </div>
                    )}
                    {description && (
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-500 whitespace-pre-wrap">
                        {description}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* QR Print Button */}
              {isQRCode && (
                <button
                  onClick={handlePrint}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                >
                  Print QR Code
                </button>
              )}
            </div>
          ),
        }}
      />
    </>
  )
}
