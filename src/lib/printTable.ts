export async function printTableById(containerId: string, title = 'Print Table') {
    const contentElement = document.getElementById(containerId)
    if (!contentElement) {
      console.warn(`No content found for printing with ID: ${containerId}`)
      return
    }
  
    const printWindow = window.open('', '', 'height=800,width=1000')
    if (!printWindow) return
  
    const clonedContent = contentElement.cloneNode(true) as HTMLElement
  
    // Create a new HTML structure
    const doc = printWindow.document
    doc.open()
    doc.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: sans-serif;
              padding: 20px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              border: 1px solid #ccc;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
            }
            img {
              max-width: 100px;
              height: auto;
            }
          </style>
        </head>
        <body>
        </body>
      </html>
    `)
    doc.body.appendChild(clonedContent)
    doc.close()
  
    // Wait for all images to load before printing
    const images = doc.images
    if (images.length > 0) {
      let loadedCount = 0
  
      const onImageLoad = () => {
        loadedCount++
        if (loadedCount === images.length) {
          printWindow.focus()
          printWindow.print()
          printWindow.close()
        }
      }
  
      for (const img of Array.from(images)) {
        if (img.complete) {
          onImageLoad()
        } else {
          img.onload = onImageLoad
          img.onerror = onImageLoad // Count even if it fails
        }
      }
    } else {
      // No images
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }
  