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
}

type GroupImageProps = {
  slides: { src: string; title?: string; description?: string }[]
  openIndex: number
  onClose: () => void
  mode: 'group'
}

export default function Fancybox(props: SingleImageProps | GroupImageProps) {
  if ('mode' in props && props.mode === 'group') {
    return (
      <Lightbox
        open
        close={props.onClose}
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

  const { src, alt, className, onClick, isQRCode } = props as SingleImageProps
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
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          ${qrContent}
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
      <img
        src={src}
        alt={alt}
        width={200}
        height={200}
        className={`${className ?? ''} cursor-pointer object-cover`}
        onClick={() => {
          onClick ? onClick() : setOpen(true)
        }}
      />

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[{ src }]}
        render={{
          slide: () =>
            isQRCode ? (
              <div
                ref={qrRef}
                className="flex flex-col items-center justify-center min-h-[80vh] bg-white p-6"
              >
                <img
                  src={src}
                  alt={alt}
                  width={300}
                  height={300}
                  className="object-contain"
                />
                <button
                  onClick={handlePrint}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Print QR Code
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[80vh] bg-black">
                <img
                  src={src}
                  alt={alt}
                  width={600}
                  height={600}
                  className="object-contain"
                />
              </div>
            ),
        }}
      />
    </>
  )
}
